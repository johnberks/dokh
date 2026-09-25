import { onboardingStatusKey, readOnboardingCompletion } from './onboarding-status';
import type { AuthClient } from './session';

function clientWith(result: {
  data: { onboarding_completed_at: string | null } | null;
  error: Error | null;
}) {
  const maybeSingle = jest.fn(async () => result);
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));
  return { client: { from } as unknown as AuthClient, from, select, eq, maybeSingle };
}

describe('onboarding status', () => {
  it('separates cache entries by Supabase UUID', () => {
    expect(onboardingStatusKey('user-one')).not.toEqual(onboardingStatusKey('user-two'));
  });

  it('treats a missing or incomplete profile as first access', async () => {
    const missing = clientWith({ data: null, error: null });
    expect(await readOnboardingCompletion('user-one', missing.client)).toBe(false);
    const incomplete = clientWith({ data: { onboarding_completed_at: null }, error: null });
    expect(await readOnboardingCompletion('user-one', incomplete.client)).toBe(false);
    expect(incomplete.from).toHaveBeenCalledWith('profiles');
    expect(incomplete.select).toHaveBeenCalledWith('onboarding_completed_at');
    expect(incomplete.eq).toHaveBeenCalledWith('id', 'user-one');
  });

  it('opens tabs only after completion is persisted', async () => {
    const fixture = clientWith({
      data: { onboarding_completed_at: '2026-09-23T12:00:00Z' },
      error: null,
    });
    expect(await readOnboardingCompletion('user-one', fixture.client)).toBe(true);
  });

  it('surfaces read errors instead of treating them as incomplete onboarding', async () => {
    const fixture = clientWith({ data: null, error: new Error('offline') });
    await expect(readOnboardingCompletion('user-one', fixture.client)).rejects.toThrow('offline');
  });
});
