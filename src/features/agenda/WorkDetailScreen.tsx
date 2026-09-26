import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { type ReactNode, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { LoadError, MutationError } from '@/components/TechnicalStates';
import { formatDayMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { newIdempotencyKey, useDeleteWork } from '@/features/work/work-data';
import { localDateToDate, workEndDescription } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, workLocationColors } from '@/theme/tokens';
import { AgendaHeroBackdrop } from './AgendaHeroBackdrop';
import { type AgendaWork, useAgendaWork } from './agenda-data';
import { durationLabel } from './agenda-format';

const LONG_DATE = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const EXPECTED_DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Ponto de status: bronze para "a receber"/"a confirmar", verde para recebido, neutro sem data. */
const STATUS_DOT = {
  received: palette.structure,
  scheduled: palette.bronze,
  due_today: palette.bronze,
  confirmation_pending: palette.bronze,
  undated: palette.sage,
} as const;

/**
 * Agenda 15: data por extenso, local, horário em blocos (início, término, duração), valor,
 * previsão e status (ponto + texto, sem badge), `Editar trabalho` (mesmo formulário, preenchido)
 * e `Excluir` com confirmação. Recorrência entra com a 8.5.
 */
export function WorkDetailScreen({ workId }: { workId: string }) {
  const { t } = useTranslation('agenda');
  const work = useAgendaWork(workId);

  return (
    <View style={styles.screen} testID="work-detail">
      <StatusBar style="light" />
      {work.isPending ? (
        <DetailFrame>
          <ActivityIndicator color={palette.sage} style={styles.loading} />
        </DetailFrame>
      ) : work.isError || !work.data ? (
        <DetailFrame>
          {work.isError ? (
            <LoadError onRetry={() => void work.refetch()} retrying={work.isFetching} />
          ) : (
            <AppText style={styles.missing}>{t('detail.missing')}</AppText>
          )}
        </DetailFrame>
      ) : (
        <DetailContent work={work.data} />
      )}
    </View>
  );
}

function DetailFrame({
  children,
  hero,
  footer,
}: {
  children: ReactNode;
  hero?: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation('agenda');
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ao puxar para baixo, o topo continua escuro. */}
        <View pointerEvents="none" style={styles.bleed} />
        <View style={[styles.hero, { paddingTop: insets.top }]}>
          <AgendaHeroBackdrop />
          <View style={styles.heroBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('detail.back')}
              onPress={() => router.back()}
              testID="work-detail-back"
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <ChevronLeft color={palette.cream} size={20} />
            </Pressable>
            <AppText variant="technical" style={styles.eyebrow}>
              {t('detail.eyebrow')}
            </AppText>
            <View style={styles.backSpacer} />
          </View>
          {hero}
        </View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          {footer}
        </View>
      ) : null}
    </>
  );
}

/** Bloco de horário: rótulo técnico, valor grande e, quando existe, um complemento. */
function TimeTile({
  label,
  value,
  detail,
  testID,
}: {
  label: string;
  value: string;
  detail?: string;
  testID?: string;
}) {
  const type = useBrandTypography();
  return (
    <View
      accessible
      accessibilityLabel={[label, value, detail].filter(Boolean).join(', ')}
      style={styles.tile}
      testID={testID}
    >
      <AppText variant="technical" style={styles.tileLabel}>
        {label}
      </AppText>
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.tileValue]}>
        {value}
      </AppText>
      {detail ? (
        <AppText numberOfLines={1} style={styles.tileDetail}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

function DetailContent({ work }: { work: AgendaWork }) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteWork();
  // Uma chave por tentativa de exclusão: repetir após erro de rede não apaga duas vezes.
  const deleteKey = useRef<string | null>(null);
  const end = workEndDescription(work.workDate, work.startTime, work.durationMinutes);
  const status = work.receiptStatus === 'invalidated' ? null : (work.receiptStatus ?? 'undated');
  const amount =
    work.amountCents === null ? '—' : formatCentsToBRL(work.amountCents, { omitZeroCents: true });

  function confirmDelete() {
    deleteKey.current ??= newIdempotencyKey();
    remove.mutate(
      { workEntryId: work.id, idempotencyKey: deleteKey.current },
      {
        onSuccess: () => {
          setConfirming(false);
          router.back();
        },
      },
    );
  }

  const hero = (
    <View style={styles.heroContent}>
      <View style={styles.metaRow}>
        <View style={styles.typeChip}>
          <View style={[styles.dot, { backgroundColor: workLocationColors[work.colorToken] }]} />
          <AppText variant="technical" style={styles.typeChipText}>
            {t(`workType.${work.type}` as 'workType.shift').toUpperCase()}
          </AppText>
        </View>
        <AppText style={styles.date} numberOfLines={1}>
          {capitalize(LONG_DATE.format(localDateToDate(work.workDate)))}
        </AppText>
      </View>
      <AppText accessibilityRole="header" numberOfLines={2} style={[type.heading1, styles.place]}>
        {work.locationName}
      </AppText>
      {work.description ? <AppText style={styles.description}>{work.description}</AppText> : null}

      {(work.startTime !== null || work.durationMinutes !== null) && (
        <View style={styles.tiles}>
          {work.startTime !== null && (
            <TimeTile label={t('detail.start')} value={work.startTime} testID="work-detail-start" />
          )}
          {end && (
            <TimeTile
              label={t('detail.end')}
              value={end.time}
              detail={
                end.nextDay ? t('detail.endNextDay', { date: formatDayMonth(end.date) }) : undefined
              }
              testID="work-detail-end"
            />
          )}
          {work.durationMinutes !== null && (
            <TimeTile
              label={t('detail.duration')}
              value={durationLabel(work.durationMinutes)}
              testID="work-detail-duration"
            />
          )}
        </View>
      )}
    </View>
  );

  const footer = (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('detail.edit')}
        onPress={() => router.push({ pathname: '/work/edit/[id]', params: { id: work.id } })}
        testID="work-detail-edit"
        style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.editText]}>{t('detail.edit')}</AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('detail.delete')}
        onPress={() => setConfirming(true)}
        testID="work-detail-delete"
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.deleteText]}>{t('detail.delete')}</AppText>
      </Pressable>
    </View>
  );

  return (
    <>
      <DetailFrame hero={hero} footer={footer}>
        <View style={styles.card}>
          <View style={[styles.cardRow, styles.cardRowRule]}>
            <AppText style={styles.cardLabel}>{t('detail.amount')}</AppText>
            <AppText style={[type.heading1, styles.cardValue]} testID="work-detail-amount">
              {amount}
            </AppText>
          </View>
          <View style={[styles.cardRow, styles.cardRowRule]}>
            <AppText style={styles.cardLabel}>{t('detail.expected')}</AppText>
            <AppText style={[type.heading1, styles.cardValueSmall]} testID="work-detail-expected">
              {work.expectedOn === null
                ? t('detail.noExpected')
                : EXPECTED_DATE.format(localDateToDate(work.expectedOn))}
            </AppText>
          </View>
          <View style={styles.cardRow}>
            <AppText style={styles.cardLabel}>{t('detail.status')}</AppText>
            {status && (
              <View style={styles.status} testID="work-detail-status">
                <View style={[styles.statusDot, { backgroundColor: STATUS_DOT[status] }]} />
                <AppText style={[type.heading1, styles.statusText]}>
                  {t(`detail.statusLabel.${status}` as 'detail.statusLabel.scheduled')}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </DetailFrame>

      <BottomSheet
        open={confirming}
        onClose={() => {
          if (!remove.isPending) setConfirming(false);
        }}
        accessibilityLabel={t('detail.confirmTitle')}
        testID="work-delete-sheet"
      >
        <View style={styles.confirmCopy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.confirmTitle]}>
            {t('detail.confirmTitle')}
          </AppText>
          <AppText style={styles.confirmText}>
            {t('detail.confirmText', {
              place: work.locationName,
              date: formatDayMonth(work.workDate),
              amount,
            })}
          </AppText>
        </View>
        {remove.isError && <MutationError onRetry={confirmDelete} retrying={remove.isPending} />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('detail.confirmDelete')}
          accessibilityState={{ busy: remove.isPending, disabled: remove.isPending }}
          disabled={remove.isPending}
          onPress={confirmDelete}
          testID="work-delete-confirm"
          style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
        >
          {remove.isPending && <ActivityIndicator color={palette.cream} />}
          <AppText style={[type.heading1, styles.confirmButtonText]}>
            {t('detail.confirmDelete')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('detail.cancel')}
          disabled={remove.isPending}
          onPress={() => setConfirming(false)}
          testID="work-delete-cancel"
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.cancelText]}>{t('detail.cancel')}</AppText>
        </Pressable>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  bleed: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: palette.base,
  },
  hero: { backgroundColor: palette.base, paddingBottom: 52, overflow: 'hidden' },
  heroBar: {
    paddingTop: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 44 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  heroContent: { paddingTop: 30, paddingHorizontal: 24, gap: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.2)',
    backgroundColor: 'rgba(237,234,224,0.06)',
  },
  typeChipText: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.cream },
  dot: { width: 8, height: 8, borderRadius: 4 },
  date: { flex: 1, fontSize: 14, lineHeight: 18, color: palette.secondaryText },
  place: { fontSize: 32, lineHeight: 35, letterSpacing: -0.96, color: palette.cream },
  description: { fontSize: 15, lineHeight: 20, color: palette.secondaryText },
  tiles: { flexDirection: 'row', gap: 8, paddingTop: 6 },
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.16)',
    backgroundColor: 'rgba(237,234,224,0.07)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  tileLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 1.44, color: palette.sage },
  tileValue: { fontSize: 24, lineHeight: 28, letterSpacing: -0.72, color: palette.cream },
  tileDetail: { fontSize: 12, lineHeight: 16, color: palette.bronze },
  body: {
    flexGrow: 1,
    marginTop: -28,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 20,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  cardRow: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardRowRule: { borderBottomWidth: 1, borderBottomColor: 'rgba(16,22,15,0.08)' },
  cardLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  cardValue: { fontSize: 17, lineHeight: 21, letterSpacing: 0, color: colors.textPrimary },
  cardValueSmall: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  footer: { paddingHorizontal: 24, paddingTop: 8, backgroundColor: colors.background },
  actions: { gap: 6 },
  edit: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  delete: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.negative },
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
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  loading: { marginTop: 24 },
  missing: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
