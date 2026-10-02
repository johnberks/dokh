import { forwardRef, type ReactNode, useImperativeHandle, useRef } from 'react';
import {
  Keyboard,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';

/** Respiro entre o topo do teclado e o botão fixo: um toque só já avança. */
export const KEYBOARD_FOOTER_GAP = 16;
/** Altura do botão principal (56) + respiro + folga: o campo em foco nunca fica atrás dele. */
const FOOTER_CLEARANCE = 56 + KEYBOARD_FOOTER_GAP + 16;

type Props = {
  children: ReactNode;
  /** Botão principal: fica no rodapé e sobe junto com o teclado. */
  footer?: ReactNode;
  /** Espaço inferior com o teclado fechado (área segura + respiro do design). */
  bottomInset: number;
  /**
   * Distância mínima entre o campo em foco e o teclado, além do botão fixo. Use para manter
   * visível o que aparece logo abaixo do campo (sugestões, dica, erro).
   */
  extraOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * `false` congela a tela: nada rola nem sobe com o teclado. Para layouts que cuidam do próprio
   * espaço (busca com título e campo fixos e só a lista rolando).
   */
  autoScroll?: boolean;
  testID?: string;
};

export type KeyboardScreenHandle = {
  /**
   * Rola o mínimo para que o conteúdo até `bottom` (coordenada no conteúdo) fique visível —
   * ex.: uma opção que acabou de se abrir não pode ficar atrás do botão fixo.
   */
  reveal: (bottom: number) => void;
  /** Volta ao topo: usado quando a tela troca para um layout fixo (ex.: busca). */
  scrollToTop: () => void;
};

/**
 * Tela com campos de digitação: o conteúdo rola sozinho até o campo em foco e o botão
 * acompanha o teclado. A pessoa sempre vê o que está digitando ou escolhendo (Onboarding v2).
 * Sem rolagem quando tudo cabe; sem barra de rolagem.
 */
export const KeyboardScreen = forwardRef<KeyboardScreenHandle, Props>(function KeyboardScreen(
  {
    children,
    footer,
    bottomInset,
    extraOffset = 0,
    contentContainerStyle,
    autoScroll = true,
    testID,
  },
  ref,
) {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const viewport = useRef({ height: 0, offset: 0 });

  useImperativeHandle(ref, () => ({
    reveal(bottom) {
      const { height, offset } = viewport.current;
      const target = bottom + KEYBOARD_FOOTER_GAP - height;
      if (height > 0 && target > offset) scrollRef.current?.scrollTo({ y: target, animated: true });
    },
    scrollToTop() {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
  }));

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        onLayout={(event) => {
          viewport.current.height = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          viewport.current.offset = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        bottomOffset={(footer ? FOOTER_CLEARANCE : KEYBOARD_FOOTER_GAP) + extraOffset}
        bounces={false}
        enabled={autoScroll}
        scrollEnabled={autoScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.flex}
        testID={testID}
      >
        {/* Teclado numérico não tem tecla de fechar: tocar fora dos campos baixa o teclado. */}
        <Pressable
          accessible={false}
          onPress={Keyboard.dismiss}
          style={[styles.content, contentContainerStyle]}
        >
          {children}
        </Pressable>
      </KeyboardAwareScrollView>
      {footer ? (
        <KeyboardStickyView
          // Fechado: respeita a área segura. Aberto: encosta no teclado com o respiro.
          offset={{ closed: 0, opened: bottomInset - KEYBOARD_FOOTER_GAP }}
          style={[styles.footer, { paddingBottom: bottomInset }]}
        >
          {footer}
        </KeyboardStickyView>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  footer: { paddingTop: 12 },
});
