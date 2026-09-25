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

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/** Agrupamento pt-BR para valores acima do limite seguro de `number`. */
function groupIntegerPtBR(value: bigint): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formatação pt-BR na borda da interface; o cálculo continua em centavos inteiros (D31).
 * O `Intl` do Hermes **não aceita `bigint`** (o do Node aceita), então a parte inteira vira
 * `number` enquanto for exata; acima disso, o agrupamento é feito manualmente.
 */
export function formatCentsToBRL(cents: bigint, options: { omitZeroCents?: boolean } = {}): string {
  const isNegative = cents < 0n;
  const absolute = isNegative ? -cents : cents;
  const wholeUnits = absolute / 100n;
  const units =
    wholeUnits <= MAX_SAFE
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(wholeUnits))
      : `R$ ${groupIntegerPtBR(wholeUnits)}`;
  const remainder = absolute % 100n;
  const sign = isNegative ? '-' : '';
  // Valores inteiros aparecem sem ",00" nos resumos do design ("R$ 1.200").
  if (options.omitZeroCents && remainder === 0n) return `${sign}${units}`;
  return `${sign}${units},${String(remainder).padStart(2, '0')}`;
}
