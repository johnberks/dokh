import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Teclado aberto ou fechado. No iOS reage no início da animação (`Will`), para o layout
 * mudar junto com o teclado; o Android só emite os eventos `Did`.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const shown = Keyboard.addListener(showEvent, () => setVisible(true));
    const hidden = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return visible;
}
