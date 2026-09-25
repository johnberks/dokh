import { createSecureAuthStorage } from './secure-auth-storage';

function fakeSecureStore() {
  const values = new Map<string, string>();
  return {
    values,
    port: {
      getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
      setItemAsync: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      deleteItemAsync: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    },
  };
}

describe('Supabase auth SecureStore adapter', () => {
  const key = 'dokh.local.auth';

  it('persists a large Unicode session across adapter instances in bounded secure chunks', async () => {
    const { values, port } = fakeSecureStore();
    const session = `access.${'a'.repeat(2800)}.${'😀'.repeat(900)}`;
    await createSecureAuthStorage(port).setItem(key, session);

    expect(await createSecureAuthStorage(port).getItem(key)).toBe(session);
    expect(values.size).toBeGreaterThan(2);
    expect([...values.values()].every((value) => Array.from(value).length <= 400)).toBe(true);
    expect([...values.values()]).not.toContain(session);
  });

  it('commits replacements last and deletes the prior session shards', async () => {
    const { values, port } = fakeSecureStore();
    const storage = createSecureAuthStorage(port);
    await storage.setItem(key, 'old-session'.repeat(200));
    const oldKeys = [...values.keys()].filter((name) => name !== key);

    await storage.setItem(key, 'new-session'.repeat(200));
    expect(await storage.getItem(key)).toBe('new-session'.repeat(200));
    expect(oldKeys.every((name) => !values.has(name))).toBe(true);
  });

  it('keeps the last committed session if a replacement write fails', async () => {
    const { port } = fakeSecureStore();
    const storage = createSecureAuthStorage(port);
    await storage.setItem(key, 'old-session');
    const setItem = port.setItemAsync;
    setItem.mockImplementationOnce(async () => {
      throw new Error('native write failed');
    });

    await expect(storage.setItem(key, 'new-session')).rejects.toThrow('native write failed');
    expect(await storage.getItem(key)).toBe('old-session');
  });

  it('removes the manifest and every session shard on logout', async () => {
    const { values, port } = fakeSecureStore();
    const storage = createSecureAuthStorage(port);
    await storage.setItem(key, 'private-token'.repeat(300));
    await storage.removeItem(key);

    expect(await createSecureAuthStorage(port).getItem(key)).toBeNull();
    expect(values.size).toBe(0);
  });
});
