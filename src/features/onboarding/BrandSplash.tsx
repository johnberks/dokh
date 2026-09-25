import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingIntroMetrics as m, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { BrandBackdrop } from './BrandBackdrop';

const UNIT = m.symbolSize / 120; // o símbolo do Brand Kit é desenhado em 120×120
const SURFACE = 62 * UNIT;
const OFFSET = 30 * UNIT;
const INTERSECTION = 32 * UNIT;
const CORNER = 10 * UNIT;

/** Símbolo (620 ms) + assinatura (420 ms, com atraso) + leitura: ~1,4 s no total. */
export const SPLASH_DURATION = m.splashWordmarkDelay + m.splashWordmark + m.splashHold;

type Props = {
  /** Chamado quando a assinatura termina; a tela seguinte entra sozinha. */
  onFinish: () => void;
  testID?: string;
};

/**
 * Splash 00B: as duas superfícies se aproximam até formar a interseção bronze e a
 * assinatura aparece em seguida. Com "Reduzir movimento" tudo aparece montado, mantendo
 * o mesmo tempo de leitura.
 */
export function BrandSplash({ onFinish, testID }: Props) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const symbol = useSharedValue(reduced ? 1 : 0);
  const wordmark = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      symbol.value = withTiming(1, {
        duration: m.splashSymbol,
        easing: Easing.out(Easing.cubic),
      });
      wordmark.value = withDelay(
        m.splashWordmarkDelay,
        withTiming(1, { duration: m.splashWordmark, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      symbol.value = withTiming(1, { duration: motion.instant });
      wordmark.value = withTiming(1, { duration: motion.instant });
    }
    const timer = setTimeout(onFinish, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [onFinish, reduced, symbol, wordmark]);

  const back = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(1 - symbol.value) * m.splashApproach },
      { translateY: -(1 - symbol.value) * m.splashApproach },
    ],
  }));
  const front = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - symbol.value) * m.splashApproach },
      { translateY: (1 - symbol.value) * m.splashApproach },
    ],
  }));
  const intersection = useAnimatedStyle(() => ({ opacity: symbol.value }));
  const signature = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: (1 - wordmark.value) * m.splashWordmarkRise }],
  }));

  return (
    <View style={styles.screen} testID={testID}>
      <BrandBackdrop variant="splash" />
      <View accessible accessibilityRole="image" accessibilityLabel={t('welcome.splash.label')}>
        <View style={styles.symbol}>
          <Animated.View style={[styles.surface, styles.cream, back]} />
          <Animated.View style={[styles.surface, styles.sage, front]} />
          <Animated.View style={[styles.intersection, intersection]} />
        </View>
      </View>
      <Animated.View style={signature}>
        <AppText style={[type.wordmark, styles.wordmark]}>{t('welcome.splash.label')}</AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.symbolWordmarkGap,
    backgroundColor: palette.base,
  },
  symbol: { width: m.symbolSize, height: m.symbolSize },
  surface: { position: 'absolute', width: SURFACE, height: SURFACE, borderRadius: CORNER },
  cream: { left: 14 * UNIT, top: 14 * UNIT, backgroundColor: palette.cream },
  sage: { left: 14 * UNIT + OFFSET, top: 14 * UNIT + OFFSET, backgroundColor: palette.sage },
  intersection: {
    position: 'absolute',
    left: 44 * UNIT,
    top: 44 * UNIT,
    width: INTERSECTION,
    height: INTERSECTION,
    backgroundColor: palette.bronze,
  },
  wordmark: {
    fontSize: m.splashWordmarkSize,
    lineHeight: m.splashWordmarkSize,
    color: palette.cream,
  },
});
