import { type ReactNode, useEffect } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration } from '@/theme/motion';
import { motion } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { AppText } from './AppText';

/** Subida curta padrão da cascata; nunca desloca o layout, só o desenho. */
const RISE = 16;

function useRevealStyle(delay: number, rise: number, scaleFrom: number) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    // "Reduzir movimento": tudo aparece montado, na hora (D11).
    progress.value = reduced
      ? withTiming(1, { duration: motion.instant })
      : withDelay(
          delay,
          withTiming(1, {
            duration: motionDuration('reveal', false),
            easing: Easing.out(Easing.cubic),
          }),
        );
  }, [delay, progress, reduced]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * rise },
      { scale: scaleFrom + (1 - scaleFrom) * progress.value },
    ],
  }));
}

/**
 * Entrada em cascata (referências da Mobbin: Buddy, Duolingo, Jomo): o item surge com fade e
 * uma subida curta depois de `delay` ms. Use `step(n)` para montar a sequência da tela.
 */
export function Reveal({
  children,
  delay = 0,
  rise = RISE,
  scaleFrom = 1,
  style,
  testID,
}: {
  children: ReactNode;
  delay?: number;
  rise?: number;
  /** Escala inicial (ex.: 0.94 para cards que "assentam" ao entrar). */
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const animated = useRevealStyle(delay, rise, scaleFrom);
  return (
    <Animated.View style={[style, animated]} testID={testID}>
      {children}
    </Animated.View>
  );
}

/** Atraso do n-ésimo item da cascata, a partir de um início opcional. */
export function step(index: number, start = 0): number {
  return start + index * motion.revealStagger;
}

function Word({
  word,
  delay,
  style,
}: {
  word: string;
  delay: number;
  style: StyleProp<TextStyle>;
}) {
  const animated = useRevealStyle(delay, 10, 1);
  return (
    <Animated.View style={animated}>
      <AppText style={style}>{word}</AppText>
    </Animated.View>
  );
}

/**
 * Título que entra palavra por palavra. O leitor de tela lê a frase inteira de uma vez;
 * as palavras animadas ficam escondidas dele. Quebra de linha natural via `flexWrap`.
 */
export function WordReveal({
  text,
  style,
  delay = 0,
  stagger = motion.revealStagger / 2,
  testID,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  delay?: number;
  stagger?: number;
  testID?: string;
}) {
  const words = text.split(/\s+/u).filter(Boolean);
  const flat = StyleSheet.flatten(style) ?? {};
  // Espaço entre palavras no tamanho da fonte: o mesmo respiro de um texto corrido.
  const gap = (flat.fontSize ?? 16) * 0.26;
  const { marginTop, marginBottom, marginHorizontal, marginLeft, marginRight, ...textStyle } = flat;
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={text}
      style={[
        styles.words,
        { columnGap: gap, marginTop, marginBottom, marginHorizontal, marginLeft, marginRight },
      ]}
      testID={testID}
    >
      {words.map((word, index) => (
        <Word
          // Palavras repetidas continuam únicas pela posição.
          // biome-ignore lint/suspicious/noArrayIndexKey: a frase é fixa durante a animação.
          key={`${index}-${word}`}
          word={word}
          delay={delay + index * stagger}
          style={textStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  words: { flexDirection: 'row', flexWrap: 'wrap' },
});
