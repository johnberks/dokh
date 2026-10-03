import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, workAffectedPrefixes } from '@/data/query-keys';
import { parseBRLToCents } from '@/domain/money';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { isFreeColorToken } from '@/features/locations/location-colors';
import {
  createWorkLocation,
  listWorkLocations,
  updateWorkLocation,
} from '@/features/locations/locations-data';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import {
  confirmReceivableReceived,
  createWorkWithReceivable,
  newIdempotencyKey,
  updateWorkWithReceivable,
  type WorkAggregateInput,
} from './work-data';
import type { ExpectedEntry, WorkDraftStore } from './work-draft';
import { createWorkSeries } from './work-recurrence';
import { todayInTimezone } from './work-schedule';

/** Dia do recebimento quando a pessoa marcou "Já recebi"; só existe para data de hoje ou passada. */
export function receivedOn(expected: ExpectedEntry | null): string | null {
  if (expected?.kind !== 'date' || expected.received !== true) return null;
  return expected.date <= todayInTimezone(deviceTimezone()) ? expected.date : null;
}

/**
 * Grava um Trabalho a partir de um rascunho: reaproveita o Local pelo nome quando já existir, cria quando não,
 * e chama a RPC atômica de Trabalho + Recebível — ou a da série, quando há recorrência. A chave
 * de idempotência nasce na primeira tentativa e é reaproveitada no retry, para não gravar duas vezes.
 * Com `workId`, grava a edição pela RPC atômica de atualização (Agenda 16).
 */
export function useSaveWork(store: WorkDraftStore, workId?: string) {
  const session = useAuthSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const draft = store.getState();
      if (session.userId === null) throw new Error('missing session');
      if (draft.type === null || draft.workDate === null) {
        throw new Error('incomplete work draft');
      }
      const amountCents = parseBRLToCents(draft.amount);
      if (amountCents === null) throw new Error('invalid amount');

      const idempotencyKey = draft.idempotencyKey ?? newIdempotencyKey();
      if (draft.idempotencyKey === null) draft.update({ idempotencyKey });

      const name = draft.locationName.trim();
      const locations = await listWorkLocations();
      const existing = locations.find(
        (location) => location.name.localeCompare(name, 'pt-BR', { sensitivity: 'base' }) === 0,
      );
      // A cor escolhida (Agenda 13) pertence ao Local, não só a este Trabalho.
      const color = draft.colorToken;
      const colorSource = color && (isFreeColorToken(color) ? 'free_palette' : 'premium_palette');
      let location =
        existing ??
        (await createWorkLocation(
          { name, colorToken: color ?? undefined, colorSource: colorSource ?? undefined },
          locations,
        ));
      if (existing && color && colorSource && existing.colorToken !== color) {
        location = await updateWorkLocation(existing, { colorToken: color, colorSource });
      }

      const input: WorkAggregateInput = {
        type: draft.type,
        locationId: location.id,
        workDate: draft.workDate,
        startTime: draft.startTime,
        durationMinutes: draft.durationMinutes,
        description: draft.description,
        amountCents,
        // Sem previsão escolhida o valor entra em Finanças como "sem previsão" (UX Agenda).
        expectedOn: draft.expected?.kind === 'date' ? draft.expected.date : null,
        timezone: deviceTimezone(),
      };
      if (workId !== undefined) return updateWorkWithReceivable(workId, input, idempotencyKey);
      // Com recorrência (Premium), a série gera este Trabalho e os próximos 12 meses.
      if (draft.repeat !== 'none') return createWorkSeries(input, draft.repeat, idempotencyKey);
      const created = await createWorkWithReceivable(input, idempotencyKey);
      // "Já recebi" (7.7): confirmação explícita com o dia previsto, que já passou. Criar e
      // confirmar são idempotentes, então o retry de uma falha no meio termina o que faltou.
      if (receivedOn(draft.expected) !== null) {
        await confirmReceivableReceived(created.receivableId, receivedOn(draft.expected));
      }
      return created;
    },
    onSuccess: () => {
      if (session.userId === null) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.workLocations(session.userId) });
      for (const prefix of workAffectedPrefixes) {
        void queryClient.invalidateQueries({ queryKey: [prefix, session.userId] });
      }
    },
  });
}
