import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { useBrandTypography } from '@/theme/BrandFontProvider';
import { haptic } from '@/theme/haptics';
import { motionDuration } from '@/theme/motion';
import { colors, palette } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';

export type SavePhase = 'idle' | 'saving' | 'saved';

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Comprimento do traço do check (viewBox 24): desenhado de 0 a 100%. */
const CHECK_LENGTH = 22;
/** Deslocamento vertical de cada estado ao entrar e sair. */
const SHIFT = 10;
const DISABLED_BACKGROUND = 'rgba(16,22,15,0.18)';

/**
 * "Salvar trabalho" com a troca de estado dentro do próprio botão (referência Shazam, Mobbin):
 * toque afunda com mola, "Salvando…" entra com spinner e, ao gravar, o botão fica verde DOKH,
 * desenha o check e mostra "Trabalho salvo". Nada para tocar depois: a tela segue sozinha.
 * A vibração de sucesso sai no instante em que o botão fica verde.
 */
export function SaveWorkButton({
  label,
  savingLabel,
  savedLabel,
  phase,
  disabled,
  onPress,
  testID,
}: {
  label: string;
  savingLabel: string;
  savedLabel: string;
  phase: SavePhase;
  disabled: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const type = useBrandTypography();
  const reduced = useReducedMotion();
  const morph = motionDuration('saveMorph', reduced);
  const easing = Easing.out(Easing.cubic);

  const enabled = useSharedValue(disabled ? 0 : 1);
  const saved = useSharedValue(phase === 'saved' ? 1 : 0);
  const scale = useSharedValue(1);
  const idle = useSharedValue(phase === 'idle' ? 1 : 0);
  const saving = useSharedValue(phase === 'saving' ? 1 : 0);
  const check = useSharedValue(phase === 'saved' ? 1 : 0);

  useEffect(() => {
    enabled.value = withTiming(disabled ? 0 : 1, { duration: morph, easing });
  }, [disabled, enabled, morph, easing]);

  // Só na passagem para "salvo": remontar já salvo não vibra de novo.
  const previous = useRef(phase);
  useEffect(() => {
    if (phase === 'saved' && previous.current !== 'saved') haptic('success');
    previous.current = phase;
  }, [phase]);

  useEffect(() => {
    idle.value = withTiming(phase === 'idle' ? 1 : 0, { duration: morph, easing });
    saving.value = withTiming(phase === 'saving' ? 1 : 0, { duration: morph, easing });
    saved.value = withTiming(phase === 'saved' ? 1 : 0, { duration: morph, easing });
    check.value =
      phase === 'saved'
        ? withDelay(
            morph / 2,
            withTiming(1, { duration: motionDuration('saveCheck', reduced), easing }),
          )
        : 0;
    // O "sucesso" dá um pequeno pulso, como a confirmação das referências.
    if (phase === 'saved' && !reduced) {
      scale.value = withSpring(1.03, { damping: 12, stiffness: 320 }, () => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      });
    }
  }, [phase, idle, saving, saved, check, scale, morph, easing, reduced]);

  const container = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor:
      saved.value > 0
        ? interpolateColor(saved.value, [0, 1], [colors.foreground, palette.structure])
        : interpolateColor(enabled.value, [0, 1], [DISABLED_BACKGROUND, colors.foreground]),
  }));
  // Cada estado entra por baixo e sai por cima, como um contador.
  const idleStyle = useAnimatedStyle(() => ({
    opacity: idle.value,
    transform: [{ translateY: -(1 - idle.value) * SHIFT }],
  }));
  const savingStyle = useAnimatedStyle(() => ({
    opacity: saving.value,
    transform: [{ translateY: (1 - saving.value) * (saved.value > 0 ? -SHIFT : SHIFT) }],
  }));
  const savedStyle = useAnimatedStyle(() => ({
    opacity: saved.value,
    transform: [{ translateY: (1 - saved.value) * SHIFT }],
  }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - check.value),
  }));

  const blocked = disabled || phase !== 'idle';
  const accessibleLabel = phase === 'saved' ? savedLabel : phase === 'saving' ? savingLabel : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibleLabel}
      accessibilityState={{ disabled: blocked, busy: phase === 'saving' }}
      accessibilityLiveRegion="polite"
      disabled={blocked}
      onPress={onPress}
      onPressIn={() => {
        if (!reduced) scale.value = withSpring(0.97, { damping: 18, stiffness: 400 });
      }}
      onPressOut={() => {
        if (phase === 'idle') scale.value = withSpring(1, { damping: 14, stiffness: 300 });
      }}
      testID={testID}
    >
      <Animated.View style={[styles.button, container]}>
        <Animated.View style={[styles.layer, idleStyle]} pointerEvents="none">
          <AppText style={[type.heading1, styles.label]}>{label}</AppText>
        </Animated.View>
        <Animated.View style={[styles.layer, savingStyle]} pointerEvents="none">
          {phase === 'saving' && <ActivityIndicator color={palette.cream} />}
          <AppText style={[type.heading1, styles.label]}>{savingLabel}</AppText>
        </Animated.View>
        <Animated.View
          style={[styles.layer, savedStyle]}
          pointerEvents="none"
          testID={testID ? `${testID}-saved` : undefined}
        >
          <View style={styles.checkBadge}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
              <AnimatedPath
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke={palette.structure}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_LENGTH}
                animatedProps={checkProps}
              />
            </Svg>
          </View>
          <AppText style={[type.heading1, styles.label]}>{savedLabel}</AppText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 16, overflow: 'hidden' },
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { fontSize: 16, lineHeight: 20, letterSpacing: 0, color: palette.cream },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
