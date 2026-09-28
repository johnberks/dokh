import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Check from 'lucide-react-native/icons/check';
import Search from 'lucide-react-native/icons/search';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { MutationError } from '@/components/TechnicalStates';
import { searchResidencyPrograms } from '@/domain/medical-specialties';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { ProfessionalStatus } from '@/features/profile/profile-data';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { OnboardingCta } from '../OnboardingCta';
import { OnboardingHeader } from '../OnboardingHeader';
import { useProfileDraft } from '../profile-draft';
import { useSaveProfile } from '../use-save-profile';

/** Poucas sugestões cabem acima do teclado sem esconder a lista. */
const SUGGESTION_LIMIT = 4;

const OPTIONS = [
  { value: 'resident', label: 'profile.status.resident', hint: 'profile.status.residentHint' },
  {
    value: 'general_practitioner',
    label: 'profile.status.generalist',
    hint: 'profile.status.generalistHint',
  },
  {
    value: 'specialist',
    label: 'profile.status.specialist',
    hint: 'profile.status.specialistHint',
  },
] as const satisfies readonly { value: ProfessionalStatus; label: string; hint: string }[];

/**
 * Tela 09: situação profissional (11.10). A escolha é sempre explícita — sem residência não
 * significa generalista. Em residência pede o programa e segue para a bolsa; Especialista pede
 * a especialidade (mesma lista) e conclui; Generalista conclui direto. A tela rola como um todo
 * (sem área interna rolável) e o teclado nunca cobre as sugestões.
 */
export function ProfessionalStatusScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const session = useAuthSession();
  const { displayName, status, specialty, update } = useProfileDraft();
  const [query, setQuery] = useState(specialty);
  const [touched, setTouched] = useState(false);
  const save = useSaveProfile();

  const suggestions = useMemo(() => searchResidencyPrograms(query, SUGGESTION_LIMIT), [query]);
  const chosen = specialty.trim();
  const asksSpecialty = status === 'resident' || status === 'specialist';
  const missingSpecialty = asksSpecialty && chosen.length === 0;

  function selectSpecialty(name: string) {
    update({ specialty: name });
    setQuery(name);
    // Escolha feita: o teclado sai da frente e o botão Continuar fica livre.
    Keyboard.dismiss();
  }

  function goForward() {
    setTouched(true);
    if (status === null || missingSpecialty) return;
    if (status === 'resident') {
      router.push('/residency-income');
      return;
    }
    const onSuccess = () => router.push('/profile-ready');
    if (status === 'specialist') {
      save.mutate({ displayName, status, specialty: chosen }, { onSuccess });
      return;
    }
    save.mutate({ displayName, status }, { onSuccess });
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-status"
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
          testID="status-scroll"
        >
          <OnboardingHeader step={2} onBack={() => router.back()} testID="status-header" />

          <View style={styles.heading}>
            <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
              {t('profile.status.title')}
            </AppText>
            <AppText style={styles.description}>{t('profile.status.description')}</AppText>
          </View>

          <View style={styles.body}>
            <View accessibilityRole="radiogroup" style={styles.choices}>
              {OPTIONS.map((option) => {
                const selected = status === option.value;
                const label = t(option.label);
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityHint={t(option.hint)}
                    accessibilityState={{ checked: selected }}
                    onPress={() => update({ status: option.value })}
                    testID={`status-${option.value}`}
                    style={({ pressed }) => [
                      styles.choice,
                      selected ? styles.choiceSelected : styles.choiceIdle,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.choiceText}>
                      <AppText
                        style={[type.heading2, selected ? styles.choiceOn : styles.choiceOff]}
                      >
                        {label}
                      </AppText>
                      <AppText style={selected ? styles.hintOn : styles.hintOff}>
                        {t(option.hint)}
                      </AppText>
                    </View>
                    <View style={selected ? styles.radioOn : styles.radioOff}>
                      {selected && <Check color={palette.base} size={12} strokeWidth={2.5} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {asksSpecialty && (
              <View style={styles.search} testID="status-search">
                <AppText variant="technical" style={styles.searchLabel}>
                  {status === 'resident'
                    ? t('profile.status.residencyQuestion')
                    : t('profile.status.specialtyQuestion')}
                </AppText>
                <View style={[styles.field, missingSpecialty && touched && styles.fieldError]}>
                  <Search color={palette.sage} size={18} strokeWidth={1.8} />
                  <TextInput
                    accessibilityLabel={
                      status === 'resident'
                        ? t('profile.status.residencySearchLabel')
                        : t('profile.status.specialtySearchLabel')
                    }
                    autoCapitalize="words"
                    autoCorrect={false}
                    onChangeText={(value) => {
                      setQuery(value);
                      update({ specialty: '' });
                    }}
                    placeholder={t('profile.status.searchPlaceholder')}
                    placeholderTextColor={palette.sage}
                    selectionColor={palette.bronze}
                    style={[type.body, styles.input]}
                    testID="status-input"
                    value={query}
                  />
                </View>

                {/* Escolhida a especialidade, a lista some: não há mais o que decidir. */}
                {query.trim().length > 0 && chosen.length === 0 && (
                  <View testID="status-suggestions">
                    {suggestions.map((program) => (
                      <Pressable
                        key={program.name}
                        accessibilityRole="button"
                        accessibilityLabel={program.name}
                        onPress={() => selectSpecialty(program.name)}
                        testID={`status-option-${program.name}`}
                        style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                      >
                        <AppText style={[type.body, styles.suggestionText]}>
                          {program.name.slice(0, program.start)}
                          <AppText style={[type.heading1, styles.suggestionMatch]}>
                            {program.name.slice(program.start, program.end)}
                          </AppText>
                          {program.name.slice(program.end)}
                        </AppText>
                      </Pressable>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('profile.status.other')}
                      accessibilityHint={t('profile.status.otherHint')}
                      onPress={() => selectSpecialty(query.trim())}
                      testID="status-option-other"
                      style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                    >
                      <AppText style={[type.body, styles.suggestionOther]}>
                        {t('profile.status.other')}
                      </AppText>
                    </Pressable>
                  </View>
                )}

                {touched && missingSpecialty && (
                  <AppText style={styles.error}>
                    {status === 'resident'
                      ? t('profile.status.residencyRequired')
                      : t('profile.status.specialtyRequired')}
                  </AppText>
                )}
              </View>
            )}

            {save.isError && <MutationError onRetry={goForward} retrying={save.isPending} />}
          </View>

          <View style={styles.footer}>
            <OnboardingCta
              disabled={status === null || session.userId === null}
              loading={save.isPending}
              onPress={goForward}
              testID="status-cta"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  // A rolagem é da tela inteira e só existe quando o conteúdo não cabe.
  content: { flexGrow: 1 },
  heading: { marginTop: m.titlePaddingTop, marginHorizontal: 32, gap: 12 },
  title: {
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  description: { fontSize: 15, lineHeight: 23, color: colors.textMuted },
  body: { flex: 1, marginTop: 28, marginHorizontal: 32, gap: 10 },
  choices: { gap: 10 },
  choice: {
    minHeight: m.choiceHeight,
    borderRadius: m.choiceRadius,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  choiceSelected: {
    borderWidth: 1.5,
    borderColor: colors.foreground,
    backgroundColor: colors.foreground,
  },
  choiceIdle: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  choiceText: { flex: 1, gap: 3 },
  choiceOn: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  choiceOff: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  hintOn: { fontSize: 13, lineHeight: 18, color: palette.secondaryText },
  hintOff: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  radioOn: {
    width: m.choiceRadio,
    height: m.choiceRadio,
    borderRadius: m.choiceRadio / 2,
    backgroundColor: palette.bronze,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOff: {
    width: m.choiceRadio,
    height: m.choiceRadio,
    borderRadius: m.choiceRadio / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(16,22,15,0.25)',
  },
  search: { paddingTop: 16, gap: 10 },
  searchLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.sage },
  field: {
    height: m.choiceHeight,
    borderRadius: m.choiceRadius,
    borderWidth: 1,
    borderColor: colors.foreground,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldError: { borderColor: colors.errorFill },
  input: { flex: 1, fontSize: 17, lineHeight: 22, color: colors.textPrimary, padding: 0 },
  suggestion: {
    minHeight: 44,
    paddingVertical: m.suggestionPaddingVertical,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,22,15,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  suggestionText: { flex: 1, fontSize: 16, lineHeight: 21, color: colors.textPrimary },
  suggestionMatch: { fontSize: 16, lineHeight: 21, letterSpacing: 0, color: colors.textPrimary },
  suggestionOther: { fontSize: 16, lineHeight: 21, color: colors.textMuted },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  pressed: { opacity: 0.72 },
  footer: { paddingHorizontal: 32, paddingTop: 12 },
});
