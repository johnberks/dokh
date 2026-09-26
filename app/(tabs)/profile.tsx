import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { DevelopmentSignOut } from '@/features/auth/DevelopmentSignOut';

export default function ProfileScreen() {
  const { t } = useTranslation('profile');
  const { t: tComponents } = useTranslation('components');
  return (
    <PlaceholderScreen title={t('title')}>
      {/* Catálogo de componentes (só em desenvolvimento): saiu da Início quando ela virou tela real. */}
      {__DEV__ && (
        <Button
          label={tComponents('catalog.title')}
          variant="secondary"
          onPress={() => router.push('/dev/primitives')}
        />
      )}
      <DevelopmentSignOut />
    </PlaceholderScreen>
  );
}
