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
