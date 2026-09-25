import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { CalendarGrid } from '@/components/CalendarGrid';
import {
  formatDayMonth,
  type LocalDate,
  monthOf,
  shiftMonth,
  weekdayShort,
} from '@/domain/calendar';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { useMonthWorkDots } from '../month-work-dots';
import { localDateToDate } from '../work-schedule';
import { DarkButton } from './FormPieces';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

function monthName(month: string): string {
  const name = MONTH_NAME.format(localDateToDate(`${month}-01`));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Agenda 08: o mesmo calendário da Agenda, com pontos nos dias em que a pessoa já trabalha.
 * Dia ocupado não bloqueia a escolha. A data só vale ao confirmar.
 */
export function WorkDateSheet({
  open,
  value,
  today,
  onClose,
  onConfirm,
}: {
  open: boolean;
  value: LocalDate | null;
  today: LocalDate;
  onClose: () => void;
  onConfirm: (date: LocalDate) => void;
}) {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [pending, setPending] = useState<LocalDate | null>(value);
  const [month, setMonth] = useState(() => monthOf(value ?? today));
  const dots = useMonthWorkDots(month);

  // Cada abertura começa do valor atual do formulário.
  useEffect(() => {
    if (!open) return;
    setPending(value);
    setMonth(monthOf(value ?? today));
  }, [open, value, today]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      accessibilityLabel={t('form.dateSheet.eyebrow')}
      testID="work-date-sheet"
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('form.dateSheet.eyebrow')}
          </AppText>
          <AppText accessibilityRole="header" style={[type.heading1, styles.month]}>
            {monthName(month)} <AppText style={styles.year}>{month.slice(0, 4)}</AppText>
          </AppText>
        </View>
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('form.dateSheet.previousMonth')}
            onPress={() => setMonth(shiftMonth(month, -1))}
            testID="work-date-previous-month"
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          >
            <ChevronLeft color={colors.foreground} size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('form.dateSheet.nextMonth')}
            onPress={() => setMonth(shiftMonth(month, 1))}
            testID="work-date-next-month"
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          >
            <ChevronRight color={colors.foreground} size={18} />
          </Pressable>
        </View>
      </View>

      <CalendarGrid
        month={month}
        today={today}
        selected={pending}
        dots={dots.data ?? {}}
        weekStartsOn={0}
        onSelectDate={setPending}
        testID="work-date-calendar"
      />
      <AppText style={styles.hint}>{t('form.dateSheet.dotsHint')}</AppText>

      <DarkButton
        label={
          pending === null
            ? t('form.dateSheet.confirmEmpty')
            : t('form.dateSheet.confirm', {
                date: `${formatDayMonth(pending)}, ${weekdayShort(pending)}`,
              })
        }
        disabled={pending === null}
        onPress={() => {
          if (pending !== null) onConfirm(pending);
        }}
        testID="work-date-confirm"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  headerText: { gap: 4 },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  month: { fontSize: 24, lineHeight: 26, letterSpacing: -0.72, color: colors.textPrimary },
  year: { color: palette.sage },
  nav: { flexDirection: 'row', gap: 6 },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.2)',
  },
  hint: { fontSize: 13, lineHeight: 18, color: palette.mutedCopy, paddingHorizontal: 4 },
  pressed: { opacity: 0.72 },
});
