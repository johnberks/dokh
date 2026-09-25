import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/data/database.types';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { nextAutomaticColorToken } from '@/domain/work-location-colors';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import type { WorkLocationColorToken } from '@/theme/tokens';

export type WorkLocationRow = Database['public']['Tables']['work_locations']['Row'];
export type ColorSource = Database['public']['Enums']['work_location_color_source'];

export type WorkLocation = {
  id: string;
  name: string;
  city: string | null;
  colorToken: string;
  colorSource: ColorSource;
  archivedAt: string | null;
};

function toWorkLocation(row: WorkLocationRow): WorkLocation {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    colorToken: row.color_token,
    colorSource: row.color_source,
    archivedAt: row.archived_at,
  };
}

/** Locais ativos, em ordem alfabética. Arquivados saem dos seletores e ficam no histórico. */
export async function listWorkLocations(client: AuthClient = supabase): Promise<WorkLocation[]> {
  const { data, error } = await client
    .from('work_locations')
    .select('*')
    .is('archived_at', null)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toWorkLocation);
}

export type NewWorkLocation = {
  name: string;
  city?: string | null;
  /** Sem cor escolhida, a automática vem do rodízio da paleta livre. */
  colorToken?: WorkLocationColorToken;
  colorSource?: ColorSource;
};

/**
 * `user_id` vem da sessão do app e é conferido pela RLS (`auth.uid() = user_id`);
 * o banco recusa qualquer outro dono, então o cliente não consegue escrever por terceiros.
 */
export async function createWorkLocation(
  userId: string,
  input: NewWorkLocation,
  existing: readonly WorkLocation[],
  client: AuthClient = supabase,
): Promise<WorkLocation> {
  const colorToken =
    input.colorToken ?? nextAutomaticColorToken(existing.map((location) => location.colorToken));
  const { data, error } = await client
    .from('work_locations')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      city: input.city?.trim() || null,
      color_token: colorToken,
      color_source: input.colorSource ?? (input.colorToken ? 'free_palette' : 'automatic'),
    })
    .select('*')
    .single();
  if (error) throw error;
  return toWorkLocation(data);
}

export type WorkLocationPatch = {
  name?: string;
  city?: string | null;
  colorToken?: WorkLocationColorToken;
  colorSource?: ColorSource;
};

export async function updateWorkLocation(
  locationId: string,
  patch: WorkLocationPatch,
  client: AuthClient = supabase,
): Promise<WorkLocation> {
  const { data, error } = await client
    .from('work_locations')
    .update({
      ...(patch.name === undefined ? {} : { name: patch.name.trim() }),
      ...(patch.city === undefined ? {} : { city: patch.city?.trim() || null }),
      ...(patch.colorToken === undefined ? {} : { color_token: patch.colorToken }),
      ...(patch.colorSource === undefined ? {} : { color_source: patch.colorSource }),
    })
    .eq('id', locationId)
    .select('*')
    .single();
  if (error) throw error;
  return toWorkLocation(data);
}

/** Arquivar preserva o histórico: Trabalhos antigos mantêm a referência e o nome. */
export async function archiveWorkLocation(
  locationId: string,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client
    .from('work_locations')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', locationId);
  if (error) throw error;
}

export function useWorkLocations() {
  const session = useAuthSession();
  return useQuery({
    queryKey: queryKeys.workLocations(session.userId ?? ''),
    queryFn: () => listWorkLocations(),
    enabled: session.userId !== null,
  });
}

function useLocationsInvalidation() {
  const session = useAuthSession();
  const queryClient = useQueryClient();
  return () => {
    if (session.userId === null) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.workLocations(session.userId) });
  };
}

export function useCreateWorkLocation() {
  const session = useAuthSession();
  const locations = useWorkLocations();
  const invalidate = useLocationsInvalidation();
  return useMutation({
    mutationFn: (input: NewWorkLocation) => {
      if (session.userId === null) throw new Error('missing session');
      return createWorkLocation(session.userId, input, locations.data ?? []);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateWorkLocation() {
  const invalidate = useLocationsInvalidation();
  return useMutation({
    mutationFn: ({ locationId, patch }: { locationId: string; patch: WorkLocationPatch }) =>
      updateWorkLocation(locationId, patch),
    onSuccess: invalidate,
  });
}

export function useArchiveWorkLocation() {
  const invalidate = useLocationsInvalidation();
  return useMutation({
    mutationFn: (locationId: string) => archiveWorkLocation(locationId),
    onSuccess: invalidate,
  });
}
