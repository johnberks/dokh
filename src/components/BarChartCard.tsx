import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, fontAliases, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type ChartBar = {
  key: string;
  /** Rótulo curto do eixo (`JAN`). */
  label: string;
  /** `null` = sem dado no período: traço tracejado, nunca uma barra de zero. */
  value: number | null;
  /** Texto acima da barra (`5,3k`); só aparece quando há valor. */
  valueLabel?: string;
  /** Período em destaque (mês atual): barra bronze e rótulos fortes. */
  current?: boolean;
};

export type BarChartCardProps = {
  eyebrow: string;
  /** Legenda do destaque (`mês atual`), com o quadrado bronze. */
  legend?: string;
  bars: readonly ChartBar[];
  /** Conteúdo abaixo do gráfico (média, aviso de histórico curto). */
  footer?: ReactNode;
  accessibilityLabel: string;
  /** `card`: superfície própria. `plain`: direto sobre o fundo bege, como em Finanças 03. */
  surface?: 'card' | 'plain';
  testID?: string;
};

const CHART_HEIGHT = 128;
const MIN_BAR = 6;

/**
 * Gráfico de barras em card (Finanças 03/03-B/13), com a mesma superfície do calendário da
 * Agenda. As alturas são relativas ao maior valor; período sem dado vira traço tracejado.
 */
export function BarChartCard({
  eyebrow,
  legend,
  bars,
  footer,
  accessibilityLabel,
  surface = 'card',
  testID,
}: BarChartCardProps) {
  const type = useBrandTypography();
  const max = Math.max(0, ...bars.map((bar) => bar.value ?? 0));

  return (
    <View style={surface === 'card' ? styles.card : styles.plain} testID={testID}>
      <View style={styles.header}>
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
        {legend ? (
          <View style={styles.legend}>
            <View style={styles.legendSwatch} />
            <AppText style={styles.legendText}>{legend}</AppText>
          </View>
        ) : null}
      </View>

      <View accessible accessibilityLabel={accessibilityLabel} style={styles.chart}>
        <View style={styles.bars}>
          {bars.map((bar) => {
            const has = bar.value !== null && bar.value > 0;
            const height =
              has && max > 0 ? Math.max(MIN_BAR, ((bar.value ?? 0) / max) * CHART_HEIGHT) : 3;
            return (
              <View
                key={bar.key}
                style={styles.column}
                testID={testID ? `${testID}-bar-${bar.key}` : undefined}
              >
                {has && bar.valueLabel ? (
                  <AppText
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    style={[styles.value, bar.current && [type.heading1, styles.valueCurrent]]}
                  >
                    {bar.valueLabel}
                  </AppText>
                ) : null}
                <View
                  style={[
                    styles.bar,
                    { height },
                    has ? (bar.current ? styles.barCurrent : styles.barFilled) : styles.barEmpty,
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.labels}>
          {bars.map((bar) => (
            <AppText
              key={bar.key}
              variant="technical"
              style={[styles.label, bar.current && styles.labelCurrent]}
            >
              {bar.label}
            </AppText>
          ))}
        </View>
      </View>

      {footer}
    </View>
  );
}

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
    gap: 16,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  plain: { gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Título do gráfico em negrito e espaçado (`GANHOS DE 2026`).
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.4,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eyebrowStrong: { fontFamily: fontAliases.plexSemibold },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 8, height: 8, borderRadius: 2, backgroundColor: palette.bronze },
  legendText: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  chart: { gap: 10 },
  bars: {
    height: CHART_HEIGHT + 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,22,15,0.14)',
    paddingHorizontal: 2,
  },
  column: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  // Rótulo mais largo que a coluna e numa linha só: `15,5k` não quebra.
  value: {
    width: 40,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: -0.18,
    color: palette.sage,
  },
  valueCurrent: { fontSize: 9, letterSpacing: -0.18, color: colors.textPrimary },
  bar: { width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  // Cores cheias da paleta (sálvia e bronze no destaque), sem transparência.
  barFilled: { backgroundColor: palette.workSage },
  barCurrent: { backgroundColor: palette.bronze },
  barEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,22,15,0.18)',
    borderBottomWidth: 0,
  },
  labels: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.54,
    color: palette.sage,
  },
  labelCurrent: { color: colors.textPrimary, fontWeight: '600' },
});
