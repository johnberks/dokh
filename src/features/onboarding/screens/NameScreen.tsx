import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { OnboardingCta } from '../OnboardingCta';
import { OnboardingHeader } from '../OnboardingHeader';
import { useProfileDraft } from '../profile-draft';

/** Tela 07: primeiro nome, usado para personalizar as telas seguintes. */
export function NameScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const displayName = useProfileDraft((state) => state.displayName);
  const update = useProfileDraft((state) => state.update);
  const [touched, setTouched] = useState(false);

  const trimmed = displayName.trim();
  const showError = touched && trimmed.length === 0;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-name"
    >
      <StatusBar style="dark" />
      <OnboardingHeader step={1} onBack={() => router.back()} testID="name-header" />

      <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
        {t('profile.name.title')}
      </AppText>

      <View style={styles.body}>
        <View style={styles.field}>
          <AppText variant="technical" style={styles.fieldLabel}>
            {t('profile.name.label')}
          </AppText>
          <TextInput
            accessibilityLabel={t('profile.name.label')}
            autoCapitalize="words"
            autoComplete="given-name"
            autoCorrect={false}
            autoFocus
            onChangeText={(value) => update({ displayName: value })}
            returnKeyType="next"
            selectionColor={palette.bronze}
            style={[type.body, styles.input]}
            testID="name-input"
            value={displayName}
          />
        </View>
        <AppText style={styles.hint}>
          {showError ? t('profile.name.required') : t('profile.name.hint')}
        </AppText>
      </View>

      <View style={styles.cta}>
        <OnboardingCta
          onPress={() => {
            setTouched(true);
            if (trimmed.length === 0) return;
            update({ displayName: trimmed });
            router.push('/residency');
          }}
          testID="name-cta"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: {
    marginTop: m.titlePaddingTop,
    marginHorizontal: 32,
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  body: { flex: 1, marginTop: 36, marginHorizontal: 32, gap: 10 },
  field: {
    height: m.fieldHeight,
    borderRadius: m.fieldRadius,
    borderWidth: 1,
    borderColor: colors.foreground,
    paddingHorizontal: 18,
    justifyContent: 'center',
    gap: 3,
  },
  fieldLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.sage },
  input: { fontSize: 17, lineHeight: 22, color: colors.textPrimary, padding: 0 },
  hint: { paddingTop: 6, fontSize: 13, lineHeight: 18, color: palette.sage },
  cta: { marginHorizontal: 32 },
});
