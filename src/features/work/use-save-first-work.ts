import { useSaveWork } from './use-save-work';
import { useWorkDraft } from './work-draft';

/** Primeiro Trabalho do onboarding; a tela de valor já exige a previsão antes de salvar. */
export function useSaveFirstWork() {
  return useSaveWork(useWorkDraft);
}
