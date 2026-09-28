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

const LETTERS = 3; // D-O-K-H: a última letra entra 3 intervalos depois da primeira

/** Símbolo + interseção + letras em cascata + leitura + saída: ~1,65 s no total. */
export const SPLASH_DURATION =
  m.splashWordmarkDelay +
  LETTERS * m.splashLetterStagger +
  m.splashWordmark +
  m.splashHold +
  m.splashExit;

type Props = {
  /** Chamado quando a saída termina; a tela seguinte entra sozinha. */
  onFinish: () => void;
  testID?: string;
};

function Letter({ letter, index, style }: { letter: string; index: number; style: object }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      progress.value = withTiming(1, { duration: motion.instant });
      return;
    }
    progress.value = withDelay(
      m.splashWordmarkDelay + index * m.splashLetterStagger,
      withTiming(1, { duration: m.splashWordmark, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, progress, reduced]);
  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * m.splashWordmarkRise * 1.6 }],
  }));
  return (
    <Animated.View style={animated}>
      <AppText style={style}>{letter}</AppText>
    </Animated.View>
  );
}

/**
 * Splash 00B (referências da Mobbin: Revolut, Cash App, Monzo — marca que se monta antes do
 * app): o símbolo cresce enquanto as duas superfícies se aproximam, a interseção bronze estala
 * no encontro, as letras de DOKH sobem uma a uma e o splash sai com fade e leve crescimento.
 * Com "Reduzir movimento" tudo aparece montado, mantendo o mesmo tempo de leitura.
 */
export function BrandSplash({ onFinish, testID }: Props) {
  const { t } = useTranslation('onboarding');
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const symbol = useSharedValue(reduced ? 1 : 0);
  const pop = useSharedValue(reduced ? 1 : 0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!reduced) {
      symbol.value = withTiming(1, {
        duration: m.splashSymbol,
        easing: Easing.out(Easing.cubic),
      });
      // Estala perto do fim da aproximação, com um leve passo além do tamanho final.
      pop.value = withDelay(
        m.splashSymbol * 0.6,
        withTiming(1, { duration: m.splashPop, easing: Easing.out(Easing.back(2.2)) }),
      );
      exit.value = withDelay(
        SPLASH_DURATION - m.splashExit,
        withTiming(1, { duration: m.splashExit, easing: Easing.in(Easing.cubic) }),
      );
    } else {
      symbol.value = withTiming(1, { duration: motion.instant });
      pop.value = withTiming(1, { duration: motion.instant });
    }
    const timer = setTimeout(onFinish, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [exit, onFinish, pop, reduced, symbol]);

  const whole = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 + exit.value * 0.04 }],
  }));
  const grow = useAnimatedStyle(() => ({
    opacity: Math.min(1, symbol.value * 2),
    transform: [{ scale: m.splashSymbolScale + (1 - m.splashSymbolScale) * symbol.value }],
  }));
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
  const intersection = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value),
    transform: [{ scale: pop.value }],
  }));

  const label = t('welcome.splash.label');
  return (
    <View style={styles.screen} testID={testID}>
      <BrandBackdrop variant="splash" />
      <Animated.View style={[styles.center, whole]}>
        <View accessible accessibilityRole="image" accessibilityLabel={label}>
          <Animated.View style={[styles.symbol, grow]}>
            <Animated.View style={[styles.surface, styles.cream, back]} />
            <Animated.View style={[styles.surface, styles.sage, front]} />
            <Animated.View style={[styles.intersection, intersection]} />
          </Animated.View>
        </View>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.letters}
        >
          {[...label].map((letter, index) => (
            <Letter
              // biome-ignore lint/suspicious/noArrayIndexKey: a marca é fixa.
              key={index}
              letter={letter}
              index={index}
              style={[type.wordmark, styles.wordmark]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.base,
  },
  center: { alignItems: 'center', gap: m.symbolWordmarkGap },
  letters: { flexDirection: 'row' },
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
