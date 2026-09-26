import { router, useFocusEffect } from 'expo-router';
import Banknote from 'lucide-react-native/icons/banknote';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Wallet from 'lucide-react-native/icons/wallet';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { TwoToneScrollScreen } from '@/components/Layout';
import { ProgressCard } from '@/components/ProgressCard';
import { type ReviewCardEntry, ReviewCardStack } from '@/components/ReviewCard';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { WorkCard } from '@/components/WorkCard';
import { formatDayMonth, type LocalMonth, monthOf } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import type { AgendaWork } from '@/features/agenda/agenda-data';
import { durationLabel, workKindLabel, workTimeLabel } from '@/features/agenda/agenda-format';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useConfirmReceivable } from '@/features/work/work-data';
import { todayInTimezone } from '@/features/work/work-schedule';
import { palette } from '@/theme/tokens';
import { HomeHeroCards } from './HomeHero';
import { HomeEntryRow, HomeListCard } from './HomeListCard';
import { type HomeBody, type HomeEntry, useHomeBody, useHomeHero } from './home-data';
import { setupProgress, temporalLabel } from './home-format';

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * Início (Home 01–06): topo verde com o mês (e o histórico, quando existe) e o corpo bege numa
 * única rolagem; o verde tem a mesma altura das outras abas (`TOP_GREEN_HEIGHT`) e o próximo
 * trabalho fica logo abaixo, no bege. Pendências só quando existem (no máximo
 * dois Review Cards, um de atenção); confirmar é sempre pelo servidor, sem otimismo. O
 * progresso inicial some quando completo. Nada de Premium aqui.
 */
export function HomeScreen() {
  const { t } = useTranslation('home');
  const { t: tAgenda } = useTranslation('agenda');
  const [today, setToday] = useState(() => todayInTimezone(deviceTimezone()));
  const [month, setMonth] = useState<LocalMonth>(() => monthOf(today));
  const openedChild = useRef(false);
  const hero = useHomeHero(month);
  const body = useHomeBody(today);
  const confirm = useConfirmReceivable();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Como Agenda e Finanças: voltar à aba abre o mês atual, exceto ao voltar de uma tela filha.
  useFocusEffect(
    useCallback(() => {
      if (openedChild.current) {
        openedChild.current = false;
        return;
      }
      const now = todayInTimezone(deviceTimezone());
      setToday(now);
      setMonth(monthOf(now));
    }, []),
  );

  function open(go: () => void) {
    openedChild.current = true;
    go();
  }
  const addWork = () => open(() => router.push('/work/new'));
  const openWork = (id: string) =>
    open(() => router.push({ pathname: '/work/[id]', params: { id } }));

  function onConfirm(entry: HomeEntry) {
    setFailed(false);
    setConfirmingId(entry.receivableId);
    confirm.mutate(entry.receivableId, {
      onError: () => setFailed(true),
      onSettled: () => setConfirmingId(null),
    });
  }

  const data = body.data;
  const reviews = data
    ? reviewCards(data, t, {
        confirmingId,
        onConfirm,
        onDates: (id) => open(() => router.push({ pathname: '/work/edit/[id]', params: { id } })),
      })
    : [];
  const heroView = (
    <HomeHeroCards
      hero={hero.data}
      month={month}
      today={today}
      firstName={data?.firstName ?? null}
      onMonth={setMonth}
      onAddWork={addWork}
      onAvatar={() => router.push('/profile')}
      onOpenFinances={() => router.push('/finances')}
    />
  );

  return (
    <TwoToneScrollScreen
      heroBackground={<AgendaHeroBackdrop />}
      hero={heroView}
      bodyStyle={styles.body}
      testID="home-screen"
    >
      {body.isPending ? (
        <Skeleton layout="summary" testID="home-loading" />
      ) : body.isError || !data ? (
        // Falha de leitura nunca vira "nenhum trabalho" nem "nenhuma entrada".
        <LoadError
          onRetry={() => void body.refetch()}
          retrying={body.isFetching}
          testID="home-error"
        />
      ) : (
        <View style={styles.sections}>
          <View testID="home-next-work-wrap">
            {data.upcomingWorks[0] ? (
              <NextWork work={data.upcomingWorks[0]} today={today} onPress={openWork} />
            ) : (
              <EmptyState variant="homeWork" onPrimaryPress={addWork} testID="home-no-work" />
            )}
          </View>

          {hero.isError ? (
            <LoadError
              onRetry={() => void hero.refetch()}
              retrying={hero.isFetching}
              testID="home-hero-error"
            />
          ) : null}

          {/* Só existe quando há pendência: vazia, dobraria o espaço entre os cards. */}
          {reviews.length > 0 ? <ReviewCardStack cards={reviews} testID="home-reviews" /> : null}
          {failed ? (
            <AppText accessibilityRole="alert" style={styles.error} testID="home-confirm-error">
              {t('review.confirmError')}
            </AppText>
          ) : null}

          {data.upcomingEntries.length > 0 ? (
            <HomeListCard
              icon={<Wallet color={palette.bronzeDeep} size={16} strokeWidth={1.7} />}
              iconTone="bronze"
              title={t('entries.eyebrow')}
              action={t('entries.seeAll')}
              onAction={() =>
                open(() =>
                  router.push({ pathname: '/finances/entries', params: { month: monthOf(today) } }),
                )
              }
              testID="home-entries"
            >
              {data.upcomingEntries.map((entry) => (
                <HomeEntryRow
                  key={entry.receivableId}
                  date={formatDayMonth(entry.expectedOn)}
                  origin={originName(entry, t('entries.residency'))}
                  value={money(entry.amountCents)}
                  color={entry.origin === 'residency' ? null : entry.colorToken}
                  testID={`home-entry-${entry.receivableId}`}
                />
              ))}
            </HomeListCard>
          ) : null}

          {data.upcomingWorks.length > 1 ? (
            <HomeListCard
              icon={<CalendarDays color={palette.structure} size={16} strokeWidth={1.7} />}
              iconTone="sage"
              title={t('works.eyebrow')}
              action={t('works.seeAgenda')}
              onAction={() => router.push('/agenda')}
              testID="home-works"
            >
              {data.upcomingWorks.slice(1).map((work) => {
                const [day, mon] = formatDayMonth(work.workDate).split(' ');
                return (
                  <WorkCard
                    key={work.id}
                    variant="row"
                    locationColor={work.colorToken}
                    day={day}
                    month={mon}
                    time={work.startTime ?? undefined}
                    duration={
                      work.durationMinutes === null
                        ? undefined
                        : durationLabel(work.durationMinutes)
                    }
                    kind={tAgenda(`workType.${work.type}` as 'workType.shift')}
                    place={work.locationName}
                    value={work.amountCents === null ? '—' : money(work.amountCents)}
                    onPress={() => openWork(work.id)}
                    testID={`home-work-${work.id}`}
                  />
                );
              })}
            </HomeListCard>
          ) : null}

          <SetupProgress
            body={data}
            onAddWork={addWork}
            onDates={(id) =>
              open(() => router.push({ pathname: '/work/edit/[id]', params: { id } }))
            }
          />
        </View>
      )}
    </TwoToneScrollScreen>
  );
}

/** Próximo trabalho (Home 01): relação temporal, horário, local, tipo, valor e entrada. */
function NextWork({
  work,
  today,
  onPress,
}: {
  work: AgendaWork;
  today: string;
  onPress: (id: string) => void;
}) {
  const { t } = useTranslation('home');
  const { t: tAgenda } = useTranslation('agenda');
  return (
    <WorkCard
      variant="featured"
      eyebrow={t('work.eyebrow')}
      temporalLabel={temporalLabel(work.workDate, today, t)}
      time={workTimeLabel(work)}
      place={work.locationName}
      kind={workKindLabel(work, tAgenda)}
      value={work.amountCents === null ? '—' : money(work.amountCents)}
      paymentLabel={
        work.receiptStatus === 'received'
          ? t('work.paymentReceived')
          : work.expectedOn
            ? t('work.paymentOn', { date: formatDayMonth(work.expectedOn) })
            : t('work.paymentUndated')
      }
      onPress={() => onPress(work.id)}
      testID="home-next-work"
    />
  );
}

function originName(entry: HomeEntry, residency: string): string {
  return entry.origin === 'residency' ? residency : (entry.locationName ?? residency);
}

/**
 * Pendências da Home, na ordem do UX: entrada de hoje (atenção), vencida sem confirmação
 * (neutra) e valores sem data. `ReviewCardStack` mostra no máximo duas, com uma de atenção.
 * A entrada de hoje não aparece também em "Próximas entradas" (a lista começa amanhã).
 */
function reviewCards(
  body: HomeBody,
  t: ReturnType<typeof useTranslation<'home'>>['t'],
  actions: {
    confirmingId: string | null;
    onConfirm: (entry: HomeEntry) => void;
    onDates: (workId: string) => void;
  },
): ReviewCardEntry[] {
  const cards: ReviewCardEntry[] = [];
  const due = body.dueToday[0];
  if (due) {
    cards.push({
      id: `today-${due.receivableId}`,
      tone: 'attention',
      eyebrow: t('review.todayEyebrow'),
      icon: <Banknote color={palette.bronzeDeep} size={18} strokeWidth={1.7} />,
      iconTone: 'bronze',
      value: money(due.amountCents),
      qualifier: originName(due, t('entries.residency')),
      hint: relatedWork(due, t),
      action: { label: t('review.confirmToday'), kind: 'check' },
      onPress: () => actions.onConfirm(due),
      busy: actions.confirmingId === due.receivableId,
      testID: 'home-review-today',
    });
  }
  const late = body.overdue[0];
  if (late) {
    cards.push({
      id: `late-${late.receivableId}`,
      tone: 'neutral',
      eyebrow: t('review.overdueEyebrow', { date: formatDayMonth(late.expectedOn) }),
      icon: <CalendarClock color={palette.bronzeDeep} size={18} strokeWidth={1.7} />,
      iconTone: 'bronze',
      value: money(late.amountCents),
      qualifier: originName(late, t('entries.residency')),
      hint: t('review.overdueHint'),
      action: { label: t('review.confirmOverdue'), kind: 'check' },
      onPress: () => actions.onConfirm(late),
      busy: actions.confirmingId === late.receivableId,
      testID: 'home-review-overdue',
    });
  }
  const undatedWork = body.firstUndatedWorkId;
  if (body.undatedCount > 0 && undatedWork) {
    cards.push({
      id: 'undated',
      tone: 'neutral',
      size: 'compact',
      icon: <CalendarClock color={palette.bronzeDeep} size={18} strokeWidth={1.7} />,
      iconTone: 'bronze',
      value: t('review.undatedValue', { value: money(body.undatedTotalCents) }),
      qualifier:
        body.undatedCount === 1
          ? t('review.undatedOne')
          : t('review.undatedMany', { count: body.undatedCount }),
      action: { label: t('review.addDates'), kind: 'arrow' },
      onPress: () => actions.onDates(undatedWork),
      testID: 'home-review-undated',
    });
  }
  return cards;
}

/** `Plantão de 12 SET`: o trabalho que gerou a entrada, quando existe. */
function relatedWork(
  entry: HomeEntry,
  t: ReturnType<typeof useTranslation<'home'>>['t'],
): string | undefined {
  if (!entry.workType || !entry.workDate) return undefined;
  const type = TYPE_LABEL[entry.workType];
  return t('review.todayQualifier', { type, date: formatDayMonth(entry.workDate) });
}

const TYPE_LABEL = { shift: 'Plantão', procedure: 'Procedimento', appointment: 'Atendimento' };

function SetupProgress({
  body,
  onAddWork,
  onDates,
}: {
  body: HomeBody;
  onAddWork: () => void;
  onDates: (workId: string) => void;
}) {
  const { t } = useTranslation('home');
  const progress = setupProgress(body, t);
  if (!progress) return null;
  const next = progress.next;
  return (
    <ProgressCard
      completed={progress.completed}
      totalSteps={progress.total}
      next={{
        id: next.id,
        label: next.label,
        onPress: () => (next.target === 'edit-work' ? onDates(next.workId) : onAddWork()),
      }}
      testID="home-progress"
    />
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  // Mesmo respiro entre todos os blocos do corpo.
  sections: { gap: 16 },
  error: { fontSize: 13, lineHeight: 18, color: palette.bronzeDeep },
});
