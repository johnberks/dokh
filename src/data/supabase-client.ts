import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/config/env';
import type { PublicEnv } from '@/config/env.schema';
import type { Database } from './database.types';
import { createSecureAuthStorage } from './secure-auth-storage';

export function createSupabaseClient(env: PublicEnv = getEnv()) {
  return createClient<Database>(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      storage: createSecureAuthStorage(),
      storageKey: `dokh.${env.EXPO_PUBLIC_APP_ENV}.auth`,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
