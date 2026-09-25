import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/data/database.types';
import { queryKeys } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';
import type { WorkLocationColorToken } from '@/theme/tokens';
import { nextAutomaticColorToken } from './location-colors';

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
 * Escritas passam por RPC (3.5 fecha DML de Locais para o cliente): o dono vem de
 * `auth.uid()` no servidor, que também valida a paleta — a ampliada exige Premium ativo.
 */
export async function createWorkLocation(
  input: NewWorkLocation,
  existing: readonly WorkLocation[],
  client: AuthClient = supabase,
): Promise<WorkLocation> {
  const colorToken =
    input.colorToken ?? nextAutomaticColorToken(existing.map((location) => location.colorToken));
  const { data, error } = await client.rpc('create_work_location', {
    p_name: input.name.trim(),
    p_city: (input.city?.trim() || null) as unknown as string,
    p_color_token: colorToken,
    p_color_source: input.colorSource ?? (input.colorToken ? 'free_palette' : 'automatic'),
  });
  if (error) throw error;
  return toWorkLocation(data);
}

export type WorkLocationPatch = {
  name?: string;
  city?: string | null;
  colorToken?: WorkLocationColorToken;
  colorSource?: ColorSource;
};

/** A RPC substitui o Local inteiro: o patch é aplicado sobre o estado atual. */
export async function updateWorkLocation(
  current: WorkLocation,
  patch: WorkLocationPatch,
  client: AuthClient = supabase,
): Promise<WorkLocation> {
  const city = patch.city === undefined ? current.city : patch.city;
  const { data, error } = await client.rpc('update_work_location', {
    p_location_id: current.id,
    p_name: (patch.name ?? current.name).trim(),
    p_city: (city?.trim() || null) as unknown as string,
    p_color_token: patch.colorToken ?? current.colorToken,
    p_color_source: patch.colorSource ?? current.colorSource,
  });
  if (error) throw error;
  return toWorkLocation(data);
}

/** Arquivar preserva o histórico: Trabalhos antigos mantêm a referência e o nome. */
export async function archiveWorkLocation(
  locationId: string,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client.rpc('archive_work_location', { p_location_id: locationId });
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
  const locations = useWorkLocations();
  const invalidate = useLocationsInvalidation();
  return useMutation({
    mutationFn: (input: NewWorkLocation) => createWorkLocation(input, locations.data ?? []),
    onSuccess: invalidate,
  });
}

export function useUpdateWorkLocation() {
  const invalidate = useLocationsInvalidation();
  return useMutation({
    mutationFn: ({ current, patch }: { current: WorkLocation; patch: WorkLocationPatch }) =>
      updateWorkLocation(current, patch),
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
