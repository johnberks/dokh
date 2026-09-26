import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import ChartPie from 'lucide-react-native/icons/chart-pie';
import Check from 'lucide-react-native/icons/check';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BarChartCard } from '@/components/BarChartCard';
import { EmptyState } from '@/components/EmptyState';
import { TwoToneScrollScreen } from '@/components/Layout';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { PremiumBadge } from '@/components/PremiumBadge';
import { ReviewCard } from '@/components/ReviewCard';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { formatDayMonth, type LocalMonth, monthOf, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import { usePremium } from '@/features/billing/entitlement';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { localDateToDate, todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import {
  type FinanceMonth,
  type FinanceYear,
  type NextEntry,
  type OriginAmount,
  useFinanceMonth,
  useFinanceOrigins,
  useFinanceYear,
  useNextEntry,
  useUndatedPreviews,
  useYearOrigins,
} from './finance-data';
import {
  heroCaption,
  hoursLabel,
  isEmptyMonth,
  type MonthTense,
  monthTense,
  noNextEntryReason,
  originShares,
  receivedPercent,
  relativeDay,
  splitCaption,
  yearBars,
} from './finance-format';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

function monthName(month: LocalMonth): string {
  const name = MONTH_NAME.format(localDateToDate(`${month}-01`));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/** Cor da origem: Residência em sálvia, trabalhos na família do design. */
const ORIGIN_COLOR = {
  residency: palette.workSage,
  shift: palette.structure,
  procedure: palette.bronzeDeep,
  appointment: palette.workBlue,
} as const;

/**
 * Finanças — visões mensal (Finanças 01, 01-B/C/D/E, 11 e 12) e anual (03-B e 13). Topo verde e corpo bege são
 * uma única rolagem; os blocos Recebido × A receber sobem sobre o topo, como o calendário da
 * Agenda. Pendências (Review Card) só aparecem no mês atual e quando existem; recursos
 * Premium liberados não mostram selo nem cadeado. Caixa e competência nunca se misturam.
 */
export function FinancesScreen() {
  const { t } = useTranslation('finances');
  const [today, setToday] = useState(() => todayInTimezone(deviceTimezone()));
  const [month, setMonth] = useState<LocalMonth>(() => monthOf(today));
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const openedChild = useRef(false);

  // Como a Agenda: entrar na aba sempre abre o mês atual.
  useFocusEffect(
    useCallback(() => {
      if (openedChild.current) {
        openedChild.current = false;
        return;
      }
      const now = todayInTimezone(deviceTimezone());
      setToday(now);
      setMonth(monthOf(now));
      setMode('month');
      setYear(Number(now.slice(0, 4)));
    }, []),
  );

  const premium = usePremium();
  const isPremium = premium.data === true;
  const finance = useFinanceMonth(month);
  const data = finance.data;
  const tense = monthTense(month, today);
  const name = monthName(month);
  const hasEntries = data?.hasExpectedEntries === true;
  const origins = useFinanceOrigins(month, hasEntries);
  const next = useNextEntry(month, today, hasEntries && tense !== 'past');
  // Pendência sem data é tarefa de agora: só no mês atual e só quando existe.
  const showReview = tense === 'current' && (data?.undatedCount ?? 0) > 0;
  const undated = useUndatedPreviews(showReview);
  const yearData = useFinanceYear(year, mode === 'year');
  const yearMonths = (yearData.data?.months ?? []).map((item) => item.month);
  const yearOrigins = useYearOrigins(year, yearMonths, mode === 'year' && yearMonths.length > 0);

  function openChild(path: () => void) {
    openedChild.current = true;
    path();
  }

  const inYear = mode === 'year';
  const hero = (
    <View
      style={[
        styles.hero,
        (inYear ? (yearData.data?.months.length ?? 0) > 0 : hasEntries) && styles.heroWithOverlap,
      ]}
    >
      <StatusBar style="light" />
      <AgendaHeroBackdrop />
      <View style={styles.heroContent}>
        <View style={styles.heroTop}>
          <AppText variant="technical" style={styles.heroEyebrow}>
            {t('eyebrow')}
          </AppText>
          <PeriodToggle
            mode={mode}
            onChange={setMode}
            monthLabel={t('mode.month')}
            yearLabel={t('mode.year')}
          />
        </View>
        {inYear ? (
          <PeriodSwitcher
            title={String(year)}
            previousLabel={t('previousYear')}
            nextLabel={t('nextYear')}
            onPrevious={() => setYear(year - 1)}
            onNext={() => setYear(year + 1)}
            testID="finances-year"
          />
        ) : (
          <PeriodSwitcher
            title={name}
            secondary={month.slice(0, 4)}
            previousLabel={t('previousMonth')}
            nextLabel={t('nextMonth')}
            onPrevious={() => setMonth(shiftMonth(month, -1))}
            onNext={() => setMonth(shiftMonth(month, 1))}
            testID="finances-month"
          />
        )}
        {inYear
          ? yearData.data && (
              <YearHeroAmount
                total={yearData.data.totalCents}
                year={year}
                hasData={yearData.data.months.length > 0}
              />
            )
          : data && <HeroAmount data={data} tense={tense} name={name} />}
      </View>
    </View>
  );

  if (inYear) {
    return (
      <TwoToneScrollScreen hero={hero} bodyStyle={styles.body} testID="finances-screen">
        <YearBody
          query={yearData}
          year={year}
          today={today}
          isPremium={isPremium}
          origins={yearOrigins.data}
          onAddWork={() => openChild(() => router.push('/work/new'))}
        />
      </TwoToneScrollScreen>
    );
  }

  return (
    <TwoToneScrollScreen hero={hero} bodyStyle={styles.body} testID="finances-screen">
      {finance.isPending ? (
        <View style={styles.padded}>
          <Skeleton layout="summary" testID="finances-loading" />
        </View>
      ) : finance.isError || !data ? (
        // Falha de leitura nunca vira mês vazio nem `R$ —`.
        <View style={styles.padded}>
          <LoadError
            onRetry={() => void finance.refetch()}
            retrying={finance.isFetching}
            testID="finances-error"
          />
        </View>
      ) : isEmptyMonth(data) ? (
        <View style={styles.padded}>
          <EmptyState
            variant="financesNoWork"
            onPrimaryPress={() => openChild(() => router.push('/work/new'))}
            testID="finances-empty"
          />
        </View>
      ) : (
        <View style={styles.sections}>
          {hasEntries && <ReceivedSplit data={data} tense={tense} />}

          {tense !== 'past' && next.data ? (
            <NextEntryCard entry={next.data} today={today} />
          ) : tense === 'past' || next.isSuccess || !hasEntries ? (
            <EmptyState
              variant="financesNextEntry"
              description={noNextEntryReason(data, tense, name, t)}
              testID="finances-no-next"
            />
          ) : null}

          {showReview && undated.data && (
            <ReviewCard
              size="detailed"
              eyebrow={
                data.undatedCount === 1
                  ? t('review.eyebrowOne')
                  : t('review.eyebrowMany', { count: data.undatedCount })
              }
              icon={<CalendarClock color={palette.bronzeDeep} size={18} strokeWidth={1.7} />}
              iconTone="bronze"
              value={money(data.undatedTotalCents)}
              qualifier={t('review.qualifier')}
              hint={t('review.hint')}
              previews={undated.data.map((item) => ({
                id: item.workId,
                type: t(`workType.${item.type}` as 'workType.shift'),
                title: item.description
                  ? `${item.description} · ${item.locationName}`
                  : item.locationName,
                value: money(item.amountCents),
                state: t('review.undated'),
                accent: item.type === 'shift' ? 'structure' : 'bronze',
              }))}
              totalItems={data.undatedCount}
              action={{ label: t('review.action'), kind: 'arrow' }}
              onPress={() => {
                const first = undated.data?.[0];
                if (first) {
                  openChild(() =>
                    router.push({ pathname: '/work/edit/[id]', params: { id: first.workId } }),
                  );
                }
              }}
              testID="finances-review"
            />
          )}

          {hasEntries && (
            <OriginCard
              eyebrow={t('origin.eyebrow')}
              hint={t('origin.lockedHint')}
              isPremium={isPremium}
              origins={origins.data}
              testID="finances-origin"
            />
          )}

          {data.workCount > 0 && (
            <WorkGeneratedCard data={data} name={name} isPremium={isPremium} />
          )}
        </View>
      )}
    </TwoToneScrollScreen>
  );
}

function PeriodToggle({
  mode,
  onChange,
  monthLabel,
  yearLabel,
}: {
  mode: 'month' | 'year';
  onChange: (mode: 'month' | 'year') => void;
  monthLabel: string;
  yearLabel: string;
}) {
  const type = useBrandTypography();
  return (
    <View accessibilityRole="tablist" style={styles.toggle}>
      {(['month', 'year'] as const).map((option) => {
        const on = mode === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityLabel={option === 'month' ? monthLabel : yearLabel}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option)}
            testID={`finances-mode-${option}`}
            style={[styles.toggleOption, on && styles.toggleOn]}
          >
            <AppText style={[type.heading1, styles.toggleText, on && styles.toggleTextOn]}>
              {option === 'month' ? monthLabel : yearLabel}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function YearHeroAmount({
  total,
  year,
  hasData,
}: {
  total: bigint;
  year: number;
  hasData: boolean;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <View style={styles.heroAmount} accessible testID="finances-year-hero">
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.heroValue]}>
        {hasData ? money(total) : t('hero.empty')}
      </AppText>
      <AppText style={styles.heroCaption}>
        {hasData ? t('year.caption', { year }) : t('hero.nothingYet')}
      </AppText>
    </View>
  );
}

/** Visão anual (Finanças 03-B/13): barras de janeiro a dezembro, média só com base suficiente. */
function YearBody({
  query,
  year,
  today,
  isPremium,
  origins,
  onAddWork,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    data?: FinanceYear;
    refetch: () => unknown;
    isFetching: boolean;
  };
  year: number;
  today: string;
  isPremium: boolean;
  origins: OriginAmount[] | undefined;
  onAddWork: () => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  if (query.isPending) {
    return (
      <View style={styles.padded}>
        <Skeleton layout="summary" testID="finances-year-loading" />
      </View>
    );
  }
  if (query.isError || !query.data) {
    return (
      <View style={styles.padded}>
        <LoadError
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
          testID="finances-year-error"
        />
      </View>
    );
  }
  const data = query.data;
  if (data.months.length === 0) {
    return (
      <View style={styles.padded}>
        <EmptyState
          variant="financesNoWork"
          onPrimaryPress={onAddWork}
          testID="finances-year-empty"
        />
      </View>
    );
  }
  const isCurrentYear = Number(today.slice(0, 4)) === year;
  return (
    <View style={styles.sections}>
      <View style={styles.chartWrap}>
        <BarChartCard
          eyebrow={t('year.range')}
          legend={isCurrentYear ? t('year.currentMonth') : undefined}
          bars={yearBars(data, year, today)}
          accessibilityLabel={t('year.chartLabel', { year })}
          footer={
            data.historicalAverageCents !== null ? (
              <View style={styles.averageRow} testID="finances-year-average">
                <AppText style={[type.heading1, styles.averageValue]}>
                  {money(data.historicalAverageCents)}
                </AppText>
                <AppText style={styles.averageLabel}>{t('year.average')}</AppText>
              </View>
            ) : (
              <View style={styles.historyStart} testID="finances-year-history-start">
                <AppText style={[type.heading1, styles.historyTitle]}>
                  {t('year.historyTitle')}
                </AppText>
                <AppText style={styles.historyText}>{t('year.historyText')}</AppText>
              </View>
            )
          }
          testID="finances-year-chart"
        />
      </View>
      <OriginCard
        eyebrow={t('origin.yearEyebrow')}
        hint={t('origin.lockedYearHint')}
        isPremium={isPremium}
        origins={origins}
        testID="finances-year-origin"
      />
    </View>
  );
}

/** Origem das entradas: valores reais no Premium, estrutura oculta com selo no Free. */
function OriginCard({
  eyebrow,
  hint,
  isPremium,
  origins,
  testID,
}: {
  eyebrow: string;
  hint: string;
  isPremium: boolean;
  origins: OriginAmount[] | undefined;
  testID: string;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <SectionCard
      icon={<ChartPie color={colors.textPrimary} size={16} strokeWidth={1.7} />}
      eyebrow={eyebrow}
      premiumBadge={!isPremium}
      testID={testID}
    >
      {isPremium ? (
        <View style={styles.originList}>
          {originShares(origins ?? []).map((share) => (
            <View key={share.origin} style={styles.originRow}>
              <View style={styles.originLine}>
                <AppText style={[type.heading1, styles.originName]}>
                  {t(`origin.${share.origin}` as 'origin.shift')}
                </AppText>
                <AppText style={[type.heading1, styles.originValue]}>
                  {money(share.amountCents)}
                </AppText>
              </View>
              <View style={styles.originBarRow}>
                <View style={styles.originTrack}>
                  <View
                    style={[
                      styles.originFill,
                      {
                        width: `${Math.max(share.percent, 2)}%`,
                        backgroundColor: ORIGIN_COLOR[share.origin],
                      },
                    ]}
                  />
                </View>
                <AppText variant="technical" style={styles.originPercent}>
                  {`${share.percent}%`}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.originList} testID={`${testID}-locked`}>
          {[0, 1, 2].map((row) => (
            <View key={row} accessible={false} style={styles.originRow}>
              <View style={styles.originLine}>
                <AppText style={styles.masked}>{'••••••••'}</AppText>
                <AppText style={styles.masked}>{'R$ ••••'}</AppText>
              </View>
              <View style={styles.originTrack} />
            </View>
          ))}
          <AppText style={styles.lockedHint}>{hint}</AppText>
        </View>
      )}
    </SectionCard>
  );
}

function HeroAmount({
  data,
  tense,
  name,
}: {
  data: FinanceMonth;
  tense: MonthTense;
  name: string;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const { amount, caption } = heroCaption(data, tense, name, t);
  return (
    <View style={styles.heroAmount} accessible testID="finances-hero">
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.heroValue]}>
        {amount === null ? t('hero.empty') : money(amount)}
      </AppText>
      <AppText style={styles.heroCaption}>{caption}</AppText>
    </View>
  );
}

/** Recebido × A receber: objeto principal do mês, sobre a divisa do topo escuro. */
function ReceivedSplit({ data, tense }: { data: FinanceMonth; tense: MonthTense }) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const percent = receivedPercent(data);
  return (
    <View style={styles.split}>
      <View style={styles.splitRow}>
        <View
          style={[styles.splitBlock, styles.receivedBlock]}
          accessible
          testID="finances-received"
        >
          <View style={styles.splitLabel}>
            <View style={styles.receivedIcon}>
              <Check color={palette.cream} size={11} strokeWidth={3} />
            </View>
            <AppText variant="technical" style={[styles.splitEyebrow, styles.receivedEyebrow]}>
              {t('split.received')}
            </AppText>
          </View>
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[type.heading1, styles.splitValue, styles.receivedValue]}
          >
            {money(data.receivedCents)}
          </AppText>
        </View>
        <View
          style={[styles.splitBlock, styles.awaitingBlock]}
          accessible
          testID="finances-awaiting"
        >
          <View style={styles.splitLabel}>
            <View style={styles.awaitingIcon}>
              <View style={styles.awaitingDot} />
            </View>
            <AppText variant="technical" style={styles.splitEyebrow}>
              {t('split.awaiting')}
            </AppText>
          </View>
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[type.heading1, styles.splitValue]}
          >
            {money(data.awaitingCents)}
          </AppText>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <AppText style={styles.progressCaption} testID="finances-percent">
        {splitCaption(data, tense, t)}
      </AppText>
    </View>
  );
}

function NextEntryCard({ entry, today }: { entry: NextEntry; today: string }) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const [day, monthLabel] = formatDayMonth(entry.expectedOn).split(' ');
  const origin =
    entry.origin === 'residency'
      ? t('next.residency')
      : (entry.locationName ?? t('next.residency'));
  return (
    <View style={styles.card} accessible testID="finances-next">
      <AppText variant="technical" style={styles.eyebrow}>
        {t('next.eyebrow')}
      </AppText>
      <View style={styles.nextDateRow}>
        <AppText style={[type.heading1, styles.nextDay]}>
          {day} <AppText style={styles.nextMonth}>{monthLabel}</AppText>
        </AppText>
        <AppText style={styles.nextRelative}>{relativeDay(entry.expectedOn, today, t)}</AppText>
      </View>
      <View style={styles.nextOriginRow}>
        <View style={styles.nextOrigin}>
          <View style={[styles.originDot, { backgroundColor: ORIGIN_COLOR[entry.origin] }]} />
          <AppText numberOfLines={1} style={[type.heading1, styles.nextOriginName]}>
            {origin}
          </AppText>
        </View>
        <AppText style={[type.heading1, styles.nextValue]}>{money(entry.amountCents)}</AppText>
      </View>
    </View>
  );
}

function WorkGeneratedCard({
  data,
  name,
  isPremium,
}: {
  data: FinanceMonth;
  name: string;
  isPremium: boolean;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <SectionCard
      icon={<Stethoscope color={colors.textPrimary} size={16} strokeWidth={1.7} />}
      eyebrow={t('work.eyebrow', { month: name.toUpperCase() })}
      testID="finances-work"
    >
      <View style={styles.generatedRow}>
        <AppText style={[type.heading1, styles.generatedValue]}>
          {money(data.workGeneratedCents)}
        </AppText>
        <AppText style={styles.generatedLabel}>{t('work.generated')}</AppText>
      </View>
      <View style={styles.metrics}>
        <Metric
          value={String(data.workCount)}
          label={data.workCount === 1 ? t('work.worksOne') : t('work.worksMany')}
        />
        {data.workDurationMinutes > 0 && (
          <>
            <AppText style={styles.metricArrow}>{'→'}</AppText>
            <Metric value={hoursLabel(data.workDurationMinutes)} label={t('work.hours')} />
          </>
        )}
        {data.workDurationMinutes > 0 && (
          <>
            <AppText style={styles.metricArrow}>{'→'}</AppText>
            <View style={styles.metricWide} testID="finances-hourly">
              {isPremium && data.hourlyValueCents !== null ? (
                <AppText style={[type.heading1, styles.metricValue]}>
                  {money(data.hourlyValueCents)}
                  <AppText style={styles.metricUnit}>{t('work.perHour')}</AppText>
                </AppText>
              ) : (
                <AppText style={[type.heading1, styles.metricValue, styles.maskedValue]}>
                  {'R$ •••'}
                  <AppText style={styles.metricUnit}>{t('work.perHour')}</AppText>
                </AppText>
              )}
              {isPremium ? (
                <AppText style={styles.metricLabel}>{t('work.hourly')}</AppText>
              ) : (
                <PremiumBadge size="short" />
              )}
            </View>
          </>
        )}
      </View>
    </SectionCard>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  const type = useBrandTypography();
  return (
    <View style={styles.metric}>
      <AppText style={[type.heading1, styles.metricValue]}>{value}</AppText>
      <AppText style={styles.metricLabel}>{label}</AppText>
    </View>
  );
}

/** Card de seção do HTML: ícone em quadrado, rótulo técnico e, no Free, o selo Premium. */
function SectionCard({
  icon,
  eyebrow,
  premiumBadge = false,
  children,
  testID,
}: {
  icon: ReactNode;
  eyebrow: string;
  premiumBadge?: boolean;
  children: ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <View style={styles.sectionIcon}>{icon}</View>
          <AppText variant="technical" style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        </View>
        {premiumBadge && <PremiumBadge testID={testID ? `${testID}-premium` : undefined} />}
      </View>
      {children}
    </View>
  );
}

const SPLIT_OVERLAP = 56;

const styles = StyleSheet.create({
  hero: { paddingBottom: 44, overflow: 'hidden' },
  // Os blocos Recebido × A receber sobem sobre o topo escuro, como o calendário da Agenda.
  heroWithOverlap: { paddingBottom: 44 + SPLIT_OVERLAP },
  heroContent: { paddingTop: 22, paddingHorizontal: 24, gap: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(237,234,224,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.22)',
    borderRadius: 999,
    padding: 3,
  },
  toggleOption: {
    minHeight: 30,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: palette.cream },
  toggleText: { fontSize: 13, lineHeight: 16, letterSpacing: 0, color: palette.sage },
  toggleTextOn: { color: palette.base },
  chartWrap: { marginTop: -SPLIT_OVERLAP },
  averageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  averageValue: { fontSize: 24, lineHeight: 28, letterSpacing: -0.72, color: colors.textPrimary },
  averageLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  historyStart: { gap: 4 },
  historyTitle: { fontSize: 16, lineHeight: 20, letterSpacing: -0.16, color: colors.textPrimary },
  historyText: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy },
  heroAmount: { gap: 8 },
  heroValue: { fontSize: 46, lineHeight: 50, letterSpacing: -1.84, color: palette.cream },
  heroCaption: { fontSize: 15, lineHeight: 20, color: '#B9BFB2' },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  padded: { paddingTop: 24 },
  sections: { gap: 22 },
  split: { marginTop: -SPLIT_OVERLAP, gap: 10 },
  splitRow: { flexDirection: 'row', gap: 12 },
  splitBlock: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
  // Sobre o topo escuro o bloco precisa ser opaco: o verde translúcido do HTML vira tom sólido.
  receivedBlock: { backgroundColor: '#DCDDD1', borderColor: 'rgba(43,58,36,0.28)' },
  awaitingBlock: { backgroundColor: '#F8F6EF', borderColor: 'rgba(16,22,15,0.16)' },
  splitLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  receivedIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.structure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: palette.bronze,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.bronze },
  splitEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  receivedEyebrow: { color: palette.structure },
  splitValue: { fontSize: 26, lineHeight: 30, letterSpacing: -0.78, color: colors.textPrimary },
  receivedValue: { color: palette.structure },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(169,138,84,0.28)',
    marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: palette.structure },
  progressCaption: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    padding: 18,
    gap: 14,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  nextDateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: -6 },
  nextDay: { fontSize: 28, lineHeight: 30, letterSpacing: -0.84, color: colors.textPrimary },
  nextMonth: { fontSize: 16, color: palette.mutedCopy },
  nextRelative: { fontSize: 13, lineHeight: 17, color: palette.mutedCopy, paddingBottom: 3 },
  nextOriginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,22,15,0.08)',
    paddingTop: 12,
    gap: 12,
  },
  nextOrigin: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  originDot: { width: 10, height: 10, borderRadius: 5 },
  nextOriginName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  nextValue: { fontSize: 18, lineHeight: 22, letterSpacing: 0, color: colors.textPrimary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(16,22,15,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originList: { gap: 18 },
  originRow: { gap: 8 },
  originLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  originName: { fontSize: 15, lineHeight: 19, letterSpacing: -0.15, color: colors.textPrimary },
  originValue: { fontSize: 15, lineHeight: 19, letterSpacing: -0.3, color: colors.textPrimary },
  originBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  originTrack: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,22,15,0.06)',
  },
  originFill: { height: '100%', borderRadius: 6 },
  originPercent: {
    minWidth: 34,
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: palette.mutedCopy,
  },
  masked: { fontSize: 15, lineHeight: 19, color: 'rgba(16,22,15,0.28)', letterSpacing: 1 },
  lockedHint: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy },
  generatedRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  generatedValue: { fontSize: 22, lineHeight: 26, letterSpacing: -0.66, color: colors.textPrimary },
  generatedLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  metrics: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16,22,15,0.045)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  metric: { flex: 1, gap: 4 },
  metricWide: { flex: 1.5, gap: 6 },
  metricArrow: { fontSize: 14, lineHeight: 24, color: palette.sage, paddingHorizontal: 6 },
  metricValue: { fontSize: 22, lineHeight: 26, letterSpacing: -0.66, color: colors.textPrimary },
  maskedValue: { color: 'rgba(16,22,15,0.35)' },
  metricUnit: { fontSize: 14, color: palette.sage },
  metricLabel: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
});
