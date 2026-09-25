import type { AuthClient } from '@/features/auth/session';
import { currentMonthStart, saveOnboardingProfile } from './profile-data';

type UpsertCall = [Record<string, unknown>, { onConflict: string }];

function fakeClient() {
  const upsert = jest.fn(async (..._args: UpsertCall) => ({ error: null }));
  const rpc = jest.fn(async () => ({ error: null }));
  const client = { from: jest.fn(() => ({ upsert })), rpc } as unknown as AuthClient;
  return { client, upsert, rpc };
}

describe('gravação do perfil do onboarding', () => {
  it('generalista grava sem especialidade e não cria residência', async () => {
    const { client, upsert, rpc } = fakeClient();
    await saveOnboardingProfile(
      'user-1',
      { displayName: '  Anna  ', timezone: 'America/Sao_Paulo', isResident: false },
      client,
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        display_name: 'Anna',
        professional_status: 'general_practitioner',
        specialty: null,
        timezone: 'America/Sao_Paulo',
      }),
      { onConflict: 'id' },
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it('residente grava a especialidade e cria a bolsa mensal Free', async () => {
    const { client, upsert, rpc } = fakeClient();
    await saveOnboardingProfile(
      'user-2',
      {
        displayName: 'Anna',
        timezone: 'America/Sao_Paulo',
        isResident: true,
        residencyProgram: 'Cardiologia',
        monthlyAmountCents: 365442n,
        paymentDay: 5,
        startsOn: '2026-09-01',
      },
      client,
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ professional_status: 'resident', specialty: 'Cardiologia' }),
      { onConflict: 'id' },
    );
    expect(rpc).toHaveBeenCalledWith(
      'create_or_update_residency',
      expect.objectContaining({
        p_specialty: 'Cardiologia',
        p_monthly_amount_cents: 365442,
        p_payment_day: 5,
        p_starts_on: '2026-09-01',
      }),
    );
  });

  it('não marca o onboarding como concluído (isso é da 7.5)', async () => {
    const { client, upsert } = fakeClient();
    await saveOnboardingProfile(
      'user-3',
      { displayName: 'Anna', timezone: 'America/Sao_Paulo', isResident: false },
      client,
    );
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('onboarding_completed_at');
  });

  it('propaga erro do perfil sem tentar criar residência', async () => {
    const upsert = jest.fn(async () => ({ error: new Error('rls') }));
    const rpc = jest.fn(async () => ({ error: null }));
    const client = { from: jest.fn(() => ({ upsert })), rpc } as unknown as AuthClient;
    await expect(
      saveOnboardingProfile(
        'user-4',
        {
          displayName: 'Anna',
          timezone: 'America/Sao_Paulo',
          isResident: true,
          residencyProgram: 'Pediatria',
          monthlyAmountCents: 100000n,
          paymentDay: 10,
          startsOn: '2026-09-01',
        },
        client,
      ),
    ).rejects.toThrow('rls');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('usa o primeiro dia do mês no fuso do usuário', () => {
    const lastDayLate = new Date('2026-09-30T23:30:00-03:00');
    expect(currentMonthStart('America/Sao_Paulo', lastDayLate)).toBe('2026-09-01');
    // Em Kiritimati já é outubro no mesmo instante.
    expect(currentMonthStart('Pacific/Kiritimati', lastDayLate)).toBe('2026-10-01');
  });
});
