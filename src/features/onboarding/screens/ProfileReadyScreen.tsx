import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { Reveal, step, WordReveal } from '@/components/Reveal';
import { formatDayMonth } from '@/domain/calendar';
import { formatCentsToBRL } from '@/domain/money';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import { EMPTY_PIECE, WorkPiece } from '@/features/work/first-work/WorkPiece';
import { todayInTimezone } from '@/features/work/work-schedule';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingProfileMetrics as m, palette } from '@/theme/tokens';
import { BrandBackdrop } from '../BrandBackdrop';
import { deviceTimezone } from '../profile-data';
import { useProfileDraft } from '../profile-draft';
import { ResidencyPiece } from '../ResidencyPiece';
import { useResidencyNextEntries } from '../use-onboarding-done';

/**
 * Tela 12 (Onboarding v2, 7.7), depois da situação profissional:
 * - **Residente:** payoff parcial — "Sua DOKH está começando a tomar forma." A peça da
 *   residência e as próximas entradas reais da bolsa descem por uma linha bronze; a pergunta
 *   "Você também faz plantões…?" leva ao primeiro trabalho ou conclui com **Ainda não**.
 * - **Generalista/Especialista:** ponte — a peça do trabalho aparece vazia, com os encaixes que
 *   o cadastro vai preencher, e o texto acompanha o foco escolhido.
 */
export function ProfileReadyScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { userId } = useAuthSession();
  const { status, specialty, monthlyAmount, paymentDay, focus } = useProfileDraft();
  const resident = status === 'resident';
  const entries = useResidencyNextEntries(userId, resident);
  const [today] = useState(() => todayInTimezone(deviceTimezone()));
  const upcoming = entries.data ?? [];
  const bridgeLine =
    focus === 'work'
      ? t('profile.ready.bridgeWork')
      : focus === 'receivables'
        ? t('profile.ready.bridgeReceivables')
        : focus === 'earnings'
          ? t('profile.ready.bridgeEarnings')
          : t('profile.ready.bridgeDefault');

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 22, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-profile-ready"
    >
      <StatusBar style="light" />
      <BrandBackdrop variant="ready" />
      <Reveal style={styles.wordmark}>
        <BrandMark light size={22} />
        <AppText style={[type.wordmark, styles.wordmarkText]}>{t('welcome.splash.label')}</AppText>
      </Reveal>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <WordReveal
          text={resident ? t('profile.ready.residentTitle') : t('profile.ready.bridgeTitle')}
          style={[type.heading1, styles.title]}
          delay={step(1)}
        />

        {resident ? (
          <>
            <Reveal delay={step(4)} rise={24} scaleFrom={0.96}>
              <ResidencyPiece
                specialty={specialty}
                monthlyAmount={monthlyAmount}
                paymentDay={paymentDay}
                tone="light"
                testID="profile-ready-residency"
              />
            </Reveal>
            {upcoming.length > 0 && (
              <View style={styles.timeline} testID="profile-ready-entries">
                <Reveal delay={step(6)}>
                  <AppText variant="technical" style={styles.eyebrow}>
                    {t('profile.ready.nextEntries')}
                  </AppText>
                </Reveal>
                <View style={styles.timelineRows}>
                  <View style={styles.timelineLine} />
                  {upcoming.map((entry, index) => (
                    // As entradas descem uma a uma pela linha: a bolsa já é dinheiro previsto.
                    <Reveal
                      key={entry.expectedOn}
                      delay={step(7 + index)}
                      rise={10}
                      style={styles.timelineRow}
                    >
                      <View style={styles.timelineDot} />
                      <AppText style={[type.heading1, styles.timelineDate]}>
                        {formatDayMonth(entry.expectedOn)}
                      </AppText>
                      <AppText style={styles.timelineAmount}>
                        {formatCentsToBRL(entry.amountCents)}
                      </AppText>
                    </Reveal>
                  ))}
                </View>
              </View>
            )}
            <Reveal delay={step(10)}>
              <AppText style={[type.heading1, styles.question]}>
                {t('profile.ready.residentQuestion')}
              </AppText>
            </Reveal>
          </>
        ) : (
          <>
            <Reveal delay={step(4)} rise={24} scaleFrom={0.96}>
              {/* A peça vazia: os encaixes que o cadastro do trabalho vai preencher. */}
              <WorkPiece
                values={EMPTY_PIECE}
                today={today}
                tone="light"
                testID="profile-ready-piece"
              />
            </Reveal>
            <Reveal delay={step(6)} style={styles.bridgeCopy}>
              <AppText style={styles.description}>{bridgeLine}</AppText>
              <AppText style={styles.description}>{t('profile.ready.bridgeAnyDate')}</AppText>
            </Reveal>
          </>
        )}
      </ScrollView>

      <Reveal delay={step(resident ? 11 : 8)} style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            resident ? t('profile.ready.withResidencyCta') : t('profile.ready.withoutResidencyCta')
          }
          onPress={() => router.push('/first-work')}
          testID="profile-ready-cta"
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.ctaLabel]}>
            {resident
              ? t('profile.ready.withResidencyCta')
              : t('profile.ready.withoutResidencyCta')}
          </AppText>
          <AppText accessible={false} style={[type.heading1, styles.ctaArrow]}>
            {'→'}
          </AppText>
        </Pressable>
        {resident && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.ready.notYet')}
            // Sem trabalho: a conclusão mostra só a residência e suas entradas reais.
            onPress={() => router.push('/first-work-done')}
            testID="profile-ready-skip"
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <AppText style={[type.heading1, styles.skipLabel]}>{t('profile.ready.notYet')}</AppText>
          </Pressable>
        )}
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.base, paddingHorizontal: 32 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: palette.cream },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 24, paddingVertical: 24 },
  title: { fontSize: 30, lineHeight: 33, letterSpacing: -1.05, color: palette.cream },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  timeline: { gap: 12 },
  timelineRows: { gap: 14, paddingLeft: 2 },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 1,
    backgroundColor: palette.bronze,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.bronze },
  timelineDate: { flex: 1, fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  timelineAmount: { fontSize: 15, lineHeight: 19, color: palette.secondaryText },
  question: { fontSize: 19, lineHeight: 24, letterSpacing: -0.38, color: palette.cream },
  bridgeCopy: { gap: 8 },
  description: { fontSize: 15, lineHeight: 23, color: palette.secondaryText },
  footer: { gap: 4 },
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
  skip: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  skipLabel: { fontSize: 15, lineHeight: 19, letterSpacing: 0, color: palette.cream },
  pressed: { opacity: 0.72 },
});
