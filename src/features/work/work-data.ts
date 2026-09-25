import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import type { Database } from '@/data/database.types';
import { workAffectedPrefixes } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import type { WorkType } from '@/domain/work-type';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';

export type WorkEntryType = Database['public']['Enums']['work_entry_type'];

/** O domínio e o banco usam os mesmos nomes de tipo. */
const TYPE_BY_DOMAIN: Record<WorkType, WorkEntryType> = {
  shift: 'shift',
  procedure: 'procedure',
  appointment: 'appointment',
};

export type WorkAggregateInput = {
  type: WorkType;
  locationId: string;
  /** `YYYY-MM-DD` local, sem horário (D32). */
  workDate: string;
  /** `HH:MM` local. Obrigatório para Plantão. */
  startTime?: string | null;
  durationMinutes?: number | null;
  description?: string | null;
  amountCents: bigint;
  /** `YYYY-MM-DD` ou `null` quando ainda não se sabe quando entra. */
  expectedOn?: string | null;
  timezone: string;
};

export type WorkAggregateResult = { workId: string; receivableId: string };

function rpcArgs(input: WorkAggregateInput, idempotencyKey: string) {
  return {
    p_type: TYPE_BY_DOMAIN[input.type],
    p_location_id: input.locationId,
    p_work_date: input.workDate,
    p_start_time: (input.startTime ?? null) as unknown as string,
    p_duration_minutes: (input.durationMinutes ?? null) as unknown as number,
    p_description: (input.description?.trim() || null) as unknown as string,
    // Centavos cabem com folga em number; bigint não é serializável em JSON.
    p_amount_cents: Number(input.amountCents),
    p_expected_on: (input.expectedOn ?? null) as unknown as string,
    p_timezone: input.timezone,
    p_idempotency_key: idempotencyKey,
  };
}

/** Cria Trabalho + Recebível numa transação (RPC da 3.7). Repetir a chave não duplica. */
export async function createWorkWithReceivable(
  input: WorkAggregateInput,
  idempotencyKey: string,
  client: AuthClient = supabase,
): Promise<WorkAggregateResult> {
  const { data, error } = await client.rpc(
    'create_work_with_receivable',
    rpcArgs(input, idempotencyKey),
  );
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('create_work_with_receivable returned no row');
  return { workId: row.work_id, receivableId: row.receivable_id };
}

export async function updateWorkWithReceivable(
  workEntryId: string,
  input: WorkAggregateInput,
  idempotencyKey: string,
  client: AuthClient = supabase,
): Promise<WorkAggregateResult> {
  const { data, error } = await client.rpc('update_work_with_receivable', {
    ...rpcArgs(input, idempotencyKey),
    p_work_entry_id: workEntryId,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('update_work_with_receivable returned no row');
  return { workId: row.work_id, receivableId: row.receivable_id };
}

/** Exclusão lógica do agregado: sai da Agenda, da Home e dos cálculos financeiros. */
export async function deleteWorkWithReceivable(
  workEntryId: string,
  idempotencyKey: string,
  client: AuthClient = supabase,
): Promise<WorkAggregateResult> {
  const { data, error } = await client.rpc('delete_work_with_receivable', {
    p_work_entry_id: workEntryId,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('delete_work_with_receivable returned no row');
  return { workId: row.work_id, receivableId: row.receivable_id };
}

/** Confirmação explícita do recebimento (D34). O horário é do servidor. */
export async function confirmReceivableReceived(
  receivableId: string,
  client: AuthClient = supabase,
): Promise<{ receivableId: string; receivedAt: string }> {
  const { data, error } = await client.rpc('confirm_receivable_received', {
    p_receivable_id: receivableId,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('confirm_receivable_received returned no row');
  return { receivableId: row.receivable_id, receivedAt: row.received_at };
}

function useWorkInvalidation() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  return () => {
    if (session.userId === null) return;
    // Agenda, Home e Finanças são projeções do mesmo dado: todas revalidam juntas.
    for (const prefix of workAffectedPrefixes) {
      void queryClient.invalidateQueries({ queryKey: [prefix, session.userId] });
    }
  };
}

/**
 * Mutations sem retry automático nem atualização otimista (CLAUDE.md > Queries e mutations):
 * dado financeiro só muda depois da confirmação do servidor. A chave de idempotência é criada
 * uma vez por tentativa de envio, para o retry da pessoa não gravar duas vezes.
 */
export function useCreateWork() {
  const invalidate = useWorkInvalidation();
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: WorkAggregateInput;
      idempotencyKey: string;
    }) => createWorkWithReceivable(input, idempotencyKey),
    onSuccess: invalidate,
  });
}

export function useUpdateWork() {
  const invalidate = useWorkInvalidation();
  return useMutation({
    mutationFn: ({
      workEntryId,
      input,
      idempotencyKey,
    }: {
      workEntryId: string;
      input: WorkAggregateInput;
      idempotencyKey: string;
    }) => updateWorkWithReceivable(workEntryId, input, idempotencyKey),
    onSuccess: invalidate,
  });
}

export function useDeleteWork() {
  const invalidate = useWorkInvalidation();
  return useMutation({
    mutationFn: ({
      workEntryId,
      idempotencyKey,
    }: {
      workEntryId: string;
      idempotencyKey: string;
    }) => deleteWorkWithReceivable(workEntryId, idempotencyKey),
    onSuccess: invalidate,
  });
}

export function useConfirmReceivable() {
  const invalidate = useWorkInvalidation();
  return useMutation({
    mutationFn: (receivableId: string) => confirmReceivableReceived(receivableId),
    onSuccess: invalidate,
  });
}

/** Chave estável por tentativa de envio; guarde-a no formulário antes de chamar a mutation. */
export function newIdempotencyKey(): string {
  return randomUUID();
}
