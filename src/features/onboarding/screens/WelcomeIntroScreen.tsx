import { router } from 'expo-router';
import { type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { motionDuration } from '@/theme/motion';
import { colors, onboardingIntroMetrics as m, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { EarningsSlideArt } from '../art/EarningsSlideArt';
import { EntriesSlideArt } from '../art/EntriesSlideArt';
import { WorkSlideArt } from '../art/WorkSlideArt';
import { BrandSplash } from '../BrandSplash';
import { useIntroState } from '../intro-state';
import { pageAfterSwipe } from '../swipe';

type SlideKey = 'work' | 'entries' | 'earnings';
const SLIDES: readonly { key: SlideKey; art: ReactNode }[] = [
  { key: 'work', art: <WorkSlideArt /> },
  { key: 'entries', art: <EntriesSlideArt /> },
  { key: 'earnings', art: <EarningsSlideArt /> },
];

/** Destino de `Pular` e `Começar`: a composição da tela 04 pertence à 7.2. */
const ACCOUNT_ROUTE = '/sign-up' as const;

/**
 * Splash 00B e carrossel 01–03 de `design/onboarding.html`.
 * Apresenta janelas reais do produto: não coleta nem altera dados.
 */
export function WelcomeIntroScreen() {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { width } = useWindowDimensions();
  const markSeen = useIntroState((state) => state.markSeen);

  const [showSplash, setShowSplash] = useState(true);
  const [page, setPage] = useState(0);
  const offset = useSharedValue(0);

  const goToAccount = useCallback(() => {
    markSeen();
    router.replace(ACCOUNT_ROUTE);
  }, [markSeen]);

  const goToPage = useCallback(
    (next: number) => {
      if (next < 0 || next >= SLIDES.length) return;
      setPage(next);
      offset.value = withTiming(-next * width, {
        duration: motionDuration('heroPage', reduced),
        easing: Easing.out(Easing.cubic),
      });
    },
    [offset, reduced, width],
  );

  const advance = useCallback(() => {
    if (page === SLIDES.length - 1) goToAccount();
    else goToPage(page + 1);
  }, [goToAccount, goToPage, page]);

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onEnd((event) => {
          goToPage(pageAfterSwipe(page, event.translationX, SLIDES.length));
        }),
    [goToPage, page],
  );

  const track = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  if (showSplash)
    return <BrandSplash onFinish={() => setShowSplash(false)} testID="intro-splash" />;

  const isLast = page === SLIDES.length - 1;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="intro-carousel">
      <View style={styles.header}>
        <View accessible accessibilityRole="image" accessibilityLabel={t('welcome.splash.label')}>
          <View style={styles.wordmark}>
            <BrandMark size={22} />
            <AppText style={[type.wordmark, styles.wordmarkText]}>
              {t('welcome.splash.label')}
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('welcome.skip')}
          onPress={goToAccount}
          testID="intro-skip"
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
        >
          <AppText variant="heading2" style={styles.skipLabel}>
            {t('welcome.skip')}
          </AppText>
        </Pressable>
      </View>

      <GestureDetector gesture={swipe}>
        <Animated.View style={[styles.track, { width: width * SLIDES.length }, track]}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              accessibilityElementsHidden={index !== page}
              importantForAccessibility={index === page ? 'auto' : 'no-hide-descendants'}
              style={[styles.slide, { width }]}
            >
              <View style={styles.heading}>
                <AppText
                  accessibilityRole="header"
                  variant="heading1"
                  style={[styles.title, slide.key === 'work' && styles.workTitle]}
                >
                  {t(`welcome.slides.${slide.key}.title`)}
                </AppText>
                <AppText style={styles.description}>
                  {t(`welcome.slides.${slide.key}.description`)}
                </AppText>
              </View>
              <View
                accessible
                accessibilityLabel={t(`welcome.slides.${slide.key}.art`)}
                style={styles.art}
              >
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {slide.art}
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(m.footerPaddingBottom, insets.bottom + 16) },
        ]}
      >
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('welcome.pagination', { current: page + 1, total: SLIDES.length })}
          style={styles.dots}
          testID="intro-dots"
        >
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              testID={index === page ? 'intro-dot-active' : undefined}
              style={[styles.dot, index === page && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('welcome.start') : t('welcome.continue')}
          onPress={advance}
          testID="intro-advance"
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <AppText variant="heading1" style={styles.ctaLabel}>
            {isLast ? t('welcome.start') : t('welcome.continue')}
          </AppText>
          <AppText accessible={false} variant="heading1" style={styles.ctaArrow}>
            {'→'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: m.headerPaddingTop,
    paddingHorizontal: m.horizontalPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkText: { fontSize: 12, lineHeight: 14, color: colors.textPrimary },
  skip: { minHeight: 44, justifyContent: 'center' },
  skipLabel: { fontSize: 14, lineHeight: 18, letterSpacing: 0, color: palette.sage },
  track: { flex: 1, flexDirection: 'row' },
  slide: { flex: 1 },
  heading: {
    paddingTop: m.headingPaddingTop,
    paddingHorizontal: m.horizontalPadding,
    gap: m.headingGap,
  },
  title: {
    fontSize: m.slideTitleSize,
    lineHeight: m.slideTitleLineHeight,
    letterSpacing: m.slideTitleTracking,
    color: colors.textPrimary,
  },
  workTitle: { fontSize: m.workTitleSize, lineHeight: m.workTitleLineHeight },
  description: {
    fontSize: m.slideBodySize,
    lineHeight: m.slideBodyLineHeight,
    color: colors.textMuted,
  },
  art: { flex: 1, marginTop: m.artMarginTop, marginHorizontal: m.horizontalPadding },
  footer: {
    paddingTop: m.footerPaddingTop,
    paddingHorizontal: m.horizontalPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: m.dotGap,
  },
  dots: { flexDirection: 'row', gap: m.dotGap, alignItems: 'center' },
  dot: {
    width: m.dotSize,
    height: m.dotSize,
    borderRadius: m.dotSize / 2,
    backgroundColor: colors.foreground,
    opacity: 0.2,
  },
  dotActive: { width: m.dotActiveWidth, backgroundColor: palette.bronze, opacity: 1 },
  cta: {
    minHeight: m.ctaHeight,
    paddingHorizontal: m.ctaPaddingHorizontal,
    borderRadius: m.ctaRadius,
    backgroundColor: colors.foreground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaLabel: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.darkTextPrimary },
  ctaArrow: { fontSize: 18, lineHeight: 20, color: colors.darkTextPrimary },
  pressed: { opacity: 0.72 },
});
