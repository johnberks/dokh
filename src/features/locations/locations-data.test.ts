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
  const rpc = jest.fn(async (..._args: [string, Record<string, unknown>]) => ({
    data: row,
    error: null,
  }));
  const order = jest.fn(async () => ({ data: [row], error: null }));
  const is = jest.fn(() => ({ order }));
  const selectList = jest.fn(() => ({ is }));
  const from = jest.fn(() => ({ select: selectList }));
  return { client: { from, rpc } as unknown as AuthClient, rpc, order, is };
}

const CURRENT = {
  id: 'loc-1',
  name: 'Hospital São Lucas',
  city: 'São Paulo',
  colorToken: 'sage',
  colorSource: 'automatic' as const,
  archivedAt: null,
};

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

  it('cria pela RPC com cor automática livre (o dono vem do servidor)', async () => {
    const { client, rpc } = fakeClient();
    await createWorkLocation(
      { name: '  Clínica Central  ', city: ' ' },
      [{ ...CURRENT, id: 'x', name: 'A', city: null }],
      client,
    );
    expect(rpc).toHaveBeenCalledWith('create_work_location', {
      p_name: 'Clínica Central',
      p_city: null,
      p_color_token: 'bronze',
      p_color_source: 'automatic',
    });
  });

  it('cor escolhida marca a origem como paleta', async () => {
    const { client, rpc } = fakeClient();
    await createWorkLocation({ name: 'Consultório', colorToken: 'blue' }, [], client);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_color_token: 'blue',
      p_color_source: 'free_palette',
    });
  });

  it('edita aplicando o patch sobre o Local atual', async () => {
    const { client, rpc } = fakeClient();
    await updateWorkLocation(CURRENT, { name: ' Novo nome ' }, client);
    expect(rpc).toHaveBeenCalledWith('update_work_location', {
      p_location_id: 'loc-1',
      p_name: 'Novo nome',
      p_city: 'São Paulo',
      p_color_token: 'sage',
      p_color_source: 'automatic',
    });
    await updateWorkLocation(CURRENT, { city: null }, client);
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_city: null, p_name: 'Hospital São Lucas' });
  });

  it('arquivar preserva o histórico em vez de apagar', async () => {
    const { client, rpc } = fakeClient();
    await archiveWorkLocation('loc-1', client);
    expect(rpc).toHaveBeenCalledWith('archive_work_location', { p_location_id: 'loc-1' });
  });

  it('propaga recusa do servidor ao criar', async () => {
    const rpc = jest.fn(async () => ({ data: null, error: new Error('premium palette') }));
    const client = { rpc } as unknown as AuthClient;
    await expect(
      createWorkLocation(
        { name: 'X', colorToken: 'terra', colorSource: 'premium_palette' },
        [],
        client,
      ),
    ).rejects.toThrow('premium palette');
  });

  it('propaga erro do banco', async () => {
    const order = jest.fn(async () => ({ data: null, error: new Error('rls') }));
    const client = {
      from: () => ({ select: () => ({ is: () => ({ order }) }) }),
    } as unknown as AuthClient;
    await expect(listWorkLocations(client)).rejects.toThrow('rls');
  });
});
