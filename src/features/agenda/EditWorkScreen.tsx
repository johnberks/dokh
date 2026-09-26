import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { LoadError } from '@/components/TechnicalStates';
import { formatCentsToBRL } from '@/domain/money';
import { WorkForm } from '@/features/work/form/WorkForm';
import { useEditWorkDraft, type WorkDraft } from '@/features/work/work-draft';
import { colors, palette } from '@/theme/tokens';
import { type AgendaWork, useAgendaWork } from './agenda-data';

/** Rascunho da edição a partir do que está gravado — todos os dados pré-preenchidos. */
export function editDraftFromWork(work: AgendaWork): WorkDraft {
  return {
    type: work.type,
    locationName: work.locationName,
    workDate: work.workDate,
    startTime: work.startTime,
    durationMinutes: work.durationMinutes,
    amount:
      work.amountCents === null
        ? ''
        : formatCentsToBRL(work.amountCents, { omitZeroCents: true }).replace(/^R\$\s*/u, ''),
    expected:
      work.expectedOn === null ? { kind: 'unknown' } : { kind: 'date', date: work.expectedOn },
    idempotencyKey: null,
    plannedTermDays: null,
    description: work.description,
  };
}

/**
 * Agenda 16: o mesmo formulário da criação, preenchido. `Salvar alterações` grava pela RPC
 * atômica de atualização; Agenda, Início e Finanças refletem ao voltar.
 */
export function EditWorkScreen({ workId }: { workId: string }) {
  const { t } = useTranslation('agenda');
  const work = useAgendaWork(workId);
  const [ready, setReady] = useState(false);

  // Preenche uma vez, quando o Trabalho chega; refetch não apaga o que a pessoa já mudou.
  useEffect(() => {
    if (ready || !work.data) return;
    useEditWorkDraft.getState().reset();
    useEditWorkDraft.getState().update(editDraftFromWork(work.data));
    setReady(true);
  }, [ready, work.data]);

  useEffect(() => () => useEditWorkDraft.getState().reset(), []);

  if (ready) {
    return (
      <WorkForm
        store={useEditWorkDraft}
        workId={workId}
        onBack={() => router.back()}
        onSaved={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.screen} testID="edit-work-loading">
      {work.isError ? (
        <LoadError onRetry={() => void work.refetch()} retrying={work.isFetching} />
      ) : work.isSuccess && !work.data ? (
        <AppText style={styles.missing}>{t('detail.missing')}</AppText>
      ) : (
        <ActivityIndicator color={palette.sage} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missing: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
});
