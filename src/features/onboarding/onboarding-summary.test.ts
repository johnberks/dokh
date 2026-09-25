import type { AuthClient } from '@/features/auth/session';
import {
  completeOnboarding,
  formatDuration,
  formatShortDate,
  type OnboardingSummary,
  readOnboardingSummary,
  type SummaryWork,
  summaryTotals,
  workMetaLine,
} from './onboarding-summary';

/** Encadeamento `from().select().eq().eq().maybeSingle()` com resposta por tabela. */
function readClient(rows: Record<string, unknown>) {
  const eq = jest.fn();
  type Chain = {
    select: () => Chain;
    eq: (...args: unknown[]) => Chain;
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
  };
  const from = jest.fn((table: string) => {
    const chain: Chain = {
      select: jest.fn(() => chain),
      eq: jest.fn((...args: unknown[]) => {
        eq(table, ...args);
        return chain;
      }),
      maybeSingle: jest.fn(async () => ({ data: rows[table] ?? null, error: null })),
    };
    return chain;
  });
  return { client: { from } as unknown as AuthClient, eq };
}

const shift: SummaryWork = {
  type: 'shift',
  locationName: 'Hospital São Lucas',
  workDate: '2026-09-12',
  startTime: '19:00',
  durationMinutes: 720,
  amountCents: 120000n,
  expectedOn: '2026-10-12',
};

describe('resumo do onboarding', () => {
  it('lê a bolsa ativa e o Trabalho gravado, convertendo centavos e horário', async () => {
    const { client, eq } = readClient({
      residencies: { specialty: 'Cardiologia', monthly_amount_cents: 365442, payment_day: 5 },
      agenda_work_projection: {
        type: 'shift',
        location_name: 'Hospital São Lucas',
        work_date: '2026-09-12',
        start_time: '19:00:00',
        duration_minutes: 720,
        amount_cents: 120000,
        expected_on: '2026-10-12',
      },
    });
    const summary = await readOnboardingSummary('user-1', 'work-1', client);
    expect(summary).toEqual({
      residency: { specialty: 'Cardiologia', monthlyAmountCents: 365442n, paymentDay: 5 },
      work: shift,
    });
    expect(eq).toHaveBeenCalledWith('residencies', 'active', true);
    expect(eq).toHaveBeenCalledWith('agenda_work_projection', 'work_entry_id', 'work-1');
  });

  it('sem residência e sem horário não inventa dados', async () => {
    const { client } = readClient({
      agenda_work_projection: {
        type: 'procedure',
        location_name: 'Clínica Centro',
        work_date: '2026-09-12',
        start_time: null,
        duration_minutes: null,
        amount_cents: 80000,
        expected_on: null,
      },
    });
    const summary = await readOnboardingSummary('user-1', 'work-1', client);
    expect(summary.residency).toBeNull();
    expect(summary.work).toMatchObject({
      startTime: null,
      durationMinutes: null,
      expectedOn: null,
    });
  });

  it('total e contagem somam só o que existe', () => {
    const both: OnboardingSummary = {
      residency: { specialty: 'Cardiologia', monthlyAmountCents: 365442n, paymentDay: 5 },
      work: shift,
    };
    expect(summaryTotals(both)).toEqual({ totalCents: 485442n, count: 2 });
    expect(summaryTotals({ residency: null, work: shift })).toEqual({
      totalCents: 120000n,
      count: 1,
    });
  });

  it('linha do card omite horário e duração ausentes', () => {
    expect(workMetaLine(shift, 2026)).toBe('12 SET · 19:00 · 12h');
    expect(workMetaLine({ ...shift, startTime: null, durationMinutes: null }, 2026)).toBe('12 SET');
    expect(formatDuration(450)).toBe('7h30');
    expect(formatShortDate('2027-01-20', 2026)).toBe('20 JAN 2027');
  });

  it('marca a conclusão só quando ainda não havia data', async () => {
    const is = jest.fn(async () => ({ error: null }));
    const eq = jest.fn(() => ({ is }));
    const update = jest.fn(() => ({ eq }));
    const client = { from: jest.fn(() => ({ update })) } as unknown as AuthClient;
    await completeOnboarding('user-1', client);
    expect(update).toHaveBeenCalledWith({ onboarding_completed_at: expect.any(String) });
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(is).toHaveBeenCalledWith('onboarding_completed_at', null);
  });

  it('propaga erro ao marcar a conclusão', async () => {
    const failure = new Error('network');
    const client = {
      from: () => ({ update: () => ({ eq: () => ({ is: async () => ({ error: failure }) }) }) }),
    } as unknown as AuthClient;
    await expect(completeOnboarding('user-1', client)).rejects.toBe(failure);
  });
});
