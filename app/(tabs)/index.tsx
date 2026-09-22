import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function HomeScreen() {
  const { t } = useTranslation('home');
  return <PlaceholderScreen title={t('title')} />;
}
