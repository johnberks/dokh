import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SignInScreen() {
  const { t } = useTranslation('auth');
  return <PlaceholderScreen title={t('signIn.title')} />;
}
