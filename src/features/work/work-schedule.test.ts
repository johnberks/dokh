import {
  addDaysToLocalDate,
  dateToLocalDate,
  formatExpectedDate,
  localDateToDate,
  PAYMENT_TERMS,
  todayInTimezone,
  workEndDescription,
} from './work-schedule';

describe('horário e prazos do Trabalho', () => {
  it('término é derivado de início e duração, inclusive no dia seguinte', () => {
    expect(workEndDescription('2026-09-12', '19:00', 720)).toEqual({
      time: '07:00',
      nextDay: true,
    });
    expect(workEndDescription('2026-09-12', '08:00', 360)).toEqual({
      time: '14:00',
      nextDay: false,
    });
    expect(workEndDescription('2026-09-12', '13:30', 90)).toEqual({
      time: '15:00',
      nextDay: false,
    });
  });

  it('sem dado suficiente não inventa término', () => {
    expect(workEndDescription(null, '19:00', 720)).toBeNull();
    expect(workEndDescription('2026-09-12', null, 720)).toBeNull();
    expect(workEndDescription('2026-09-12', '19:00', null)).toBeNull();
  });

  it('prazos D30, D60 e D90 atravessam mês e ano', () => {
    expect(PAYMENT_TERMS).toEqual([30, 60, 90]);
    expect(addDaysToLocalDate('2026-09-12', 30)).toBe('2026-10-12');
    expect(addDaysToLocalDate('2026-12-20', 30)).toBe('2027-01-19');
    expect(addDaysToLocalDate('2028-01-30', 30)).toBe('2028-02-29');
  });

  it('formata a data prevista em maiúsculas, como no design', () => {
    expect(formatExpectedDate('2026-09-20')).toMatch(/20/);
    expect(formatExpectedDate('2026-09-20')).toBe(formatExpectedDate('2026-09-20').toUpperCase());
  });

  it('hoje respeita o fuso e tolera Intl sem timeZone', () => {
    const instant = new Date('2026-09-30T23:30:00-03:00');
    expect(todayInTimezone('America/Sao_Paulo', instant)).toBe('2026-09-30');
    expect(todayInTimezone('Pacific/Kiritimati', instant)).toBe('2026-10-01');

    const RealDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = (() => {
      throw new RangeError('timeZone não suportado');
    }) as unknown as typeof Intl.DateTimeFormat;
    try {
      const local = new Date(2026, 8, 12, 12);
      expect(todayInTimezone('America/Sao_Paulo', local)).toBe('2026-09-12');
    } finally {
      Intl.DateTimeFormat = RealDateTimeFormat;
    }
  });
});

describe('conversão entre data local e Date', () => {
  it('ida e volta preservam o dia, inclusive na virada de ano', () => {
    for (const date of ['2026-01-01', '2026-02-28', '2026-12-31']) {
      expect(dateToLocalDate(localDateToDate(date))).toBe(date);
    }
    expect(localDateToDate('2026-09-12').getHours()).toBe(12);
  });
});
