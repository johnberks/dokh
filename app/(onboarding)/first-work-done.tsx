import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { DevelopmentSignOut } from '@/features/auth/DevelopmentSignOut';

/** Conclusão dinâmica do onboarding: tela real e marcação de concluído são a tarefa 7.5. */
export default function FirstWorkDoneScreen() {
  const { t } = useTranslation('onboarding');
  return (
    <PlaceholderScreen title={t('firstWork.amount.submit')}>
      <DevelopmentSignOut />
    </PlaceholderScreen>
  );
}
