import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation('onboarding');
  return <PlaceholderScreen title={t('intro.title')} />;
}
