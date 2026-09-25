import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { spacing } from '@/theme/tokens';
import { EarningsSlideArt } from './EarningsSlideArt';
import { EntriesSlideArt } from './EntriesSlideArt';
import { WorkSlideArt } from './WorkSlideArt';

/**
 * Ilustrações dos slides 01–03 do onboarding, guardadas depois que o fluxo passou a ter
 * uma única tela após o splash. Ficam aqui para uso em telas futuras (Home, Finanças, Premium).
 */
export function OnboardingArtCatalog() {
  const { t } = useTranslation('onboarding');
  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('welcome.art.title')}
      </AppText>
      <AppText variant="technical">{t('welcome.art.work.title')}</AppText>
      <WorkSlideArt />
      <AppText variant="technical">{t('welcome.art.entries.title')}</AppText>
      <EntriesSlideArt />
      <AppText variant="technical">{t('welcome.art.earnings.title')}</AppText>
      <EarningsSlideArt />
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
});
