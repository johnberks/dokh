import type { AuthClient } from '@/features/auth/session';
import {
  completeOnboarding,
  firstViewGroups,
  formatDuration,
  formatShortDate,
  monthLabel,
  type OnboardingSummary,
  readOnboardingSummary,
  readResidencyNextEntries,
  type SummaryWork,
  summaryTotals,
  workMetaLine,
} from './onboarding-summary';

/** Encadeamento do PostgREST (`select/eq/not/is/gte/order/limit/maybeSingle`) por tabela. */
function readClient(rows: Record<string, unknown>) {
  const calls = jest.fn();
  type Chain = Record<string, (...args: unknown[]) => Chain> & {
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
  };
  const from = jest.fn((table: string) => {
    const chain = {} as Chain;
    for (const method of ['select', 'eq', 'not', 'is', 'gte', 'order', 'limit']) {
      chain[method] = jest.fn((...args: unknown[]) => {
        calls(table, method, ...args);
        return chain;
      });
    }
    chain.maybeSingle = jest.fn(async () => ({ data: rows[table] ?? null, error: null }));
    return chain;
  });
  return { client: { from } as unknown as AuthClient, calls };
}

const shift: SummaryWork = {
  type: 'shift',
  locationName: 'Hospital São Lucas',
  workDate: '2026-09-12',
  startTime: '19:00',
  durationMinutes: 720,
  amountCents: 120000n,
  expectedOn: '2026-10-12',
  receipt: 'scheduled',
};

const residency = {
  specialty: 'Cardiologia',
  monthlyAmountCents: 365442n,
  paymentDay: 5,
  nextExpectedOn: '2026-10-05',
};

describe('resumo do onboarding', () => {
  it('lê a bolsa ativa, sua próxima entrada real e o Trabalho gravado', async () => {
    const { client, calls } = readClient({
      residencies: { specialty: 'Cardiologia', monthly_amount_cents: 365442, payment_day: 5 },
      receivable_projection: { expected_on: '2026-10-05' },
      agenda_work_projection: {
        type: 'shift',
        location_name: 'Hospital São Lucas',
        work_date: '2026-09-12',
        start_time: '19:00:00',
        duration_minutes: 720,
        amount_cents: 120000,
        expected_on: '2026-10-12',
        receipt_status: 'scheduled',
      },
    });
    const summary = await readOnboardingSummary('user-1', 'work-1', '2026-10-01', client);
    expect(summary).toEqual({ residency, work: shift });
    expect(calls).toHaveBeenCalledWith('residencies', 'eq', 'active', true);
    // Só entradas reais da bolsa a partir de hoje: nada é calculado no aparelho.
    expect(calls).toHaveBeenCalledWith('receivable_projection', 'gte', 'expected_on', '2026-10-01');
    expect(calls).toHaveBeenCalledWith('agenda_work_projection', 'eq', 'work_entry_id', 'work-1');
  });

  it('residente que concluiu sem trabalho não consulta Trabalho algum', async () => {
    const { client, calls } = readClient({
      residencies: { specialty: 'Cardiologia', monthly_amount_cents: 365442, payment_day: 5 },
      receivable_projection: { expected_on: '2026-10-05' },
    });
    const summary = await readOnboardingSummary('user-1', null, '2026-10-01', client);
    expect(summary).toEqual({ residency, work: null });
    expect(calls).not.toHaveBeenCalledWith('agenda_work_projection', expect.anything());
  });

  it('estado da entrada vem do servidor: recebido, pendente ou sem previsão', async () => {
    const work = (receipt_status: string, expected_on: string | null) =>
      readClient({
        agenda_work_projection: {
          type: 'shift',
          location_name: 'H',
          work_date: '2026-08-12',
          start_time: '19:00:00',
          duration_minutes: 720,
          amount_cents: 1,
          expected_on,
          receipt_status,
        },
      }).client;
    const read = async (client: AuthClient) =>
      (await readOnboardingSummary('u', 'w', '2026-10-01', client)).work?.receipt;
    expect(await read(work('received', '2026-09-11'))).toBe('received');
    expect(await read(work('confirmation_pending', '2026-09-11'))).toBe('pending');
    expect(await read(work('undated', null))).toBe('undated');
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
        receipt_status: 'undated',
      },
    });
    const summary = await readOnboardingSummary('user-1', 'work-1', '2026-10-01', client);
    expect(summary.residency).toBeNull();
    expect(summary.work).toMatchObject({
      startTime: null,
      durationMinutes: null,
      expectedOn: null,
    });
  });

  it('totais por mês de entrada: bolsa e plantão no mesmo mês somam', () => {
    const both: OnboardingSummary = { residency, work: shift };
    expect(summaryTotals(both)).toEqual({
      months: [{ month: '2026-10', totalCents: 485442n }],
      pendingCents: 0n,
      receivedCents: 0n,
      count: 2,
    });
  });

  it('plantão que entra em outro mês nunca se soma à bolsa deste mês', () => {
    const later = { ...shift, expectedOn: '2026-11-11' };
    expect(summaryTotals({ residency, work: later }).months).toEqual([
      { month: '2026-10', totalCents: 365442n },
      { month: '2026-11', totalCents: 120000n },
    ]);
  });

  it('recebido, pendente e sem previsão ficam fora do previsto', () => {
    const received = summaryTotals({ residency: null, work: { ...shift, receipt: 'received' } });
    expect(received).toMatchObject({ months: [], receivedCents: 120000n, pendingCents: 0n });
    const pending = summaryTotals({ residency: null, work: { ...shift, receipt: 'pending' } });
    expect(pending).toMatchObject({ months: [], receivedCents: 0n, pendingCents: 120000n });
    const undated = summaryTotals({
      residency: null,
      work: { ...shift, expectedOn: null, receipt: 'undated' },
    });
    expect(undated).toEqual({ months: [], receivedCents: 0n, pendingCents: 0n, count: 1 });
  });

  it('próximas entradas da bolsa vêm do servidor, a partir de hoje e em ordem', async () => {
    const limit = jest.fn(async () => ({
      data: [
        { expected_on: '2026-10-05', amount_cents: 365442 },
        { expected_on: '2026-11-05', amount_cents: 365442 },
      ],
      error: null,
    }));
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'not', 'is', 'gte', 'order']) {
      chain[method] = jest.fn(() => chain);
    }
    chain.limit = limit;
    const client = { from: jest.fn(() => chain) } as unknown as AuthClient;
    const entries = await readResidencyNextEntries('user-1', '2026-10-01', 3, client);
    expect(entries).toEqual([
      { expectedOn: '2026-10-05', amountCents: 365442n },
      { expectedOn: '2026-11-05', amountCents: 365442n },
    ]);
    expect(chain.gte).toHaveBeenCalledWith('expected_on', '2026-10-01');
    expect(limit).toHaveBeenCalledWith(3);
  });

  it('primeira visão: cada entrada no mês em que entra; status em grupos próprios', () => {
    const later = { ...shift, expectedOn: '2026-11-11' };
    expect(firstViewGroups({ residency, work: later })).toEqual([
      {
        kind: 'month',
        month: '2026-10',
        totalCents: 365442n,
        rows: [{ source: 'residency', date: '2026-10-05', amountCents: 365442n }],
      },
      {
        kind: 'month',
        month: '2026-11',
        totalCents: 120000n,
        rows: [{ source: 'work', date: '2026-11-11', amountCents: 120000n }],
      },
    ]);
    const pending = firstViewGroups({ residency, work: { ...shift, receipt: 'pending' } });
    expect(pending.map((group) => group.kind)).toEqual(['month', 'pending']);
    expect(pending[0].totalCents).toBe(365442n);
    const undated = firstViewGroups({
      residency: null,
      work: { ...shift, expectedOn: null, receipt: 'undated' },
    });
    expect(undated).toEqual([
      {
        kind: 'undated',
        totalCents: 120000n,
        rows: [{ source: 'work', date: null, amountCents: 120000n }],
      },
    ]);
  });

  it('nome do mês só ganha ano fora do ano de referência', () => {
    expect(monthLabel('2026-10', 2026)).toBe('OUTUBRO');
    expect(monthLabel('2027-01', 2026)).toBe('JANEIRO 2027');
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
