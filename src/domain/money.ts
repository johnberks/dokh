const MAX_SIGNED_BIGINT_CENTS = 9_223_372_036_854_775_807n;

/** Parse an entered BRL amount only at validation/submit time; never persist a float. */
export function parseBRLToCents(raw: string): bigint | null {
  const value = raw.replace(/\u00a0/gu, ' ').trim();
  const match = /^(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/u.exec(value);
  if (!match) return null;

  const wholeDigits = match[1].replaceAll('.', '');
  if (wholeDigits.length > 17) return null;
  const whole = BigInt(wholeDigits);
  const cents = BigInt((match[2] ?? '').padEnd(2, '0') || '0');
  const amount = whole * 100n + cents;
  return amount > 0n && amount <= MAX_SIGNED_BIGINT_CENTS ? amount : null;
}

/**
 * Formatação pt-BR na borda da interface; o cálculo continua em centavos inteiros (D31).
 * A parte inteira é formatada como `bigint` para não perder precisão em valores grandes.
 */
export function formatCentsToBRL(cents: bigint): string {
  const isNegative = cents < 0n;
  const absolute = isNegative ? -cents : cents;
  const units = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absolute / 100n);
  const decimals = String(absolute % 100n).padStart(2, '0');
  return `${isNegative ? '-' : ''}${units},${decimals}`;
}
