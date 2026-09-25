import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { colors, onboardingIntroMetrics as m, palette } from '@/theme/tokens';

const HISTORY = '0,70 50,62 100,66 150,50 200,44 250,30 302,14';
const RECENT = '150,50 200,44 250,30 302,14';

const SOURCES = [
  { label: 'PLANTÕES', amount: 'R$ 14.800' },
  { label: 'CONSULTAS', amount: 'R$ 3.620' },
] as const;

/** Exemplo ilustrativo do slide 03: ganhos do mês, evolução e composição. */
export function EarningsSlideArt() {
  return (
    <View style={styles.art}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.total}>
            <AppText variant="technical" style={styles.eyebrow}>
              {'GANHOS DO MÊS'}
            </AppText>
            <AppText variant="heading1" style={styles.totalValue}>
              {'R$ 18.420'}
            </AppText>
          </View>
          <AppText variant="technical" style={styles.variation}>
            {'↑ 12,4%'}
          </AppText>
        </View>
        <Svg width="100%" height={84} viewBox="0 0 302 84" preserveAspectRatio="none">
          <Polyline points={HISTORY} stroke={palette.structure} strokeWidth={2} fill="none" />
          <Polyline points={RECENT} stroke={palette.bronze} strokeWidth={2} fill="none" />
          <Circle cx={302} cy={14} r={4} fill={palette.bronze} />
        </Svg>
        <View style={styles.comparison}>
          <AppText style={styles.comparisonLabel}>{'vs. mês anterior'}</AppText>
          <AppText variant="heading1" style={styles.comparisonValue}>
            {'+ R$ 2.040'}
          </AppText>
        </View>
      </View>
      <View style={styles.sources}>
        {SOURCES.map((source) => (
          <View key={source.label} style={styles.source}>
            <AppText variant="technical" style={styles.sourceLabel}>
              {source.label}
            </AppText>
            <AppText variant="heading1" style={styles.sourceValue}>
              {source.amount}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { gap: 12 },
  card: {
    backgroundColor: colors.darkBackground,
    borderRadius: m.cardRadius,
    padding: m.cardPadding,
    gap: 18,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  total: { gap: 6, flexShrink: 1 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  totalValue: { fontSize: 40, lineHeight: 42, letterSpacing: -1.2, color: colors.darkTextPrimary },
  variation: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0,
    color: colors.foreground,
    backgroundColor: palette.bronze,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  comparison: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  comparisonLabel: { fontSize: 13, lineHeight: 17, color: colors.darkTextSecondary },
  comparisonValue: {
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0,
    color: colors.darkTextPrimary,
  },
  sources: { flexDirection: 'row', gap: 10 },
  source: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.workCardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 4,
  },
  sourceLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.sage },
  sourceValue: { fontSize: 17, lineHeight: 21, letterSpacing: 0, color: colors.textPrimary },
});
