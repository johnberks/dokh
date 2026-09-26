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
        <AppText style={[type.heading1, styles.value]} testID="finance-info-value">
          {request?.value ?? ''}
        </AppText>
        <AppText style={styles.text}>{t(`info.${key}.text` as 'info.expected.text')}</AppText>
      </View>
      <View style={styles.example}>
        <AppText variant="technical" style={styles.exampleLabel}>
          {t('info.exampleLabel')}
        </AppText>
        <AppText style={styles.exampleText}>
          {request?.example ?? t(`info.${key}.example` as 'info.expected.example')}
        </AppText>
      </View>
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
  copy: { gap: 8, paddingTop: 6 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  value: { fontSize: 30, lineHeight: 34, letterSpacing: -0.9, color: colors.textPrimary },
  text: { fontSize: 15, lineHeight: 22, color: palette.mutedCopy },
  example: {
    backgroundColor: 'rgba(16,22,15,0.045)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  exampleLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 1.44, color: palette.bronzeDeep },
  exampleText: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },
});
