import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { queryKeys, workAffectedPrefixes } from '@/data/query-keys';
import { supabase } from '@/data/supabase-client';
import { useAuthSession } from '@/features/auth/AuthSessionProvider';
import type { AuthClient } from '@/features/auth/session';

/**
 * Situação profissional explícita (11.10). Nunca é inferida da residência:
 * sem residência ≠ generalista. `resident` e `specialist` exigem especialidade.
 */
export type ProfessionalStatus = 'general_practitioner' | 'resident' | 'specialist';

export function needsSpecialty(status: ProfessionalStatus): boolean {
  return status !== 'general_practitioner';
}

type StatusLabelKey =
  | 'status.resident'
  | 'status.residentNoSpecialty'
  | 'status.generalist'
  | 'status.specialist'
  | 'status.specialistNoSpecialty';

/** "Residente de Clínica Médica", "Generalista" ou "Especialista em Cardiologia". */
export function professionalStatusLabel(
  status: ProfessionalStatus,
  specialty: string | null,
  t: (key: StatusLabelKey, options?: { specialty: string }) => string,
): string {
  const name = specialty?.trim() ?? '';
  if (status === 'general_practitioner') return t('status.generalist');
  if (status === 'resident') {
    return name ? t('status.resident', { specialty: name }) : t('status.residentNoSpecialty');
  }
  return name ? t('status.specialist', { specialty: name }) : t('status.specialistNoSpecialty');
}

export type Profile = {
  displayName: string;
  graduationYear: number | null;
  status: ProfessionalStatus;
  specialty: string | null;
  city: string | null;
  avatarPath: string | null;
  /** URL assinada e temporária da foto (bucket privado); `null` sem foto. */
  avatarUrl: string | null;
};

const AVATAR_BUCKET = 'avatars';
const AVATAR_URL_SECONDS = 60 * 60;

/** Iniciais para o avatar sem foto: primeira letra do primeiro e do último nome. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

export async function readProfile(
  userId: string,
  client: AuthClient = supabase,
): Promise<Profile | null> {
  const { data, error } = await client
    .from('profiles')
    .select('display_name, graduation_year, professional_status, specialty, city, avatar_path')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  let avatarUrl: string | null = null;
  if (data.avatar_path) {
    const signed = await client.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(data.avatar_path, AVATAR_URL_SECONDS);
    // Foto indisponível não derruba o Perfil: cai nas iniciais.
    avatarUrl = signed.error ? null : signed.data.signedUrl;
  }
  return {
    displayName: data.display_name,
    graduationYear: data.graduation_year,
    status: data.professional_status,
    specialty: data.specialty,
    city: data.city,
    avatarPath: data.avatar_path,
    avatarUrl,
  };
}

export type ProfilePatch = {
  displayName: string;
  graduationYear: number | null;
  status: ProfessionalStatus;
  specialty: string | null;
  city: string | null;
};

/**
 * Generalista não tem especialidade — o banco recusa o contrário. Sair de `resident`
 * encerra a residência ativa no servidor (trigger da 11.10): a bolsa futura sai de Finanças.
 */
export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({
      display_name: patch.displayName.trim(),
      graduation_year: patch.graduationYear,
      professional_status: patch.status,
      specialty: needsSpecialty(patch.status) ? patch.specialty?.trim() || null : null,
      city: patch.city?.trim() || null,
    })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Troca a foto: envia um arquivo novo (sem UPDATE no Storage, 3.6), aponta o perfil para ele
 * e só então apaga o anterior. Falhar ao apagar o antigo não desfaz a troca.
 */
export async function replaceAvatar(
  userId: string,
  file: { uri: string; mimeType: string },
  previousPath: string | null,
  client: AuthClient = supabase,
): Promise<string> {
  const extension = file.mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/avatar-${randomUUID()}.${extension}`;
  const body = await (await fetch(file.uri)).arrayBuffer();
  const upload = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, body, { contentType: file.mimeType, upsert: false });
  if (upload.error) throw upload.error;
  const { error } = await client.from('profiles').update({ avatar_path: path }).eq('id', userId);
  if (error) {
    await client.storage.from(AVATAR_BUCKET).remove([path]);
    throw error;
  }
  if (previousPath) await client.storage.from(AVATAR_BUCKET).remove([previousPath]);
  return path;
}

export async function removeAvatar(
  userId: string,
  previousPath: string,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client.from('profiles').update({ avatar_path: null }).eq('id', userId);
  if (error) throw error;
  await client.storage.from(AVATAR_BUCKET).remove([previousPath]);
}

export type Residency = {
  id: string;
  specialty: string;
  institution: string | null;
  levelLabel: string | null;
  /** `YYYY-MM-DD`. */
  startsOn: string;
  expectedEndsOn: string | null;
  monthlyAmountCents: bigint;
  paymentDay: number;
};

export async function readActiveResidency(
  client: AuthClient = supabase,
): Promise<Residency | null> {
  const { data, error } = await client
    .from('residencies')
    .select(
      'id, specialty, institution, level_label, starts_on, expected_ends_on, monthly_amount_cents, payment_day',
    )
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    specialty: data.specialty,
    institution: data.institution,
    levelLabel: data.level_label,
    startsOn: data.starts_on,
    expectedEndsOn: data.expected_ends_on,
    monthlyAmountCents: BigInt(data.monthly_amount_cents),
    paymentDay: data.payment_day,
  };
}

export type ResidencyInput = Omit<Residency, 'id'>;

/**
 * Cria ou edita a bolsa pela RPC Free da 3.9 (reconcilia só os meses futuros). Só existe para
 * quem é residente (a RPC recusa o contrário, 11.10); o programa vira a especialidade do perfil.
 */
export async function saveResidency(
  userId: string,
  residencyId: string | null,
  input: ResidencyInput,
  client: AuthClient = supabase,
): Promise<void> {
  const { error: profileError } = await client
    .from('profiles')
    .update({ professional_status: 'resident', specialty: input.specialty.trim() })
    .eq('id', userId);
  if (profileError) throw profileError;
  const { error } = await client.rpc('create_or_update_residency', {
    p_residency_id: residencyId as unknown as string,
    p_specialty: input.specialty.trim(),
    p_institution: (input.institution?.trim() || null) as unknown as string,
    p_level_label: (input.levelLabel?.trim() || null) as unknown as string,
    p_starts_on: input.startsOn,
    p_expected_ends_on: input.expectedEndsOn as unknown as string,
    p_monthly_amount_cents: Number(input.monthlyAmountCents),
    p_payment_day: input.paymentDay,
  });
  if (error) throw error;
}

/** Encerra a bolsa: recebidos ficam, meses futuros saem de Finanças (RPC da 3.9). */
export async function endResidency(
  residencyId: string,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client.rpc('deactivate_residency', { p_residency_id: residencyId });
  if (error) throw error;
}

export type WorkPreferences = {
  durationMinutes: number | null;
  /** `HH:MM`. */
  startTime: string | null;
  paymentTermDays: 30 | 60 | 90 | null;
};

export const EMPTY_PREFERENCES: WorkPreferences = {
  durationMinutes: null,
  startTime: null,
  paymentTermDays: null,
};

export async function readWorkPreferences(client: AuthClient = supabase): Promise<WorkPreferences> {
  const { data, error } = await client
    .from('work_preferences')
    .select('default_duration_minutes, default_start_time, default_payment_term_days')
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_PREFERENCES;
  const term = data.default_payment_term_days;
  return {
    durationMinutes: data.default_duration_minutes,
    startTime: data.default_start_time ? data.default_start_time.slice(0, 5) : null,
    paymentTermDays: term === 30 || term === 60 || term === 90 ? term : null,
  };
}

export async function saveWorkPreferences(
  userId: string,
  preferences: WorkPreferences,
  client: AuthClient = supabase,
): Promise<void> {
  const { error } = await client.from('work_preferences').upsert(
    {
      user_id: userId,
      default_duration_minutes: preferences.durationMinutes,
      default_start_time: preferences.startTime,
      default_payment_term_days: preferences.paymentTermDays,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

/** Trabalhos ativos por Local (lista de Locais mostra a contagem, nunca valores). */
export async function readLocationWorkCounts(
  client: AuthClient = supabase,
): Promise<Record<string, number>> {
  const { data, error } = await client
    .from('work_entries')
    .select('location_id')
    .is('deleted_at', null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.location_id] = (counts[row.location_id] ?? 0) + 1;
  return counts;
}

export async function readAccountEmail(client: AuthClient = supabase): Promise<string | null> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user?.email ?? null;
}

export function useProfile() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ''),
    queryFn: () => readProfile(userId ?? ''),
    enabled: userId !== null,
  });
}

export function useActiveResidency() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.profileResidency(userId ?? ''),
    queryFn: () => readActiveResidency(),
    enabled: userId !== null,
  });
}

export function useWorkPreferences() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.workPreferences(userId ?? ''),
    queryFn: () => readWorkPreferences(),
    enabled: userId !== null,
  });
}

export function useLocationWorkCounts() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.locationWorkCounts(userId ?? ''),
    queryFn: () => readLocationWorkCounts(),
    enabled: userId !== null,
  });
}

export function useAccountEmail() {
  const { userId } = useAuthSession();
  return useQuery({
    queryKey: queryKeys.account(userId ?? ''),
    queryFn: () => readAccountEmail(),
    enabled: userId !== null,
  });
}

/** Perfil, Início (nome, residência) e Finanças (bolsa) leem os mesmos dados. */
function useProfileInvalidation() {
  const { userId } = useAuthSession();
  const queryClient = useQueryClient();
  return () => {
    if (userId === null) return;
    void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    for (const prefix of workAffectedPrefixes) {
      void queryClient.invalidateQueries({ queryKey: [prefix, userId] });
    }
  };
}

function requireUser(userId: string | null): string {
  if (userId === null) throw new Error('missing session');
  return userId;
}

export function useUpdateProfile() {
  const { userId } = useAuthSession();
  const invalidate = useProfileInvalidation();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => updateProfile(requireUser(userId), patch),
    onSuccess: invalidate,
  });
}

export function useReplaceAvatar() {
  const { userId } = useAuthSession();
  const invalidate = useProfileInvalidation();
  return useMutation({
    mutationFn: ({
      file,
      previousPath,
    }: {
      file: { uri: string; mimeType: string };
      previousPath: string | null;
    }) => replaceAvatar(requireUser(userId), file, previousPath),
    onSuccess: invalidate,
  });
}

export function useRemoveAvatar() {
  const { userId } = useAuthSession();
  const invalidate = useProfileInvalidation();
  return useMutation({
    mutationFn: (previousPath: string) => removeAvatar(requireUser(userId), previousPath),
    onSuccess: invalidate,
  });
}

export function useSaveResidency() {
  const { userId } = useAuthSession();
  const invalidate = useProfileInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: ResidencyInput }) =>
      saveResidency(requireUser(userId), id, input),
    onSuccess: invalidate,
  });
}

export function useEndResidency() {
  const invalidate = useProfileInvalidation();
  return useMutation({
    mutationFn: (residencyId: string) => endResidency(residencyId),
    onSuccess: invalidate,
  });
}

export function useSaveWorkPreferences() {
  const { userId } = useAuthSession();
  const invalidate = useProfileInvalidation();
  return useMutation({
    mutationFn: (preferences: WorkPreferences) =>
      saveWorkPreferences(requireUser(userId), preferences),
    onSuccess: invalidate,
  });
}
