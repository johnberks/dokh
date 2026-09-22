import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { LocalDate } from '@/domain/calendar';
import { spacing, type WorkLocationColorToken } from '@/theme/tokens';
import { AppText } from './AppText';
import { CalendarGrid } from './CalendarGrid';

// Dados de Agenda 01 (setembro/2026, hoje = dia 10): cores dos Locais do HTML.
const TODAY: LocalDate = '2026-09-10';
const DOTS: Partial<Record<LocalDate, WorkLocationColorToken[]>> = {
  '2026-09-03': ['sage'],
  '2026-09-05': ['blue'],
  '2026-09-10': ['sage'],
  '2026-09-12': ['blue'],
  '2026-09-15': ['sage'],
  '2026-09-18': ['bronze'],
  '2026-09-20': ['terra'],
  '2026-09-22': ['bronze', 'sage'],
  '2026-09-24': ['sage'],
  '2026-09-26': ['blue'],
  '2026-09-30': ['bronze'],
};

/** Agenda 01 (Domingo, dia selecionável) e Agenda 08 (Segunda, seleção de data). */
export function CalendarGridCatalog() {
  const { t } = useTranslation('components');
  const [agendaSelected, setAgendaSelected] = useState<LocalDate>(TODAY);
  const [sheetSelected, setSheetSelected] = useState<LocalDate>('2026-09-14');

  return (
    <View style={styles.catalog}>
      <AppText accessibilityRole="header" variant="heading2">
        {t('catalog.calendarTitle')}
      </AppText>
      <AppText variant="technical">{t('catalog.calendarSunday')}</AppText>
      <CalendarGrid
        month="2026-09"
        today={TODAY}
        selected={agendaSelected}
        weekStartsOn={0}
        dots={DOTS}
        onSelectDate={setAgendaSelected}
        testID="catalog-calendar-agenda"
      />
      <AppText variant="technical">
        {t('catalog.calendarSelected', { date: agendaSelected })}
      </AppText>
      <AppText variant="technical">{t('catalog.calendarMonday')}</AppText>
      <CalendarGrid
        month="2026-09"
        today={TODAY}
        selected={sheetSelected}
        weekStartsOn={1}
        dots={DOTS}
        onSelectDate={setSheetSelected}
        testID="catalog-calendar-sheet"
      />
      <AppText variant="technical">
        {t('catalog.calendarSelected', { date: sheetSelected })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: { gap: spacing.md },
});
