import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, workAffectedPrefixes } from '@/data/query-keys';
import { parseBRLToCents } from '@/domain/money';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { createWorkLocation, listWorkLocations } from '@/features/locations/locations-data';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import {
  createWorkWithReceivable,
  newIdempotencyKey,
  updateWorkWithReceivable,
  type WorkAggregateInput,
} from './work-data';
import type { WorkDraftStore } from './work-draft';

/**
 * Grava um Trabalho a partir de um rascunho: reaproveita o Local pelo nome quando já existir, cria quando não,
 * e chama a RPC atômica de Trabalho + Recebível. A chave de idempotência nasce na primeira
 * tentativa e é reaproveitada no retry, para não gravar dois Trabalhos.
 */
/**
 * Com `workId`, grava a edição pela RPC atômica de atualização (Agenda 16); sem, cria.
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
      const location = existing ?? (await createWorkLocation({ name }, locations));

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
      return workId === undefined
        ? createWorkWithReceivable(input, idempotencyKey)
        : updateWorkWithReceivable(workId, input, idempotencyKey);
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
