import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { WorkType } from '@/domain/work-type';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { WorkTypeSelector } from './WorkTypeSelector';

/** Onboarding 06 (escolha com Plantão marcado) e Agenda 06B (menu de ação). */
export function WorkTypeSelectorCatalog() {
  const { t } = useTranslation('components');
  const [choice, setChoice] = useState<WorkType | null>('shift');
  const [lastMenu, setLastMenu] = useState<WorkType | null>(null);

  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.workTypeTitle')}
      </AppText>

      <AppText variant="technical">{t('catalog.workTypeChoice')}</AppText>
      <WorkTypeSelector
        variant="choice"
        label={t('catalog.workTypeChoiceQuestion')}
        value={choice}
        onChange={setChoice}
        testID="catalog-work-type-choice"
      />

      <AppText variant="technical">{t('catalog.workTypeMenu')}</AppText>
      <WorkTypeSelector
        variant="menu"
        label={t('catalog.workTypeMenuQuestion')}
        onSelect={setLastMenu}
        testID="catalog-work-type-menu"
      />
      <AppText variant="technical">
        {lastMenu
          ? t('catalog.workTypeMenuResult', { type: t(`workType.${lastMenu}.title`) })
          : t('catalog.workTypeMenuNone')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
});
