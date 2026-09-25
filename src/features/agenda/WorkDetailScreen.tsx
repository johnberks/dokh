import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { LoadError } from '@/components/TechnicalStates';
import { formatCentsToBRL } from '@/domain/money';
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
 * Agenda 15, leitura: data por extenso, local, início → término, tipo e duração, valor,
 * previsão e status (ponto + texto, sem badge). `Editar trabalho` e `Excluir` entram com a
 * 6.7/8.4; recorrência, com a 8.5.
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
          <View style={styles.errorBody}>
            {work.isError ? (
              <LoadError onRetry={() => void work.refetch()} retrying={work.isFetching} />
            ) : (
              <AppText style={styles.missing}>{t('detail.missing')}</AppText>
            )}
          </View>
        </DetailFrame>
      ) : (
        <DetailContent work={work.data} />
      )}
    </View>
  );
}

function DetailFrame({ children, hero }: { children: React.ReactNode; hero?: React.ReactNode }) {
  const { t } = useTranslation('agenda');
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  return (
    <>
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
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}>
        {children}
      </View>
    </>
  );
}

function DetailContent({ work }: { work: AgendaWork }) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const end = workEndDescription(work.workDate, work.startTime, work.durationMinutes);
  const typeLabel = t(`workType.${work.type}` as 'workType.shift');
  const kind =
    work.durationMinutes === null
      ? typeLabel
      : `${typeLabel} ${durationLabel(work.durationMinutes)}`;
  const status = work.receiptStatus === 'invalidated' ? null : (work.receiptStatus ?? 'undated');

  const hero = (
    <View style={styles.heroContent}>
      <View style={styles.dateRow}>
        <View style={[styles.dot, { backgroundColor: workLocationColors[work.colorToken] }]} />
        <AppText style={styles.date}>
          {capitalize(LONG_DATE.format(localDateToDate(work.workDate)))}
        </AppText>
      </View>
      <AppText accessibilityRole="header" style={[type.heading1, styles.place]}>
        {work.locationName}
      </AppText>
      {work.startTime ? (
        <View style={styles.timeRow}>
          <AppText style={[type.heading1, styles.time]} testID="work-detail-time">
            {work.startTime}
          </AppText>
          <AppText style={styles.timeMeta}>
            {end ? `→ ${end.time}${end.nextDay ? ` ${t('detail.nextDay')}` : ''} · ${kind}` : kind}
          </AppText>
        </View>
      ) : (
        <AppText style={styles.timeMeta}>{kind}</AppText>
      )}
      {work.description ? <AppText style={styles.timeMeta}>{work.description}</AppText> : null}
    </View>
  );

  return (
    <DetailFrame hero={hero}>
      <View style={styles.card}>
        <View style={[styles.cardRow, styles.cardRowRule]}>
          <AppText style={styles.cardLabel}>{t('detail.amount')}</AppText>
          <AppText style={[type.heading1, styles.cardValue]} testID="work-detail-amount">
            {work.amountCents === null
              ? '—'
              : formatCentsToBRL(work.amountCents, { omitZeroCents: true })}
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  heroContent: { paddingTop: 34, paddingHorizontal: 24, gap: 14 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  date: { fontSize: 14, lineHeight: 18, color: palette.secondaryText },
  place: { fontSize: 32, lineHeight: 34, letterSpacing: -0.96, color: palette.cream },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  time: { fontSize: 44, lineHeight: 46, letterSpacing: -1.76, color: palette.cream },
  timeMeta: { fontSize: 15, lineHeight: 20, color: palette.secondaryText, paddingBottom: 6 },
  body: {
    flex: 1,
    marginTop: -28,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
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
  },
  cardRowRule: { borderBottomWidth: 1, borderBottomColor: 'rgba(16,22,15,0.08)' },
  cardLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  cardValue: { fontSize: 17, lineHeight: 21, letterSpacing: 0, color: colors.textPrimary },
  cardValueSmall: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  loading: { marginTop: 24 },
  errorBody: { paddingTop: 8 },
  missing: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
