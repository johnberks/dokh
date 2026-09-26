import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Banknote from 'lucide-react-native/icons/banknote';
import CalendarClock from 'lucide-react-native/icons/calendar-clock';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Wallet from 'lucide-react-native/icons/wallet';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { HeroBar } from '@/components/HeroBar';
import { HeroCarousel } from '@/components/HeroCarousel';
import { TwoToneScrollScreen } from '@/components/Layout';
import { ProgressCard } from '@/components/ProgressCard';
import { type ReviewCardEntry, ReviewCardStack } from '@/components/ReviewCard';
import { LoadError, Skeleton } from '@/components/TechnicalStates';
import { WorkCard } from '@/components/WorkCard';
import { formatDayMonth, type LocalMonth, monthOf, shiftMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { AgendaHeroBackdrop } from '@/features/agenda/AgendaHeroBackdrop';
import type { AgendaWork } from '@/features/agenda/agenda-data';
import { durationLabel, workKindLabel, workTimeLabel } from '@/features/agenda/agenda-format';
import { compactReais } from '@/features/finances/finance-format';
import { deviceTimezone } from '@/features/onboarding/profile-data';
import { useConfirmReceivable } from '@/features/work/work-data';
import { localDateToDate, todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { fontAliases, palette } from '@/theme/tokens';
import { HomeEntryRow, HomeListCard } from './HomeListCard';
import {
  type HomeBody,
  type HomeEntry,
  type HomeHero,
  useHomeBody,
  useHomeHero,
} from './home-data';
import {
  heroAmount,
  heroComparison,
  heroHistory,
  monthTense,
  setupProgress,
  temporalLabel,
} from './home-format';

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const monthName = (month: LocalMonth) => MONTH_NAME.format(localDateToDate(`${month}-01`));
const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * Altura fixa das páginas do topo: trocar de página nunca mexe no corpo. Com duas páginas (ou
 * com o mês vazio, que tem texto e ação) reserva o espaço dos pontos de paginação.
 */
const HERO_PAGE_HEIGHT = 212;
const HERO_PAGE_HEIGHT_TALL = 252;
/** Quanto o card do próximo trabalho sobe sobre o verde (mesmo efeito da Agenda/Finanças). */
const OVERLAP = 96;

/**
 * Início (Home 01–06): topo verde com o mês (e o histórico, quando existe) e o corpo bege numa
 * única rolagem; o próximo trabalho sobe sobre o verde. Pendências só quando existem (no máximo
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
  const heroView = (
    <HomeHeroView
      hero={hero.data}
      month={month}
      today={today}
      firstName={data?.firstName ?? null}
      overlap={data ? OVERLAP : 0}
      onMonth={setMonth}
      onAddWork={addWork}
      onAvatar={() => router.push('/profile')}
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
          <View style={styles.overlap} testID="home-next-work-wrap">
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

          <ReviewCardStack
            cards={reviewCards(data, t, {
              confirmingId,
              onConfirm,
              onDates: (id) =>
                open(() => router.push({ pathname: '/work/edit/[id]', params: { id } })),
            })}
            testID="home-reviews"
          />
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

/** Topo: marca e avatar; carrossel com o mês (e o histórico, quando existe). */
function HomeHeroView({
  hero,
  month,
  today,
  firstName,
  overlap,
  onMonth,
  onAddWork,
  onAvatar,
}: {
  hero: HomeHero | undefined;
  month: LocalMonth;
  today: string;
  firstName: string | null;
  overlap: number;
  onMonth: (month: LocalMonth) => void;
  onAddWork: () => void;
  onAvatar: () => void;
}) {
  const { t } = useTranslation('home');
  const type = useBrandTypography();
  const [page, setPage] = useState(0);
  const history = hero ? heroHistory(hero) : null;
  const name = monthName(month);
  const tense = monthTense(month, today);
  const amount = hero ? heroAmount(hero, tense, name, t) : null;
  const comparison = hero ? heroComparison(hero) : null;
  const previousName = monthName(shiftMonth(month, -1));

  const monthPage = (
    <View style={styles.page} testID="home-hero-month">
      <View style={styles.greetingRow}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          numberOfLines={1}
          style={[type.heading1, styles.greeting]}
        >
          {firstName
            ? t('hero.greeting', { month: name, name: firstName })
            : t('hero.greetingNoName', { month: name })}
        </AppText>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('previousMonth')}
            hitSlop={8}
            onPress={() => onMonth(shiftMonth(month, -1))}
            testID="home-month-previous"
            style={styles.stepperButton}
          >
            <ChevronLeft color={palette.secondaryText} size={18} />
          </Pressable>
          <AppText variant="technical" style={styles.stepperLabel} testID="home-month-title">
            {`${SHORT[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nextMonth')}
            hitSlop={8}
            onPress={() => onMonth(shiftMonth(month, 1))}
            testID="home-month-next"
            style={styles.stepperButton}
          >
            <ChevronRight color={palette.secondaryText} size={18} />
          </Pressable>
        </View>
      </View>
      {!hero ? null : amount ? (
        <View style={styles.amountBlock}>
          <AppText
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[type.heading1, styles.amount]}
            testID="home-hero-amount"
          >
            {money(amount.amount)}
          </AppText>
          <AppText numberOfLines={1} style={styles.qualifier}>
            {amount.qualifier}
          </AppText>
          {comparison ? (
            <View style={styles.comparison} testID="home-hero-comparison">
              <AppText variant="technical" style={styles.comparisonBadge}>
                {`${comparison.direction === 'up' ? '↑' : comparison.direction === 'down' ? '↓' : '='} ${Math.abs(comparison.percent)}%`}
              </AppText>
              <AppText numberOfLines={1} style={styles.comparisonText}>
                {comparison.direction === 'stable'
                  ? t('hero.comparisonStable', { month: previousName })
                  : t(comparison.direction === 'up' ? 'hero.comparisonUp' : 'hero.comparisonDown', {
                      value: money(
                        comparison.deltaCents < 0n ? -comparison.deltaCents : comparison.deltaCents,
                      ),
                      month: previousName,
                    })}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyHero}>
          <EmptyState variant="homeEntries" onPrimaryPress={onAddWork} testID="home-no-entries" />
        </View>
      )}
    </View>
  );

  const historyPage = history ? (
    <View style={styles.page} testID="home-hero-history">
      <View style={styles.historyHead}>
        <View style={styles.historyTitleBlock}>
          <AppText variant="technical" style={styles.historyEyebrow}>
            {t('hero.historyEyebrow')}
          </AppText>
          <AppText style={[type.heading1, styles.historyTitle]}>{t('hero.historyTitle')}</AppText>
        </View>
        {hero && hero.openCount > 0 ? (
          <AppText numberOfLines={1} style={styles.historyCount}>
            {hero.openCount === 1
              ? t('hero.openOne')
              : t('hero.openMany', { count: hero.openCount })}
          </AppText>
        ) : null}
      </View>
      <View
        accessible
        accessibilityLabel={t('hero.historyLabel', {
          months: history
            .map((bar) => `${monthName(bar.month)} ${money(bar.expectedTotalCents)}`)
            .join(', '),
        })}
        style={styles.historyChart}
      >
        {history.map((bar) => {
          const max = Math.max(...history.map((item) => Number(item.expectedTotalCents)));
          return (
            <View key={bar.month} style={styles.historyColumn}>
              <AppText
                numberOfLines={1}
                style={[
                  type.heading1,
                  styles.historyValue,
                  bar.current && styles.historyValueCurrent,
                ]}
              >
                {compactReais(bar.expectedTotalCents)}
              </AppText>
              <HeroBar
                height={Math.max(6, (Number(bar.expectedTotalCents) / max) * 62)}
                width={28}
                current={bar.current}
                active={page === 1}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.historyAxis}>
        {history.map((bar) => (
          <AppText
            key={bar.month}
            variant="technical"
            style={[styles.historyMonth, bar.current && styles.historyMonthCurrent]}
          >
            {SHORT[Number(bar.month.slice(5, 7)) - 1]}
          </AppText>
        ))}
      </View>
    </View>
  ) : null;

  return (
    <View style={[styles.hero, { paddingBottom: 24 + overlap }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.brand}>
          <BrandMark light size={22} />
          <AppText style={styles.brandName}>{t('brand')}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('avatar', { name: firstName ?? '' })}
          onPress={onAvatar}
          style={styles.avatar}
          testID="home-avatar"
        >
          <AppText style={[type.heading1, styles.avatarText]}>
            {(firstName ?? '•').charAt(0).toUpperCase()}
          </AppText>
        </Pressable>
      </View>
      <HeroCarousel
        background="transparent"
        height={historyPage || (hero && !amount) ? HERO_PAGE_HEIGHT_TALL : HERO_PAGE_HEIGHT}
        onPageChange={setPage}
        pages={
          historyPage
            ? [
                { id: 'month', accessibilityLabel: t('hero.pageMonth'), content: monthPage },
                { id: 'history', accessibilityLabel: t('hero.pageHistory'), content: historyPage },
              ]
            : [{ id: 'month', accessibilityLabel: t('hero.pageMonth'), content: monthPage }]
        }
        testID="home-hero-carousel"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  header: {
    paddingTop: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: {
    fontFamily: fontAliases.unboundedSemibold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.24,
    color: palette.cream,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.structure,
    backgroundColor: '#161F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.cream },
  page: { flex: 1, paddingTop: 24, paddingHorizontal: 24, gap: 16 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  greeting: {
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.44,
    color: palette.cream,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepperButton: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepperLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.secondaryText },
  amountBlock: { gap: 6 },
  amount: { fontSize: 48, lineHeight: 52, letterSpacing: -1.92, color: palette.cream },
  qualifier: { fontSize: 15, lineHeight: 20, color: palette.secondaryText },
  comparison: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  comparisonBadge: {
    fontSize: 11,
    lineHeight: 15,
    color: palette.base,
    backgroundColor: palette.bronze,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  comparisonText: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: palette.secondaryText },
  emptyHero: { paddingTop: 2 },
  historyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  historyTitleBlock: { gap: 4, flexShrink: 1 },
  historyEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  historyTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: palette.cream },
  historyCount: { flexShrink: 0, fontSize: 12, lineHeight: 16, color: palette.sage },
  historyChart: {
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(237,234,224,0.18)',
  },
  historyColumn: { width: 52, alignItems: 'center', gap: 8 },
  historyValue: { fontSize: 11, lineHeight: 14, letterSpacing: 0, color: palette.secondaryText },
  historyValueCurrent: { fontSize: 12, color: palette.cream },
  historyAxis: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  historyMonth: {
    width: 52,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: palette.sage,
  },
  historyMonthCurrent: { color: palette.bronze },
  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  sections: { gap: 20 },
  overlap: { marginTop: -(OVERLAP + 18) },
  error: { fontSize: 13, lineHeight: 18, color: palette.bronzeDeep },
});
