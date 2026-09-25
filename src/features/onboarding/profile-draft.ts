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

/**
 * Bolsa e dia já vêm sugeridos, como diz o HTML ("valor líquido padrão da bolsa · toque
 * para ajustar"). São apenas padrões editáveis: nada é gravado sem a pessoa confirmar.
 */
export const DEFAULT_RESIDENCY_AMOUNT = '3.654,42';
export const DEFAULT_RESIDENCY_PAYMENT_DAY = 5;

const EMPTY: ProfileDraft = {
  displayName: '',
  isResident: null,
  residencyProgram: '',
  monthlyAmount: DEFAULT_RESIDENCY_AMOUNT,
  paymentDay: DEFAULT_RESIDENCY_PAYMENT_DAY,
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
