import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { motion } from '@/theme/tokens';
import { GuideTourOverlay } from './GuideTourOverlay';
import { TOUR_STEPS, useGuideTour } from './guide-tour';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderOverlay() {
  const view = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <GuideTourOverlay />
    </SafeAreaProvider>,
  );
  // O primeiro passo espera a Início ser vista antes de escurecer a tela.
  await act(async () => {
    jest.advanceTimersByTime(motion.guideStartDelay);
  });
  return view;
}

/** O alvo do passo atual "se mede" como se estivesse na tela. */
function measureCurrent() {
  const step = useGuideTour.getState().step;
  if (step === null) return;
  const target = TOUR_STEPS[step]?.target;
  if (target) useGuideTour.getState().setRect(target, { x: 20, y: 120, width: 350, height: 140 });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useGuideTour.setState({ step: null, rects: {} });
});
afterEach(() => jest.useRealTimers());

describe('guia de primeiro uso', () => {
  it('não aparece sem começar (contas existentes nunca veem o tour)', async () => {
    await renderOverlay();
    expect(screen.queryByTestId('guide-tour')).toBeNull();
  });

  it('espera 3 s na Início antes do primeiro passo', async () => {
    await act(async () => useGuideTour.getState().start());
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <GuideTourOverlay />
      </SafeAreaProvider>,
    );
    await act(async () => measureCurrent());
    await act(async () => {
      jest.advanceTimersByTime(motion.guideStartDelay - 1);
    });
    expect(screen.queryByTestId('guide-tour')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('guide-tour-card')).toBeTruthy();
    expect(motion.guideStartDelay).toBe(3000);
  });

  it('passa por Início, Agenda e Finanças, trocando de aba, e conclui na Início', async () => {
    await act(async () => useGuideTour.getState().start());
    await renderOverlay();
    const seen: string[] = [];
    for (let index = 0; index < TOUR_STEPS.length; index += 1) {
      await act(async () => measureCurrent());
      expect(screen.getByText(`${index + 1} de ${TOUR_STEPS.length}`)).toBeTruthy();
      seen.push(TOUR_STEPS[index].tab);
      await act(async () => {
        await fireEvent.press(screen.getByTestId('guide-tour-next'));
      });
    }
    expect(useGuideTour.getState().step).toBeNull();
    expect(seen).toEqual(['index', 'index', 'agenda', 'agenda', 'finances', 'finances']);
    expect(router.navigate).toHaveBeenCalledWith('/agenda');
    expect(router.navigate).toHaveBeenCalledWith('/finances');
    expect(router.navigate).toHaveBeenLastCalledWith('/');
  });

  it('mostra os textos pedidos e deixa pular a qualquer momento', async () => {
    await act(async () => useGuideTour.getState().start());
    await renderOverlay();
    await act(async () => measureCurrent());
    expect(screen.getByText('Aqui você vê quanto tem para receber neste mês.')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('guide-tour-skip'));
    });
    expect(useGuideTour.getState().step).toBeNull();
    expect(screen.queryByTestId('guide-tour')).toBeNull();
  });

  it('o último passo aponta a visão anual e troca Pular por Concluir', async () => {
    await act(async () => useGuideTour.setState({ step: TOUR_STEPS.length - 1, rects: {} }));
    await renderOverlay();
    await act(async () => measureCurrent());
    expect(screen.getByText('Veja o ano inteiro')).toBeTruthy();
    expect(screen.queryByTestId('guide-tour-skip')).toBeNull();
    expect(screen.getByText('Concluir')).toBeTruthy();
  });
});
