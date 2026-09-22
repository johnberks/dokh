import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AgendaScreen() {
  const { t } = useTranslation('agenda');
  return <PlaceholderScreen title={t('title')} />;
}
