import { create } from 'zustand';

type IntroState = {
  /** UI transitória da sessão atual: nada de domínio é persistido no device (D20). */
  seen: boolean;
  markSeen: () => void;
};

export const useIntroState = create<IntroState>((set) => ({
  seen: false,
  markSeen: () => set({ seen: true }),
}));
