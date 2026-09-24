import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { DevelopmentSignOut } from '@/features/auth/DevelopmentSignOut';

export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation('onboarding');
  return (
    <PlaceholderScreen title={t('intro.title')}>
      <DevelopmentSignOut />
    </PlaceholderScreen>
  );
}
