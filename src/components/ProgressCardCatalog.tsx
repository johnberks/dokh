import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { ProgressCard } from './ProgressCard';

const noAction = () => {};

/** The three incomplete Home HTML examples; the product feature supplies real milestones. */
export function ProgressCardCatalog() {
  const { t } = useTranslation('components');
  const completed = [
    { id: 'residency', label: t('catalog.progressResidence') },
    { id: 'first-work', label: t('catalog.progressFirstWork') },
  ];

  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.progressTitle')}
      </AppText>
      <ProgressCard
        completed={completed}
        totalSteps={3}
        next={{ id: 'dates', label: t('catalog.progressAddDates'), onPress: noAction }}
        testID="catalog-progress-dates"
      />
      <ProgressCard
        completed={completed}
        totalSteps={3}
        next={{ id: 'location', label: t('catalog.progressAddLocation'), onPress: noAction }}
        testID="catalog-progress-location"
      />
      <ProgressCard
        completed={completed}
        totalSteps={3}
        next={{ id: 'work', label: t('catalog.progressAddWork'), onPress: noAction }}
        testID="catalog-progress-work"
      />
    </View>
  );
}

const styles = StyleSheet.create({ catalog: { gap: spacing.md } });
