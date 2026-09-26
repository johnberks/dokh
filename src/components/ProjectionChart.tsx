import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type ProjectionChartProps = {
  /** Valores de janeiro até o mês atual; `null` = mês sem dado (a linha pula o ponto). */
  points: readonly (number | null)[];
  /** Índice do mês atual (0 = janeiro). */
  currentIndex: number;
  /** Média mensal usada na projeção dos meses restantes. */
  average: number;
  /** Rótulos do eixo: JAN, ABR, JUL, o mês atual e DEZ. */
  monthLabels: readonly string[];
  realizedLabel: string;
  projectedLabel: string;
  accessibilityLabel: string;
  testID?: string;
};

const W = 330;
const H = 120;
const TOP = 4;
const BOTTOM = 112;
const X0 = 6;
const X1 = 324;

const xAt = (index: number) => X0 + ((X1 - X0) / 11) * index;

/**
 * Projeção anual (Finanças 03): linha verde do realizado até o mês atual, tracejado bronze na
 * média até dezembro, média pontilhada e marca vertical no mês atual. Nada é desenhado para
 * meses sem dado.
 */
export function ProjectionChart({
  points,
  currentIndex,
  average,
  monthLabels,
  realizedLabel,
  projectedLabel,
  accessibilityLabel,
  testID,
}: ProjectionChartProps) {
  const values = points.filter((value): value is number => value !== null);
  const max = Math.max(average, ...values, 1) * 1.15;
  const yAt = (value: number) => BOTTOM - (value / max) * (BOTTOM - TOP);
  const realized = points
    .map((value, index) =>
      value === null ? null : `${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`,
    )
    .filter((point): point is string => point !== null);
  const current = points[currentIndex];
  const startY = yAt(current ?? average);
  const avgY = yAt(average);
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
          <Line
            x1={0}
            y1={avgY}
            x2={W}
            y2={avgY}
            stroke="rgba(169,138,84,0.35)"
            strokeDasharray="1 4"
          />
          {realized.length > 1 && (
            <Polyline
              points={realized.join(' ')}
              fill="none"
              stroke={palette.structure}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {currentIndex < 11 && (
            <Polyline
              points={`${xAt(currentIndex)},${startY} ${xAt(currentIndex + 1)},${avgY} ${xAt(11)},${avgY}`}
              fill="none"
              stroke={palette.bronze}
              strokeWidth={2}
              strokeDasharray="3 5"
              strokeLinecap="round"
            />
          )}
          <Circle
            cx={xAt(currentIndex)}
            cy={startY}
            r={4}
            fill={colors.background}
            stroke={palette.structure}
            strokeWidth={2}
          />
          <Circle cx={xAt(11)} cy={avgY} r={4} fill={palette.bronze} />
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
