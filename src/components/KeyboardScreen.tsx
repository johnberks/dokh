import type { ReactNode } from 'react';
import {
  Keyboard,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

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
  testID?: string;
};

/**
 * Tela com campos de digitação: o conteúdo rola sozinho até o campo em foco e o botão
 * acompanha o teclado. A pessoa sempre vê o que está digitando ou escolhendo (Onboarding v2).
 * Sem rolagem quando tudo cabe; sem barra de rolagem.
 */
export function KeyboardScreen({
  children,
  footer,
  bottomInset,
  extraOffset = 0,
  contentContainerStyle,
  testID,
}: Props) {
  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        bottomOffset={(footer ? FOOTER_CLEARANCE : KEYBOARD_FOOTER_GAP) + extraOffset}
        bounces={false}
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
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  footer: { paddingTop: 12 },
});
