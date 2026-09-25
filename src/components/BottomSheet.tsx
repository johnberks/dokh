import { type ReactNode, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { colors, bottomSheetMetrics as m, motion, shadow, spacing } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

export type BottomSheetProps = {
  open: boolean;
  /** Único caminho de fechamento: fundo, alça, arraste, voltar do Android e gesto de escape do VoiceOver. */
  onClose: () => void;
  /** Nome da folha para leitor de tela (normalmente o título visível). */
  accessibilityLabel: string;
  /** `standard`: Agenda 08–14 e Finanças. `menu`: Agenda 06B. */
  variant?: 'standard' | 'menu';
  children: ReactNode;
  testID?: string;
};

/**
 * Folha inferior controlada (D17): o estado `open` pertence à tela; nada fica "preso" dentro dela.
 * Anima com Reanimated e respeita "Reduzir movimento" (D11) — o motion completo é a tarefa 2.7.
 */
export function BottomSheet({
  open,
  onClose,
  accessibilityLabel,
  variant = 'standard',
  children,
  testID,
}: BottomSheetProps) {
  const { t } = useTranslation('components');
  // Contexto em vez do hook: fora de um SafeAreaProvider (ex.: catálogo isolado) usa margem zero.
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0 };
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const isMenu = variant === 'menu';

  // Mantém o Modal montado até a animação de saída terminar.
  const [mounted, setMounted] = useState(open);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      drag.value = 0;
      progress.value = withTiming(1, {
        duration: reduceMotion ? motion.instant : motion.enter,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    progress.value = withTiming(0, { duration: reduceMotion ? motion.instant : motion.exit });
    const timer = setTimeout(() => setMounted(false), reduceMotion ? 0 : motion.exit);
    return () => clearTimeout(timer);
  }, [open, reduceMotion, progress, drag]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY(8)
    .onUpdate((event) => {
      drag.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldClose =
        drag.value > sheetHeight * m.dismissRatio || event.velocityY > m.dismissVelocity;
      if (shouldClose) {
        onClose();
      } else {
        drag.value = withTiming(0, { duration: reduceMotion ? motion.instant : motion.feedback });
      }
    });

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * sheetHeight + drag.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      testID={testID}
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isMenu ? colors.sheetMenuScrim : colors.sheetScrim },
            scrimStyle,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('sheet.close')}
            onPress={onClose}
            testID={testID ? `${testID}-scrim` : undefined}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            onAccessibilityEscape={onClose}
            onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
            testID={testID ? `${testID}-panel` : undefined}
            style={[
              styles.sheet,
              isMenu ? styles.sheetMenu : styles.sheetStandard,
              {
                paddingBottom: Math.max(
                  isMenu ? m.menuPaddingBottom : m.paddingBottom,
                  insets.bottom + spacing.base,
                ),
                maxHeight: windowHeight - insets.top - spacing.xxl,
              },
              sheetStyle,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('sheet.close')}
              accessibilityHint={t('sheet.closeHint')}
              onPress={onClose}
              hitSlop={spacing.sm}
              testID={testID ? `${testID}-handle` : undefined}
              style={styles.handleTarget}
            >
              <View
                style={[
                  styles.handle,
                  isMenu
                    ? { width: m.menuHandleWidth, backgroundColor: colors.sheetMenuHandle }
                    : { width: m.handleWidth, backgroundColor: colors.sheetHandle },
                ]}
              />
            </Pressable>
            <View style={{ gap: isMenu ? m.menuGap : m.standardGap }}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    paddingTop: m.paddingTop,
    paddingHorizontal: m.paddingHorizontal,
  },
  sheetStandard: {
    borderTopLeftRadius: m.standardRadius,
    borderTopRightRadius: m.standardRadius,
    ...shadow.sheet,
  },
  sheetMenu: {
    borderTopLeftRadius: m.menuRadius,
    borderTopRightRadius: m.menuRadius,
    ...shadow.sheetMenu,
  },
  // A alça visível tem 4 de altura. O alvo (28 + hitSlop de 8 em cima e embaixo = 44) fica
  // centrado nela; a margem negativa preserva o espaçamento visual do HTML.
  handleTarget: {
    alignSelf: 'center',
    minWidth: m.handleHitTarget,
    minHeight: m.handleHitTarget - 2 * spacing.sm,
    marginVertical: -(m.handleHitTarget - 2 * spacing.sm - m.handleHeight) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: { height: m.handleHeight, borderRadius: m.handleHeight / 2 },
});
