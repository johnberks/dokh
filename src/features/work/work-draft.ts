import { create } from 'zustand';
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

type WorkDraftState = WorkDraft & {
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

/** Rascunho do primeiro Trabalho entre telas (D22). Nada é persistido no device. */
export const useWorkDraft = create<WorkDraftState>((set) => ({
  ...EMPTY,
  update: (patch) => set(patch),
  reset: () => set(EMPTY),
}));
