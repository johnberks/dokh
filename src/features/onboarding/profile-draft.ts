import { create } from 'zustand';

export type ProfileDraft = {
  displayName: string;
  /** `null` enquanto a pessoa não respondeu à pergunta de residência. */
  isResident: boolean | null;
  residencyProgram: string;
  /** Rascunho em pt-BR; a conversão para centavos acontece na validação. */
  monthlyAmount: string;
  paymentDay: number | null;
};

type ProfileDraftState = ProfileDraft & {
  update: (patch: Partial<ProfileDraft>) => void;
  reset: () => void;
};

const EMPTY: ProfileDraft = {
  displayName: '',
  isResident: null,
  residencyProgram: '',
  monthlyAmount: '',
  paymentDay: null,
};

/**
 * Rascunho do onboarding entre telas (D22: UI transitória que cruza rotas).
 * Nada é persistido no device; a gravação acontece no Supabase ao fim do fluxo.
 */
export const useProfileDraft = create<ProfileDraftState>((set) => ({
  ...EMPTY,
  update: (patch) => set(patch),
  reset: () => set(EMPTY),
}));
