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
 * Recebido × A receber + barra de recebido (Finanças 01): o objeto principal do mês num bloco
 * só. Os dois lados abrem a explicação do número quando a tela fornece o toque.
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
  card: { gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  block: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  received: { backgroundColor: 'rgba(43,58,36,0.10)', borderColor: 'rgba(43,58,36,0.28)' },
  awaiting: { backgroundColor: '#F8F6EF', borderColor: 'rgba(16,22,15,0.16)' },
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
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(169,138,84,0.28)',
    marginTop: 4,
  },
  fill: { height: '100%', borderRadius: 4, backgroundColor: palette.structure },
  caption: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  pressed: { opacity: 0.72 },
});
