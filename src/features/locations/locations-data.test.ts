import type { AuthClient } from '@/features/auth/session';
import {
  archiveWorkLocation,
  createWorkLocation,
  listWorkLocations,
  updateWorkLocation,
} from './locations-data';

const ROW = {
  id: 'loc-1',
  user_id: 'user-1',
  name: 'Hospital São Lucas',
  city: 'São Paulo',
  color_token: 'sage',
  color_source: 'automatic' as const,
  archived_at: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

function fakeClient(row = ROW) {
  const calls: Record<string, unknown> = {};
  const single = jest.fn(async () => ({ data: row, error: null }));
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn((payload: unknown) => {
    calls.insert = payload;
    return { select };
  });
  const eqUpdate = jest.fn(() => ({ select }));
  const update = jest.fn((payload: unknown) => {
    calls.update = payload;
    return { eq: eqUpdate, select };
  });
  const order = jest.fn(async () => ({ data: [row], error: null }));
  const is = jest.fn(() => ({ order }));
  const selectList = jest.fn(() => ({ is }));
  const from = jest.fn(() => ({ select: selectList, insert, update }));
  return { client: { from } as unknown as AuthClient, calls, order, is, eqUpdate };
}

describe('camada de dados de Locais', () => {
  it('lista apenas ativos, em ordem alfabética', async () => {
    const { client, is, order } = fakeClient();
    const locations = await listWorkLocations(client);
    expect(is).toHaveBeenCalledWith('archived_at', null);
    expect(order).toHaveBeenCalledWith('name', { ascending: true });
    expect(locations[0]).toEqual({
      id: 'loc-1',
      name: 'Hospital São Lucas',
      city: 'São Paulo',
      colorToken: 'sage',
      colorSource: 'automatic',
      archivedAt: null,
    });
  });

  it('cria com cor automática livre e dono da sessão', async () => {
    const { client, calls } = fakeClient();
    await createWorkLocation(
      'user-1',
      { name: '  Clínica Central  ', city: ' ' },
      [
        {
          id: 'x',
          name: 'A',
          city: null,
          colorToken: 'sage',
          colorSource: 'automatic',
          archivedAt: null,
        },
      ],
      client,
    );
    expect(calls.insert).toEqual({
      user_id: 'user-1',
      name: 'Clínica Central',
      city: null,
      color_token: 'bronze',
      color_source: 'automatic',
    });
  });

  it('cor escolhida marca a origem como paleta', async () => {
    const { client, calls } = fakeClient();
    await createWorkLocation('user-1', { name: 'Consultório', colorToken: 'blue' }, [], client);
    expect(calls.insert).toMatchObject({ color_token: 'blue', color_source: 'free_palette' });
  });

  it('edita só os campos enviados', async () => {
    const { client, calls } = fakeClient();
    await updateWorkLocation('loc-1', { name: ' Novo nome ' }, client);
    expect(calls.update).toEqual({ name: 'Novo nome' });
  });

  it('arquivar preserva o histórico em vez de apagar', async () => {
    const { client, calls, eqUpdate } = fakeClient();
    await archiveWorkLocation('loc-1', client);
    expect(calls.update).toHaveProperty('archived_at');
    expect(eqUpdate).toHaveBeenCalledWith('id', 'loc-1');
  });

  it('propaga erro do banco', async () => {
    const order = jest.fn(async () => ({ data: null, error: new Error('rls') }));
    const client = {
      from: () => ({ select: () => ({ is: () => ({ order }) }) }),
    } as unknown as AuthClient;
    await expect(listWorkLocations(client)).rejects.toThrow('rls');
  });
});
