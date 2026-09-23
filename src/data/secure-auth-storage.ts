import * as SecureStore from 'expo-secure-store';

type SecureStorePort = Pick<
  typeof SecureStore,
  'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'
>;

type Manifest = { version: 1; id: string; parts: number };

// 400 Unicode code points are at most 1,600 UTF-8 bytes, below older iOS limits.
const CHUNK_CODE_POINTS = 400;
const MAX_PARTS = 256;
let writeSequence = 0;

function parseManifest(raw: string | null): Manifest | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      'version' in value &&
      value.version === 1 &&
      'id' in value &&
      typeof value.id === 'string' &&
      /^[a-z0-9-]+$/.test(value.id) &&
      'parts' in value &&
      typeof value.parts === 'number' &&
      Number.isInteger(value.parts) &&
      value.parts > 0 &&
      value.parts <= MAX_PARTS
    ) {
      return value as Manifest;
    }
  } catch {
    // Invalid or interrupted metadata must never be interpreted as a session.
  }
  return null;
}

function partKey(key: string, manifest: Manifest, index: number) {
  return `${key}.${manifest.id}.${index}`;
}

async function removeParts(store: SecureStorePort, key: string, manifest: Manifest) {
  await Promise.all(
    Array.from({ length: manifest.parts }, (_, index) =>
      store.deleteItemAsync(partKey(key, manifest, index)),
    ),
  );
}

/** Supabase Auth storage. Session content never touches AsyncStorage or plain files. */
export function createSecureAuthStorage(store: SecureStorePort = SecureStore) {
  return {
    async getItem(key: string): Promise<string | null> {
      const manifest = parseManifest(await store.getItemAsync(key));
      if (!manifest) return null;
      const parts = await Promise.all(
        Array.from({ length: manifest.parts }, (_, index) =>
          store.getItemAsync(partKey(key, manifest, index)),
        ),
      );
      return parts.every((part): part is string => part !== null) ? parts.join('') : null;
    },
    async setItem(key: string, value: string): Promise<void> {
      const previous = parseManifest(await store.getItemAsync(key));
      const codePoints = Array.from(value);
      const chunks: string[] = [];
      for (let index = 0; index < codePoints.length; index += CHUNK_CODE_POINTS) {
        chunks.push(codePoints.slice(index, index + CHUNK_CODE_POINTS).join(''));
      }
      if (chunks.length === 0) chunks.push('');
      if (chunks.length > MAX_PARTS)
        throw new Error('Auth session exceeds secure storage capacity');

      const manifest: Manifest = {
        version: 1,
        id: `${Date.now().toString(36)}-${(++writeSequence).toString(36)}-${Math.floor(Math.random() * 0x100000000).toString(36)}`,
        parts: chunks.length,
      };
      const written: string[] = [];
      try {
        for (const [index, chunk] of chunks.entries()) {
          const name = partKey(key, manifest, index);
          await store.setItemAsync(name, chunk);
          written.push(name);
        }
        // Commit last: an interrupted write leaves the previous session readable.
        await store.setItemAsync(key, JSON.stringify(manifest));
      } catch (error) {
        await Promise.allSettled(written.map((name) => store.deleteItemAsync(name)));
        throw error;
      }
      if (previous) await removeParts(store, key, previous);
    },
    async removeItem(key: string): Promise<void> {
      const manifest = parseManifest(await store.getItemAsync(key));
      await store.deleteItemAsync(key);
      if (manifest) await removeParts(store, key, manifest);
    },
  };
}
