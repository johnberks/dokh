import type { AuthClient } from '@/features/auth/session';
import { listMonthWorkDots } from './month-work-dots';

function client(rows: unknown[]) {
  const calls: unknown[][] = [];
  type Chain = Record<'select' | 'gte' | 'lt', (...args: unknown[]) => Chain> & {
    order: (...args: unknown[]) => Chain | Promise<{ data: unknown[]; error: null }>;
  };
  let orders = 0;
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
      return chain;
    };
  const chain: Chain = {
    select: record('select'),
    gte: record('gte'),
    lt: record('lt'),
    order: (...args) => {
      calls.push(['order', ...args]);
      orders += 1;
      return orders === 2 ? Promise.resolve({ data: rows, error: null }) : chain;
    },
  };
  return { client: { from: () => chain } as unknown as AuthClient, calls };
}

describe('pontos do mês', () => {
  it('agrupa por dia, limita a três e troca cor desconhecida pela padrão', async () => {
    const { client: fake, calls } = client([
      { work_date: '2026-09-12', color_token: 'bronze', start_time: '07:00:00' },
      { work_date: '2026-09-12', color_token: 'blue', start_time: '13:00:00' },
      { work_date: '2026-09-12', color_token: 'green', start_time: '19:00:00' },
      { work_date: '2026-09-12', color_token: 'sage', start_time: '23:00:00' },
      { work_date: '2026-09-20', color_token: 'petrol', start_time: null },
    ]);
    const dots = await listMonthWorkDots('2026-09', fake);
    expect(dots).toEqual({
      '2026-09-12': ['bronze', 'blue', 'green'],
      '2026-09-20': ['sage'],
    });
    // Mês fechado à direita: dezembro vai até antes de 1º de janeiro.
    expect(calls).toContainEqual(['gte', 'work_date', '2026-09-01']);
    expect(calls).toContainEqual(['lt', 'work_date', '2026-10-01']);
  });
});
