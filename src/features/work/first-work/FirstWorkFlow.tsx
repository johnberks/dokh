import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { OnboardingHeader } from '@/features/onboarding/OnboardingHeader';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { colors, motion } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { useSaveFirstWork } from '../use-save-first-work';
import { useWorkDraft } from '../work-draft';
import { todayInTimezone } from '../work-schedule';
import { AmountStep, ExpectedStep, PlaceStep, TypeStep, WhenStep } from './FirstWorkSteps';
import { WorkPiece } from './WorkPiece';

export const FIRST_WORK_STEPS = ['type', 'place', 'when', 'amount', 'expected'] as const;
export type FirstWorkStep = (typeof FIRST_WORK_STEPS)[number];
/** As etapas continuam a contagem do onboarding (nome 1 · foco 2 · situação 3 · bolsa 4). */
const FIRST_HEADER_STEP = 5;

/**
 * Primeiro trabalho numa rota só (Onboarding v2, 7.7): tipo → local → data → valor → entrada.
 * A peça fica fixa no topo e ganha um encaixe a cada resposta; só o conteúdo abaixo dela troca.
 * Voltar (botão, gesto do Android) retorna à etapa anterior sem perder nada; o gesto de voltar
 * do iOS só sai do fluxo na primeira etapa.
 */
export function FirstWorkFlow({ initialStep = 'type' }: { initialStep?: FirstWorkStep }) {
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const navigation = useNavigation();
  const reduced = useReducedMotion();
  const draft = useWorkDraft();
  const save = useSaveFirstWork();
  const [step, setStep] = useState<FirstWorkStep>(initialStep);
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const index = FIRST_WORK_STEPS.indexOf(step);

  useEffect(() => {
    navigation?.setOptions?.({ gestureEnabled: index === 0 });
  }, [index, navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      setStep(FIRST_WORK_STEPS[index - 1]);
      return true;
    });
    return () => subscription.remove();
  }, [index]);

  function back() {
    if (index === 0) router.back();
    else setStep(FIRST_WORK_STEPS[index - 1]);
  }

  function next() {
    setStep(FIRST_WORK_STEPS[Math.min(index + 1, FIRST_WORK_STEPS.length - 1)]);
  }

  function submit() {
    save.mutate(undefined, {
      // `replace`: o fluxo sai da pilha, então não há como voltar e gravar de novo.
      onSuccess: ({ workId }) =>
        router.replace({ pathname: '/first-work-done', params: { workId } }),
    });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="first-work-flow">
      <StatusBar style="dark" />
      <OnboardingHeader step={FIRST_HEADER_STEP + index} onBack={back} testID="first-work-header" />
      <View style={styles.piece}>
        <WorkPiece values={draft} today={today} />
      </View>
      <Animated.View
        key={step}
        entering={reduced ? undefined : FadeIn.duration(motion.enter)}
        exiting={reduced ? undefined : FadeOut.duration(motion.exit)}
        style={styles.step}
      >
        {step === 'type' && <TypeStep onNext={next} today={today} />}
        {step === 'place' && <PlaceStep onNext={next} today={today} />}
        {step === 'when' && <WhenStep onNext={next} today={today} />}
        {step === 'amount' && <AmountStep onNext={next} today={today} />}
        {step === 'expected' && (
          <ExpectedStep
            today={today}
            onSave={submit}
            saving={save.isPending}
            saveFailed={save.isError}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  piece: { marginTop: 14, marginHorizontal: 24 },
  step: { flex: 1 },
});
