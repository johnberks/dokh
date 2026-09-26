import type { AuthClient } from '@/features/auth/session';
import { readPremiumActive } from './entitlement';

function client(row: unknown) {
  return {
    from: () => ({ select: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }),
  } as unknown as AuthClient;
}

describe('Premium pelo espelho do servidor', () => {
  const now = new Date('2026-09-26T12:00:00Z');

  it('sem registro ou inativo é Free', async () => {
    expect(await readPremiumActive(now, client(null))).toBe(false);
    expect(await readPremiumActive(now, client({ is_active: false, expires_at: null }))).toBe(
      false,
    );
  });

  it('ativo sem expiração ou com expiração futura é Premium; expirado não', async () => {
    expect(await readPremiumActive(now, client({ is_active: true, expires_at: null }))).toBe(true);
    expect(
      await readPremiumActive(now, client({ is_active: true, expires_at: '2026-10-26T00:00:00Z' })),
    ).toBe(true);
    expect(
      await readPremiumActive(now, client({ is_active: true, expires_at: '2026-09-01T00:00:00Z' })),
    ).toBe(false);
  });
});
