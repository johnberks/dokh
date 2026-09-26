import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';

export type InfoKey =
  | 'expected'
  | 'received'
  | 'awaiting'
  | 'generated'
  | 'hourly'
  | 'yearTotal'
  | 'average'
  | 'yearHourly'
  | 'projection';

export type InfoRequest = { key: InfoKey; value: string; example?: string };

/** Cor do número na folha: recebido em verde, como o check da lista (Sheet 16). */
const VALUE_TONE: Partial<Record<InfoKey, string>> = { received: palette.structure };

/** O `i` do HTML: círculo de 16 com alvo de 44. `tone` segue o fundo (topo escuro ou bege). */
export function InfoButton({
  label,
  onPress,
  tone = 'light',
  testID,
}: {
  label: string;
  onPress: () => void;
  tone?: 'light' | 'dark';
  testID?: string;
}) {
  const { t } = useTranslation('finances');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('info.open', { label })}
      hitSlop={14}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        tone === 'dark' ? styles.buttonDark : styles.buttonLight,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="technical"
        style={[styles.buttonText, tone === 'dark' ? styles.textDark : styles.textLight]}
      >
        {'i'}
      </AppText>
    </Pressable>
  );
}

/**
 * Folhas explicativas (9.4): rótulo, valor no contexto, explicação simples e exemplo
 * concreto. Caixa e competência são explicados sem se misturar.
 */
export function FinanceInfoSheet({
  request,
  onClose,
}: {
  request: InfoRequest | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('finances');
  const type = useBrandTypography();
  const key = request?.key ?? 'expected';
  const title = t(`info.${key}.title` as 'info.expected.title');
  return (
    <BottomSheet
      open={request !== null}
      onClose={onClose}
      accessibilityLabel={title}
      testID="finance-info-sheet"
    >
      <View style={styles.copy}>
        <AppText variant="technical" style={styles.eyebrow}>
          {title}
        </AppText>
        <AppText
          style={[type.heading1, styles.value, { color: VALUE_TONE[key] ?? colors.textPrimary }]}
          testID="finance-info-value"
        >
          {request?.value ?? ''}
        </AppText>
        <AppText style={styles.text}>{t(`info.${key}.text` as 'info.expected.text')}</AppText>
      </View>
      <View style={styles.example}>
        <View style={styles.bullet} />
        <AppText style={styles.exampleText}>
          {request?.example ?? t(`info.${key}.example` as 'info.expected.example')}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('info.close')}
        onPress={onClose}
        testID="finance-info-close"
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
      >
        <AppText style={[type.heading1, styles.ctaText]}>{t('info.close')}</AppText>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: { borderColor: 'rgba(237,234,224,0.55)' },
  buttonLight: { borderColor: 'rgba(16,22,15,0.35)' },
  buttonText: { fontSize: 9, lineHeight: 11 },
  textDark: { color: 'rgba(237,234,224,0.7)' },
  textLight: { color: 'rgba(16,22,15,0.5)' },
  pressed: { opacity: 0.6 },
  // Sheet 15–18/22 do HTML: rótulo, número, explicação, exemplo com ponto bronze e `Entendi`.
  copy: { gap: 10, paddingTop: 6 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  value: { fontSize: 30, lineHeight: 32, letterSpacing: -0.9 },
  text: { fontSize: 16, lineHeight: 25, color: palette.mutedCopy },
  example: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,22,15,0.1)',
    paddingTop: 16,
  },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.bronze, marginTop: 8 },
  exampleText: { flex: 1, fontSize: 14, lineHeight: 21, color: palette.mutedCopy },
  cta: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
});
