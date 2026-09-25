import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { formatCentsToBRL, parseBRLToCents } from '@/domain/money';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import {
  onboardingIntroMetrics as intro,
  onboardingProfileMetrics as m,
  palette,
} from '@/theme/tokens';
import { BrandBackdrop } from '../BrandBackdrop';
import { useProfileDraft } from '../profile-draft';

/**
 * Tela 12: perfil construído. Não existe `Pular` — a única saída é registrar o primeiro
 * trabalho, conforme decisão do usuário (2026-09-25). Mostra só o que foi cadastrado.
 */
export function ProfileReadyScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { isResident, residencyProgram, monthlyAmount, paymentDay } = useProfileDraft();
  const resident = isResident === true;
  const amountCents = parseBRLToCents(monthlyAmount);

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
      <View style={styles.wordmark}>
        <BrandMark light size={22} />
        <AppText style={[type.wordmark, styles.wordmarkText]}>{t('welcome.splash.label')}</AppText>
      </View>

      <View style={styles.summary}>
        <BrandMark light size={intro.symbolSize} />
        {resident ? (
          <BlurView intensity={36} tint="dark" style={styles.card} testID="profile-ready-residency">
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <AppText variant="technical" style={styles.badgeLabel}>
                {t('profile.ready.badge')}
              </AppText>
            </View>
            <View style={styles.cardBody}>
              <AppText style={[type.heading1, styles.program]}>{residencyProgram}</AppText>
              {amountCents !== null && (
                <AppText style={[type.heading1, styles.amount]}>
                  {formatCentsToBRL(amountCents)}
                </AppText>
              )}
              {paymentDay !== null && (
                <AppText style={styles.day}>
                  {t('profile.ready.everyDay', { day: String(paymentDay).padStart(2, '0') })}
                </AppText>
              )}
            </View>
          </BlurView>
        ) : (
          <BlurView
            intensity={36}
            tint="dark"
            style={styles.card}
            testID="profile-ready-generalist"
          >
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <AppText variant="technical" style={styles.badgeLabel}>
                {t('profile.ready.generalistBadge')}
              </AppText>
            </View>
          </BlurView>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {resident
              ? t('profile.ready.withResidencyTitle')
              : t('profile.ready.withoutResidencyTitle')}
          </AppText>
          <AppText style={styles.description}>
            {resident
              ? t('profile.ready.withResidencyDescription')
              : t('profile.ready.withoutResidencyDescription')}
          </AppText>
        </View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.base, paddingHorizontal: 32 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: palette.cream },
  summary: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 32 },
  // Vidro: desfoque real do fundo (expo-blur) + véu creme e borda clara do HTML.
  card: {
    width: 262,
    backgroundColor: 'rgba(237,234,224,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(237,234,224,0.22)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
    overflow: 'hidden',
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeDot: { width: 7, height: 7, backgroundColor: palette.workSage },
  badgeLabel: { fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: palette.sage },
  cardBody: { gap: 4 },
  program: { fontSize: 20, lineHeight: 22, letterSpacing: -0.4, color: palette.cream },
  amount: { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: palette.cream },
  day: { fontSize: 13, lineHeight: 17, color: palette.secondaryText },
  footer: { gap: 32 },
  copy: { gap: 14 },
  title: { fontSize: 36, lineHeight: 38, letterSpacing: -1.26, color: palette.cream },
  description: { fontSize: 15, lineHeight: 24, color: palette.secondaryText, maxWidth: 320 },
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
