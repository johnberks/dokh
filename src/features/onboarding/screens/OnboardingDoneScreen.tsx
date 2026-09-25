import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { formatCentsToBRL } from '@/domain/money';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { onboardingStatusKey } from '@/features/auth/onboarding-status';
import { useWorkDraft } from '@/features/work/work-draft';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { BrandBackdrop } from '../BrandBackdrop';
import {
  formatShortDate,
  type SummaryResidency,
  type SummaryWork,
  summaryTotals,
  workMetaLine,
} from '../onboarding-summary';
import { useProfileDraft } from '../profile-draft';
import { useCompleteOnboarding, useOnboardingSummary } from '../use-onboarding-done';

const money = (cents: bigint) => formatCentsToBRL(cents, { omitZeroCents: true });

/**
 * TELA 10: conclusão dinâmica. Mostra só o que foi gravado no servidor — sem residência o card
 * não existe, sem horário a linha não aparece, sem previsão aparece "Sem previsão de entrada".
 * O onboarding é marcado como concluído ao abrir a tela, para que fechar o app aqui não refaça
 * o fluxo (e não duplique o Trabalho); a Home só assume quando a pessoa toca no botão.
 */
export function OnboardingDoneScreen({ workId }: { workId: string | null }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const queryClient = useQueryClient();
  const { userId } = useAuthSession();
  const summary = useOnboardingSummary(userId, workId);
  const complete = useCompleteOnboarding(userId);
  const started = useRef(false);

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
    useProfileDraft.getState().reset();
    useWorkDraft.getState().reset();
    queryClient.setQueryData(onboardingStatusKey(userId), true);
    router.replace('/');
  }

  function submit() {
    if (complete.isSuccess) goHome();
    else complete.mutate(undefined, { onSuccess: goHome });
  }

  const data = summary.data;
  const totals = data ? summaryTotals(data) : null;
  const referenceYear = new Date().getFullYear();

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
      <View style={styles.wordmark}>
        <BrandMark light size={22} />
        <AppText style={[type.wordmark, styles.wordmarkText]}>{t('welcome.splash.label')}</AppText>
      </View>

      <View style={styles.summary}>
        {summary.isPending ? (
          <ActivityIndicator color={palette.cream} testID="onboarding-done-loading" />
        ) : summary.isError || !data || !totals ? (
          <View style={styles.inlineError}>
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
          <>
            <View style={styles.total} accessible testID="onboarding-done-total">
              <AppText variant="technical" style={styles.totalLabel}>
                {t('done.totalLabel')}
              </AppText>
              <AppText style={[type.heading1, styles.totalValue]}>
                {money(totals.totalCents)}
              </AppText>
              <AppText style={styles.totalCount}>
                {totals.count === 1
                  ? t('done.countOne')
                  : t('done.countMany', { count: totals.count })}
              </AppText>
            </View>
            <View style={styles.cards}>
              {data.residency && <ResidencyCard residency={data.residency} />}
              {data.work && <WorkSummaryCard work={data.work} referenceYear={referenceYear} />}
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {t('done.title')}
          </AppText>
          <AppText style={styles.description}>{t('done.description')}</AppText>
        </View>
        {complete.isError && !complete.isPending && (
          <AppText style={styles.errorText} testID="onboarding-done-complete-error">
            {t('done.completeError')}
          </AppText>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('done.cta')}
          accessibilityState={{ busy: complete.isPending }}
          disabled={complete.isPending}
          onPress={submit}
          testID="onboarding-done-cta"
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.ctaLabel]}>{t('done.cta')}</AppText>
          <AppText accessible={false} style={[type.heading1, styles.ctaArrow]}>
            {'→'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ResidencyCard({ residency }: { residency: SummaryResidency }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  return (
    <View style={styles.card} testID="onboarding-done-residency">
      <View style={styles.badge}>
        <View style={[styles.badgeDot, { backgroundColor: palette.workSage }]} />
        <AppText variant="technical" style={styles.badgeLabel}>
          {t('done.residencyBadge')}
        </AppText>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.cardIdentity}>
          <AppText style={[type.heading1, styles.cardTitle]} numberOfLines={1}>
            {residency.specialty}
          </AppText>
          <AppText style={styles.cardMeta}>
            {t('done.everyDay', { day: String(residency.paymentDay).padStart(2, '0') })}
          </AppText>
        </View>
        <AppText style={[type.heading1, styles.cardAmount]}>
          {money(residency.monthlyAmountCents)}
        </AppText>
      </View>
    </View>
  );
}

function WorkSummaryCard({ work, referenceYear }: { work: SummaryWork; referenceYear: number }) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  return (
    <View style={styles.card} testID="onboarding-done-work">
      <View style={styles.badge}>
        <View style={[styles.badgeDot, { backgroundColor: palette.structure }]} />
        <AppText variant="technical" style={styles.badgeLabel}>
          {t(`firstWork.chip.${work.type}` as 'firstWork.chip.shift')}
        </AppText>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.cardIdentity}>
          <AppText style={[type.heading1, styles.cardTitle]} numberOfLines={1}>
            {work.locationName}
          </AppText>
          <AppText style={styles.cardMeta} testID="onboarding-done-work-meta">
            {workMetaLine(work, referenceYear)}
          </AppText>
        </View>
        <AppText style={[type.heading1, styles.cardAmount]}>{money(work.amountCents)}</AppText>
      </View>
      <View style={styles.divider} />
      {work.expectedOn === null ? (
        <AppText style={styles.cardMeta} testID="onboarding-done-no-expected">
          {t('done.noExpected')}
        </AppText>
      ) : (
        <View style={styles.expectedRow} testID="onboarding-done-expected">
          <AppText style={styles.cardMeta}>{t('done.expected')}</AppText>
          <AppText variant="technical" style={styles.expectedDate}>
            {formatShortDate(work.expectedOn, referenceYear)}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.base, paddingHorizontal: 32 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: palette.cream },
  // Tela estática (sem rolagem): resumo no topo, texto e botão ancorados embaixo.
  summary: { flex: 1, marginTop: 34, gap: 20 },
  total: { gap: 6 },
  totalLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  totalValue: { fontSize: 46, lineHeight: 50, letterSpacing: -1.61, color: palette.cream },
  totalCount: { fontSize: 13, lineHeight: 17, color: palette.secondaryText },
  cards: { gap: 10 },
  card: {
    backgroundColor: palette.cream,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 12,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeDot: { width: 7, height: 7 },
  badgeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  cardIdentity: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17, lineHeight: 21, letterSpacing: -0.17, color: palette.base },
  cardMeta: { fontSize: 13, lineHeight: 17, color: palette.mutedCopy },
  cardAmount: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: palette.base },
  divider: { height: 1, backgroundColor: 'rgba(16,22,15,0.12)' },
  expectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expectedDate: { fontSize: 11, lineHeight: 15, letterSpacing: 0.88, color: palette.bronzeDeep },
  inlineError: { gap: 12, alignItems: 'flex-start' },
  errorText: { fontSize: 14, lineHeight: 20, color: palette.secondaryText },
  retry: { minHeight: 44, justifyContent: 'center' },
  retryLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  footer: { gap: 26 },
  copy: { gap: 12 },
  title: { fontSize: 32, lineHeight: 34, letterSpacing: -1.12, color: palette.cream },
  description: { fontSize: 15, lineHeight: 24, color: palette.secondaryText, maxWidth: 300 },
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
