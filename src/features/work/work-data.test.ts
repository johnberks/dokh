import type { AuthClient } from '@/features/auth/session';
import {
  confirmReceivableReceived,
  createWorkWithReceivable,
  deleteWorkWithReceivable,
  updateWorkWithReceivable,
  type WorkAggregateInput,
} from './work-data';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-1' }));

const SHIFT: WorkAggregateInput = {
  type: 'shift',
  locationId: 'loc-1',
  workDate: '2026-09-12',
  startTime: '19:00',
  durationMinutes: 720,
  amountCents: 120000n,
  expectedOn: '2026-10-12',
  timezone: 'America/Sao_Paulo',
};

type RpcCall = [name: string, args: Record<string, unknown>];

function fakeClient(rows: unknown[] = [{ work_id: 'w1', receivable_id: 'r1' }]) {
  const rpc = jest.fn(async (..._call: RpcCall) => ({ data: rows, error: null }));
  return { client: { rpc } as unknown as AuthClient, rpc };
}

describe('agregado Trabalho + Recebível', () => {
  it('cria pela RPC atômica, com centavos e chave de idempotência', async () => {
    const { client, rpc } = fakeClient();
    const result = await createWorkWithReceivable(SHIFT, 'key-1', client);
    expect(result).toEqual({ workId: 'w1', receivableId: 'r1' });
    expect(rpc).toHaveBeenCalledWith('create_work_with_receivable', {
      p_type: 'shift',
      p_location_id: 'loc-1',
      p_work_date: '2026-09-12',
      p_start_time: '19:00',
      p_duration_minutes: 720,
      p_description: null,
      p_amount_cents: 120000,
      p_expected_on: '2026-10-12',
      p_timezone: 'America/Sao_Paulo',
      p_idempotency_key: 'key-1',
    });
  });

  it('trabalho sem previsão de entrada envia data nula', async () => {
    const { client, rpc } = fakeClient();
    await createWorkWithReceivable(
      { ...SHIFT, type: 'appointment', startTime: null, durationMinutes: null, expectedOn: null },
      'key-2',
      client,
    );
    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_type: 'appointment',
      p_start_time: null,
      p_duration_minutes: null,
      p_expected_on: null,
    });
  });

  it('editar envia o identificador do Trabalho junto', async () => {
    const { client, rpc } = fakeClient();
    await updateWorkWithReceivable('w1', SHIFT, 'key-3', client);
    expect(rpc.mock.calls[0][0]).toBe('update_work_with_receivable');
    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_work_entry_id: 'w1',
      p_idempotency_key: 'key-3',
    });
  });

  it('excluir usa a RPC lógica com chave de idempotência', async () => {
    const { client, rpc } = fakeClient();
    await deleteWorkWithReceivable('w1', 'key-4', client);
    expect(rpc).toHaveBeenCalledWith('delete_work_with_receivable', {
      p_work_entry_id: 'w1',
      p_idempotency_key: 'key-4',
    });
  });

  it('confirmação devolve o horário do servidor', async () => {
    const { client, rpc } = fakeClient([
      { receivable_id: 'r1', received_at: '2026-10-12T12:00:00Z' },
    ]);
    const result = await confirmReceivableReceived('r1', client);
    expect(rpc).toHaveBeenCalledWith('confirm_receivable_received', { p_receivable_id: 'r1' });
    expect(result).toEqual({ receivableId: 'r1', receivedAt: '2026-10-12T12:00:00Z' });
  });

  it('falha explicitamente quando o servidor não devolve linha', async () => {
    const { client } = fakeClient([]);
    await expect(createWorkWithReceivable(SHIFT, 'key-5', client)).rejects.toThrow(
      'create_work_with_receivable returned no row',
    );
  });

  it('propaga erro da RPC', async () => {
    const rpc = jest.fn(async () => ({ data: null, error: new Error('permission denied') }));
    const client = { rpc } as unknown as AuthClient;
    await expect(confirmReceivableReceived('r1', client)).rejects.toThrow('permission denied');
  });
});
