import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';

/** Respiro entre o topo do teclado e o botão (`keyboardVerticalOffset`): um toque só avança. */
export const KEYBOARD_CTA_GAP = 16;

type Props = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
};

/** Botão escuro de 56 com seta, repetido nas telas 07, 09 e TELA 04. */
export function OnboardingCta({
  label,
  onPress,
  disabled = false,
  loading = false,
  testID,
}: Props) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const text = label ?? t('profile.continue');
  const blocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.cta,
        pressed && !blocked && styles.pressed,
        blocked && styles.blocked,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.cream} />
      ) : (
        <View style={styles.labelRow}>
          <AppText style={[type.heading1, styles.label]}>{text}</AppText>
          <AppText accessible={false} style={[type.heading1, styles.arrow]}>
            {'→'}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    minHeight: m.ctaHeight,
    borderRadius: m.ctaRadius,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  arrow: { fontSize: 18, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  pressed: { opacity: 0.72 },
  blocked: { opacity: 0.4 },
});
