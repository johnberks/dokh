import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { KEYBOARD_CTA_GAP, OnboardingCta } from '@/features/onboarding/OnboardingCta';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { WorkTypeChip } from '../WorkTypeChip';
import { useWorkDraft } from '../work-draft';

/** Tela 19: só o nome do lugar. Campo e botão ficam acima do teclado. */
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
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="first-work-place"
    >
      <StatusBar style="dark" />
      <OnboardingHeader step={5} onBack={() => router.back()} testID="work-place-header" />

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={KEYBOARD_CTA_GAP}
        style={styles.body}
      >
        <View style={styles.fieldArea}>
          <View style={styles.field}>
            <AppText variant="technical" style={styles.fieldLabel}>
              {t('firstWork.place.label')}
            </AppText>
            <TextInput
              accessibilityLabel={t('firstWork.place.label')}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              onChangeText={(value) => update({ locationName: value })}
              onSubmitEditing={submit}
              returnKeyType="next"
              selectionColor={palette.bronze}
              style={[type.body, styles.input]}
              submitBehavior="submit"
              testID="work-place-input"
              value={locationName}
            />
          </View>
          <AppText style={showError ? styles.error : styles.hint}>
            {showError ? t('firstWork.place.required') : t('firstWork.place.hint')}
          </AppText>
        </View>

        <View style={styles.footer}>
          <OnboardingCta onPress={submit} testID="work-place-cta" />
        </View>
      </KeyboardAvoidingView>
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
  body: { flex: 1, marginTop: 36 },
  fieldArea: { flex: 1, marginHorizontal: 32, gap: 10 },
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
  error: { paddingTop: 6, fontSize: 13, lineHeight: 18, color: colors.errorFill },
  footer: { marginHorizontal: 32, paddingTop: 12 },
});
