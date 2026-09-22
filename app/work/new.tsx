import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function NewWorkScreen() {
  const { t } = useTranslation('agenda');
  return <PlaceholderScreen title={t('newWork.title')} />;
}
