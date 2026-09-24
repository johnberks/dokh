import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { DevelopmentSignOut } from '@/features/auth/DevelopmentSignOut';

export default function ProfileScreen() {
  const { t } = useTranslation('profile');
  return (
    <PlaceholderScreen title={t('title')}>
      <DevelopmentSignOut />
    </PlaceholderScreen>
  );
}
