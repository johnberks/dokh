import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function ProfileScreen() {
  const { t } = useTranslation('profile');
  return <PlaceholderScreen title={t('title')} />;
}
