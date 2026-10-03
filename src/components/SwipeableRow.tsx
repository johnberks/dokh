import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { motion, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { AppText } from './AppText';

export type SwipeAction = {
  key: string;
  /** Rótulo curto sob o ícone. */
  label: string;
  /** Frase completa para leitor de tela (padrão: o rótulo). */
  accessibilityLabel?: string;
  icon: (color: string) => ReactNode;
  tone: 'positive' | 'negative';
  onPress: () => void;
  busy?: boolean;
};

/** Largura de cada ação revelada; o card se afasta dela pelo mesmo respiro da lista. */
export const SWIPE_ACTION_WIDTH = 76;
const GAP = 8;
const SPRING = { damping: 22, stiffness: 260, mass: 0.9 };
const TONE = { positive: palette.structure, negative: palette.negative } as const;

/**
 * Linha que desliza para a esquerda e revela ações em blocos arredondados, separados do card
 * (referências da Mobbin: pillowtalk, Chick-fil-A, Notion Mail). Soltar além da metade abre;
 * um toque nas ações as executa. Só uma linha aberta por vez: quem usa controla `open`.
 * Leitor de tela não desliza — as mesmas ações devem ir como `accessibilityActions` do card.
 */
export function SwipeableRow({
  children,
  actions,
  open,
  onOpenChange,
  testID,
}: {
  children: ReactNode;
  actions: readonly SwipeAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testID?: string;
}) {
  const reduced = useReducedMotion();
  const width = actions.length * (SWIPE_ACTION_WIDTH + GAP);
  const offset = useSharedValue(0);
  const start = useSharedValue(0);

  function settle(toOpen: boolean) {
    const target = toOpen ? -width : 0;
    offset.value = reduced
      ? withTiming(target, { duration: motion.instant })
      : withSpring(target, SPRING);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: `settle` só lê o estado atual.
  useEffect(() => {
    settle(open);
  }, [open, width, reduced]);

  /** Além das ações e para a direita, o card resiste como um elástico. */
  function follow(translationX: number): number {
    const next = start.value + translationX;
    if (next > 0) return next * 0.2;
    if (next < -width) return -width + (next + width) * 0.25;
    return next;
  }

  const pan = Gesture.Pan()
    .runOnJS(true)
    .withTestId(testID ? `${testID}-swipe` : 'swipeable-row')
    .enabled(width > 0)
    // Horizontal decide; vertical devolve o gesto para a rolagem da tela.
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onStart(() => {
      start.value = offset.value;
    })
    .onUpdate((event) => {
      offset.value = follow(event.translationX);
    })
    .onEnd((event) => {
      const position = follow(event.translationX);
      const toOpen = event.velocityX < -500 || (event.velocityX <= 500 && position < -width / 2);
      settle(toOpen);
      if (toOpen !== open) onOpenChange(toOpen);
    });

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View testID={testID}>
      <View
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        pointerEvents={open ? 'box-none' : 'none'}
        style={[styles.actions, { width: width - GAP }]}
        testID={testID ? `${testID}-actions` : undefined}
      >
        {actions.map((action, index) => (
          <ActionTile
            key={action.key}
            action={action}
            // A ação mais à direita aparece primeiro: é a área que o card descobre antes.
            order={actions.length - 1 - index}
            count={actions.length}
            offset={offset}
            width={width}
            testID={testID ? `${testID}-action-${action.key}` : undefined}
          />
        ))}
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

function ActionTile({
  action,
  order,
  count,
  offset,
  width,
  testID,
}: {
  action: SwipeAction;
  order: number;
  count: number;
  offset: SharedValue<number>;
  width: number;
  testID?: string;
}) {
  const type = useBrandTypography();
  const style = useAnimatedStyle(() => {
    const progress = Math.min(Math.max(-offset.value / width, 0), 1);
    const from = (order / count) * 0.45;
    const shown = interpolate(progress, [from, from + 0.55], [0, 1], Extrapolation.CLAMP);
    return { opacity: shown, transform: [{ scale: 0.72 + 0.28 * shown }] };
  });

  return (
    <Animated.View style={[styles.tileBox, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.accessibilityLabel ?? action.label}
        accessibilityState={{ busy: action.busy === true, disabled: action.busy === true }}
        disabled={action.busy}
        onPress={action.onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: TONE[action.tone] },
          pressed && styles.pressed,
        ]}
      >
        {action.busy ? <ActivityIndicator color={palette.cream} /> : action.icon(palette.cream)}
        <AppText numberOfLines={1} style={[type.heading1, styles.tileLabel]}>
          {action.label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: GAP,
  },
  tileBox: { width: SWIPE_ACTION_WIDTH },
  tile: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  tileLabel: { fontSize: 12, lineHeight: 15, letterSpacing: 0, color: palette.cream },
  pressed: { opacity: 0.8 },
});
