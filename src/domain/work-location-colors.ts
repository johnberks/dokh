import { type WorkLocationColorToken, workLocationColors } from '@/theme/tokens';

/** Cores livres no plano Free; a paleta ampliada é Premium e validada no servidor (D49). */
export const FREE_COLOR_TOKENS: readonly WorkLocationColorToken[] = [
  'sage',
  'bronze',
  'blue',
  'green',
];

export const PREMIUM_COLOR_TOKENS: readonly WorkLocationColorToken[] = Object.keys(
  workLocationColors,
) as WorkLocationColorToken[];

/**
 * Cor automática de um novo Local: usa a primeira cor livre ainda não usada e, quando
 * todas já estiverem em uso, segue em rodízio — dois locais podem repetir cor, e o
 * calendário nunca depende só dela para identificar o Trabalho.
 */
export function nextAutomaticColorToken(usedTokens: readonly string[]): WorkLocationColorToken {
  const unused = FREE_COLOR_TOKENS.find((token) => !usedTokens.includes(token));
  if (unused) return unused;
  return FREE_COLOR_TOKENS[usedTokens.length % FREE_COLOR_TOKENS.length];
}

export function isFreeColorToken(token: string): token is WorkLocationColorToken {
  return (FREE_COLOR_TOKENS as readonly string[]).includes(token);
}
