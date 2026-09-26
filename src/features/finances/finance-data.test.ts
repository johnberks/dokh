import type { AuthClient } from '@/features/auth/session';
import { readYearWork } from './finance-data';

function client(rows: Record<string, { hourly: number | null; minutes: number }>) {
  return {
    rpc: async (_name: string, args: { p_month: string }) => {
      const row = rows[args.p_month.slice(0, 7)] ?? { hourly: null, minutes: 0 };
      return {
        data: [
          {
            has_expected_entries: false,
            expected_total_cents: 0,
            received_of_expected_cents: 0,
            awaiting_of_expected_cents: 0,
            undated_count: 0,
            undated_total_cents: 0,
            work_generated_cents: 0,
            work_count: 0,
            work_duration_minutes: row.minutes,
            hourly_value_cents: row.hourly,
          },
        ],
        error: null,
      };
    },
  } as unknown as AuthClient;
}

describe('valor/hora do ano', () => {
  it('pondera pelas horas de cada mês e compara o primeiro com o último', async () => {
    const result = await readYearWork(
      ['2026-07', '2026-08', '2026-09'],
      client({
        '2026-07': { hourly: 14800, minutes: 600 },
        '2026-08': { hourly: null, minutes: 0 },
        '2026-09': { hourly: 17600, minutes: 1800 },
      }),
    );
    // (148·10h + 176·30h) / 40h = 169
    expect(result).toEqual({ hourlyValueCents: 16900n, hourlyEvolutionPercent: 19 });
  });

  it('Free (sem valor/hora do servidor) ou um mês só: sem número e sem tendência', async () => {
    expect(
      await readYearWork(['2026-09'], client({ '2026-09': { hourly: null, minutes: 600 } })),
    ).toEqual({
      hourlyValueCents: null,
      hourlyEvolutionPercent: null,
    });
    expect(
      await readYearWork(['2026-09'], client({ '2026-09': { hourly: 17600, minutes: 600 } })),
    ).toEqual({ hourlyValueCents: 17600n, hourlyEvolutionPercent: null });
  });
});
