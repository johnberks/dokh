import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { CheckIcon, MagnifyingGlassIcon } from '@/components/icons/heroicons';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import { MutationError } from '@/components/TechnicalStates';
import { suggestResidencyPrograms } from '@/domain/medical-specialties';
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
/** Altura das sugestões + "Outra" abaixo da busca: o teclado nunca as cobre. */
const SUGGESTIONS_SPACE = (SUGGESTION_LIMIT + 1) * 44 + 16;

const OPTIONS = [
  // Ordem pedida pelo usuário (2026-10-01): Generalista, Em residência, Especialista.
  {
    value: 'general_practitioner',
    label: 'profile.status.generalist',
    hint: 'profile.status.generalistHint',
  },
  { value: 'resident', label: 'profile.status.resident', hint: 'profile.status.residentHint' },
  {
    value: 'specialist',
    label: 'profile.status.specialist',
    hint: 'profile.status.specialistHint',
  },
] as const satisfies readonly { value: ProfessionalStatus; label: string; hint: string }[];

/**
 * Tela 09: situação profissional (11.10). A escolha é sempre explícita — sem residência não
 * significa generalista. Em residência pede o programa e segue para a bolsa; Especialista pede
 * a especialidade (mesma lista) e conclui; Generalista conclui direto. Ao digitar na busca, ela
 * assume a tela e as sugestões ficam inteiras acima do teclado (pedido do usuário, 2026-10-01).
 */
export function ProfessionalStatusScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const session = useAuthSession();
  const { displayName, focus, status, specialty, update } = useProfileDraft();
  const [query, setQuery] = useState(specialty);
  const [touched, setTouched] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const save = useSaveProfile();

  const suggestions = useMemo(() => suggestResidencyPrograms(query, SUGGESTION_LIMIT), [query]);
  const chosen = specialty.trim();
  const asksSpecialty = status === 'resident' || status === 'specialist';
  const missingSpecialty = asksSpecialty && chosen.length === 0;
  // Buscando: a busca assume a tela (título, opções e botão saem) para que a lista inteira de
  // sugestões caiba acima do teclado, sem precisar rolar. Escolher ou tocar fora devolve tudo.
  const searching = asksSpecialty && searchFocused;

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
      save.mutate({ displayName, focus, status, specialty: chosen }, { onSuccess });
      return;
    }
    save.mutate({ displayName, focus, status }, { onSuccess });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="onboarding-status">
      <StatusBar style="dark" />
      <OnboardingHeader step={3} onBack={() => router.back()} testID="status-header" />
      <KeyboardScreen
        bottomInset={Math.max(insets.bottom, 24) + 20}
        // Em telas pequenas, a busca ainda sobe o bastante para as sugestões caberem.
        extraOffset={SUGGESTIONS_SPACE}
        footer={
          searching ? undefined : (
            <View style={styles.footer}>
              <OnboardingCta
                disabled={status === null || session.userId === null}
                loading={save.isPending}
                onPress={goForward}
                testID="status-cta"
              />
            </View>
          )
        }
        testID="status-scroll"
      >
        {!searching && (
          <View style={styles.heading}>
            <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
              {t('profile.status.title')}
            </AppText>
            <AppText style={styles.description}>
              {focus === 'work'
                ? t('profile.status.descriptionWork')
                : focus === 'receivables'
                  ? t('profile.status.descriptionReceivables')
                  : focus === 'earnings'
                    ? t('profile.status.descriptionEarnings')
                    : t('profile.status.description')}
            </AppText>
          </View>
        )}

        <View style={[styles.body, searching && styles.bodySearching]}>
          {!searching && (
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
                      {selected && <CheckIcon color={palette.base} size={12} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {asksSpecialty && (
            <View style={styles.search} testID="status-search">
              <AppText variant="technical" style={styles.searchLabel}>
                {status === 'resident'
                  ? t('profile.status.residencyQuestion')
                  : t('profile.status.specialtyQuestion')}
              </AppText>
              <View style={[styles.field, missingSpecialty && touched && styles.fieldError]}>
                <MagnifyingGlassIcon color={palette.sage} size={18} />
                <TextInput
                  accessibilityLabel={
                    status === 'resident'
                      ? t('profile.status.residencySearchLabel')
                      : t('profile.status.specialtySearchLabel')
                  }
                  autoCapitalize="words"
                  autoCorrect={false}
                  onBlur={() => setSearchFocused(false)}
                  onChangeText={(value) => {
                    setQuery(value);
                    update({ specialty: '' });
                  }}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t('profile.status.searchPlaceholder')}
                  placeholderTextColor={palette.sage}
                  selectionColor={palette.bronze}
                  style={[
                    // Sem `lineHeight`: o campo de uma linha do iOS cortaria as letras.
                    { fontFamily: type.body.fontFamily, fontWeight: type.body.fontWeight },
                    styles.input,
                  ]}
                  testID="status-input"
                  value={query}
                />
                <View style={styles.iconBalance} />
              </View>

              {/* Tocar no campo já mostra as mais procuradas; digitando, a busca. Escolhida a
                  especialidade, a lista some: não há mais o que decidir. */}
              {chosen.length === 0 && (query.trim().length > 0 || searchFocused) && (
                <View testID="status-suggestions">
                  {query.trim().length === 0 && (
                    <AppText variant="technical" style={styles.popularLabel}>
                      {t('profile.status.popular')}
                    </AppText>
                  )}
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
                  {query.trim().length > 0 && (
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
                  )}
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
  description: { fontSize: 15, lineHeight: 23, color: colors.textMuted },
  body: { marginTop: 28, marginHorizontal: 32, paddingBottom: 12, gap: 10 },
  bodySearching: { marginTop: 12 },
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
  searchLabel: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: palette.sage,
    textAlign: 'center',
  },
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
  // Texto digitado centralizado, como nos demais campos do onboarding.
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.textPrimary,
    padding: 0,
    textAlign: 'center',
  },
  // Contrapeso da lupa: mantém o texto no centro real do campo.
  iconBalance: { width: 18 },
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
  popularLabel: {
    paddingTop: 4,
    paddingBottom: 2,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.4,
    color: palette.sage,
  },
  suggestionOther: { fontSize: 16, lineHeight: 21, color: colors.textMuted },
  error: { fontSize: 13, lineHeight: 18, color: colors.errorFill },
  pressed: { opacity: 0.72 },
  footer: { paddingHorizontal: 32 },
});
