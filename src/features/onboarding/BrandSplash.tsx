import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { onboardingIntroMetrics as m, motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

const UNIT = m.symbolSize / 120; // o símbolo do Brand Kit é desenhado em 120×120
const SURFACE = 62 * UNIT;
const OFFSET = 30 * UNIT;
const INTERSECTION = 32 * UNIT;
const CORNER = 10 * UNIT;

type Props = {
  /** Chamado quando a assinatura termina de se formar; a transição para o slide 1 é automática. */
  onFinish: () => void;
  testID?: string;
};

/**
 * Splash 00B: as duas superfícies se aproximam até formar a interseção bronze.
 * Com "Reduzir movimento" a assinatura já aparece montada e o tempo de leitura é preservado.
 */
export function BrandSplash({ onFinish, testID }: Props) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    const duration = reduced ? motion.instant : motion.heroPage;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    const timer = setTimeout(onFinish, duration + m.splashHold);
    return () => clearTimeout(timer);
  }, [onFinish, progress, reduced]);

  const back = useAnimatedStyle(() => ({
    transform: [
      { translateX: -(1 - progress.value) * m.splashApproach },
      { translateY: -(1 - progress.value) * m.splashApproach },
    ],
  }));
  const front = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - progress.value) * m.splashApproach },
      { translateY: (1 - progress.value) * m.splashApproach },
    ],
  }));
  const intersection = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={styles.screen} testID={testID}>
      <View accessible accessibilityRole="image" accessibilityLabel={t('welcome.splash.label')}>
        <View style={styles.symbol}>
          <Animated.View style={[styles.surface, styles.cream, back]} />
          <Animated.View style={[styles.surface, styles.sage, front]} />
          <Animated.View style={[styles.intersection, intersection]} />
        </View>
      </View>
      <AppText style={[type.wordmark, styles.wordmark]}>{t('welcome.splash.label')}</AppText>
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
