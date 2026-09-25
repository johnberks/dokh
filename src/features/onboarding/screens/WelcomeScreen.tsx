import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { legalUrls } from '@/config/legal';
import { AuthAction, AuthWordmark, SocialChoices } from '@/features/auth/AuthVisuals';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { colors, onboardingIntroMetrics as m, palette } from '@/theme/tokens';
import { AccountPreview } from '../AccountPreview';
import { BrandSplash } from '../BrandSplash';

/**
 * Mesma família, tamanho e cor do restante da frase; só o peso muda.
 * O toque existe apenas quando a URL estiver configurada (P04).
 */
function LegalLink({ label, url }: { label: string; url: string | null }) {
  const type = useBrandTypography();
  // Só tipografia: o padding pertence ao parágrafo, não ao trecho embutido.
  const style = [styles.legalInline, { fontFamily: type.label.fontFamily }];
  if (!url) return <AppText style={style}>{label}</AppText>;
  return (
    <AppText
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      style={style}
    >
      {label}
    </AppText>
  );
}

/**
 * Splash 00B seguido da tela 04 (Criar conta) de `design/onboarding.html`.
 * Depois do splash existe só esta tela: e-mail leva ao cadastro e `Entrar` ao login.
 */
export function WelcomeScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash)
    return <BrandSplash onFinish={() => setShowSplash(false)} testID="intro-splash" />;

  return (
    // Tela estática: nada rola. A prévia encolhe para caber no espaço que sobra.
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + m.headerPaddingTop, paddingBottom: Math.max(insets.bottom, 24) },
      ]}
      testID="welcome-account"
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <AuthWordmark />
      </View>

      <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
        {t('welcome.account.headline')}
      </AppText>

      <View style={styles.preview}>
        <AccountPreview />
      </View>

      <View style={styles.actions}>
        <SocialChoices />
        <AuthAction label={t('welcome.account.email')} onPress={() => router.push('/sign-up')} />
        <View style={styles.signInRow}>
          <AppText style={styles.signInPrompt}>{t('welcome.account.hasAccount')}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('welcome.account.signIn')}
            onPress={() => router.push('/sign-in')}
            hitSlop={8}
            testID="welcome-sign-in"
          >
            <AppText style={[type.heading1, styles.signInLink]}>
              {t('welcome.account.signIn')}
            </AppText>
          </Pressable>
        </View>
      </View>

      <AppText style={styles.legal}>
        {t('welcome.account.legalBefore')}
        <LegalLink label={t('welcome.account.terms')} url={legalUrls.terms} />
        {t('welcome.account.legalBetween')}
        <LegalLink label={t('welcome.account.privacy')} url={legalUrls.privacy} />
        {t('welcome.account.legalAfter')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: m.horizontalPadding },
  title: {
    marginTop: 32,
    marginHorizontal: m.horizontalPadding,
    fontSize: m.slideTitleSize,
    lineHeight: m.slideTitleLineHeight,
    letterSpacing: m.slideTitleTracking,
    color: colors.textPrimary,
  },
  // Ocupa o espaço livre entre o título e os botões; a prévia se ajusta a ele.
  preview: { flex: 1, marginTop: 24, marginHorizontal: m.horizontalPadding },
  actions: { paddingTop: 20, paddingHorizontal: m.horizontalPadding, gap: 10 },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  signInPrompt: { fontSize: 14, lineHeight: 18, color: colors.textMuted },
  signInLink: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: colors.textPrimary },
  legal: {
    paddingTop: 14,
    paddingHorizontal: m.horizontalPadding,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
    color: palette.sage,
  },
  // Sem sublinhado e sem mudança de tamanho: o destaque é só o peso da fonte.
  legalInline: { fontSize: 11, lineHeight: 18, color: palette.sage, fontWeight: '600' },
});
