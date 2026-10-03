import { zonedDateTime } from './zoned-time';

describe('horário local em instante absoluto', () => {
  it('São Paulo (UTC−3): 19:00 do plantão é 22:00 UTC', () => {
    expect(zonedDateTime('2026-10-12', '19:00', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-10-12T22:00:00.000Z',
    );
  });

  it('meia-noite e virada de mês', () => {
    expect(zonedDateTime('2026-10-31', '23:30', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-11-01T02:30:00.000Z',
    );
  });

  it('respeita horário de verão onde existe (Nova York, antes e depois da troca)', () => {
    expect(zonedDateTime('2026-03-07', '08:00', 'America/New_York').toISOString()).toBe(
      '2026-03-07T13:00:00.000Z',
    );
    expect(zonedDateTime('2026-03-09', '08:00', 'America/New_York').toISOString()).toBe(
      '2026-03-09T12:00:00.000Z',
    );
  });

  it('fuso inválido cai no relógio do aparelho, sem quebrar', () => {
    const date = zonedDateTime('2026-10-12', '08:00', 'Nao/Existe');
    expect(date.getHours()).toBe(8);
    expect(date.getDate()).toBe(12);
  });
});
