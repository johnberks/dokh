import { useEffect, useRef, useState } from 'react';
import { motionDuration } from './motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Contagem rápida de 0 até o valor (em centavos), com desaceleração no fim. Os passos mostram
 * reais inteiros; o último quadro é o valor exato. `runKey` recomeça a contagem (ex.: ao entrar
 * na tela). Com "Reduzir movimento", mostra o valor direto. `onDone` avisa quando o valor
 * final aparece (ex.: a vibração de "DOKH pronta").
 */
export function useCountUp(target: bigint, runKey: number, onDone?: () => void): bigint {
  const reduced = useReducedMotion();
  const duration = motionDuration('countUp', reduced);
  const [value, setValue] = useState(target);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    // Recomeça a cada nova entrada na tela, mesmo com o mesmo valor.
    void runKey;
    if (duration === 0 || target <= 0n) {
      setValue(target);
      done.current?.();
      return;
    }
    const reais = Number(target / 100n);
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      if (progress >= 1) {
        setValue(target);
        done.current?.();
        return;
      }
      const eased = 1 - (1 - progress) ** 3;
      setValue(BigInt(Math.round(reais * eased)) * 100n);
      frame = requestAnimationFrame(tick);
    };
    setValue(0n);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, runKey, duration]);

  return value;
}
