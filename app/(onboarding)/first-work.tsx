import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { DevelopmentSignOut } from '@/features/auth/DevelopmentSignOut';

/** Destino da conclusão do perfil. As telas reais do primeiro Trabalho são a tarefa 7.4. */
export default function FirstWorkScreen() {
  const { t } = useTranslation('onboarding');
  return (
    <PlaceholderScreen title={t('profile.ready.withResidencyCta')}>
      <DevelopmentSignOut />
    </PlaceholderScreen>
  );
}
