import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type ProjectionChartProps = {
  /** Acumulado de janeiro até o mês atual (linha cheia). */
  cumulative: readonly number[];
  /** Acumulado do mês atual até dezembro pela média (linha tracejada); começa no atual. */
  projected: readonly number[];
  /** Índice do mês atual (0 = janeiro). */
  currentIndex: number;
  /** Rótulos dos 12 meses; o eixo mostra JAN, ABR, JUL, o atual e DEZ. */
  monthLabels: readonly string[];
  realizedLabel: string;
  projectedLabel: string;
  accessibilityLabel: string;
  testID?: string;
};

const W = 330;
const H = 120;
const TOP = 8;
const BOTTOM = 112;
const X0 = 6;
const X1 = 324;

const xAt = (index: number) => X0 + ((X1 - X0) / 11) * index;

/**
 * Projeção anual acumulada: linha verde com o total do ano até o mês atual e tracejado bronze
 * somando a média mensal até dezembro. Um total acumulado só sobe (ou fica estável), então a
 * linha nunca "cai" depois do mês atual.
 */
export function ProjectionChart({
  cumulative,
  projected,
  currentIndex,
  monthLabels,
  realizedLabel,
  projectedLabel,
  accessibilityLabel,
  testID,
}: ProjectionChartProps) {
  const max = Math.max(1, ...cumulative, ...projected);
  const yAt = (value: number) => BOTTOM - (value / max) * (BOTTOM - TOP);
  const realizedPoints = cumulative
    .map((value, index) => `${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`)
    .join(' ');
  const projectedPoints = projected
    .map((value, step) => `${xAt(currentIndex + step).toFixed(1)},${yAt(value).toFixed(1)}`)
    .join(' ');
  const current = cumulative[currentIndex] ?? 0;
  const end = projected[projected.length - 1] ?? current;
  const axis = [0, 3, 6, currentIndex, 11].filter(
    (index, position, list) => list.indexOf(index) === position,
  );

  return (
    <View style={styles.block} testID={testID}>
      <View accessible accessibilityLabel={accessibilityLabel}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Line
            x1={xAt(currentIndex)}
            y1={TOP}
            x2={xAt(currentIndex)}
            y2={BOTTOM}
            stroke="rgba(16,22,15,0.14)"
            strokeDasharray="2 3"
          />
          <Line x1={0} y1={BOTTOM} x2={W} y2={BOTTOM} stroke="rgba(16,22,15,0.1)" />
          {cumulative.length > 1 && (
            <Polyline
              points={realizedPoints}
              fill="none"
              stroke={palette.structure}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {projected.length > 1 && (
            <Polyline
              points={projectedPoints}
              fill="none"
              stroke={palette.bronze}
              strokeWidth={2}
              strokeDasharray="3 5"
              strokeLinecap="round"
            />
          )}
          <Circle
            cx={xAt(currentIndex)}
            cy={yAt(current)}
            r={4}
            fill={colors.background}
            stroke={palette.structure}
            strokeWidth={2}
          />
          {projected.length > 1 && (
            <Circle cx={xAt(11)} cy={yAt(end)} r={4} fill={palette.bronze} />
          )}
        </Svg>
      </View>
      <View style={styles.axis}>
        {axis.map((index) => (
          <AppText
            key={index}
            variant="technical"
            style={[
              styles.axisLabel,
              index === currentIndex && styles.axisCurrent,
              index === 11 && index !== currentIndex && styles.axisEnd,
            ]}
          >
            {monthLabels[index]}
          </AppText>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendRealized} />
          <AppText style={styles.legendText}>{realizedLabel}</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendProjected} />
          <AppText style={styles.legendText}>{projectedLabel}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  axisLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.54, color: palette.sage },
  axisCurrent: { color: colors.textPrimary, fontWeight: '600' },
  axisEnd: { color: palette.bronzeDeep },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,22,15,0.08)',
    paddingTop: 12,
    marginTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendRealized: { width: 14, height: 2, borderRadius: 1, backgroundColor: palette.structure },
  legendProjected: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.bronze,
  },
  legendText: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
});
