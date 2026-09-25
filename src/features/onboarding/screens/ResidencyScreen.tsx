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
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { OnboardingCta } from '../OnboardingCta';
import { OnboardingHeader } from '../OnboardingHeader';
import { useProfileDraft } from '../profile-draft';
import { useSaveProfile } from '../use-save-profile';

/** Poucas sugestões cabem acima do teclado sem esconder a lista. */
const SUGGESTION_LIMIT = 4;

/**
 * Tela 09: pergunta de residência. O campo de busca só existe para quem responde **Sim**;
 * quem responde **Não** vê a etiqueta Generalista e segue direto para a conclusão do perfil.
 * A tela rola como um todo (sem área interna rolável) e o teclado nunca cobre as sugestões.
 */
export function ResidencyScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const session = useAuthSession();
  const { displayName, isResident, residencyProgram, update } = useProfileDraft();
  const [query, setQuery] = useState(residencyProgram);
  const [touched, setTouched] = useState(false);
  const save = useSaveProfile();

  const suggestions = useMemo(() => searchResidencyPrograms(query, SUGGESTION_LIMIT), [query]);
  const chosen = residencyProgram.trim();
  const missingProgram = isResident === true && chosen.length === 0;

  function selectProgram(name: string) {
    update({ residencyProgram: name });
    setQuery(name);
    // Escolha feita: o teclado sai da frente e o botão Continuar fica livre.
    Keyboard.dismiss();
  }

  function goForward() {
    setTouched(true);
    if (isResident === null || missingProgram) return;
    if (isResident) {
      router.push('/residency-income');
      return;
    }
    save.mutate(
      { displayName, isResident: false },
      { onSuccess: () => router.push('/profile-ready') },
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-residency"
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
          testID="residency-scroll"
        >
          <OnboardingHeader step={2} onBack={() => router.back()} testID="residency-header" />

          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {displayName.trim().length > 0
              ? t('profile.residency.title', { name: displayName.trim() })
              : t('profile.residency.titleWithoutName')}
          </AppText>

          <View style={styles.body}>
            <View accessibilityRole="radiogroup" style={styles.choices}>
              {[true, false].map((option) => {
                const selected = isResident === option;
                const label = option ? t('profile.residency.yes') : t('profile.residency.no');
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ checked: selected }}
                    onPress={() => update({ isResident: option })}
                    testID={option ? 'residency-yes' : 'residency-no'}
                    style={({ pressed }) => [
                      styles.choice,
                      selected ? styles.choiceSelected : styles.choiceIdle,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText style={[type.heading2, selected ? styles.choiceOn : styles.choiceOff]}>
                      {label}
                    </AppText>
                    <View style={selected ? styles.radioOn : styles.radioOff}>
                      {selected && <Check color={palette.base} size={12} strokeWidth={2.5} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {isResident === true && (
              <View style={styles.search} testID="residency-search">
                <AppText variant="technical" style={styles.searchLabel}>
                  {t('profile.residency.question')}
                </AppText>
                <View style={[styles.field, missingProgram && touched && styles.fieldError]}>
                  <Search color={palette.sage} size={18} strokeWidth={1.8} />
                  <TextInput
                    accessibilityLabel={t('profile.residency.searchLabel')}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onChangeText={(value) => {
                      setQuery(value);
                      update({ residencyProgram: '' });
                    }}
                    placeholder={t('profile.residency.searchPlaceholder')}
                    placeholderTextColor={palette.sage}
                    selectionColor={palette.bronze}
                    style={[type.body, styles.input]}
                    testID="residency-input"
                    value={query}
                  />
                </View>

                {/* Escolhida a residência, a lista some: não há mais o que decidir. */}
                {query.trim().length > 0 && chosen.length === 0 && (
                  <View testID="residency-suggestions">
                    {suggestions.map((program) => {
                      const selected = program.name === chosen;
                      return (
                        <Pressable
                          key={program.name}
                          accessibilityRole="button"
                          accessibilityLabel={program.name}
                          accessibilityState={{ selected }}
                          onPress={() => selectProgram(program.name)}
                          testID={`residency-option-${program.name}`}
                          style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                        >
                          <AppText style={[type.body, styles.suggestionText]}>
                            {program.name.slice(0, program.start)}
                            <AppText style={[type.heading1, styles.suggestionMatch]}>
                              {program.name.slice(program.start, program.end)}
                            </AppText>
                            {program.name.slice(program.end)}
                          </AppText>
                          {selected && (
                            <AppText variant="technical" style={styles.suggestionSelected}>
                              {t('profile.residency.selected')}
                            </AppText>
                          )}
                        </Pressable>
                      );
                    })}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('profile.residency.other')}
                      accessibilityHint={t('profile.residency.otherHint')}
                      onPress={() => selectProgram(query.trim())}
                      testID="residency-option-other"
                      style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                    >
                      <AppText style={[type.body, styles.suggestionOther]}>
                        {t('profile.residency.other')}
                      </AppText>
                    </Pressable>
                  </View>
                )}

                {touched && missingProgram && (
                  <AppText style={styles.error}>{t('profile.residency.required')}</AppText>
                )}
              </View>
            )}

            {isResident === false && (
              <View style={styles.generalist} testID="residency-generalist">
                <AppText variant="technical" style={styles.generalistTag}>
                  {t('profile.residency.generalist')}
                </AppText>
                <AppText style={styles.generalistNote}>
                  {t('profile.residency.noResidencyNote')}
                </AppText>
              </View>
            )}

            {save.isError && <MutationError onRetry={goForward} retrying={save.isPending} />}
          </View>

          <View style={styles.footer}>
            <OnboardingCta
              disabled={isResident === null || session.userId === null}
              loading={save.isPending}
              onPress={goForward}
              testID="residency-cta"
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
  title: {
    marginTop: m.titlePaddingTop,
    marginHorizontal: 32,
    fontSize: m.titleSize,
    lineHeight: m.titleLineHeight,
    letterSpacing: m.titleTracking,
    color: colors.textPrimary,
  },
  body: { flex: 1, marginTop: 30, marginHorizontal: 32, gap: 10 },
  choices: { gap: 10 },
  choice: {
    height: m.choiceHeight,
    borderRadius: m.choiceRadius,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceSelected: {
    borderWidth: 1.5,
    borderColor: colors.foreground,
    backgroundColor: colors.foreground,
  },
  choiceIdle: { borderWidth: 1, borderColor: 'rgba(16,22,15,0.18)' },
  choiceOn: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  choiceOff: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
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
  suggestionSelected: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.bronze },
  suggestionOther: { fontSize: 16, lineHeight: 21, color: colors.textMuted },
  generalist: { paddingTop: 16, gap: 8 },
  generalistTag: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: palette.bronzeDeep },
  generalistNote: { fontSize: 13, lineHeight: 18, color: palette.sage },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  pressed: { opacity: 0.72 },
  footer: { paddingHorizontal: 32, paddingTop: 12 },
});
