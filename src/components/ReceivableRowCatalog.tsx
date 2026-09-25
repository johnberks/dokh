import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from './AppText';
import { ReceivableRow } from './ReceivableRow';

const noAction = () => {};

/** The dated states from Finanças 05–10; no fabricated financial persistence. */
export function ReceivableRowCatalog() {
  const { t } = useTranslation('components');
  return (
    <View>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.receivableTitle')}
      </AppText>
      <AppText variant="technical">{t('catalog.receivableReceived')}</AppText>
      <ReceivableRow
        status="received"
        day={t('catalog.receivableDayReceived')}
        month={t('catalog.receivableMonth')}
        origin={t('catalog.receivableOrigin')}
        value={t('catalog.standardValue')}
        onPress={noAction}
        testID="catalog-receivable-received"
      />
      <AppText variant="technical">{t('catalog.receivableExpected')}</AppText>
      <ReceivableRow
        status="scheduled"
        day={t('catalog.receivableDayExpected')}
        month={t('catalog.receivableMonth')}
        origin={t('catalog.clinic')}
        value={t('catalog.receivableExpectedValue')}
        onPress={noAction}
        testID="catalog-receivable-expected"
      />
      <AppText variant="technical">{t('catalog.receivablePending')}</AppText>
      <ReceivableRow
        status="confirmation_pending"
        day={t('catalog.receivableDayPending')}
        month={t('catalog.receivableMonth')}
        origin={t('catalog.receivableHospital')}
        value={t('catalog.attentionValue')}
        onPress={noAction}
        onConfirm={noAction}
        testID="catalog-receivable-pending"
      />
    </View>
  );
}
