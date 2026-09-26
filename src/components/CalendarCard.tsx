import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  buildFullMonthGrid,
  compareLocalDates,
  type LocalDate,
  type LocalMonth,
  type WeekStart,
  weekdayOrder,
} from '@/domain/calendar';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette, type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';
import { AppText } from './AppText';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const DAY_LABEL = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

function toDate(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function monthTitle(month: LocalMonth): string {
  const name = MONTH_NAME.format(toDate(`${month}-01`));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export type CalendarCardProps = {
  month: LocalMonth;
  today: LocalDate;
  selected: LocalDate | null;
  /** Um ponto por Trabalho, na cor do Local (até três). */
  dots?: Partial<Record<LocalDate, readonly WorkLocationColorToken[]>>;
  weekStartsOn?: WeekStart;
  onSelectDate: (date: LocalDate) => void;
  /**
   * Cabeçalho com mês, atalho para hoje e setas. Sem ele (Agenda), o mês e a navegação
   * ficam fora do card, no topo da tela.
   */
  header?: { onPreviousMonth: () => void; onNextMonth: () => void; onToday: () => void };
  testID?: string;
};

/**
 * Calendário mensal em card, com cabeçalho opcional (mês, atalho para hoje e navegação); dias
 * em quadrados arredondados. Dias vizinhos só completam a primeira e a última semana (tocar
 * leva ao mês deles).
 * Hoje tem contorno bronze e a seleção é verde-escura; cor nunca é a única pista — o nome
 * acessível diz "hoje" e quantos trabalhos há no dia.
 */
export function CalendarCard({
  month,
  today,
  selected,
  dots = {},
  weekStartsOn = 1,
  onSelectDate,
  header,
  testID,
}: CalendarCardProps) {
  const { t } = useTranslation('components');
  const type = useBrandTypography();
  const weeks = buildFullMonthGrid(month, weekStartsOn);

  return (
    <View style={styles.card} testID={testID}>
      {header && (
        <View style={styles.header}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.month]}>
            {monthTitle(month)}{' '}
            <AppText style={[type.heading1, styles.year]}>{month.slice(0, 4)}</AppText>
          </AppText>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendarCard.goToToday')}
              onPress={header.onToday}
              testID={testID ? `${testID}-today` : undefined}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <CalendarDays color={colors.textPrimary} size={21} strokeWidth={1.7} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendarCard.previousMonth')}
              onPress={header.onPreviousMonth}
              testID={testID ? `${testID}-previous` : undefined}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <ChevronLeft color={colors.textPrimary} size={22} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('calendarCard.nextMonth')}
              onPress={header.onNextMonth}
              testID={testID ? `${testID}-next` : undefined}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <ChevronRight color={colors.textPrimary} size={22} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.weekdays}>
        {weekdayOrder(weekStartsOn).map((weekday) => (
          <AppText
            key={weekday}
            accessible={false}
            variant="technical"
            style={[styles.weekday, (weekday === 0 || weekday === 6) && styles.weekend]}
          >
            {t(`calendarCard.weekdayShort.${weekday}` as 'calendarCard.weekdayShort.0')}
          </AppText>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week) => (
          <View key={week[0].date} style={styles.week}>
            {week.map((cell) => {
              const isSelected = cell.date === selected;
              const isToday = cell.date === today;
              const isPast = compareLocalDates(cell.date, today) < 0;
              const dayDots = dots[cell.date] ?? [];
              const label = [
                DAY_LABEL.format(toDate(cell.date)),
                isToday ? t('calendar.today') : null,
                cell.inMonth ? null : t('calendarCard.otherMonth'),
                dayDots.length === 1 ? t('calendar.oneWork') : null,
                dayDots.length > 1 ? t('calendar.manyWorks', { count: dayDots.length }) : null,
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <Pressable
                  key={cell.date}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelectDate(cell.date)}
                  testID={testID ? `${testID}-${cell.date}` : undefined}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.square,
                      isToday && styles.squareToday,
                      isSelected && styles.squareSelected,
                    ]}
                  >
                    <AppText
                      style={[
                        type.heading1,
                        styles.number,
                        !cell.inMonth && styles.numberOutside,
                        cell.inMonth && isPast && styles.numberPast,
                        isSelected && styles.numberSelected,
                      ]}
                    >
                      {String(cell.day)}
                    </AppText>
                  </View>
                  <View style={styles.dots}>
                    {dayDots.slice(0, 3).map((token, index) => (
                      <View
                        // biome-ignore lint/suspicious/noArrayIndexKey: pontos repetem a cor do Local.
                        key={`${token}-${index}`}
                        style={[
                          styles.dot,
                          { backgroundColor: workLocationColors[token] },
                          !cell.inMonth && styles.dotOutside,
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F6EF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(16,22,15,0.08)',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  month: { fontSize: 24, lineHeight: 28, letterSpacing: -0.6, color: colors.textPrimary },
  year: { color: palette.sage },
  actions: { flexDirection: 'row', alignItems: 'center' },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  weekdays: { flexDirection: 'row', paddingTop: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.66,
    color: palette.sage,
  },
  weekend: { color: palette.bronzeDeep },
  grid: { gap: 2 },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3, gap: 3, minHeight: 50 },
  square: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  squareToday: { borderColor: palette.bronze },
  squareSelected: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  number: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.textPrimary },
  numberPast: { color: '#8A9184' },
  numberOutside: { color: 'rgba(127,138,118,0.45)' },
  numberSelected: { color: palette.cream },
  dots: { flexDirection: 'row', gap: 3, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotOutside: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
