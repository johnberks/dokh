import { parseBRLToCents } from './money';

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
