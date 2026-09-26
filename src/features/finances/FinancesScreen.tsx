import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import CalendarRange from 'lucide-react-native/icons/calendar-range';
import ChartPie from 'lucide-react-native/icons/chart-pie';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BarChartCard } from '@/components/BarChartCard';
import { EmptyState } from '@/components/EmptyState';
import { TwoToneScrollScreen } from '@/components/Layout';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { PremiumBadge } from '@/components/PremiumBadge';
import { ProjectionChart } from '@/components/ProjectionChart';
import { ReceiptProgressCard } from '@/components/ReceiptProgressCard';
import { ReviewCard } from '@/components/ReviewCard';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { type LocalMonth, monthOf, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import { usePremium } from '@/features/billing/entitlement';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { localDateToDate, todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { SectionCard, WorkGeneratedCard } from './FinanceCards';
import { FinanceInfoSheet, InfoButton, type InfoRequest } from './FinanceInfo';
import {
  type FinanceMonth,
  type FinanceYear,
  type OriginAmount,
  useFinanceMonth,
  useFinanceOrigins,
  useFinanceYear,
  useHourlyWindow,
  useNextEntry,
  useUndatedPreviews,
  useYearOrigins,
  useYearWork,
  type YearWork,
} from './finance-data';
import {
  bestMonth,
  compactReais,
  heroCaption,
  hourlyInsight,
  hourlyReais,
  hoursLabel,
  isEmptyMonth,
  type MonthTense,
  monthsForYearWork,
  monthTense,
  noNextEntryReason,
  originShares,
  projectYear,
  receivedPercent,
  splitCaption,
  yearBars,
} from './finance-format';
import { InsightCard } from './InsightCard';
import { NextEntryCard } from './NextEntryCard';

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
  const [info, setInfo] = useState<InfoRequest | null>(null);

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
  const hourlyWindow = useHourlyWindow(month, (data?.workCount ?? 0) > 0);
  const insight = hourlyWindow.data ? hourlyInsight(hourlyWindow.data) : null;
  const yearData = useFinanceYear(year, mode === 'year');
  const yearMonths = (yearData.data?.months ?? []).map((item) => item.month);
  const yearOrigins = useYearOrigins(year, yearMonths, mode === 'year' && yearMonths.length > 0);
  // Trabalhos e horas do ano valem para todos; o valor/hora só vem do servidor com Premium.
  const yearWork = useYearWork(year, monthsForYearWork(year, today), mode === 'year');

  function openChild(path: () => void) {
    openedChild.current = true;
    path();
  }

  const openEntries = () =>
    openChild(() => router.push({ pathname: '/finances/entries', params: { month } }));

  const inYear = mode === 'year';
  // O verde fica por trás do bloco principal, como o calendário da Agenda: no Ano, o gráfico;
  // no Mês, o card Recebido × A receber.
  const chartOverlap = inYear
    ? (yearData.data?.months.length ?? 0) > 0
    : hasEntries && !finance.isError;
  const hero = (
    <View style={[styles.hero, chartOverlap && styles.heroBehindChart]}>
      <StatusBar style="light" />
      <View style={styles.heroContent}>
        <View style={styles.heroTop}>
          {inYear ? (
            <PeriodSwitcher
              size="compact"
              title={String(year)}
              previousLabel={t('previousYear')}
              nextLabel={t('nextYear')}
              onPrevious={() => setYear(year - 1)}
              onNext={() => setYear(year + 1)}
              testID="finances-year"
            />
          ) : (
            <PeriodSwitcher
              size="compact"
              title={name}
              secondary={month.slice(0, 4)}
              previousLabel={t('previousMonth')}
              nextLabel={t('nextMonth')}
              onPrevious={() => setMonth(shiftMonth(month, -1))}
              onNext={() => setMonth(shiftMonth(month, 1))}
              testID="finances-month"
            />
          )}
          <PeriodToggle
            mode={mode}
            onChange={setMode}
            monthLabel={t('mode.month')}
            yearLabel={t('mode.year')}
          />
        </View>
        {inYear
          ? yearData.data && (
              <YearHeroAmount
                data={yearData.data}
                year={year}
                onInfo={() => setInfo({ key: 'yearTotal', value: money(yearData.data.totalCents) })}
              />
            )
          : data && (
              <HeroAmount
                data={data}
                tense={tense}
                name={name}
                onInfo={(value) => setInfo({ key: 'expected', value })}
              />
            )}
      </View>
    </View>
  );

  if (inYear) {
    return (
      <TwoToneScrollScreen
        heroBackground={<AgendaHeroBackdrop />}
        hero={hero}
        bodyStyle={styles.body}
        testID="finances-screen"
      >
        <YearBody
          query={yearData}
          year={year}
          today={today}
          isPremium={isPremium}
          origins={yearOrigins.data}
          work={yearWork.data}
          onInfo={setInfo}
          onAddWork={() => openChild(() => router.push('/work/new'))}
        />
        <FinanceInfoSheet request={info} onClose={() => setInfo(null)} />
      </TwoToneScrollScreen>
    );
  }

  return (
    <TwoToneScrollScreen
      heroBackground={<AgendaHeroBackdrop />}
      hero={hero}
      bodyStyle={styles.body}
      testID="finances-screen"
    >
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
          {hasEntries && (
            <View style={styles.chartOverlap} testID="finances-split-wrap">
              <ReceivedSplit data={data} tense={tense} onInfo={setInfo} />
            </View>
          )}

          {tense !== 'past' && next.data ? (
            <NextEntryCard
              entry={next.data}
              today={today}
              showFollowing={tense === 'current'}
              onOpen={openEntries}
            />
          ) : tense === 'past' || next.isSuccess || !hasEntries ? (
            <EmptyState
              variant="financesNextEntry"
              description={noNextEntryReason(data, tense, name, t)}
              onPrimaryPress={hasEntries ? openEntries : undefined}
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
            <WorkGeneratedCard data={data} name={name} isPremium={isPremium} onInfo={setInfo} />
          )}

          {insight && (
            <InsightCard
              insight={insight}
              isPremium={isPremium}
              // Análise completa é 100% Premium; o Free vai ao fluxo de benefícios (5.5).
              onOpenAnalysis={
                isPremium
                  ? () =>
                      openChild(() =>
                        router.push({ pathname: '/finances/hourly', params: { month } }),
                      )
                  : undefined
              }
            />
          )}
        </View>
      )}
      <FinanceInfoSheet request={info} onClose={() => setInfo(null)} />
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
  data,
  year,
  onInfo,
}: {
  data: FinanceYear;
  year: number;
  onInfo: () => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const hasData = data.months.length > 0;
  return (
    <View style={styles.heroAmount} testID="finances-year-hero">
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.heroValue]}>
        {hasData ? money(data.totalCents) : t('hero.empty')}
      </AppText>
      <View style={styles.captionRow}>
        <AppText style={styles.heroCaption}>
          {hasData ? t('year.caption', { year }) : t('hero.nothingYet')}
        </AppText>
        {hasData && (
          <InfoButton
            tone="dark"
            label={t('info.yearTotal.title')}
            onPress={onInfo}
            testID="finances-info-yearTotal"
          />
        )}
      </View>
    </View>
  );
}

/**
 * Visão anual, na ordem do conceito do usuário: resumo (no topo), entradas mês a mês, origem,
 * seu ano, valor/hora e projeção. Média e tendência só com base suficiente; nada vira zero.
 */
function YearBody({
  query,
  year,
  today,
  isPremium,
  origins,
  work,
  onInfo,
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
  work: YearWork | undefined;
  onInfo: (request: InfoRequest) => void;
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
  const best = bestMonth(data, today);
  return (
    <View style={styles.sections}>
      <View style={styles.chartOverlap} testID="finances-year-chart-wrap">
        <BarChartCard
          eyebrow={t('year.range', { year })}
          legend={
            isCurrentYear
              ? [
                  { label: t('year.legendRealized'), kind: 'realized' },
                  { label: t('year.legendCurrent'), kind: 'current' },
                  { label: t('year.legendFuture'), kind: 'future' },
                ]
              : undefined
          }
          bars={yearBars(data, year, today)}
          accessibilityLabel={t('year.chartLabel', { year })}
          footer={
            // Componente = gráfico + ganho médio até o mês atual (meses concluídos).
            data.historicalAverageCents !== null ? (
              <View style={styles.averageRow} testID="finances-year-average">
                <AppText style={[type.heading1, styles.averageValue]}>
                  {money(data.historicalAverageCents)}
                </AppText>
                <AppText style={styles.averageLabel}>{t('year.average')}</AppText>
                <InfoButton
                  label={t('info.average.title')}
                  onPress={() =>
                    onInfo({ key: 'average', value: money(data.historicalAverageCents ?? 0n) })
                  }
                  testID="finances-info-average"
                />
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
      <YourYear
        average={data.historicalAverageCents}
        best={best}
        work={work}
        onInfoAverage={() =>
          onInfo({ key: 'average', value: money(data.historicalAverageCents ?? 0n) })
        }
      />
      <YearHourly isPremium={isPremium} work={work} onInfo={onInfo} />
      {isCurrentYear && (
        <YearProjection
          data={data}
          year={year}
          today={today}
          isPremium={isPremium}
          onInfo={onInfo}
        />
      )}
    </View>
  );
}

/** "Seu ano": média mensal, melhor mês, trabalhos e horas — abertos também no Free. */
function YourYear({
  average,
  best,
  work,
  onInfoAverage,
}: {
  average: bigint | null;
  best: { month: string; amountCents: bigint } | null;
  work: YearWork | undefined;
  onInfoAverage: () => void;
}) {
  const { t } = useTranslation('finances');
  return (
    <SectionCard
      icon={<CalendarRange color={colors.textPrimary} size={16} strokeWidth={1.7} />}
      eyebrow={t('year.yourYear')}
      testID="finances-your-year"
    >
      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <Stat
            value={average !== null ? money(average) : '—'}
            label={average !== null ? t('year.statAverage') : t('year.statAverageEmpty')}
            onInfo={average !== null ? onInfoAverage : undefined}
            testID="finances-stat-average"
          />
          <Stat
            value={best ? money(best.amountCents) : '—'}
            label={best ? `${t('year.statBest')} · ${monthName(best.month)}` : t('year.statBest')}
            testID="finances-stat-best"
          />
        </View>
        <View style={styles.statRow}>
          <Stat
            value={work ? String(work.workCount) : '—'}
            label={t('year.statWorks')}
            testID="finances-stat-works"
          />
          <Stat
            value={
              work && work.workDurationMinutes > 0 ? hoursLabel(work.workDurationMinutes) : '—'
            }
            label={t('year.statHours')}
            testID="finances-stat-hours"
          />
        </View>
      </View>
    </SectionCard>
  );
}

function Stat({
  value,
  label,
  onInfo,
  testID,
}: {
  value: string;
  label: string;
  onInfo?: () => void;
  testID: string;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  return (
    <View style={styles.stat} testID={testID}>
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.statValue]}>
        {value}
      </AppText>
      <View style={styles.statLabelRow}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          numberOfLines={1}
          style={styles.statLabel}
        >
          {label}
        </AppText>
        {onInfo ? (
          <InfoButton
            label={t('info.average.title')}
            onPress={onInfo}
            testID="finances-info-average"
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * Valor/hora médio do ano em destaque e as horas consideradas no cálculo como apoio (sem
 * percentual de evolução, a pedido do usuário). No Free, o número fica oculto com o selo; as horas continuam abertas.
 */
function YearHourly({
  isPremium,
  work,
  onInfo,
}: {
  isPremium: boolean;
  work: YearWork | undefined;
  onInfo: (request: InfoRequest) => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const hourly = work?.hourlyValueCents ?? null;
  if (!work || work.workDurationMinutes === 0) return null;
  const hoursUsed = isPremium ? work.hourlyMinutes : work.workDurationMinutes;
  return (
    <View style={styles.hourlyCard} testID="finances-year-hourly">
      <View style={styles.hourlyHeader}>
        <AppText variant="technical" style={styles.eyebrow}>
          {t('year.hourlyEyebrow')}
        </AppText>
        {isPremium ? (
          <InfoButton
            label={t('info.yearHourly.title')}
            onPress={() =>
              onInfo({
                key: 'yearHourly',
                value: hourly !== null ? `${hourlyReais(hourly)}${t('work.perHour')}` : '—',
              })
            }
            testID="finances-info-yearHourly"
          />
        ) : (
          <PremiumBadge testID="finances-year-hourly-premium" />
        )}
      </View>
      <View style={styles.hourlyValueRow}>
        <AppText
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            type.heading1,
            styles.hourlyBig,
            isPremium ? styles.hourlyValueAccent : styles.maskedValue,
          ]}
          testID="finances-year-hourly-value"
        >
          {isPremium && hourly !== null ? hourlyReais(hourly) : 'R$ •••'}
          <AppText style={styles.hourlyUnit}>{t('work.perHour')}</AppText>
        </AppText>
      </View>
      <AppText style={styles.hourlyHours}>
        {t('year.hourlyHours', { hours: hoursLabel(hoursUsed) })}
      </AppText>
    </View>
  );
}

const MONTH_AXIS = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

/**
 * Projeção até dezembro (conceito do usuário, gráfico 2): valor final em destaque, linha cheia
 * com o que já entrou e tracejado até dezembro. Só no ano corrente e com média calculável.
 */
function YearProjection({
  data,
  year,
  today,
  isPremium,
  onInfo,
}: {
  data: FinanceYear;
  year: number;
  today: string;
  isPremium: boolean;
  onInfo: (request: InfoRequest) => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const projection = projectYear(data, year, today);
  if (isPremium && projection === null) return null;
  return (
    <SectionCard
      icon={null}
      eyebrow={t('year.projectionEyebrow', { year })}
      premiumBadge={!isPremium}
      testID="finances-year-projection"
    >
      <View style={styles.projectionHead}>
        <AppText
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[type.heading1, styles.projectionValue, !isPremium && styles.maskedValue]}
          testID="finances-projection-total"
        >
          {isPremium && projection ? money(projection.totalCents) : 'R$ •••.•••'}
        </AppText>
        <View style={styles.captionRowLight}>
          <AppText style={styles.metricLabel}>{t('year.projectionCaption')}</AppText>
          <InfoButton
            label={t('info.projection.title')}
            onPress={() =>
              onInfo({
                key: 'projection',
                value: isPremium && projection ? money(projection.totalCents) : 'R$ •••.•••',
              })
            }
            testID="finances-info-projection"
          />
        </View>
      </View>
      {isPremium && projection ? (
        <>
          <ProjectionChart
            cumulative={projection.cumulative}
            projected={projection.projected}
            currentIndex={projection.currentIndex}
            monthLabels={MONTH_AXIS}
            todayLabel={t('year.projectionToday')}
            endLabel={compactReais(projection.totalCents)}
            realizedLabel={t('year.projectionRealized')}
            projectedLabel={t('year.projectionEstimated')}
            accessibilityLabel={t('year.chartProjectionLabel', { year })}
            testID="finances-projection-chart"
          />
          {projection.remainingMonths > 0 && (
            <AppText style={styles.lockedHint}>
              {t('year.projectionAverage', { average: money(projection.averageCents) })}
            </AppText>
          )}
        </>
      ) : (
        <AppText style={styles.lockedHint}>{t('year.projectionLocked')}</AppText>
      )}
    </SectionCard>
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
  onInfo,
}: {
  data: FinanceMonth;
  tense: MonthTense;
  name: string;
  onInfo: (value: string) => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const { amount, caption } = heroCaption(data, tense, name, t);
  return (
    <View style={styles.heroAmount} accessible testID="finances-hero">
      <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.heroValue]}>
        {amount === null ? t('hero.empty') : money(amount)}
      </AppText>
      <View style={styles.captionRow}>
        <AppText style={styles.heroCaption}>{caption}</AppText>
        {amount !== null && (
          <InfoButton
            tone="dark"
            label={t('info.expected.title')}
            onPress={() => onInfo(money(data.expectedTotalCents))}
            testID="finances-info-expected"
          />
        )}
      </View>
    </View>
  );
}

/** Recebido × A receber + barra de recebido, no componente compartilhado. */
function ReceivedSplit({
  data,
  tense,
  onInfo,
}: {
  data: FinanceMonth;
  tense: MonthTense;
  onInfo: (request: InfoRequest) => void;
}) {
  const { t } = useTranslation('finances');
  return (
    <ReceiptProgressCard
      receivedLabel={t('split.received')}
      receivedValue={money(data.receivedCents)}
      awaitingLabel={t('split.awaiting')}
      awaitingValue={money(data.awaitingCents)}
      percent={receivedPercent(data)}
      caption={splitCaption(data, tense, t)}
      onPressReceived={() => onInfo({ key: 'received', value: money(data.receivedCents) })}
      onPressAwaiting={() => onInfo({ key: 'awaiting', value: money(data.awaitingCents) })}
      testID="finances-split"
    />
  );
}

/** Quanto do bloco do gráfico fica sobre o topo verde (mesmo efeito do calendário). */
const CHART_OVERLAP = 96;

const styles = StyleSheet.create({
  hero: { paddingBottom: 24, overflow: 'hidden' },
  heroBehindChart: { paddingBottom: 24 + CHART_OVERLAP },
  // Sobe o bloco pelo espaço extra do topo e pelo respiro do corpo.
  chartOverlap: { marginTop: -(CHART_OVERLAP + 18) },
  heroContent: { paddingTop: 22, paddingHorizontal: 24, gap: 14 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
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
  averageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  averageValue: { fontSize: 24, lineHeight: 28, letterSpacing: -0.72, color: colors.textPrimary },
  averageLabel: { fontSize: 14, lineHeight: 18, color: palette.mutedCopy },
  historyStart: { gap: 4 },
  historyTitle: { fontSize: 16, lineHeight: 20, letterSpacing: -0.16, color: colors.textPrimary },
  historyText: { fontSize: 13, lineHeight: 19, color: palette.mutedCopy },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  captionRowLight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hourlyLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  // Duas caixinhas lado a lado com cor de destaque (valor/hora em bronze, evolução em verde).
  yearHourly: { flexDirection: 'row', gap: 12 },
  yearHourlyItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 6,
  },
  hourlyBox: { backgroundColor: 'rgba(169,138,84,0.12)', borderColor: 'rgba(169,138,84,0.4)' },
  evolutionBox: { backgroundColor: 'rgba(43,58,36,0.10)', borderColor: 'rgba(43,58,36,0.28)' },
  hourlyValueAccent: { color: palette.bronzeDeep },
  // Texto fixo e `i` sempre na mesma linha: o texto encolhe um pouco antes de quebrar.
  boxLabelRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  boxLabel: { flexShrink: 1, textAlign: 'center' },
  yearHourlyValue: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.72,
    color: colors.textPrimary,
  },
  evolutionValue: { color: palette.structure },
  projectionHead: { gap: 4 },
  projectionValue: { fontSize: 30, lineHeight: 34, letterSpacing: -0.9, color: colors.textPrimary },
  pressed: { opacity: 0.72 },
  heroAmount: { gap: 8 },
  // "Seu ano": grade 2×2.
  statGrid: { gap: 10 },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    backgroundColor: 'rgba(16,22,15,0.045)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  statValue: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.textPrimary },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { flexShrink: 1, fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  // Valor/hora do ano: número em destaque, evolução como etiqueta, horas como apoio.
  hourlyCard: {
    backgroundColor: 'rgba(169,138,84,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(169,138,84,0.38)',
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  hourlyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hourlyValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hourlyBig: { flexShrink: 1, fontSize: 34, lineHeight: 38, letterSpacing: -1.02 },
  hourlyUnit: { fontSize: 16, color: palette.sage, letterSpacing: 0 },
  hourlyHours: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy },
  heroValue: { fontSize: 46, lineHeight: 50, letterSpacing: -1.84, color: palette.cream },
  heroCaption: { fontSize: 15, lineHeight: 20, color: '#B9BFB2' },
  // Passagem reta do verde para o bege (sem cantos arredondados), conteúdo no fundo bege.
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  padded: {},
  sections: { gap: 22 },
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
  cardPressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  seeEntries: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeEntriesText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  seeEntriesArrow: { fontSize: 14, lineHeight: 18, color: palette.bronze },
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
