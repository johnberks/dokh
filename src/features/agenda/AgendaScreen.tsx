import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Plus from 'lucide-react-native/icons/plus';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { CalendarCard } from '@/components/CalendarCard';
import { EmptyState } from '@/components/EmptyState';
import { TwoToneScrollScreen } from '@/components/Layout';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { WorkCard } from '@/components/WorkCard';
import { type LocalDate, type LocalMonth, monthOf, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { localDateToDate, todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, palette } from '@/theme/tokens';
import { AgendaHeroBackdrop } from './AgendaHeroBackdrop';
import { dotsByDay, useAgendaMonth, worksByDay } from './agenda-data';
import {
  dayCountLabel,
  dayLabel,
  workKindLabel,
  workPayment,
  workTimeLabel,
} from './agenda-format';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

function monthName(month: LocalMonth): string {
  const name = MONTH_NAME.format(localDateToDate(`${month}-01`));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Agenda 01–05: mês com pontos por Local, hoje em bronze, dia selecionado em verde e a lista
 * do dia em ordem de horário. A Agenda não soma valores — consolidação é de Finanças.
 */
export function AgendaScreen() {
  const { t } = useTranslation('agenda');
  const type = useBrandTypography();
  const [today, setToday] = useState(() => todayInTimezone(deviceTimezone()));
  const [month, setMonth] = useState<LocalMonth>(() => monthOf(today));
  const [selected, setSelected] = useState<LocalDate>(today);
  // Voltar do detalhe ou do `+` preserva o dia que a pessoa olhava.
  const openedChild = useRef(false);

  // A Agenda sempre abre no mês atual (pedido do usuário, 2026-09-25).
  useFocusEffect(
    useCallback(() => {
      if (openedChild.current) {
        openedChild.current = false;
        return;
      }
      const now = todayInTimezone(deviceTimezone());
      setToday(now);
      setMonth(monthOf(now));
      setSelected(now);
    }, []),
  );
  const agenda = useAgendaMonth(month);

  const works = agenda.data ?? [];
  const byDay = worksByDay(works);
  const dayWorks = byDay.get(selected) ?? [];

  function goToMonth(next: LocalMonth) {
    setMonth(next);
    // No mês atual a seleção volta para hoje; nos outros, para o dia 1.
    setSelected(next === monthOf(today) ? today : `${next}-01`);
  }

  function selectDate(date: LocalDate) {
    // Dia vizinho (fora do mês) leva ao mês dele.
    if (monthOf(date) !== month) setMonth(monthOf(date));
    setSelected(date);
  }

  const addWork = () => {
    openedChild.current = true;
    router.push('/work/new');
  };

  const hero = (
    <View style={styles.hero}>
      <StatusBar style="light" />
      <AgendaHeroBackdrop />
      <View style={styles.heroRow}>
        <View style={styles.heroText}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('eyebrow')}
          </AppText>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('previousMonth')}
              hitSlop={6}
              onPress={() => goToMonth(shiftMonth(month, -1))}
              testID="agenda-previous-month"
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <ChevronLeft color={palette.sage} size={22} />
            </Pressable>
            <AppText
              accessibilityRole="header"
              style={[type.heading1, styles.heroTitle]}
              testID="agenda-month"
            >
              {monthName(month)} <AppText style={styles.year}>{month.slice(0, 4)}</AppText>
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('nextMonth')}
              hitSlop={6}
              onPress={() => goToMonth(shiftMonth(month, 1))}
              testID="agenda-next-month"
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <ChevronRight color={palette.cream} size={22} />
            </Pressable>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('empty.addWork')}
          onPress={addWork}
          testID="agenda-add"
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Plus color={palette.cream} size={18} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <TwoToneScrollScreen hero={hero} bodyStyle={styles.body} testID="agenda-screen">
      <View style={styles.calendar}>
        <CalendarCard
          month={month}
          today={today}
          selected={selected}
          dots={dotsByDay(works)}
          onSelectDate={selectDate}
          testID="agenda-calendar"
        />
      </View>

      <View style={styles.dayRow}>
        <AppText variant="technical" style={styles.dayLabel} testID="agenda-day-label">
          {dayLabel(selected, today, t)}
        </AppText>
        {agenda.isSuccess && (
          <AppText style={styles.dayCount}>{dayCountLabel(dayWorks.length, t)}</AppText>
        )}
      </View>

      {agenda.isPending ? (
        <Skeleton layout="list" testID="agenda-loading" />
      ) : agenda.isError ? (
        // Falha de leitura nunca vira "dia livre".
        <LoadError
          onRetry={() => void agenda.refetch()}
          retrying={agenda.isFetching}
          testID="agenda-error"
        />
      ) : dayWorks.length === 0 ? (
        <EmptyState variant="agendaDay" onPrimaryPress={addWork} testID="agenda-free-day" />
      ) : (
        <View style={styles.list}>
          {dayWorks.map((work) => (
            <WorkCard
              key={work.id}
              variant="agenda"
              place={work.locationName}
              locationColor={work.colorToken}
              time={workTimeLabel(work)}
              kind={workKindLabel(work, t)}
              value={
                work.amountCents === null
                  ? '—'
                  : formatCentsToBRL(work.amountCents, { omitZeroCents: true })
              }
              payment={workPayment(work, t)}
              onPress={() => {
                openedChild.current = true;
                router.push({ pathname: '/work/[id]', params: { id: work.id } });
              }}
              accessibilityHint={t('card.hint')}
              testID={`agenda-work-${work.id}`}
            />
          ))}
        </View>
      )}
    </TwoToneScrollScreen>
  );
}

const styles = StyleSheet.create({
  // O card do calendário sobe sobre o topo escuro: o espaço de baixo do hero é dele.
  hero: { paddingBottom: 132, overflow: 'hidden' },
  heroRow: {
    paddingTop: 22,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroText: { gap: 10 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -8 },
  monthButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  year: { color: palette.sage },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  heroTitle: { fontSize: 28, lineHeight: 30, letterSpacing: -0.84, color: palette.cream },
  add: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(237,234,224,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 20, gap: 6 },
  calendar: { marginTop: -116, marginBottom: 18 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  dayLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.76,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dayCount: { fontSize: 13, lineHeight: 17, color: palette.mutedCopy },
  list: { gap: 12 },
  pressed: { opacity: 0.72 },
});
