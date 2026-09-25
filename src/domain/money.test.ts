import { formatCentsToBRL, parseBRLToCents } from './money';

describe('parseBRLToCents', () => {
  it.each([
    ['R$ 1.200', 120_000n],
    ['1.200,50', 120_050n],
    ['1200,5', 120_050n],
    ['0,01', 1n],
    ['R$\u00a03.654,42', 365_442n],
    ['92.233.720.368.547.758,07', 9_223_372_036_854_775_807n],
  ])('converts %s exactly to integer cents', (input, cents) => {
    expect(parseBRLToCents(input)).toBe(cents);
  });

  it.each([
    '',
    'R$',
    '0',
    '0,00',
    '-1,00',
    '1.23',
    '1,234',
    '1.23,45',
    '1.234.56',
    '1 234,56',
    'USD 1,00',
    '92.233.720.368.547.758,08',
  ])('rejects invalid or non-positive value %s', (input) => {
    expect(parseBRLToCents(input)).toBeNull();
  });
});

describe('formatCentsToBRL', () => {
  it('formata centavos em reais no padrão pt-BR', () => {
    expect(formatCentsToBRL(365442n)).toMatch(/^R\$\s?3\.654,42$/);
    expect(formatCentsToBRL(100n)).toMatch(/^R\$\s?1,00$/);
    expect(formatCentsToBRL(5n)).toMatch(/^R\$\s?0,05$/);
  });

  it('omite ",00" só quando pedido e o valor é inteiro', () => {
    expect(formatCentsToBRL(120000n, { omitZeroCents: true })).toMatch(/^R\$\s?1\.200$/);
    expect(formatCentsToBRL(365442n, { omitZeroCents: true })).toMatch(/^R\$\s?3\.654,42$/);
    expect(formatCentsToBRL(120000n)).toMatch(/^R\$\s?1\.200,00$/);
  });

  it('mantém precisão acima do limite seguro de number', () => {
    expect(formatCentsToBRL(9007199254740993n)).toMatch(/90\.071\.992\.547\.409,93$/);
    // Acima do limite seguro o agrupamento é manual, mas o formato continua o mesmo.
    expect(formatCentsToBRL(1234567890123456789n)).toMatch(
      /^R\$\s?12\.345\.678\.901\.234\.567,89$/,
    );
  });

  it('funciona onde o Intl recusa bigint, como o Hermes do iOS', () => {
    const RealNumberFormat = Intl.NumberFormat;
    // Reproduz o erro visto no iPhone: "Cannot convert BigInt to number".
    const HermesLikeNumberFormat = ((...args: ConstructorParameters<typeof Intl.NumberFormat>) => {
      const inner = new RealNumberFormat(...args);
      return {
        format: (value: number | bigint) => {
          if (typeof value === 'bigint') throw new TypeError('Cannot convert BigInt to number');
          return inner.format(value);
        },
      };
    }) as unknown as typeof Intl.NumberFormat;

    Intl.NumberFormat = HermesLikeNumberFormat;
    try {
      expect(formatCentsToBRL(365442n)).toMatch(/3\.654,42$/);
      expect(formatCentsToBRL(1234567890123456789n)).toMatch(/12\.345\.678\.901\.234\.567,89$/);
    } finally {
      Intl.NumberFormat = RealNumberFormat;
    }
  });
});
