import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration } from '@/theme/motion';
import { colors } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

export function HeroBar({
  height,
  width,
  current = false,
  active = true,
  testID,
}: {
  height: number;
  width: number;
  current?: boolean;
  active?: boolean;
  testID?: string;
}) {
  const reduced = useReducedMotion();
  const animatedHeight = useSharedValue(0);
  useEffect(() => {
    animatedHeight.value = withTiming(active ? height : 0, {
      duration: motionDuration('heroBar', reduced),
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [animatedHeight, height, reduced, active]);
  const barStyle = useAnimatedStyle(() => ({ height: animatedHeight.value }));
  return (
    <View style={[styles.track, { height, width }]}>
      <Animated.View
        testID={testID}
        style={[styles.bar, current ? styles.current : styles.past, barStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { justifyContent: 'flex-end' },
  bar: { width: '100%' },
  current: { backgroundColor: colors.accent },
  past: { backgroundColor: colors.darkTextSecondary },
});
