import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const { t: tComponents } = useTranslation('components');
  return (
    <PlaceholderScreen title={t('title')}>
      {__DEV__ && (
        <Button
          label={tComponents('catalog.title')}
          variant="secondary"
          onPress={() => router.push('/dev/primitives')}
        />
      )}
    </PlaceholderScreen>
  );
}
