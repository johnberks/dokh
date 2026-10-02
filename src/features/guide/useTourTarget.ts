import { useCallback, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { currentTourStep, type TourTargetId, useGuideTour } from './guide-tour';

/** Espera a troca de aba e a entrada em cascata assentarem antes de medir. */
export const TOUR_MEASURE_DELAY = 750;

/**
 * Marca um elemento como alvo do tour: devolve o `ref` para o elemento e mede sua posição na
 * janela quando o passo dele fica ativo (e de novo se o layout mudar enquanto está ativo).
 */
export function useTourTarget(id: TourTargetId, delay = TOUR_MEASURE_DELAY) {
  const ref = useRef<View>(null);
  // O passo atual vem das etapas na ordem do foco (7.7), não da ordem fixa: começando pela
  // Agenda, o primeiro alvo é o `+` dela, não o valor da Início.
  const active = useGuideTour(
    (state) =>
      currentTourStep(state.step, state.steps)?.target === id ||
      (state.going !== null && id === `tab-${state.going}`),
  );
  const setRect = useGuideTour((state) => state.setRect);

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setRect(id, { x, y, width, height });
    });
  }, [id, setRect]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(measure, delay);
    return () => clearTimeout(timer);
  }, [active, delay, measure]);

  return { ref, onLayout: active ? measure : undefined };
}
