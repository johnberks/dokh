import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function FinancesScreen() {
  const { t } = useTranslation('finances');
  return <PlaceholderScreen title={t('title')} />;
}
