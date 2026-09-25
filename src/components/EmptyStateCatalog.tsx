import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { EmptyState } from './EmptyState';

const noAction = () => {};

/** Each documented empty-data placement, with enough space to inspect typography. */
export function EmptyStateCatalog() {
  const { t } = useTranslation('components');
  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.emptyTitle')}
      </AppText>
      <AppText variant="technical">{t('catalog.emptyHomeEntries')}</AppText>
      <View style={styles.darkPreview}>
        <EmptyState
          variant="homeEntries"
          onPrimaryPress={noAction}
          testID="catalog-empty-home-entries"
        />
      </View>
      <AppText variant="technical">{t('catalog.emptyHomeWork')}</AppText>
      <EmptyState variant="homeWork" onPrimaryPress={noAction} testID="catalog-empty-home-work" />
      <AppText variant="technical">{t('catalog.emptyAgenda')}</AppText>
      <EmptyState variant="agendaDay" onPrimaryPress={noAction} testID="catalog-empty-agenda" />
      <AppText variant="technical">{t('catalog.emptyFinances')}</AppText>
      <EmptyState
        variant="financesNoWork"
        onPrimaryPress={noAction}
        testID="catalog-empty-finances"
      />
      <AppText variant="technical">{t('catalog.emptyEntriesMonth')}</AppText>
      <View style={styles.tallPreview}>
        <EmptyState
          variant="entriesMonth"
          periodLabel={t('catalog.emptyMonth')}
          testID="catalog-empty-entries"
        />
      </View>
      <AppText variant="technical">{t('catalog.emptyNextEntry')}</AppText>
      <EmptyState
        variant="financesNextEntry"
        description={t('catalog.emptyNextEntryDescription')}
        onPrimaryPress={noAction}
        testID="catalog-empty-next-entry"
      />
      <AppText variant="technical">{t('catalog.emptyLocations')}</AppText>
      <View style={styles.tallPreview}>
        <EmptyState
          variant="profileLocations"
          onPrimaryPress={noAction}
          testID="catalog-empty-locations"
        />
      </View>
      <AppText variant="technical">{t('catalog.emptyResidency')}</AppText>
      <View style={styles.tallPreview}>
        <EmptyState
          variant="profileResidency"
          onPrimaryPress={noAction}
          testID="catalog-empty-residency"
        />
      </View>
      <AppText variant="technical">{t('catalog.emptyImport')}</AppText>
      <View style={styles.tallPreview}>
        <EmptyState
          variant="profileImportNoData"
          onPrimaryPress={noAction}
          onSecondaryPress={noAction}
          testID="catalog-empty-import"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
  darkPreview: { backgroundColor: colors.darkBackground, padding: spacing.xl },
  tallPreview: { minHeight: 320, paddingHorizontal: spacing.xl },
});
