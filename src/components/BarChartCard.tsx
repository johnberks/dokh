import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, fontAliases, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type ChartBarState = 'realized' | 'current' | 'future';

export type ChartBar = {
  key: string;
  /** Rótulo curto do eixo (`JAN`). */
  label: string;
  /** Total do período; `null` = sem dado: traço tracejado, nunca uma barra de zero. */
  value: number | null;
  /** Parte já confirmada (recebida) do total: vira a base cheia da barra. */
  filled: number;
  /** Passado, atual ou futuro — cada um com seu tratamento (cheio, destacado, contorno). */
  state: ChartBarState;
};

export type ChartLegendItem = { key: string; label: string; swatch: 'filled' | 'soft' | 'outline' };

export type BarChartCardProps = {
  eyebrow: string;
  bars: readonly ChartBar[];
  /** Período escolhido: fundo destacado; o resumo dele fica em `summary`. */
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  /** Resumo do período escolhido, entre o título e as barras. */
  summary?: ReactNode;
  /** Linha tracejada de referência (média), com rótulo curto. */
  reference?: { value: number; label: string } | null;
  legend?: readonly ChartLegendItem[];
  /** Conteúdo abaixo do gráfico (aviso de histórico curto). */
  footer?: ReactNode;
  /** Rótulo acessível de cada barra (mês e valores). */
  barAccessibilityLabel?: (bar: ChartBar) => string;
  accessibilityLabel: string;
  testID?: string;
};

const CHART_HEIGHT = 132;
const MIN_BAR = 6;

/**
 * Gráfico de barras em card, com a superfície do `CalendarCard`. Cada barra mostra o total do
 * período, com a parte recebida cheia na base: passado em sálvia (topo bronze claro se sobrou
 * algo sem confirmação), atual com contorno bronze, futuro só em contorno (previsto não é
 * dinheiro). Sem rótulos em cima das barras: tocar escolhe o período e o resumo aparece acima.
 */
export function BarChartCard({
  eyebrow,
  bars,
  selectedKey,
  onSelect,
  summary,
  reference,
  legend,
  footer,
  barAccessibilityLabel,
  accessibilityLabel,
  testID,
}: BarChartCardProps) {
  const type = useBrandTypography();
  const max = Math.max(0, ...bars.map((bar) => bar.value ?? 0), reference?.value ?? 0);
  const heightOf = (value: number) => (max > 0 ? (value / max) * CHART_HEIGHT : 0);

  return (
    <View style={styles.card} testID={testID}>
      <AppText
        variant="technical"
        style={[
          styles.eyebrow,
          // Plex Mono tem arquivo próprio por peso: o negrito vem do semibold carregado.
          type.technical.fontFamily === fontAliases.plexRegular && styles.eyebrowStrong,
        ]}
      >
        {eyebrow}
      </AppText>
      {summary}

      <View accessibilityLabel={accessibilityLabel} style={styles.chart}>
        <View style={styles.bars}>
          {reference && max > 0 ? (
            <View
              pointerEvents="none"
              style={[styles.reference, { bottom: heightOf(reference.value) }]}
              testID={testID ? `${testID}-reference` : undefined}
            >
              <AppText style={styles.referenceLabel}>{reference.label}</AppText>
            </View>
          ) : null}
          {bars.map((bar) => {
            const has = bar.value !== null && bar.value > 0;
            const total = has ? Math.max(MIN_BAR, heightOf(bar.value ?? 0)) : 3;
            const filled = has ? Math.min(total, heightOf(bar.filled)) : 0;
            const selected = bar.key === selectedKey;
            return (
              <Pressable
                key={bar.key}
                accessibilityRole="button"
                accessibilityLabel={barAccessibilityLabel?.(bar) ?? bar.label}
                accessibilityState={{ selected }}
                disabled={!onSelect}
                hitSlop={{ top: 8, bottom: 8 }}
                onPress={() => onSelect?.(bar.key)}
                style={[styles.column, selected && styles.columnSelected]}
                testID={testID ? `${testID}-bar-${bar.key}` : undefined}
              >
                <View
                  testID={testID ? `${testID}-bar-${bar.key}-body` : undefined}
                  style={[
                    styles.bar,
                    { height: total },
                    !has
                      ? styles.barEmpty
                      : bar.state === 'future'
                        ? styles.barFuture
                        : bar.state === 'current'
                          ? styles.barCurrent
                          : styles.barRealized,
                  ]}
                >
                  {has && filled > 0 ? (
                    <View
                      testID={testID ? `${testID}-bar-${bar.key}-filled` : undefined}
                      style={[styles.filled, { height: filled }]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.labels}>
          {bars.map((bar) => (
            <AppText
              key={bar.key}
              variant="technical"
              style={[
                styles.label,
                bar.state === 'current' && styles.labelCurrent,
                bar.key === selectedKey && styles.labelSelected,
              ]}
            >
              {bar.label}
            </AppText>
          ))}
        </View>
      </View>

      {legend && legend.length > 0 ? (
        <View style={styles.legend}>
          {legend.map((item) => (
            <View key={item.key} style={styles.legendItem}>
              <View
                style={[
                  styles.swatch,
                  item.swatch === 'filled'
                    ? styles.swatchFilled
                    : item.swatch === 'soft'
                      ? styles.swatchSoft
                      : styles.swatchOutline,
                ]}
              />
              <AppText style={styles.legendText}>{item.label}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {footer}
    </View>
  );
}

const SOFT = 'rgba(169,138,84,0.28)';

const styles = StyleSheet.create({
  // Mesma superfície do CalendarCard: papel claro, raio 28 e sombra longa.
  card: {
    backgroundColor: '#F8F6EF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.08)',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  // Título do gráfico em negrito e espaçado (`GANHOS DE 2026`).
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eyebrowStrong: { fontFamily: fontAliases.plexSemibold },
  chart: { gap: 8 },
  bars: {
    height: CHART_HEIGHT + 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,22,15,0.14)',
  },
  column: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  columnSelected: { backgroundColor: 'rgba(16,22,15,0.05)' },
  bar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  // Passado: o que sobrou sem confirmação fica em bronze claro por cima do recebido.
  barRealized: { backgroundColor: SOFT },
  barCurrent: { backgroundColor: SOFT, borderWidth: 1.5, borderColor: palette.bronze },
  // Futuro previsto: só contorno — ainda não é dinheiro.
  barFuture: {
    backgroundColor: 'rgba(111,126,103,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(111,126,103,0.55)',
    borderBottomWidth: 0,
  },
  barEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,22,15,0.18)',
    borderBottomWidth: 0,
  },
  filled: { width: '100%', backgroundColor: palette.workSage },
  reference: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(138,110,60,0.7)',
    zIndex: 1,
  },
  referenceLabel: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    fontSize: 10,
    lineHeight: 13,
    color: palette.bronzeDeep,
    backgroundColor: '#F8F6EF',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  labels: { flexDirection: 'row', gap: 4 },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.36,
    color: palette.sage,
  },
  labelCurrent: { color: palette.bronzeDeep },
  labelSelected: { color: colors.textPrimary, fontFamily: fontAliases.plexSemibold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  swatchFilled: { backgroundColor: palette.workSage },
  swatchSoft: { backgroundColor: SOFT },
  swatchOutline: { borderWidth: 1.5, borderColor: 'rgba(111,126,103,0.55)' },
  legendText: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
});
