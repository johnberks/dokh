import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { LocalDate } from '@/domain/calendar';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { CalendarGrid } from './CalendarGrid';
import { WorkTypeSelector } from './WorkTypeSelector';

/** Agenda 08 (folha padrão com calendário) e Agenda 06B (folha de menu com tipos). */
export function BottomSheetCatalog() {
  const { t } = useTranslation('components');
  const [openSheet, setOpenSheet] = useState<'standard' | 'menu' | null>(null);
  const [date, setDate] = useState<LocalDate>('2026-09-14');
  const close = () => setOpenSheet(null);

  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.sheetTitle')}
      </AppText>
      <Button
        variant="secondary"
        label={t('catalog.sheetOpenStandard')}
        onPress={() => setOpenSheet('standard')}
        testID="catalog-sheet-open-standard"
      />
      <Button
        variant="secondary"
        label={t('catalog.sheetOpenMenu')}
        onPress={() => setOpenSheet('menu')}
        testID="catalog-sheet-open-menu"
      />

      <BottomSheet
        open={openSheet === 'standard'}
        onClose={close}
        accessibilityLabel={t('catalog.sheetStandardEyebrow')}
        testID="catalog-sheet-standard"
      >
        <View style={styles.heading}>
          <AppText variant="technical">{t('catalog.sheetStandardEyebrow')}</AppText>
          <AppText accessibilityRole="header" variant="heading1" style={styles.month}>
            {t('catalog.sheetStandardHeading')}
          </AppText>
        </View>
        <CalendarGrid
          month="2026-09"
          today="2026-09-10"
          selected={date}
          weekStartsOn={0}
          dots={{ '2026-09-12': ['blue'], '2026-09-15': ['sage'], '2026-09-18': ['bronze'] }}
          onSelectDate={setDate}
        />
        <AppText style={styles.note}>{t('catalog.sheetStandardNote')}</AppText>
        <Button label={t('catalog.sheetConfirm')} onPress={close} />
      </BottomSheet>

      <BottomSheet
        variant="menu"
        open={openSheet === 'menu'}
        onClose={close}
        accessibilityLabel={t('catalog.sheetMenuHeading')}
        testID="catalog-sheet-menu"
      >
        <AppText accessibilityRole="header" variant="heading1" style={styles.menuHeading}>
          {t('catalog.sheetMenuHeading')}
        </AppText>
        <WorkTypeSelector variant="menu" label={t('catalog.sheetMenuHeading')} onSelect={close} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
  heading: { gap: spacing.xs, paddingTop: 6, paddingHorizontal: spacing.xs },
  month: { fontSize: 24, lineHeight: 26, letterSpacing: -0.72 },
  note: { fontSize: 13, lineHeight: 18, paddingHorizontal: spacing.xs },
  menuHeading: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44 },
});
