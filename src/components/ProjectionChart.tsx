import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';
import { colors, fontAliases, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type ProjectionChartProps = {
  /** Acumulado de janeiro até o mês atual (linha cheia). */
  cumulative: readonly number[];
  /** Acumulado do mês atual até dezembro (linha tracejada); começa no ponto de hoje. */
  projected: readonly number[];
  /** Índice do mês atual (0 = janeiro). */
  currentIndex: number;
  /** Rótulos dos 12 meses; o eixo mostra JAN, o atual e DEZ. */
  monthLabels: readonly string[];
  /** Rótulo do ponto de hoje (`hoje`) e valor final escrito em dezembro (`R$ 53,8k`). */
  todayLabel: string;
  endLabel?: string;
  realizedLabel: string;
  projectedLabel: string;
  accessibilityLabel: string;
  testID?: string;
};

const W = 330;
const H = 150;
const TOP = 26;
const BOTTOM = 140;
const X0 = 6;
const X1 = 318;

const xAt = (index: number) => X0 + ((X1 - X0) / 11) * index;

/**
 * Projeção anual acumulada (referências Nutmeg/Plum/Monzo): área verde suave sob o que já
 * entrou, tracejado bronze até dezembro com o valor final escrito no ponto, e a marca de hoje.
 * Um total acumulado só sobe: a linha nunca "cai" depois do mês atual.
 */
export function ProjectionChart({
  cumulative,
  projected,
  currentIndex,
  monthLabels,
  todayLabel,
  endLabel,
  realizedLabel,
  projectedLabel,
  accessibilityLabel,
  testID,
}: ProjectionChartProps) {
  const max = Math.max(1, ...cumulative, ...projected);
  const yAt = (value: number) => BOTTOM - (value / max) * (BOTTOM - TOP);
  const point = (index: number, value: number) =>
    `${xAt(index).toFixed(1)},${yAt(value).toFixed(1)}`;
  const realizedPoints = cumulative.map((value, index) => point(index, value)).join(' ');
  const area = `${xAt(0).toFixed(1)},${BOTTOM} ${realizedPoints} ${xAt(cumulative.length - 1).toFixed(1)},${BOTTOM}`;
  const projectedPoints = projected
    .map((value, step) => point(currentIndex + step, value))
    .join(' ');
  const current = cumulative[currentIndex] ?? 0;
  const endIndex = currentIndex + projected.length - 1;
  const end = projected[projected.length - 1] ?? current;
  const axis = [0, currentIndex, 11].filter(
    (index, position, list) => list.indexOf(index) === position,
  );
  // Posições em % do desenho, para os rótulos em texto sobre o SVG.
  const pctX = (index: number) => `${(xAt(index) / W) * 100}%` as const;
  const pctY = (value: number) => `${(yAt(value) / H) * 100}%` as const;

  return (
    <View style={styles.block} testID={testID}>
      <View accessible accessibilityLabel={accessibilityLabel} style={styles.plot}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="realizedArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.structure} stopOpacity={0.22} />
              <Stop offset="1" stopColor={palette.structure} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          <Line x1={0} y1={TOP} x2={W} y2={TOP} stroke="rgba(16,22,15,0.06)" />
          <Line x1={0} y1={BOTTOM} x2={W} y2={BOTTOM} stroke="rgba(16,22,15,0.12)" />
          <Line
            x1={xAt(currentIndex)}
            y1={TOP - 8}
            x2={xAt(currentIndex)}
            y2={BOTTOM}
            stroke="rgba(16,22,15,0.18)"
            strokeDasharray="2 3"
          />
          {cumulative.length > 1 && <Polygon points={area} fill="url(#realizedArea)" />}
          {cumulative.length > 1 && (
            <Polyline
              points={realizedPoints}
              fill="none"
              stroke={palette.structure}
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {projected.length > 1 && (
            <Polyline
              points={projectedPoints}
              fill="none"
              stroke={palette.bronze}
              strokeWidth={2.2}
              strokeDasharray="4 5"
              strokeLinecap="round"
            />
          )}
          <Circle
            cx={xAt(currentIndex)}
            cy={yAt(current)}
            r={4.5}
            fill={colors.background}
            stroke={palette.structure}
            strokeWidth={2.2}
          />
          {projected.length > 1 && (
            <Circle cx={xAt(endIndex)} cy={yAt(end)} r={5} fill={palette.bronze} />
          )}
        </Svg>
        <AppText
          variant="technical"
          style={[styles.today, { left: pctX(currentIndex) }]}
          testID={testID ? `${testID}-today` : undefined}
        >
          {todayLabel}
        </AppText>
        {endLabel && projected.length > 1 ? (
          <AppText
            style={[styles.endLabel, { top: pctY(end) }]}
            testID={testID ? `${testID}-end` : undefined}
          >
            {endLabel}
          </AppText>
        ) : null}
      </View>
      <View style={styles.axis}>
        {axis.map((index) => (
          <AppText
            key={index}
            variant="technical"
            style={[
              styles.axisLabel,
              // Cada mês fica sob o seu ponto: JAN na borda esquerda, DEZ na direita.
              index === 0 ? styles.axisStart : index === 11 ? styles.axisRight : styles.axisMiddle,
              index > 0 && index < 11 && { left: pctX(index) },
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
  plot: { position: 'relative' },
  today: {
    position: 'absolute',
    top: 0,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.08,
    color: colors.textPrimary,
    transform: [{ translateX: -14 }],
  },
  endLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 12,
    lineHeight: 16,
    color: palette.bronzeDeep,
    fontFamily: fontAliases.plexSemibold,
    transform: [{ translateY: -22 }],
  },
  axis: { height: 12 },
  axisStart: { position: 'absolute', left: 0 },
  axisRight: { position: 'absolute', right: 0 },
  axisMiddle: { position: 'absolute', transform: [{ translateX: -10 }] },
  axisLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.54, color: palette.sage },
  axisCurrent: { color: colors.textPrimary, fontFamily: fontAliases.plexSemibold },
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
