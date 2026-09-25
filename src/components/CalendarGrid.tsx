import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  buildMonthGrid,
  compareLocalDates,
  type LocalDate,
  type LocalMonth,
  type WeekStart,
  weekdayOrder,
} from '@/domain/calendar';
import {
  colors,
  calendarMetrics as m,
  type WorkLocationColorToken,
  workLocationColors,
} from '@/theme/tokens';
import { AppText } from './AppText';

export type CalendarGridProps = {
  month: LocalMonth;
  /** "Hoje" no fuso do usuário, calculado pela feature; o componente não lê o relógio. */
  today: LocalDate;
  selected: LocalDate | null;
  weekStartsOn: WeekStart;
  /** Um token por Trabalho do dia, na cor do Local. Até 4 pontos aparecem; o leitor de tela recebe a contagem total. */
  dots?: Partial<Record<LocalDate, readonly WorkLocationColorToken[]>>;
  /** Sem callback, o calendário é só leitura. */
  onSelectDate?: (date: LocalDate) => void;
  /** `compact` reproduz a grade menor do onboarding (tela 20). */
  density?: 'comfortable' | 'compact';
  testID?: string;
};

// Sem a opção `timeZone` (suporte irregular no Hermes): a data local ao meio-dia
// nunca muda de dia, qualquer que seja o fuso do aparelho.
const dayLabelFormat = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function spokenDate(date: LocalDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return dayLabelFormat.format(new Date(year, month - 1, day, 12));
}

/**
 * Grade mensal de Agenda 01–05 e do bottom sheet de data (Agenda 08).
 * Hoje: contorno bronze. Selecionado: círculo verde escuro. Passado: cinza-verde.
 * Não soma valores e não bloqueia dias ocupados (os pontos só avisam).
 */
export function CalendarGrid({
  month,
  today,
  selected,
  weekStartsOn,
  dots = {},
  onSelectDate,
  density = 'comfortable',
  testID,
}: CalendarGridProps) {
  const { t } = useTranslation('components');
  const weeks = useMemo(() => buildMonthGrid(month, weekStartsOn), [month, weekStartsOn]);
  const compact = density === 'compact';
  const cellStyle = compact ? styles.cellCompact : null;
  const markerStyle = compact ? styles.markerCompact : null;
  const numberStyle = compact ? styles.dayNumberCompact : null;

  return (
    <View testID={testID} style={styles.container}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.row}
      >
        {weekdayOrder(weekStartsOn).map((weekday) => (
          <AppText key={weekday} variant="technical" style={styles.weekday}>
            {t(`calendar.weekdayNarrow.${weekday}` as 'calendar.weekdayNarrow.0')}
          </AppText>
        ))}
      </View>
      <View style={styles.weeks}>
        {weeks.map((week) => (
          <View key={week.find(Boolean)?.date} style={styles.row}>
            {week.map((cell, index) => {
              if (!cell) {
                // Célula vazia é posicional (coluna fixa da semana); a posição é a identidade.
                // biome-ignore lint/suspicious/noArrayIndexKey: coluna da grade, não item de lista.
                return <View key={`blank-${index}`} style={[styles.cell, cellStyle]} />;
              }

              const isSelected = cell.date === selected;
              const isToday = cell.date === today;
              const isPast = compareLocalDates(cell.date, today) < 0;
              const dayDots = dots[cell.date] ?? [];
              const label = [
                spokenDate(cell.date),
                isToday ? t('calendar.today') : null,
                dayDots.length === 1 ? t('calendar.oneWork') : null,
                dayDots.length > 1 ? t('calendar.manyWorks', { count: dayDots.length }) : null,
              ]
                .filter(Boolean)
                .join(', ');

              const content = (
                <>
                  <View
                    testID={testID ? `${testID}-${cell.date}-marker` : undefined}
                    style={[
                      styles.marker,
                      markerStyle,
                      isToday && styles.markerToday,
                      isSelected && styles.markerSelected,
                    ]}
                  >
                    <AppText
                      // Archivo Medium (500) nos dias comuns; SemiBold (600) em hoje/selecionado.
                      variant={isSelected || isToday ? 'heading1' : 'heading2'}
                      style={[
                        styles.dayNumber,
                        numberStyle,
                        isPast && styles.dayPast,
                        isSelected && styles.daySelected,
                      ]}
                    >
                      {cell.day}
                    </AppText>
                  </View>
                  <View style={styles.dots}>
                    {dayDots.slice(0, m.maxDots).map((token, dotIndex) => (
                      <View
                        // Ordem estável: a feature entrega os Trabalhos já ordenados por horário.
                        // biome-ignore lint/suspicious/noArrayIndexKey: dois Trabalhos podem ter a mesma cor.
                        key={dotIndex}
                        testID={testID ? `${testID}-${cell.date}-dot` : undefined}
                        style={[styles.dot, { backgroundColor: workLocationColors[token] }]}
                      />
                    ))}
                  </View>
                </>
              );

              if (!onSelectDate) {
                return (
                  <View
                    key={cell.date}
                    accessible
                    accessibilityLabel={label}
                    style={[styles.cell, cellStyle]}
                  >
                    {content}
                  </View>
                );
              }

              return (
                <Pressable
                  key={cell.date}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelectDate(cell.date)}
                  testID={testID ? `${testID}-${cell.date}` : undefined}
                  style={[styles.cell, cellStyle]}
                >
                  {content}
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
  container: { gap: 6 },
  weeks: { gap: m.rowGap },
  row: { flexDirection: 'row', paddingHorizontal: m.horizontalPadding },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: m.weekdayFontSize,
    lineHeight: m.weekdayLineHeight,
    letterSpacing: m.weekdayTracking,
    color: colors.darkTextSecondary,
  },
  cell: {
    flex: 1,
    height: m.cellHeight,
    alignItems: 'center',
    paddingTop: m.cellPaddingTop,
    gap: m.cellGap,
  },
  marker: {
    width: m.dayCircle,
    height: m.dayCircle,
    borderRadius: m.dayCircle / 2,
    borderWidth: m.markerBorderWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellCompact: { height: m.compactCellHeight, gap: 2 },
  markerCompact: {
    width: m.compactDayCircle,
    height: m.compactDayCircle,
    borderRadius: m.compactDayCircle / 2,
  },
  dayNumberCompact: { fontSize: m.compactDayFontSize, lineHeight: 19 },
  markerToday: { borderColor: colors.accent },
  markerSelected: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  dayNumber: {
    fontSize: m.dayFontSize,
    lineHeight: m.dayLineHeight,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  dayPast: { color: colors.calendarPastDay },
  daySelected: { color: colors.darkTextPrimary },
  dots: { flexDirection: 'row', gap: m.dotGap, height: m.dotSize },
  dot: { width: m.dotSize, height: m.dotSize, borderRadius: m.dotSize / 2 },
});
