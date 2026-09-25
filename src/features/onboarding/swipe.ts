/** Deslocamento mínimo (pontos) para o swipe trocar de slide. */
export const SWIPE_THRESHOLD = 40;

/**
 * Página resultante de um arrasto horizontal, limitada aos extremos:
 * arrastar para a esquerda avança, para a direita volta, e o carrossel não dá a volta.
 */
export function pageAfterSwipe(current: number, translationX: number, total: number): number {
  if (translationX <= -SWIPE_THRESHOLD) return Math.min(current + 1, total - 1);
  if (translationX >= SWIPE_THRESHOLD) return Math.max(current - 1, 0);
  return current;
}
