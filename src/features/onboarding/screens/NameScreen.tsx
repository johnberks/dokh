import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m } from '@/theme/tokens';
import { DokhFrame } from '../DokhFrame';
import { OnboardingCta } from '../OnboardingCta';
import { FIELD_HELPER_SPACE, OnboardingField } from '../OnboardingField';
import { OnboardingHeader } from '../OnboardingHeader';
import { useProfileDraft } from '../profile-draft';

/**
 * Tela 07: primeiro nome, usado para personalizar as telas seguintes. A moldura "DOKH de João"
 * ganha o nome enquanto se digita (Onboarding v2, 7.7).
 */
export function NameScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const displayName = useProfileDraft((state) => state.displayName);
  const update = useProfileDraft((state) => state.update);
  const [touched, setTouched] = useState(false);

  const trimmed = displayName.trim();
  const showError = touched && trimmed.length === 0;

  function submit() {
    setTouched(true);
    if (trimmed.length === 0) return;
    update({ displayName: trimmed });
    router.push('/focus');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="onboarding-name">
      <StatusBar style="dark" />
      <OnboardingHeader step={1} onBack={() => router.back()} testID="name-header" />

      <KeyboardScreen
        bottomInset={Math.max(insets.bottom, 24) + 20}
        extraOffset={FIELD_HELPER_SPACE}
        footer={
          <View style={styles.cta}>
            <OnboardingCta onPress={submit} testID="name-cta" />
          </View>
        }
      >
        <View style={styles.frame}>
          <DokhFrame name={displayName} />
        </View>
        <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
          {t('profile.name.title')}
        </AppText>
        <View style={styles.fieldArea}>
          <OnboardingField
            autoCapitalize="words"
            autoComplete="given-name"
            autoCorrect={false}
            autoFocus
            error={showError}
            helper={showError ? t('profile.name.required') : undefined}
            label={t('profile.name.label')}
            onChangeText={(value) => update({ displayName: value })}
            onSubmitEditing={submit}
            returnKeyType="next"
            submitBehavior="submit"
            testID="name-input"
            value={displayName}
          />
        </View>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  frame: { marginTop: 24, marginHorizontal: 32 },
  title: {
    marginTop: 28,
    marginHorizontal: 32,
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  fieldArea: { marginTop: 36, marginHorizontal: 32 },
  cta: { marginHorizontal: 32 },
});
