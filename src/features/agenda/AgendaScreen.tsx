import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { CalendarCard } from '@/components/CalendarCard';
import { EmptyState } from '@/components/EmptyState';
import { PlusIcon } from '@/components/icons/heroicons';
import { TOP_GREEN_HEIGHT, TwoToneScrollScreen } from '@/components/Layout';
import { PeriodSwitcher } from '@/components/PeriodSwitcher';
import { Reveal, step } from '@/components/Reveal';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { WorkCard } from '@/components/WorkCard';
import { type LocalDate, type LocalMonth, monthOf, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { localDateToDate, todayInTimezone } from '@/features/work/work-schedule';
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

/** Janela em que a lista do dia ainda faz parte da cascata de entrada da aba. */
const ENTRY_WINDOW = 900;

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
  const [today, setToday] = useState(() => todayInTimezone(deviceTimezone()));
  const [month, setMonth] = useState<LocalMonth>(() => monthOf(today));
  const [selected, setSelected] = useState<LocalDate>(today);
  // Voltar do detalhe ou do `+` preserva o dia que a pessoa olhava.
  const openedChild = useRef(false);
  // Cada entrada na aba remonta a cascata de entrada (topo → calendário → dia → cards).
  // Voltar de uma tela filha não reanima: a pessoa continua de onde estava.
  const [enterKey, setEnterKey] = useState(0);
  const enteredAt = useRef(0);

  // Depois de salvar um Trabalho novo, a Agenda abre no dia dele (`?date=`).
  const { date: savedDate } = useLocalSearchParams<{ date?: string }>();

  // A Agenda sempre abre no mês atual (pedido do usuário, 2026-09-25).
  useFocusEffect(
    useCallback(() => {
      if (savedDate && /^\d{4}-\d{2}-\d{2}$/.test(savedDate)) {
        openedChild.current = false;
        enteredAt.current = Date.now();
        setEnterKey((key) => key + 1);
        setToday(todayInTimezone(deviceTimezone()));
        setMonth(monthOf(savedDate));
        setSelected(savedDate);
        router.setParams({ date: undefined });
        return;
      }
      if (openedChild.current) {
        openedChild.current = false;
        return;
      }
      enteredAt.current = Date.now();
      setEnterKey((key) => key + 1);
      const now = todayInTimezone(deviceTimezone());
      setToday(now);
      setMonth(monthOf(now));
      setSelected(now);
    }, [savedDate]),
  );
  const agenda = useAgendaMonth(month);

  const works = agenda.data ?? [];
  const byDay = worksByDay(works);
  const dayWorks = byDay.get(selected) ?? [];
  // Na entrada, os cards esperam o calendário; ao trocar de dia, entram na hora.
  const listStart = Date.now() - enteredAt.current < ENTRY_WINDOW ? 5 : 0;

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
      <View style={styles.heroRow}>
        <Reveal key={`text-${enterKey}`} rise={10} style={styles.heroText}>
          <AppText variant="technical" style={styles.eyebrow}>
            {t('eyebrow')}
          </AppText>
          <PeriodSwitcher
            title={monthName(month)}
            secondary={month.slice(0, 4)}
            previousLabel={t('previousMonth')}
            nextLabel={t('nextMonth')}
            onPrevious={() => goToMonth(shiftMonth(month, -1))}
            onNext={() => goToMonth(shiftMonth(month, 1))}
            testID="agenda-month"
          />
        </Reveal>
        <Reveal key={`add-${enterKey}`} delay={step(1)} scaleFrom={0.8}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('empty.addWork')}
            onPress={addWork}
            testID="agenda-add"
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          >
            <PlusIcon color={palette.cream} size={18} />
          </Pressable>
        </Reveal>
      </View>
    </View>
  );

  return (
    <TwoToneScrollScreen
      heroBackground={<AgendaHeroBackdrop />}
      standardHeroHeight
      hero={hero}
      bodyStyle={styles.body}
      testID="agenda-screen"
    >
      <Reveal
        key={`calendar-${enterKey}`}
        delay={step(2)}
        rise={28}
        scaleFrom={0.97}
        style={styles.calendar}
      >
        <CalendarCard
          month={month}
          today={today}
          selected={selected}
          dots={dotsByDay(works)}
          onSelectDate={selectDate}
          testID="agenda-calendar"
        />
      </Reveal>

      <Reveal key={`day-${enterKey}`} delay={step(4)} style={styles.dayRow}>
        <AppText variant="technical" style={styles.dayLabel} testID="agenda-day-label">
          {dayLabel(selected, today, t)}
        </AppText>
        {agenda.isSuccess && (
          <AppText style={styles.dayCount}>{dayCountLabel(dayWorks.length, t)}</AppText>
        )}
      </Reveal>

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
        <Reveal key={`free-${enterKey}`} delay={step(5)}>
          <EmptyState variant="agendaDay" onPrimaryPress={addWork} testID="agenda-free-day" />
        </Reveal>
      ) : (
        <View key={`list-${enterKey}`} style={styles.list}>
          {/* Cards do dia em cascata: na entrada da aba e ao trocar de dia. */}
          {dayWorks.map((work, index) => (
            <Reveal key={`${selected}-${work.id}`} delay={step(listStart + index)} rise={20}>
              <WorkCard
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
            </Reveal>
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
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
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
  // O verde tem a mesma altura das outras abas (TOP_GREEN_HEIGHT); o calendário começa 24 pt
  // abaixo da troca de mês (topo de 78 pt) e sobe sobre o resto do verde.
  calendar: { marginTop: -(TOP_GREEN_HEIGHT - 78 - 24), marginBottom: 18 },
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
