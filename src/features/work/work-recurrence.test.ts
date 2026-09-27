import type { AuthClient } from '@/features/auth/session';
import { createWorkSeries, expectedOffsetDays, recurrenceDates } from './work-recurrence';

describe('datas da recorrência (mesma regra do servidor)', () => {
  it('semanal e quinzenal contam a partir da primeira', () => {
    expect(recurrenceDates('weekly', '2026-09-28', 3)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
    ]);
    expect(recurrenceDates('biweekly', '2026-12-24', 3)).toEqual([
      '2026-12-24',
      '2027-01-07',
      '2027-01-21',
    ]);
  });

  it('mensal no dia 31 cai no último dia dos meses curtos sem escorregar', () => {
    expect(recurrenceDates('monthly', '2027-01-31', 4)).toEqual([
      '2027-01-31',
      '2027-02-28',
      '2027-03-31',
      '2027-04-30',
    ]);
    expect(recurrenceDates('monthly', '2027-12-31', 3)).toEqual([
      '2027-12-31',
      '2028-01-31',
      '2028-02-29',
    ]);
  });
});

describe('previsão repetida em cada ocorrência', () => {
  it('guarda a distância em dias; "Ainda não sei" fica sem data', () => {
    expect(expectedOffsetDays('2026-09-28', { kind: 'date', date: '2026-10-28' })).toBe(30);
    expect(expectedOffsetDays('2026-09-28', { kind: 'unknown' })).toBeNull();
    expect(expectedOffsetDays('2026-09-28', null)).toBeNull();
    expect(expectedOffsetDays('2026-09-28', { kind: 'date', date: '2026-09-20' })).toBe(0);
  });
});

describe('create_work_series', () => {
  it('envia o modelo do Trabalho, a frequência e a distância do pagamento', async () => {
    const rpc = jest.fn(async () => ({
      data: [{ series_id: 's1', work_id: 'w1', occurrences: 53 }],
      error: null,
    }));
    const result = await createWorkSeries(
      {
        type: 'shift',
        locationId: 'loc-1',
        workDate: '2026-09-28',
        startTime: '19:00',
        durationMinutes: 720,
        amountCents: 120000n,
        expectedOn: '2026-10-28',
        timezone: 'America/Sao_Paulo',
      },
      'weekly',
      'key-1',
      { rpc } as unknown as AuthClient,
    );
    expect(result).toEqual({ seriesId: 's1', workId: 'w1', occurrences: 53 });
    expect(rpc).toHaveBeenCalledWith('create_work_series', {
      p_idempotency_key: 'key-1',
      p_frequency: 'weekly',
      p_type: 'shift',
      p_location_id: 'loc-1',
      p_description: null,
      p_starts_on: '2026-09-28',
      p_start_time: '19:00',
      p_duration_minutes: 720,
      p_timezone: 'America/Sao_Paulo',
      p_amount_cents: 120000,
      p_expected_offset_days: 30,
    });
  });
});
