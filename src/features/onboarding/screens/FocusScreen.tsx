import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { CheckIcon } from '@/components/icons/heroicons';
import { KeyboardScreen, type KeyboardScreenHandle } from '@/components/KeyboardScreen';
import { Reveal, step } from '@/components/Reveal';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingProfileMetrics as m, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { OnboardingCta } from '../OnboardingCta';
import { OnboardingHeader } from '../OnboardingHeader';
import { ONBOARDING_FOCUSES, type OnboardingFocus } from '../profile-data';
import { useProfileDraft } from '../profile-draft';

/** Como cada foco se conecta: lista (Onde · Quando · Quanto), fluxo (→) ou soma (+ … =). */
const JOINERS: Record<OnboardingFocus, readonly [string, string]> = {
  work: ['·', '·'],
  receivables: ['→', '→'],
  earnings: ['+', '='],
};

/**
 * Onboarding v2 (7.7): o que a pessoa mais quer organizar. Escolha única e obrigatória; a opção
 * escolhida se abre com a mini-sequência do que vem depois (referência Wispr Flow na Mobbin) e
 * a frase que muda o resto do fluxo. A resposta é gravada no perfil junto com a situação.
 */
export function FocusScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const reduced = useReducedMotion();
  const { displayName, focus, update } = useProfileDraft();
  const [touched, setTouched] = useState(false);
  const screenRef = useRef<KeyboardScreenHandle>(null);
  // Topo da lista de opções dentro do conteúdo rolável.
  const choicesTop = useRef(0);
  const name = displayName.trim();

  function submit() {
    setTouched(true);
    if (focus === null) return;
    router.push('/professional-status');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="onboarding-focus">
      <StatusBar style="dark" />
      <OnboardingHeader step={2} onBack={() => router.back()} testID="focus-header" />
      <KeyboardScreen
        ref={screenRef}
        bottomInset={Math.max(insets.bottom, 24) + 20}
        footer={
          <View style={styles.footer}>
            <OnboardingCta onPress={submit} testID="focus-cta" />
          </View>
        }
      >
        <View style={styles.heading}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {name ? t('profile.focus.titleNamed', { name }) : t('profile.focus.title')}
          </AppText>
          <AppText style={styles.description}>{t('profile.focus.description')}</AppText>
        </View>

        <View
          accessibilityRole="radiogroup"
          onLayout={(event) => {
            choicesTop.current = event.nativeEvent.layout.y;
          }}
          style={styles.choices}
        >
          {ONBOARDING_FOCUSES.map((option) => {
            const selected = focus === option;
            const label = t(`profile.focus.${option}.label`);
            return (
              <Animated.View
                key={option}
                layout={reduced ? undefined : LinearTransition.duration(motion.enter)}
                // A opção aberta nunca fica atrás do "Continuar": a tela rola até o fim dela
                // (pedido do usuário, 2026-10-02 — "Meus ganhos" ficava escondido).
                onLayout={(event) => {
                  if (!selected) return;
                  const { y, height } = event.nativeEvent.layout;
                  screenRef.current?.reveal(choicesTop.current + y + height);
                }}
              >
                <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityHint={t(`profile.focus.${option}.hint`)}
                  accessibilityState={{ checked: selected }}
                  onPress={() => update({ focus: option })}
                  testID={`focus-${option}`}
                  style={({ pressed }) => [
                    styles.choice,
                    selected ? styles.choiceSelected : styles.choiceIdle,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.choiceRow}>
                    <View style={styles.choiceText}>
                      <AppText
                        style={[type.heading2, selected ? styles.choiceOn : styles.choiceOff]}
                      >
                        {label}
                      </AppText>
                      <AppText style={selected ? styles.hintOn : styles.hintOff}>
                        {t(`profile.focus.${option}.hint`)}
                      </AppText>
                    </View>
                    <View style={selected ? styles.radioOn : styles.radioOff}>
                      {selected && <CheckIcon color={palette.base} size={12} />}
                    </View>
                  </View>
                  {selected && <FocusSequence focus={option} />}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {touched && focus === null && (
          <AppText style={styles.error}>{t('profile.focus.required')}</AppText>
        )}
      </KeyboardScreen>
    </View>
  );
}

/** A mini-sequência entra peça a peça e termina na frase do que a DOKH vai fazer. */
function FocusSequence({ focus }: { focus: OnboardingFocus }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const steps = [
    t(`profile.focus.${focus}.step1`),
    t(`profile.focus.${focus}.step2`),
    t(`profile.focus.${focus}.step3`),
  ];
  const [first, second] = JOINERS[focus];

  return (
    <View style={styles.sequence} testID={`focus-${focus}-sequence`}>
      <View accessible accessibilityLabel={steps.join(', ')} style={styles.chips}>
        {steps.map((label, index) => {
          // O último passo é o resultado: bronze, como as datas de entrada da DOKH.
          const result = index === steps.length - 1 && focus !== 'work';
          const accent = focus === 'receivables' && index === 1;
          return (
            <Reveal key={label} delay={step(index * 2)} rise={6} style={styles.chipGroup}>
              {index > 0 && (
                <AppText accessible={false} style={styles.joiner}>
                  {index === 1 ? first : second}
                </AppText>
              )}
              <View style={[styles.chip, (result || accent) && styles.chipAccent]}>
                <AppText
                  accessible={false}
                  style={[
                    type.heading1,
                    styles.chipText,
                    (result || accent) && styles.chipTextAccent,
                  ]}
                >
                  {label}
                </AppText>
              </View>
            </Reveal>
          );
        })}
      </View>
      <Reveal delay={step(6)} rise={6}>
        <AppText style={styles.story}>{t(`profile.focus.${focus}.story`)}</AppText>
      </Reveal>
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
  choices: { marginTop: 28, marginHorizontal: 32, gap: 10, paddingBottom: 12 },
  choice: {
    minHeight: m.choiceHeight,
    borderRadius: m.choiceRadius,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  choiceRow: {
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
  sequence: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(237,234,224,0.14)',
    gap: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 8 },
  chipGroup: { flexDirection: 'row', alignItems: 'center' },
  joiner: { marginHorizontal: 6, fontSize: 13, lineHeight: 18, color: palette.sage },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.32)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipAccent: { borderColor: palette.bronze, backgroundColor: palette.bronze },
  chipText: { fontSize: 12, lineHeight: 16, letterSpacing: 0, color: palette.cream },
  chipTextAccent: { color: palette.base },
  story: { fontSize: 14, lineHeight: 20, color: palette.cream },
  error: {
    marginTop: 6,
    marginHorizontal: 32,
    fontSize: 13,
    lineHeight: 18,
    color: colors.errorFill,
  },
  pressed: { opacity: 0.72 },
  footer: { marginHorizontal: 32 },
});
