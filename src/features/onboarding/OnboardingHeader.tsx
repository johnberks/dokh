import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeftIcon } from '@/components/icons/heroicons';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';

type Props = {
  /** Passo atual dentro dos 13 do onboarding completo (7.7). */
  step: number;
  onBack: () => void;
  testID?: string;
};

/** Voltar + barra de progresso das telas 07, 09 e TELA 04. */
export function OnboardingHeader({ step, onBack, testID }: Props) {
  const { t } = useTranslation('onboarding');
  const percentage = Math.min(100, Math.round((step / m.totalSteps) * 100));
  const width: `${number}%` = `${percentage}%`;

  return (
    <View style={styles.header} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.back')}
        onPress={onBack}
        testID={testID ? `${testID}-back` : undefined}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ChevronLeftIcon color={colors.foreground} size={m.backIcon} />
      </Pressable>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('profile.steps', { current: step, total: m.totalSteps })}
        accessibilityValue={{ min: 0, max: m.totalSteps, now: step }}
        style={styles.track}
      >
        <View
          accessible={false}
          testID={testID ? `${testID}-progress` : undefined}
          style={[styles.fill, { width }]}
        />
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: m.headerPaddingTop,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headerGap,
  },
  back: {
    width: m.backTarget,
    height: m.backTarget,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  track: {
    flex: 1,
    height: m.progressHeight,
    borderRadius: 1,
    backgroundColor: 'rgba(16,22,15,0.12)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 1, backgroundColor: palette.base },
  spacer: { width: 22 },
});
