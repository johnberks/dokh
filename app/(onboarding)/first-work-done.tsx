import { useLocalSearchParams } from 'expo-router';
import { OnboardingDoneScreen } from '@/features/onboarding/screens/OnboardingDoneScreen';

/** TELA 10: recebe o Trabalho recém-gravado para mostrar o que de fato foi salvo. */
export default function FirstWorkDoneRoute() {
  const { workId } = useLocalSearchParams<{ workId?: string }>();
  return <OnboardingDoneScreen workId={workId ?? null} />;
}
