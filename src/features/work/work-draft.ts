import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { WorkType } from '@/domain/work-type';

export type ExpectedEntry = { kind: 'date'; date: string } | { kind: 'unknown' };

export type WorkDraft = {
  type: WorkType | null;
  locationName: string;
  /** `YYYY-MM-DD` local. */
  workDate: string | null;
  /** `HH:MM` local; obrigatório só em Plantão. */
  startTime: string | null;
  durationMinutes: number | null;
  /** Rascunho em pt-BR; vira centavos só na validação. */
  amount: string;
  expected: ExpectedEntry | null;
  /** Criada uma vez por envio: repetir não grava dois Trabalhos. */
  idempotencyKey: string | null;
};

export type WorkDraftState = WorkDraft & {
  update: (patch: Partial<WorkDraft>) => void;
  reset: () => void;
};

const EMPTY: WorkDraft = {
  type: null,
  locationName: '',
  workDate: null,
  startTime: null,
  durationMinutes: null,
  amount: '',
  expected: null,
  idempotencyKey: null,
};

export type WorkDraftStore = UseBoundStore<StoreApi<WorkDraftState>>;

function createWorkDraftStore(): WorkDraftStore {
  return create<WorkDraftState>((set) => ({
    ...EMPTY,
    update: (patch) => set(patch),
    reset: () => set(EMPTY),
  }));
}

/** Rascunho do primeiro Trabalho entre telas do onboarding (D22). Nada é persistido no device. */
export const useWorkDraft = createWorkDraftStore();

/** Rascunho do fluxo `+` (Agenda 06–10); separado para não misturar com o onboarding. */
export const useNewWorkDraft = createWorkDraftStore();
