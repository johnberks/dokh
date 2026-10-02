import { create } from 'zustand';
import type { OnboardingFocus } from '@/features/onboarding/profile-data';

export type TourTargetId =
  | 'home-amount'
  | 'tab-bar'
  | 'agenda-add'
  | 'agenda-calendar'
  | 'finances-value'
  | 'finances-period'
  /** Abas de destino, acesas na passagem entre seções. */
  | 'tab-index'
  | 'tab-agenda'
  | 'tab-finances';

export type TourTab = 'index' | 'agenda' | 'finances';

export type TourStep = {
  target: TourTargetId;
  tab: TourTab;
  /** Chaves em `navigation.guide.<key>.title/body`. */
  key:
    | 'homeAmount'
    | 'tabBar'
    | 'agendaAdd'
    | 'agendaCalendar'
    | 'financesValue'
    | 'financesPeriod';
};

/** Tour curto pedido pelo usuário (2026-09-28): Início → Agenda → Finanças. */
export const TOUR_STEPS: readonly TourStep[] = [
  { target: 'home-amount', tab: 'index', key: 'homeAmount' },
  { target: 'tab-bar', tab: 'index', key: 'tabBar' },
  { target: 'agenda-add', tab: 'agenda', key: 'agendaAdd' },
  { target: 'agenda-calendar', tab: 'agenda', key: 'agendaCalendar' },
  { target: 'finances-value', tab: 'finances', key: 'financesValue' },
  { target: 'finances-period', tab: 'finances', key: 'financesPeriod' },
];

/**
 * O guia começa pela seção do foco escolhido no onboarding (7.7); as etapas são as mesmas,
 * muda só a ordem. Ganhos (ou sem foco) começa pelos valores do mês na Início.
 */
export function tourStepsFor(focus: OnboardingFocus | null): readonly TourStep[] {
  const home = TOUR_STEPS.filter((step) => step.tab === 'index');
  const agenda = TOUR_STEPS.filter((step) => step.tab === 'agenda');
  const finances = TOUR_STEPS.filter((step) => step.tab === 'finances');
  if (focus === 'work') return [...agenda, ...home, ...finances];
  if (focus === 'receivables') return [...finances, ...home, ...agenda];
  return TOUR_STEPS;
}

export type TourRect = { x: number; y: number; width: number; height: number };

type TourState = {
  /** `null` quando o tour não está acontecendo. */
  step: number | null;
  /** Etapas na ordem do foco escolhido. */
  steps: readonly TourStep[];
  rects: Partial<Record<TourTargetId, TourRect>>;
  /** Passagem para outra seção: a aba de destino fica acesa antes de a tela trocar. */
  going: TourTab | null;
  start: (focus?: OnboardingFocus | null) => void;
  goTo: (tab: TourTab) => void;
  next: () => void;
  /** Pular e concluir terminam igual: o tour não volta nesta sessão. */
  finish: () => void;
  setRect: (id: TourTargetId, rect: TourRect) => void;
};

/**
 * Estado do guia de primeiro uso. Só começa quando uma conta nova conclui o onboarding
 * (`OnboardingDoneScreen`); nada é gravado no aparelho nem no servidor (D20), então contas
 * existentes nunca veem o tour e fechar o app no meio simplesmente o encerra.
 */
export const useGuideTour = create<TourState>((set, get) => ({
  step: null,
  steps: TOUR_STEPS,
  rects: {},
  going: null,
  start: (focus = null) => set({ step: 0, steps: tourStepsFor(focus), rects: {}, going: null }),
  goTo: (tab) => set({ going: tab }),
  next: () => {
    const { step, steps } = get();
    if (step === null) return;
    set({ step: step + 1 < steps.length ? step + 1 : null, going: null });
  },
  finish: () => set({ step: null, going: null }),
  setRect: (id, rect) => set((state) => ({ rects: { ...state.rects, [id]: rect } })),
}));

/** Sempre com as etapas do estado: a ordem depende do foco (7.7). */
export function currentTourStep(step: number | null, steps: readonly TourStep[]): TourStep | null {
  return step === null ? null : (steps[step] ?? null);
}
