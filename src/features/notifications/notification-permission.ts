import { create } from 'zustand';
import { type PermissionState, readPermission, requestPermission } from './scheduler';

type PermissionStore = {
  state: PermissionState | null;
  refresh: () => Promise<PermissionState>;
  request: () => Promise<PermissionState>;
};

/**
 * Permissão do sistema compartilhada entre a sincronização, o convite e a tela do Perfil. É
 * relida ao voltar para o app (a pessoa pode ter mudado nos Ajustes).
 */
export const useNotificationPermission = create<PermissionStore>((set) => ({
  state: null,
  refresh: async () => {
    const state = await readPermission();
    set({ state });
    return state;
  },
  request: async () => {
    const state = await requestPermission();
    set({ state });
    return state;
  },
}));
