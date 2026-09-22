import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * "Reduzir movimento" do sistema (D11), reativo a mudanças com o app aberto.
 * Usa AccessibilityInfo em vez do hook do Reanimated para não depender do mock de testes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
