import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { PremiumBadge } from '@/components/PremiumBadge';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import { localDateToDate } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { type HourlyInsight, hourlyReais } from './finance-format';

const SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const LONG = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const BAR_HEIGHT = 64;

const shortOf = (month: string) => SHORT[Number(month.slice(5, 7)) - 1];
const longOf = (month: string) => LONG.format(localDateToDate(`${month}-01`));

/**
 * Insight de valor/hora (último item de Finanças 01): card escuro com a conclusão, barras do
 * mês e dos anteriores, variação e frase com números reais. No Free (Finanças 01-B), a
 * conclusão fica visível e os números ocultos, com o selo Premium.
 */
export function InsightCard({
  insight,
  isPremium,
  onOpenAnalysis,
}: {
  insight: HourlyInsight;
  isPremium: boolean;
  /** "Ver análise completa" (Finanças 02); sem destino, o link não aparece. */
  onOpenAnalysis?: () => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const max = Math.max(...insight.bars.map((bar) => bar.hourlyCents));
  const current = insight.bars[insight.bars.length - 1];
  const period = `${shortOf(insight.bars[0].month)}–${shortOf(current.month)}`;
  const previousShort = insight.previousMonths.map(shortOf).join('–');
  const previousLong = insight.previousMonths.map(longOf).join(' e ');
  const arrow = insight.direction === 'up' ? '↑' : insight.direction === 'down' ? '↓' : '=';
  const deltaAbs = insight.deltaCents < 0n ? -insight.deltaCents : insight.deltaCents;

  const text = isPremium
    ? [
        t(
          insight.direction === 'up'
            ? 'insight.textUp'
            : insight.direction === 'down'
              ? 'insight.textDown'
              : 'insight.textStable',
          {
            hourly: hourlyReais(insight.currentCents),
            month: longOf(current.month),
            delta: hourlyReais(deltaAbs),
            previous: previousLong,
          },
        ),
        insight.fewerWorks ? t('insight.fewerWorks') : null,
      ]
        .filter(Boolean)
        .join(' ')
    : t(
        insight.direction === 'up'
          ? 'insight.lockedUp'
          : insight.direction === 'down'
            ? 'insight.lockedDown'
            : 'insight.lockedStable',
        { month: longOf(current.month) },
      );

  return (
    <View style={styles.card} testID="finances-insight">
      <View style={styles.backdrop} pointerEvents="none">
        <AgendaHeroBackdrop />
      </View>
      <View style={styles.header}>
        <AppText variant="technical" style={styles.eyebrow}>
          {t('insight.eyebrow')}
        </AppText>
        {isPremium ? (
          <AppText variant="technical" style={styles.period}>
            {period}
          </AppText>
        ) : (
          <PremiumBadge testID="finances-insight-premium" />
        )}
      </View>
      <AppText accessibilityRole="header" style={[type.heading1, styles.headline]}>
        {t(`insight.${insight.direction}` as 'insight.up')}
      </AppText>

      <View
        accessible
        accessibilityLabel={t('insight.chartLabel', {
          months: insight.bars.map((bar) => longOf(bar.month)).join(', '),
        })}
        style={styles.chart}
      >
        {insight.bars.map((bar, index) => (
          <View key={bar.month} style={styles.column}>
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(8, (bar.hourlyCents / max) * BAR_HEIGHT),
                    backgroundColor: bar.current
                      ? palette.bronze
                      : `rgba(111,126,103,${index === 0 && insight.bars.length > 2 ? 0.55 : 0.75})`,
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
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[type.heading1, styles.barValue, bar.current && styles.barValueCurrent]}
            >
              {isPremium
                ? `${hourlyReais(BigInt(bar.hourlyCents))}${bar.current ? '/h' : ''}`
                : `R$ •••${bar.current ? '/h' : ''}`}
            </AppText>
          </View>
        ))}
        <View style={styles.delta}>
          <AppText variant="technical" style={styles.deltaBadge} testID="finances-insight-delta">
            {isPremium ? `${arrow} ${Math.abs(insight.percent)}%` : `${arrow} ••%`}
          </AppText>
          <AppText style={styles.deltaCaption}>
            {isPremium
              ? t('insight.versusAverage', { months: previousShort })
              : t('insight.versusRecent')}
          </AppText>
        </View>
      </View>

      <AppText style={styles.text} testID="finances-insight-text">
        {text}
      </AppText>
      {onOpenAnalysis ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenAnalysis}
          testID="finances-insight-analysis"
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <AppText style={[type.heading1, styles.linkText]}>{t('insight.seeAnalysis')}</AppText>
          <AppText style={styles.linkArrow}>{'→'}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: palette.base,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.structure,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 16,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  backdrop: { position: 'absolute', top: -40, right: -120, width: 360, height: 260, opacity: 0.8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.bronze },
  period: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  headline: {
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.72,
    color: palette.cream,
    maxWidth: 260,
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 4 },
  column: { flex: 1, alignItems: 'center', gap: 8 },
  barArea: { height: BAR_HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '60%', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderRadius: 2 },
  barMonth: { fontSize: 9, lineHeight: 12, letterSpacing: 1.26, color: palette.sage },
  barMonthCurrent: { color: palette.bronze, fontWeight: '600' },
  barValue: { fontSize: 13, lineHeight: 16, letterSpacing: 0, color: palette.secondaryText },
  barValueCurrent: { color: palette.cream },
  delta: { alignItems: 'flex-end', gap: 6, paddingBottom: 22 },
  deltaBadge: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.base,
    backgroundColor: palette.bronze,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deltaCaption: { fontSize: 11, lineHeight: 14, color: palette.secondaryText },
  text: { fontSize: 13, lineHeight: 20, color: '#B9BFB2' },
  link: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(237,234,224,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.16)',
  },
  linkPressed: { backgroundColor: 'rgba(237,234,224,0.14)' },
  linkText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  linkArrow: { fontSize: 16, lineHeight: 20, color: palette.bronze },
});
