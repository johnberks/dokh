import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { Reveal, step, WordReveal } from '@/components/Reveal';
import { formatDayMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { onboardingStatusKey } from '@/features/auth/onboarding-status';
import { useGuideTour } from '@/features/guide/guide-tour';
import { useWorkDraft } from '@/features/work/work-draft';
import { todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { useCountUp } from '@/theme/useCountUp';
import { BrandBackdrop } from '../BrandBackdrop';
import {
  type FirstViewGroup,
  firstViewGroups,
  monthLabel,
  type SummaryWork,
  summaryTotals,
  workMetaLine,
} from '../onboarding-summary';
import { deviceTimezone } from '../profile-data';
import { useProfileDraft } from '../profile-draft';
import { useCompleteOnboarding, useOnboardingSummary } from '../use-onboarding-done';

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * TELA 10 (Onboarding v2, 7.7 · Entrega 4): a primeira visão — "Sua DOKH está pronta, João."
 * O que foi cadastrado se encaixa no mês em que o dinheiro deve entrar (caixa): o mês mais
 * próximo em destaque, os demais abaixo; recebido, aguardando confirmação e sem previsão em
 * grupos próprios, nunca somados ao previsto. "Próximo trabalho" só existe para trabalho
 * futuro; o passado aparece como realizado. A ordem dos blocos segue o foco. Sem confete: a
 * recompensa é a clareza. Só aparece o que foi gravado no servidor.
 * O onboarding é marcado como concluído ao abrir a tela, para que fechar o app aqui não refaça
 * o fluxo (e não duplique o Trabalho); a Home só assume quando a pessoa toca no botão.
 */
export function OnboardingDoneScreen({ workId }: { workId: string | null }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const queryClient = useQueryClient();
  const { userId } = useAuthSession();
  const { displayName, focus } = useProfileDraft();
  const summary = useOnboardingSummary(userId, workId);
  const complete = useCompleteOnboarding(userId);
  const started = useRef(false);
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const referenceYear = Number(today.slice(0, 4));

  useEffect(() => {
    if (started.current || userId === null) return;
    started.current = true;
    complete.mutate();
  }, [complete, userId]);

  // Voltar daqui regravaria o Trabalho: a saída é só pelo botão.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  function goHome() {
    if (userId === null) return;
    // O foco sai do rascunho antes de limpá-lo: o guia começa pela seção dele.
    const chosenFocus = useProfileDraft.getState().focus;
    useProfileDraft.getState().reset();
    useWorkDraft.getState().reset();
    queryClient.setQueryData(onboardingStatusKey(userId), true);
    useGuideTour.getState().start(chosenFocus);
    router.replace('/');
  }

  function submit() {
    if (complete.isSuccess) goHome();
    else complete.mutate(undefined, { onSuccess: goHome });
  }

  const data = summary.data;
  const groups = data ? firstViewGroups(data) : [];
  const count = data ? summaryTotals(data).count : 0;
  const name = displayName.trim();
  const work = data?.work ?? null;

  const entries = (
    <EntriesBlock
      key="entries"
      groups={groups}
      workLabel={work?.locationName ?? ''}
      referenceYear={referenceYear}
      delay={step(3)}
    />
  );
  const workBlock = work ? (
    <WorkBlock
      key="work"
      work={work}
      upcoming={work.workDate >= today}
      referenceYear={referenceYear}
      delay={step(focus === 'work' ? 3 : 6)}
    />
  ) : null;
  // Trabalhos começa pelo trabalho; Recebimentos e Ganhos, pelas entradas do mês.
  const blocks = focus === 'work' ? [workBlock, entries] : [entries, workBlock];

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 22, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-done"
    >
      <StatusBar style="light" />
      <BrandBackdrop variant="done" />
      <Reveal style={styles.wordmark}>
        <BrandMark light size={22} />
        <AppText style={[type.wordmark, styles.wordmarkText]}>{t('welcome.splash.label')}</AppText>
      </Reveal>

      {summary.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.cream} testID="onboarding-done-loading" />
        </View>
      ) : summary.isError || !data ? (
        <View style={[styles.center, styles.inlineError]}>
          <AppText style={styles.errorText}>{t('done.loadError')}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('done.retry')}
            onPress={() => void summary.refetch()}
            testID="onboarding-done-retry"
            style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.retryLabel]}>{t('done.retry')}</AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <WordReveal
            text={name ? t('done.titleNamed', { name }) : t('done.titleAnonymous')}
            style={[type.heading1, styles.title]}
            delay={step(1)}
          />
          <Reveal delay={step(2)}>
            <AppText style={styles.count}>
              {count === 1 ? t('done.countOne') : t('done.countMany', { count })}
            </AppText>
          </Reveal>
          {blocks}
        </ScrollView>
      )}

      <View style={styles.footer}>
        {complete.isError && !complete.isPending && (
          <AppText style={styles.errorText} testID="onboarding-done-complete-error">
            {t('done.completeError')}
          </AppText>
        )}
        <Reveal delay={step(9)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('done.viewCta')}
            accessibilityState={{ busy: complete.isPending }}
            disabled={complete.isPending}
            onPress={submit}
            testID="onboarding-done-cta"
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.ctaLabel]}>{t('done.viewCta')}</AppText>
            <AppText accessible={false} style={[type.heading1, styles.ctaArrow]}>
              {'→'}
            </AppText>
          </Pressable>
        </Reveal>
      </View>
    </View>
  );
}

/** As entradas por mês: o mês mais próximo em destaque (o número conta), os demais abaixo. */
function EntriesBlock({
  groups,
  workLabel,
  referenceYear,
  delay,
}: {
  groups: FirstViewGroup[];
  workLabel: string;
  referenceYear: number;
  delay: number;
}) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const [lead, ...rest] = groups;
  const counted = useCountUp(lead?.totalCents ?? 0n, lead ? 1 : 0);
  if (!lead) return null;

  return (
    <View style={styles.block} testID="onboarding-done-entries">
      <Reveal delay={delay}>
        <View accessible testID="onboarding-done-total">
          <AppText variant="technical" style={styles.leadLabel}>
            {leadLabel(lead, referenceYear, t)}
          </AppText>
          <AppText style={[type.heading1, styles.leadValue]}>{money(counted)}</AppText>
        </View>
      </Reveal>
      <GroupRows group={lead} workLabel={workLabel} delay={delay + step(1)} />
      {rest.map((group, index) => (
        <Reveal
          key={groupKey(group)}
          delay={delay + step(3 + index * 2)}
          style={styles.group}
          testID={`onboarding-done-group-${groupKey(group)}`}
        >
          <View style={styles.groupHeader}>
            <AppText style={[type.heading1, styles.groupTitle]}>
              {groupTitle(group, referenceYear, t)}
            </AppText>
            <AppText style={[type.heading1, styles.groupTotal]}>{money(group.totalCents)}</AppText>
          </View>
          <GroupRows group={group} workLabel={workLabel} delay={delay + step(4 + index * 2)} />
        </Reveal>
      ))}
    </View>
  );
}

/** Cada linha é uma peça que se encaixa no mês: data, de onde vem e quanto. */
function GroupRows({
  group,
  workLabel,
  delay,
}: {
  group: FirstViewGroup;
  workLabel: string;
  delay: number;
}) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  return (
    <View style={styles.rows}>
      {group.rows.map((row, index) => (
        <Reveal
          key={`${row.source}-${row.date ?? 'none'}`}
          delay={delay + index * 90}
          rise={16}
          scaleFrom={0.94}
          style={styles.row}
          testID="onboarding-done-row"
        >
          <View style={styles.rowDate}>
            <AppText variant="technical" style={styles.rowDateText}>
              {row.date ? formatDayMonth(row.date) : '—'}
            </AppText>
          </View>
          <View style={styles.rowIdentity}>
            <AppText numberOfLines={1} style={[type.heading1, styles.rowTitle]}>
              {row.source === 'residency' ? t('done.rowResidency') : workLabel}
            </AppText>
            {row.date === null && <AppText style={styles.rowMeta}>{t('done.rowUndated')}</AppText>}
          </View>
          <AppText style={[type.heading1, styles.rowAmount]}>{money(row.amountCents)}</AppText>
        </Reveal>
      ))}
    </View>
  );
}

/** O trabalho cadastrado: próximo (futuro) ou realizado (passado). */
function WorkBlock({
  work,
  upcoming,
  referenceYear,
  delay,
}: {
  work: SummaryWork;
  upcoming: boolean;
  referenceYear: number;
  delay: number;
}) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  return (
    <Reveal delay={delay} rise={20} scaleFrom={0.96} style={styles.block}>
      <AppText variant="technical" style={styles.leadLabel}>
        {upcoming ? t('done.nextWork') : t('done.doneWork')}
      </AppText>
      <View
        style={styles.workCard}
        testID={upcoming ? 'onboarding-done-next-work' : 'onboarding-done-past-work'}
      >
        <View style={styles.workChip}>
          <AppText variant="technical" style={styles.workChipText}>
            {t(`firstWork.chip.${work.type}` as 'firstWork.chip.shift')}
          </AppText>
        </View>
        <AppText numberOfLines={1} style={[type.heading1, styles.workPlace]}>
          {work.locationName}
        </AppText>
        <AppText style={styles.workMeta} testID="onboarding-done-work-meta">
          {workMetaLine(work, referenceYear)}
        </AppText>
      </View>
    </Reveal>
  );
}

function groupKey(group: FirstViewGroup): string {
  return group.kind === 'month' ? group.month : group.kind;
}

function groupTitle(
  group: FirstViewGroup,
  referenceYear: number,
  t: ReturnType<typeof useTranslation<'onboarding'>>['t'],
): string {
  if (group.kind === 'month') {
    const name = monthLabel(group.month, referenceYear);
    return name.charAt(0) + name.slice(1).toLowerCase();
  }
  if (group.kind === 'received') return t('done.groupReceived');
  if (group.kind === 'pending') return t('done.groupPending');
  return t('done.groupUndated');
}

function leadLabel(
  group: FirstViewGroup,
  referenceYear: number,
  t: ReturnType<typeof useTranslation<'onboarding'>>['t'],
): string {
  if (group.kind === 'month') {
    return t('done.totalMonth', { month: monthLabel(group.month, referenceYear) });
  }
  if (group.kind === 'received') return t('done.totalReceived');
  if (group.kind === 'pending') return t('done.totalPending');
  return t('done.totalUndated');
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.base, paddingHorizontal: 32 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: palette.cream },
  center: { flex: 1, justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingTop: 28, paddingBottom: 24, gap: 22 },
  title: { fontSize: 32, lineHeight: 35, letterSpacing: -1.12, color: palette.cream },
  count: { marginTop: -12, fontSize: 13, lineHeight: 17, color: palette.secondaryText },
  block: { gap: 12 },
  leadLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  leadValue: { fontSize: 44, lineHeight: 48, letterSpacing: -1.54, color: palette.cream },
  group: { gap: 8, paddingTop: 6 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  groupTitle: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  groupTotal: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.secondaryText },
  rows: { gap: 8 },
  row: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: palette.cream,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowDate: {
    borderRadius: 8,
    backgroundColor: palette.bronze,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowDateText: { fontSize: 11, lineHeight: 14, letterSpacing: 0.9, color: palette.base },
  rowIdentity: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, lineHeight: 19, letterSpacing: -0.15, color: palette.base },
  rowMeta: { fontSize: 12, lineHeight: 16, color: palette.mutedCopy },
  rowAmount: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.base },
  workCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(237,234,224,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.16)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  workChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: palette.bronze,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  workChipText: { fontSize: 10, lineHeight: 13, letterSpacing: 1.2, color: palette.base },
  workPlace: { fontSize: 17, lineHeight: 21, letterSpacing: -0.17, color: palette.cream },
  workMeta: { fontSize: 13, lineHeight: 17, color: palette.secondaryText },
  inlineError: { gap: 12, alignItems: 'flex-start' },
  errorText: { fontSize: 14, lineHeight: 20, color: palette.secondaryText },
  retry: { minHeight: 44, justifyContent: 'center' },
  retryLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  footer: { gap: 12, paddingTop: 12 },
  cta: {
    minHeight: m.ctaHeight,
    borderRadius: m.ctaRadius,
    backgroundColor: palette.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.base },
  ctaArrow: { fontSize: 18, lineHeight: 20, letterSpacing: 0, color: palette.base },
  pressed: { opacity: 0.72 },
});
