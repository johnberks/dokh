import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import {
  onboardingIntroMetrics as intro,
  onboardingProfileMetrics as m,
  palette,
} from '@/theme/tokens';

/** Tela 06: estado zero, só símbolo e convite para começar. */
export function OnboardingIntroScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 22, paddingBottom: Math.max(insets.bottom, 24) + 20 },
      ]}
      testID="onboarding-intro"
    >
      <StatusBar style="light" />
      <View style={styles.wordmark}>
        <BrandMark light size={22} />
        <AppText style={[type.wordmark, styles.wordmarkText]}>{t('welcome.splash.label')}</AppText>
      </View>

      <View style={styles.symbol}>
        <BrandMark light size={intro.symbolSize} />
      </View>

      <View style={styles.footer}>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" style={[type.heading1, styles.title]}>
            {t('profile.intro.title')}
          </AppText>
          <AppText style={styles.description}>{t('profile.intro.description')}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.intro.cta')}
          onPress={() => router.push('/name')}
          testID="onboarding-intro-cta"
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <AppText style={[type.heading1, styles.ctaLabel]}>{t('profile.intro.cta')}</AppText>
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
  symbol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
