import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { FIELD_HELPER_SPACE, OnboardingField } from '@/features/onboarding/OnboardingField';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m } from '@/theme/tokens';
import { WorkTypeChip } from '../WorkTypeChip';
import { useWorkDraft } from '../work-draft';

/** Tela 19: só o nome do lugar, centralizado. Campo e botão ficam acima do teclado. */
export function WorkPlaceScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { type: workType, locationName, update } = useWorkDraft();
  const [touched, setTouched] = useState(false);

  const trimmed = locationName.trim();
  const showError = touched && trimmed.length === 0;

  function submit() {
    setTouched(true);
    if (trimmed.length === 0) return;
    update({ locationName: trimmed });
    router.push('/work-when');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="first-work-place">
      <StatusBar style="dark" />
      <OnboardingHeader step={5} onBack={() => router.back()} testID="work-place-header" />

      <KeyboardScreen
        bottomInset={Math.max(insets.bottom, 24) + 20}
        extraOffset={FIELD_HELPER_SPACE}
        footer={
          <View style={styles.footer}>
            <OnboardingCta onPress={submit} testID="work-place-cta" />
          </View>
        }
      >
        <View style={styles.heading}>
          {workType && <WorkTypeChip type={workType} />}
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {t(
              workType === 'procedure'
                ? 'firstWork.place.titleProcedure'
                : workType === 'appointment'
                  ? 'firstWork.place.titleAppointment'
                  : 'firstWork.place.titleShift',
            )}
          </AppText>
        </View>
        <View style={styles.fieldArea}>
          <OnboardingField
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            error={showError}
            helper={showError ? t('firstWork.place.required') : t('firstWork.place.hint')}
            label={t('firstWork.place.label')}
            onChangeText={(value) => update({ locationName: value })}
            onSubmitEditing={submit}
            returnKeyType="next"
            submitBehavior="submit"
            testID="work-place-input"
            value={locationName}
          />
        </View>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { marginTop: m.titlePaddingTop, marginHorizontal: 32, gap: 12 },
  title: {
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  fieldArea: { marginTop: 36, marginHorizontal: 32 },
  footer: { marginHorizontal: 32 },
});
