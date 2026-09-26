import Check from 'lucide-react-native/icons/check';
import { Pressable, StyleSheet, View } from 'react-native';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { AppText } from './AppText';

export type ReceiptProgressCardProps = {
  receivedLabel: string;
  receivedValue: string;
  awaitingLabel: string;
  awaitingValue: string;
  /** 0–100; a barra verde cobre o recebido. */
  percent: number;
  /** Legenda abaixo da barra (`67% recebido`, `100% recebido · mês fechado`). */
  caption: string;
  onPressReceived?: () => void;
  onPressAwaiting?: () => void;
  testID?: string;
};

/**
 * Recebido × A receber + barra de recebido (Finanças 01): o objeto principal do mês num card
 * só, com a superfície do `CalendarCard` — duas caixas em cima, barra e legenda embaixo. Os dois
 * lados abrem a explicação do número quando a tela fornece o toque.
 */
export function ReceiptProgressCard({
  receivedLabel,
  receivedValue,
  awaitingLabel,
  awaitingValue,
  percent,
  caption,
  onPressReceived,
  onPressAwaiting,
  testID,
}: ReceiptProgressCardProps) {
  const type = useBrandTypography();
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${receivedLabel}, ${receivedValue}`}
          disabled={!onPressReceived}
          onPress={onPressReceived}
          testID={testID ? `${testID}-received` : undefined}
          style={({ pressed }) => [styles.block, styles.received, pressed && styles.pressed]}
        >
          <View style={styles.label}>
            <View style={styles.receivedIcon}>
              <Check color={palette.cream} size={11} strokeWidth={3} />
            </View>
            <AppText variant="technical" style={[styles.eyebrow, styles.receivedEyebrow]}>
              {receivedLabel}
            </AppText>
          </View>
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[type.heading1, styles.value, styles.receivedValue]}
          >
            {receivedValue}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${awaitingLabel}, ${awaitingValue}`}
          disabled={!onPressAwaiting}
          onPress={onPressAwaiting}
          testID={testID ? `${testID}-awaiting` : undefined}
          style={({ pressed }) => [styles.block, styles.awaiting, pressed && styles.pressed]}
        >
          <View style={styles.label}>
            <View style={styles.awaitingIcon}>
              <View style={styles.awaitingDot} />
            </View>
            <AppText variant="technical" style={styles.eyebrow}>
              {awaitingLabel}
            </AppText>
          </View>
          <AppText adjustsFontSizeToFit numberOfLines={1} style={[type.heading1, styles.value]}>
            {awaitingValue}
          </AppText>
        </Pressable>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        testID={testID ? `${testID}-bar` : undefined}
        accessibilityLabel={caption}
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      <AppText style={styles.caption} testID={testID ? `${testID}-caption` : undefined}>
        {caption}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mesma superfície do CalendarCard e do BarChartCard: papel claro, raio 28 e sombra longa.
  card: {
    backgroundColor: '#F8F6EF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.08)',
    padding: 14,
    paddingBottom: 16,
    gap: 12,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  row: { flexDirection: 'row', gap: 10 },
  block: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 10,
  },
  received: { backgroundColor: 'rgba(43,58,36,0.10)', borderColor: 'rgba(43,58,36,0.28)' },
  awaiting: { backgroundColor: 'rgba(169,138,84,0.08)', borderColor: 'rgba(169,138,84,0.30)' },
  label: { flexDirection: 'row', alignItems: 'center', gap: 7 },
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
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  receivedEyebrow: { color: palette.structure },
  value: { fontSize: 26, lineHeight: 30, letterSpacing: -0.78, color: colors.textPrimary },
  receivedValue: { color: palette.structure },
  // Barra mais grossa (12) que a anterior (8), dentro do card.
  track: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(169,138,84,0.28)',
    marginHorizontal: 4,
    marginTop: 2,
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: palette.structure },
  caption: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy, marginHorizontal: 4 },
  pressed: { opacity: 0.72 },
});
