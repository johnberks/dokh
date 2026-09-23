import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration } from '@/theme/motion';
import { colors, spacing } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

export type HeroCarouselPage = {
  id: string;
  accessibilityLabel: string;
  content: ReactNode;
};

export type HeroCarouselProps = {
  pages: readonly [HeroCarouselPage] | readonly [HeroCarouselPage, HeroCarouselPage];
  /** Fixed page height: switching between month and history never moves the cream body. */
  height: number;
  onPageChange?: (page: number) => void;
  testID?: string;
};

/** Home's two-page hero. Horizontal gestures fail early on vertical movement for page scrolling. */
export function HeroCarousel({ pages, height, onPageChange, testID }: HeroCarouselProps) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (selected >= pages.length) {
      setSelected(0);
      onPageChange?.(0);
    }
  }, [pages.length, selected, onPageChange]);

  function selectPage(page: number) {
    if (page === selected || page >= pages.length) return;
    setSelected(page);
    onPageChange?.(page);
  }

  useEffect(() => {
    offset.value = withTiming(-selected * width, {
      duration: motionDuration('heroPage', reduced),
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [offset, selected, width, reduced]);

  const trackStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(pages.length > 1)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onEnd((event) => {
      if (event.translationX < -40 || event.velocityX < -500) selectPage(1);
      if (event.translationX > 40 || event.velocityX > 500) selectPage(0);
    });

  return (
    <View
      testID={testID}
      style={[styles.viewport, { height }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.track, trackStyle]}>
          {pages.map((page, index) => (
            <View
              key={page.id}
              style={{ width, height }}
              accessibilityElementsHidden={index !== selected}
              importantForAccessibility={index === selected ? 'auto' : 'no-hide-descendants'}
            >
              {page.content}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
      {pages.length > 1 && (
        <View style={styles.pagination}>
          {pages.map((page, index) => (
            <Pressable
              key={page.id}
              accessibilityRole="button"
              accessibilityLabel={page.accessibilityLabel}
              accessibilityState={{ selected: selected === index }}
              onPress={() => selectPage(index)}
              hitSlop={spacing.base}
              style={styles.pageTarget}
              testID={`hero-page-${index}`}
            >
              <View style={[styles.dot, selected === index && styles.dotSelected]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden', backgroundColor: colors.darkBackground },
  track: { flexDirection: 'row' },
  pagination: {
    position: 'absolute',
    bottom: spacing.base,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pageTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.darkTextSecondary },
  dotSelected: { backgroundColor: colors.accent },
});
