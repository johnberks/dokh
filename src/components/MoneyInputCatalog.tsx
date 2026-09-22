import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { MoneyInput } from './MoneyInput';

/** The empty/filled Agenda field and both large Onboarding treatments. */
export function MoneyInputCatalog() {
  const { t } = useTranslation('components');
  const [empty, setEmpty] = useState('');
  const [filled, setFilled] = useState('1.200');
  const [residency, setResidency] = useState('3.654,42');
  const [work, setWork] = useState('1.200');

  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.moneyTitle')}
      </AppText>
      <AppText variant="technical">{t('catalog.moneyFormEmpty')}</AppText>
      <MoneyInput
        label={t('catalog.moneyFormLabel')}
        value={empty}
        onChangeText={setEmpty}
        testID="catalog-money-form-empty"
      />
      <AppText variant="technical">{t('catalog.moneyFormFilled')}</AppText>
      <MoneyInput
        label={t('catalog.moneyFormLabel')}
        value={filled}
        onChangeText={setFilled}
        testID="catalog-money-form-filled"
      />
      <AppText variant="technical">{t('catalog.moneyResidency')}</AppText>
      <MoneyInput
        variant="residency"
        label={t('catalog.moneyResidencyLabel')}
        hint={t('catalog.moneyResidencyHint')}
        value={residency}
        onChangeText={setResidency}
        testID="catalog-money-residency"
      />
      <AppText variant="technical">{t('catalog.moneyWork')}</AppText>
      <AppText accessibilityRole="header" variant="heading1" style={styles.workHeading}>
        {t('catalog.moneyWorkLabel')}
      </AppText>
      <MoneyInput
        variant="work"
        label={t('catalog.moneyWorkLabel')}
        value={work}
        onChangeText={setWork}
        testID="catalog-money-work"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
  workHeading: { fontSize: 32, lineHeight: 35, letterSpacing: -0.96 },
});
