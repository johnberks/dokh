import { type ReactNode, useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration } from '@/theme/motion';
import { useReducedMotion } from '@/theme/useReducedMotion';

/** Distância curta: o conteúdo desliza e aparece, sem atravessar a tela inteira. */
export const SLIDE_DISTANCE = 32;

export type SlideFrom = 'left' | 'right' | null;

/**
 * Desliza o conteúdo a cada troca de `slideKey`, vindo do lado de `from` (`null` = sem
 * animação, ex.: primeira entrada na aba). "Reduzir movimento" troca na hora (D11).
 */
export function SlideIn({
  slideKey,
  from,
  children,
  style,
  testID,
}: {
  slideKey: number;
  from: SlideFrom;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const reduced = useReducedMotion();
  const offset = useSharedValue(0);
  const opacity = useSharedValue(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a animação recomeça só quando a chave muda.
  useEffect(() => {
    if (from === null || reduced) return;
    const duration = motionDuration('slide', reduced);
    const easing = Easing.out(Easing.cubic);
    offset.value = from === 'right' ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
    opacity.value = 0;
    offset.value = withTiming(0, { duration, easing });
    opacity.value = withTiming(1, { duration, easing });
  }, [slideKey]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Animated.View style={[style, animated]} testID={testID}>
      {children}
    </Animated.View>
  );
}
