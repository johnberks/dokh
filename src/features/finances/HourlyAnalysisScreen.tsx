import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { TwoToneScrollScreen } from '@/components/Layout';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import type { LocalMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import { localDateToDate } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { WorkGeneratedCard } from './FinanceCards';
import { FinanceInfoSheet, type InfoRequest } from './FinanceInfo';
import { FinanceSubHero } from './FinanceSubHero';
import { type FinanceMonth, useFinanceMonth, useHourlyHistory } from './finance-data';
import { type HourlyEvolution, hourlyEvolution, hourlyReais, hoursLabel } from './finance-format';

const SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const LONG = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const shortOf = (month: string) => SHORT[Number(month.slice(5, 7)) - 1];
const longOf = (month: string) => LONG.format(localDateToDate(`${month}-01`));
const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/** Quanto o card do trabalho sobe sobre o topo verde. */
const OVERLAP = 96;
const BAR_HEIGHT = 88;
const MONTHS_WORD = ['', '', 'two', 'three', 'four', 'five', 'six'] as const;

/**
 * Análise completa de valor/hora (Finanças 02), 100% Premium: o trabalho do mês, a fórmula
 * gerado ÷ horas com o resultado e a evolução mês a mês com números reais. Sem CTAs: a tela é a
 * análise. Comparações só aparecem quando os dados as sustentam.
 */
export function HourlyAnalysisScreen({ month }: { month: LocalMonth }) {
  const { t } = useTranslation('finances');
  const [info, setInfo] = useState<InfoRequest | null>(null);
  const finance = useFinanceMonth(month);
  const history = useHourlyHistory(month, true);
  const data = finance.data;
  const name = capitalized(longOf(month));
  const evolution = history.data ? hourlyEvolution(history.data, month) : null;

  const hero = (
    <FinanceSubHero
      eyebrow={`${name} ${month.slice(0, 4)}`.toUpperCase()}
      title={t('analysis.title')}
      overlap={data ? OVERLAP : 0}
      testID="analysis"
    />
  );

  return (
    <TwoToneScrollScreen
      heroBackground={<AgendaHeroBackdrop />}
      hero={hero}
      bodyStyle={styles.body}
      testID="analysis-screen"
    >
      {finance.isPending ? (
        <Skeleton layout="summary" testID="analysis-loading" />
      ) : finance.isError || !data ? (
        <LoadError
          onRetry={() => void finance.refetch()}
          retrying={finance.isFetching}
          testID="analysis-error"
        />
      ) : (
        <View style={styles.sections}>
          <View style={styles.overlap}>
            <WorkGeneratedCard data={data} name={name} isPremium onInfo={setInfo} />
          </View>
          <HourlyResult data={data} name={longOf(month)} evolution={evolution} />
          {evolution ? <EvolutionCard evolution={evolution} /> : null}
        </View>
      )}
      <FinanceInfoSheet request={info} onClose={() => setInfo(null)} />
    </TwoToneScrollScreen>
  );
}

/** Card escuro com o resultado: `R$ 176 /h`, a fórmula e a frase com números reais. */
function HourlyResult({
  data,
  name,
  evolution,
}: {
  data: FinanceMonth;
  name: string;
  evolution: HourlyEvolution | null;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const hourly = data.hourlyValueCents;
  return (
    <View style={styles.dark} testID="analysis-result">
      <View style={styles.darkBackdrop} pointerEvents="none">
        <AgendaHeroBackdrop />
      </View>
      <AppText variant="technical" style={styles.darkEyebrow}>
        {t('analysis.eyebrow')}
      </AppText>
      {hourly !== null ? (
        <>
          <View style={styles.resultRow}>
            <AppText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[type.heading1, styles.resultValue]}
              testID="analysis-hourly"
            >
              {'R$ '}
              <AppText style={[type.heading1, styles.resultAccent]}>
                {hourlyReais(hourly).replace('R$', '').trim()}
              </AppText>
            </AppText>
            <AppText style={styles.resultUnit}>{t('work.perHour')}</AppText>
          </View>
          <AppText
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            numberOfLines={1}
            style={styles.formula}
            testID="analysis-formula"
          >
            <AppText style={[type.heading1, styles.formulaStrong]}>
              {money(data.workGeneratedCents)}
            </AppText>
            {` ${t('analysis.generated')} `}
            <AppText style={styles.formulaSign}>÷</AppText>{' '}
            <AppText style={[type.heading1, styles.formulaStrong]}>
              {hoursLabel(data.workDurationMinutes)}
            </AppText>
            {` ${t('analysis.worked')}`}
          </AppText>
          <AppText style={styles.darkText} testID="analysis-result-text">
            {evolution?.currentIsBest
              ? t('analysis.textBest', {
                  month: name,
                  hourly: hourlyReais(hourly),
                  months: evolution.bars.length,
                })
              : t('analysis.text', { month: name, hourly: hourlyReais(hourly) })}
          </AppText>
        </>
      ) : (
        <AppText style={styles.darkText} testID="analysis-no-hours">
          {t('analysis.noHours', { month: name })}
        </AppText>
      )}
    </View>
  );
}

/** Evolução mês a mês: barras reais, só dos meses com valor/hora; o mês escolhido em bronze. */
function EvolutionCard({ evolution }: { evolution: HourlyEvolution }) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const bars = evolution.bars;
  const max = Math.max(...bars.map((bar) => bar.hourlyCents));
  const period =
    bars.length > 1
      ? `${shortOf(bars[0].month)}–${shortOf(bars[bars.length - 1].month)}`
      : shortOf(bars[0].month);
  const sentence =
    evolution.direction === null
      ? t('analysis.evolutionShort')
      : [
          t(
            evolution.direction === 'up'
              ? 'analysis.evolutionUp'
              : evolution.direction === 'down'
                ? 'analysis.evolutionDown'
                : 'analysis.evolutionStable',
            { percent: Math.abs(evolution.percent ?? 0), month: longOf(evolution.firstMonth) },
          ),
          evolution.bestTwo
            ? t('analysis.bestTwo', {
                first: capitalized(longOf(evolution.bestTwo[0])),
                second: longOf(evolution.bestTwo[1]),
              })
            : null,
        ]
          .filter(Boolean)
          .join(' ');

  return (
    <View style={styles.card} testID="analysis-evolution">
      <View style={styles.cardHeader}>
        <AppText variant="technical" style={styles.cardEyebrow}>
          {t('analysis.evolutionEyebrow')}
        </AppText>
        <AppText variant="technical" style={styles.cardPeriod}>
          {period}
        </AppText>
      </View>
      {bars.length > 1 ? (
        <AppText style={[type.heading1, styles.cardTitle]}>
          {t('analysis.evolutionTitle', {
            months: t(
              `analysis.monthsWord.${MONTHS_WORD[bars.length]}` as 'analysis.monthsWord.two',
            ),
          })}
        </AppText>
      ) : null}
      <View
        accessible
        accessibilityLabel={t('analysis.chartLabel', {
          months: bars
            .map((bar) => `${longOf(bar.month)}: ${hourlyReais(BigInt(bar.hourlyCents))}`)
            .join(', '),
        })}
        style={styles.chart}
      >
        {bars.map((bar, index) => (
          <View key={bar.month} style={styles.column} testID={`analysis-bar-${bar.month}`}>
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(8, (bar.hourlyCents / max) * BAR_HEIGHT),
                    backgroundColor: bar.current
                      ? palette.bronze
                      : `rgba(111,126,103,${0.45 + (0.55 * (index + 1)) / bars.length})`,
                  },
                ]}
              />
            </View>
            <AppText
              variant="technical"
              style={[styles.barMonth, bar.current && styles.barMonthCurrent]}
            >
              {shortOf(bar.month)}
            </AppText>
            <AppText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[type.heading1, styles.barValue, bar.current && styles.barValueCurrent]}
            >
              {hourlyReais(BigInt(bar.hourlyCents)).replace('R$', '').trim()}
            </AppText>
          </View>
        ))}
      </View>
      <AppText style={styles.cardText} testID="analysis-evolution-text">
        {sentence}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  sections: { gap: 26 },
  overlap: { marginTop: -(OVERLAP + 18) },
  dark: {
    overflow: 'hidden',
    backgroundColor: palette.base,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.structure,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  darkBackdrop: { position: 'absolute', top: -40, right: -120, width: 360, height: 260 },
  darkEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.bronze },
  resultRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  resultValue: { fontSize: 44, lineHeight: 48, letterSpacing: -1.76, color: palette.cream },
  resultAccent: { fontSize: 44, letterSpacing: -1.76, color: palette.bronze },
  resultUnit: { fontSize: 18, lineHeight: 22, color: palette.secondaryText },
  formula: { fontSize: 13, lineHeight: 18, color: '#B9BFB2' },
  formulaStrong: { fontSize: 13, letterSpacing: 0, color: palette.cream },
  formulaSign: { fontSize: 13, color: palette.sage },
  darkText: { fontSize: 13, lineHeight: 20, color: '#B9BFB2' },
  card: {
    backgroundColor: '#F8F6EF',
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.16)',
    borderRadius: 22,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 16,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  cardPeriod: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  cardTitle: { fontSize: 22, lineHeight: 26, letterSpacing: -0.66, color: colors.textPrimary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 2 },
  column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  barArea: { height: BAR_HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '62%', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderRadius: 2 },
  barMonth: { fontSize: 9, lineHeight: 12, letterSpacing: 1.08, color: palette.sage },
  barMonthCurrent: { color: colors.textPrimary },
  barValue: { fontSize: 11, lineHeight: 14, letterSpacing: 0, color: palette.mutedCopy },
  barValueCurrent: { color: palette.bronzeDeep },
  cardText: { fontSize: 13, lineHeight: 20, color: palette.mutedCopy },
});
