import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { MutationError } from '@/components/TechnicalStates';
import { formatDayMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { newIdempotencyKey, useDeleteWork } from '@/features/work/work-data';
import { useDeleteWorkSeriesFrom } from '@/features/work/work-recurrence';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import type { AgendaWork } from './agenda-data';

/**
 * Confirmação de exclusão de um Trabalho (Agenda 15 e o deslizar do card na Agenda). Trabalho
 * recorrente: excluir só o dia ou deste em diante (pedido do usuário, 2026-09-26).
 */
export function DeleteWorkSheet({
  work,
  open,
  onClose,
  onDeleted,
}: {
  work: AgendaWork;
  open: boolean;
  onClose: () => void;
  /** Exclusão confirmada pelo servidor (a folha já pode fechar). */
  onDeleted: () => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [deleteScope, setDeleteScope] = useState<'one' | 'forward'>('one');
  const remove = useDeleteWork();
  const removeForward = useDeleteWorkSeriesFrom();
  const deleting = remove.isPending || removeForward.isPending;
  const deleteFailed = remove.isError || removeForward.isError;
  const repeating = work.seriesId !== null && work.seriesActive && work.seriesFrequency !== null;
  // Uma chave por tentativa de exclusão: repetir após erro de rede não apaga duas vezes.
  const deleteKey = useRef<string | null>(null);
  const amount =
    work.amountCents === null ? '—' : formatCentsToBRL(work.amountCents, { omitZeroCents: true });

  // Cada abertura começa em "só este dia"; outro Trabalho ganha outra chave.
  useEffect(() => {
    if (open) setDeleteScope('one');
  }, [open]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a chave muda junto com o Trabalho.
  useEffect(() => {
    deleteKey.current = null;
    remove.reset();
    removeForward.reset();
  }, [work.id]);

  function confirmDelete() {
    if (repeating && deleteScope === 'forward') {
      removeForward.mutate(work.id, { onSuccess: onDeleted });
      return;
    }
    deleteKey.current ??= newIdempotencyKey();
    remove.mutate(
      { workEntryId: work.id, idempotencyKey: deleteKey.current },
      { onSuccess: onDeleted },
    );
  }

  const deleteLabel = !repeating
    ? t('detail.confirmDelete')
    : deleteScope === 'forward'
      ? t('detail.deleteSeries.confirmForward')
      : t('detail.deleteSeries.confirmOnlyThis');

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        if (!deleting) onClose();
      }}
      accessibilityLabel={repeating ? t('detail.deleteSeries.title') : t('detail.confirmTitle')}
      testID="work-delete-sheet"
    >
      <View style={styles.confirmCopy}>
        <AppText accessibilityRole="header" style={[type.heading1, styles.confirmTitle]}>
          {repeating ? t('detail.deleteSeries.title') : t('detail.confirmTitle')}
        </AppText>
        <AppText style={styles.confirmText}>
          {repeating
            ? t('detail.deleteSeries.text', { place: work.locationName })
            : t('detail.confirmText', {
                place: work.locationName,
                date: formatDayMonth(work.workDate),
                amount,
              })}
        </AppText>
      </View>
      {repeating && (
        <View accessibilityRole="radiogroup" style={styles.scopeOptions}>
          {(['one', 'forward'] as const).map((scope) => {
            const selected = deleteScope === scope;
            const label =
              scope === 'one'
                ? t('detail.deleteSeries.onlyThis')
                : t('detail.deleteSeries.forward');
            const hint = t(
              scope === 'one'
                ? 'detail.deleteSeries.onlyThisHint'
                : 'detail.deleteSeries.forwardHint',
              { date: formatDayMonth(work.workDate) },
            );
            return (
              <Pressable
                key={scope}
                accessibilityRole="radio"
                accessibilityLabel={`${label}, ${hint}`}
                accessibilityState={{ checked: selected, disabled: deleting }}
                disabled={deleting}
                onPress={() => setDeleteScope(scope)}
                testID={`work-delete-scope-${scope}`}
                style={({ pressed }) => [
                  styles.scopeOption,
                  selected ? styles.scopeOptionOn : styles.scopeOptionOff,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.scopeText}>
                  <AppText style={[selected && type.heading1, styles.scopeLabel]}>{label}</AppText>
                  <AppText style={styles.scopeHint}>{hint}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      {deleteFailed && <MutationError onRetry={confirmDelete} retrying={deleting} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        accessibilityState={{ busy: deleting, disabled: deleting }}
        disabled={deleting}
        onPress={confirmDelete}
        testID="work-delete-confirm"
        style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
      >
        {deleting && <ActivityIndicator color={palette.cream} />}
        <AppText style={[type.heading1, styles.confirmButtonText]}>{deleteLabel}</AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('detail.cancel')}
        disabled={deleting}
        onPress={onClose}
        testID="work-delete-cancel"
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.cancelText]}>{t('detail.cancel')}</AppText>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  confirmCopy: { gap: 8, paddingTop: 6 },
  confirmTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: colors.textPrimary },
  confirmText: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  confirmButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: palette.negative,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  confirmButtonText: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  scopeOptions: { gap: 8 },
  scopeOption: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scopeOptionOn: { borderColor: colors.foreground, backgroundColor: '#F6F4EC' },
  scopeOptionOff: { borderColor: 'rgba(16,22,15,0.2)' },
  scopeText: { flex: 1, gap: 2 },
  scopeLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  scopeHint: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.foreground },
  radioOff: { borderColor: 'rgba(16,22,15,0.3)' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.foreground },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  pressed: { opacity: 0.72 },
});
