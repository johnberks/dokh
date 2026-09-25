import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { differenceInLocalDays } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import type { WorkType } from '@/domain/work-type';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import type { WorkDraft } from './work-draft';
import { PAYMENT_TERMS } from './work-schedule';

/** Um Trabalho que a DOKH "já conhece" (Agenda 06), derivado do histórico — sem tabela própria. */
export type WorkTemplate = {
  key: string;
  type: WorkType;
  locationId: string;
  locationName: string;
  colorToken: string;
  /** `HH:MM` do último Trabalho igual, ou `null` quando não tinha horário. */
  startTime: string | null;
  durationMinutes: number | null;
  amountCents: bigint;
  /** Prazo D30/60/90 usado da última vez; `unknown` quando entrou sem previsão. */
  payment: { kind: 'term'; days: (typeof PAYMENT_TERMS)[number] } | { kind: 'unknown' } | null;
};

export type TemplateSourceRow = {
  work_entry_id: string | null;
  location_id: string | null;
  location_name: string | null;
  color_token: string | null;
  type: string | null;
  work_date: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  amount_cents: number | null;
  expected_on: string | null;
};

const MAX_TEMPLATES = 3;
/** Histórico suficiente para achar combinações distintas sem trazer a agenda inteira. */
const HISTORY_LIMIT = 200;

function paymentOf(row: TemplateSourceRow): WorkTemplate['payment'] {
  if (row.expected_on === null) return { kind: 'unknown' };
  if (row.work_date === null) return null;
  const days = differenceInLocalDays(row.expected_on, row.work_date);
  const term = PAYMENT_TERMS.find((value) => value === days);
  // Data específica não se repete: a pessoa escolhe de novo.
  return term === undefined ? null : { kind: 'term', days: term };
}

/**
 * Templates = combinações distintas de Local, tipo, horário, duração e valor, da mais recente
 * para a mais antiga (as linhas já chegam nessa ordem). Locais arquivados ficam de fora:
 * não aceitam Trabalho novo.
 */
export function deriveWorkTemplates(
  rows: readonly TemplateSourceRow[],
  activeLocationIds: ReadonlySet<string>,
  max = MAX_TEMPLATES,
): WorkTemplate[] {
  const templates: WorkTemplate[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (
      !row.location_id ||
      !row.location_name ||
      !row.type ||
      row.amount_cents === null ||
      !activeLocationIds.has(row.location_id)
    ) {
      continue;
    }
    const startTime = row.start_time ? row.start_time.slice(0, 5) : null;
    const key = [row.location_id, row.type, startTime, row.duration_minutes, row.amount_cents].join(
      '|',
    );
    if (seen.has(key)) continue;
    seen.add(key);
    templates.push({
      key,
      type: row.type as WorkType,
      locationId: row.location_id,
      locationName: row.location_name,
      colorToken: row.color_token ?? 'sage',
      startTime,
      durationMinutes: row.duration_minutes,
      amountCents: BigInt(row.amount_cents),
      payment: paymentOf(row),
    });
    if (templates.length >= max) break;
  }
  return templates;
}

export async function listWorkTemplateSources(
  client: AuthClient = supabase,
): Promise<{ rows: TemplateSourceRow[]; activeLocationIds: Set<string> }> {
  const [works, locations] = await Promise.all([
    client
      .from('agenda_work_projection')
      .select(
        'work_entry_id, location_id, location_name, color_token, type, work_date, start_time, duration_minutes, amount_cents, expected_on',
      )
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    client.from('work_locations').select('id').is('archived_at', null),
  ]);
  if (works.error) throw works.error;
  if (locations.error) throw locations.error;
  return {
    rows: works.data ?? [],
    activeLocationIds: new Set((locations.data ?? []).map((location) => location.id)),
  };
}

export function useWorkTemplates() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.workTemplates(userId ?? ''),
    queryFn: async () => {
      const { rows, activeLocationIds } = await listWorkTemplateSources();
      return deriveWorkTemplates(rows, activeLocationIds);
    },
    enabled: userId !== null,
  });
}

/**
 * Rascunho pré-preenchido a partir de um template: tudo, menos a data — o fluxo pergunta
 * "quando será?". O prazo D30/60/90 é reaplicado sobre a nova data assim que ela for escolhida.
 */
export function templateDraft(template: WorkTemplate): Partial<WorkDraft> {
  return {
    type: template.type,
    locationName: template.locationName,
    workDate: null,
    startTime: template.startTime,
    durationMinutes: template.durationMinutes,
    amount: formatCentsToBRL(template.amountCents, { omitZeroCents: true }).replace(/^R\$\s*/u, ''),
    expected: template.payment?.kind === 'unknown' ? { kind: 'unknown' } : null,
    plannedTermDays: template.payment?.kind === 'term' ? template.payment.days : null,
    idempotencyKey: null,
  };
}
