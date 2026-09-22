import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from './AppText';
import { WorkCard } from './WorkCard';

const noAction = () => {};

/** Development-only examples from Agenda 02/03/05 and Home 01/03. */
export function WorkCardCatalog() {
  const { t } = useTranslation('components');
  return (
    <View style={{ gap: 12 }}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.workTitle')}
      </AppText>
      <AppText variant="technical">{t('catalog.workAgenda')}</AppText>
      <WorkCard
        variant="agenda"
        locationColor="bronze"
        time={t('catalog.workMorning')}
        kind={t('catalog.workShiftSixHours')}
        place={t('catalog.clinic')}
        value={t('catalog.standardValue')}
        payment={{ state: 'scheduled', label: t('catalog.workExpectedOctober') }}
        onPress={noAction}
        testID="catalog-work-agenda"
      />
      <WorkCard
        variant="agenda"
        locationColor="sage"
        time={t('catalog.workEvening')}
        kind={t('catalog.workShiftTwelveHours')}
        place={t('catalog.hospital')}
        value={t('catalog.attentionValue')}
        payment={{ state: 'scheduled', label: t('catalog.workExpectedOctober') }}
        onPress={noAction}
        testID="catalog-work-agenda-second"
      />
      <AppText variant="technical">{t('catalog.workReceived')}</AppText>
      <WorkCard
        variant="agenda"
        locationColor="sage"
        time={t('catalog.workEvening')}
        kind={t('catalog.workShiftTwelveHours')}
        place={t('catalog.hospital')}
        value={t('catalog.attentionValue')}
        payment={{ state: 'received', label: t('catalog.workReceivedLabel') }}
        onPress={noAction}
        testID="catalog-work-received"
      />
      <AppText variant="technical">{t('catalog.workFeatured')}</AppText>
      <WorkCard
        variant="featured"
        eyebrow={t('catalog.workNext')}
        temporalLabel={t('catalog.workToday')}
        time={t('catalog.workEvening')}
        kind={t('catalog.workShiftTwelveHours')}
        place={t('catalog.hospital')}
        value={t('catalog.attentionValue')}
        paymentLabel={t('catalog.workPaymentDue')}
        onPress={noAction}
        testID="catalog-work-featured"
      />
      <AppText variant="technical">{t('catalog.workRow')}</AppText>
      <WorkCard
        variant="row"
        locationColor="blue"
        day={t('catalog.workRowDay')}
        month={t('catalog.workRowMonth')}
        time={t('catalog.workMorning')}
        duration={t('catalog.workSixHours')}
        kind={t('catalog.workShift')}
        place={t('catalog.shiftTitle')}
        value={t('catalog.standardValue')}
        onPress={noAction}
        testID="catalog-work-row"
      />
    </View>
  );
}
