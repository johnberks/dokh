import {
  buildMonthGrid,
  compareLocalDates,
  isLocalDate,
  isLocalMonth,
  monthOf,
  shiftMonth,
  weekdayOrder,
} from './calendar';

const days = (weeks: ReturnType<typeof buildMonthGrid>) =>
  weeks.flat().filter((cell) => cell !== null);

describe('calendário (domínio)', () => {
  it('setembro/2026 começa numa terça: 2 vazios com Domingo, 1 com Segunda', () => {
    const sunday = buildMonthGrid('2026-09', 0);
    expect(sunday[0].slice(0, 3)).toEqual([null, null, expect.objectContaining({ day: 1 })]);
    expect(sunday).toHaveLength(5);
    const monday = buildMonthGrid('2026-09', 1);
    expect(monday[0][0]).toBeNull();
    expect(monday[0][1]).toEqual({ date: '2026-09-01', day: 1, weekday: 2 });
  });

  it('cobre todos os dias, inclusive fevereiro bissexto e virada de ano', () => {
    expect(days(buildMonthGrid('2028-02', 0))).toHaveLength(29);
    expect(days(buildMonthGrid('2027-02', 0))).toHaveLength(28);
    const december = days(buildMonthGrid('2026-12', 1));
    expect(december.at(-1)).toEqual({ date: '2026-12-31', day: 31, weekday: 4 });
  });

  it('sempre tem linhas completas de 7 e entre 4 e 6 semanas', () => {
    for (const month of ['2026-02', '2026-08', '2027-02', '2021-02', '2026-05']) {
      for (const start of [0, 1] as const) {
        const weeks = buildMonthGrid(month, start);
        expect(weeks.every((week) => week.length === 7)).toBe(true);
        expect(weeks.length).toBeGreaterThanOrEqual(4);
        expect(weeks.length).toBeLessThanOrEqual(6);
      }
    }
    // Fevereiro/2015 começou num domingo e tem 28 dias: exatamente 4 semanas.
    expect(buildMonthGrid('2015-02', 0)).toHaveLength(4);
    // Agosto/2026 começa num sábado: 6 semanas com Domingo.
    expect(buildMonthGrid('2026-08', 0)).toHaveLength(6);
  });

  it('ordena o cabeçalho conforme o início da semana', () => {
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('navega entre meses atravessando o ano', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-09', 0)).toBe('2026-09');
    expect(monthOf('2026-09-14')).toBe('2026-09');
  });

  it('valida datas e meses estritamente', () => {
    expect(isLocalDate('2026-02-29')).toBe(false);
    expect(isLocalDate('2028-02-29')).toBe(true);
    expect(isLocalDate('2026-9-1')).toBe(false);
    expect(isLocalMonth('2026-13')).toBe(false);
    expect(() => buildMonthGrid('2026-13', 0)).toThrow(RangeError);
  });

  it('compara datas locais sem converter fuso', () => {
    expect(compareLocalDates('2026-09-09', '2026-09-10')).toBe(-1);
    expect(compareLocalDates('2026-12-31', '2027-01-01')).toBe(-1);
    expect(compareLocalDates('2026-09-10', '2026-09-10')).toBe(0);
  });
});
