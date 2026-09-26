import type { AuthClient } from '@/features/auth/session';
import { readHourlyHistory, readMonthEntries, readYearWork } from './finance-data';

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

/** Cliente mínimo encadeável: grava os filtros e devolve as linhas da tabela pedida. */
function tableClient(tables: Record<string, unknown[]>, calls: string[] = []) {
  return {
    from: (table: string) => {
      const builder = {
        select: () => builder,
        gte: (column: string, value: string) => {
          calls.push(`gte ${column} ${value}`);
          return builder;
        },
        lt: (column: string, value: string) => {
          calls.push(`lt ${column} ${value}`);
          return builder;
        },
        is: (column: string) => {
          calls.push(`is ${column}`);
          return builder;
        },
        in: (column: string, values: string[]) => {
          calls.push(`in ${column} ${values.join(',')}`);
          return builder;
        },
        order: () => builder,
        // biome-ignore lint/suspicious/noThenProperty: imita o builder "thenable" do supabase-js.
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: tables[table] ?? [], error: null }),
      };
      return builder;
    },
  } as unknown as AuthClient;
}

describe('entradas do mês', () => {
  it('mesmo recorte do total (data prevista no mês, sem invalidados nem excluídos) com o Local', async () => {
    const calls: string[] = [];
    const result = await readMonthEntries(
      '2026-09',
      tableClient(
        {
          receivable_projection: [
            {
              receivable_id: 'r1',
              work_entry_id: null,
              origin: 'residency',
              amount_cents: 410609,
              expected_on: '2026-09-05',
              receipt_status: 'received',
            },
            {
              receivable_id: 'r2',
              work_entry_id: 'w2',
              origin: 'shift',
              amount_cents: 140000,
              expected_on: '2026-09-12',
              receipt_status: 'confirmation_pending',
            },
            // Um status fora da lista (sem data/invalidado) nunca aparece.
            {
              receivable_id: 'r3',
              work_entry_id: 'w3',
              origin: 'shift',
              amount_cents: 1,
              expected_on: '2026-09-13',
              receipt_status: 'undated',
            },
          ],
          agenda_work_projection: [
            { work_entry_id: 'w2', location_name: 'Hospital São Camilo' },
            { work_entry_id: 'w3', location_name: 'Outro' },
          ],
        },
        calls,
      ),
    );
    expect(calls).toEqual(
      expect.arrayContaining([
        'gte expected_on 2026-09-01',
        'lt expected_on 2026-10-01',
        'is invalidated_at',
        'is work_deleted_at',
        'in work_entry_id w2',
      ]),
    );
    expect(result).toEqual([
      {
        receivableId: 'r1',
        workId: null,
        origin: 'residency',
        locationName: null,
        amountCents: 410609n,
        expectedOn: '2026-09-05',
        status: 'received',
      },
      {
        receivableId: 'r2',
        workId: 'w2',
        origin: 'shift',
        locationName: 'Hospital São Camilo',
        amountCents: 140000n,
        expectedOn: '2026-09-12',
        status: 'confirmation_pending',
      },
    ]);
  });
});

describe('histórico de valor/hora', () => {
  it('lê os seis meses até o escolhido, do mais antigo ao atual', async () => {
    const result = await readHourlyHistory(
      '2026-02',
      6,
      client({ '2026-02': { hourly: 17600, minutes: 60 } }),
    );
    expect(result.map((item) => item.month)).toEqual([
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ]);
    expect(result[5].hourlyValueCents).toBe(17600n);
  });
});
