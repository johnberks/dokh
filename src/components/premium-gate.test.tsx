import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { colors, premiumGateMetrics } from '@/theme/tokens';
import { PremiumBadge } from './PremiumBadge';
import { PremiumGate } from './PremiumGate';
import { PrimitivesCatalog } from './PrimitivesCatalog';

function Gate(props: Partial<Parameters<typeof PremiumGate>[0]>) {
  return (
    <PremiumGate
      title="Cada lugar com a sua cor."
      description="Personalize seus locais."
      preview={<Text>{'Hospital São Lucas'}</Text>}
      onLearnMore={jest.fn()}
      freeExitLabel="Usar cor automática"
      onContinueFree={jest.fn()}
      testID="gate"
      {...props}
    />
  );
}

describe('PremiumBadge', () => {
  it('mostra "DOKH PREMIUM" nas folhas e "PREMIUM" nos cartões, com borda bronze', async () => {
    const { rerender } = await render(<PremiumBadge testID="badge" />);
    expect(screen.getByText('DOKH PREMIUM')).toBeTruthy();
    expect(screen.getByTestId('badge')).toHaveStyle({ borderColor: colors.premiumBadgeBorder });
    await rerender(<PremiumBadge size="short" />);
    expect(screen.getByText('PREMIUM')).toBeTruthy();
  });
});

describe('PremiumGate', () => {
  it('explica o benefício antes de oferecer o Premium (selo, título e descrição)', async () => {
    await render(<Gate />);
    expect(screen.getByText('DOKH PREMIUM')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Cada lugar com a sua cor.' })).toHaveStyle({
      fontSize: premiumGateMetrics.titleSize,
    });
    expect(screen.getByText('Personalize seus locais.')).toBeTruthy();
  });

  it('a prévia é real, sem interação e resumida para o leitor de tela', async () => {
    await render(<Gate />);
    const preview = screen.getByTestId('gate-preview');
    expect(preview.props.pointerEvents).toBe('none');
    expect(preview.props.accessibilityLabel).toBe('Prévia do recurso Premium');
    expect(screen.queryByText('Hospital São Lucas')).toBeNull();
    expect(screen.getByText('Hospital São Lucas', { includeHiddenElements: true })).toBeTruthy();
  });

  it('CTA leva aos benefícios e a saída Free fica sempre disponível', async () => {
    const onLearnMore = jest.fn();
    const onContinueFree = jest.fn();
    await render(<Gate onLearnMore={onLearnMore} onContinueFree={onContinueFree} />);
    const cta = screen.getByRole('button', { name: 'Conhecer DOKH Premium' });
    expect(cta).toHaveStyle({ minHeight: premiumGateMetrics.ctaHeight });
    expect(cta.props.accessibilityHint).toMatch(/Nada é cobrado/);
    await fireEvent.press(cta);
    await fireEvent.press(screen.getByRole('button', { name: 'Usar cor automática' }));
    expect(onLearnMore).toHaveBeenCalledTimes(1);
    expect(onContinueFree).toHaveBeenCalledTimes(1);
  });

  it('pílula "Disponível no Premium" é opcional (Agenda 12)', async () => {
    const { rerender } = await render(<Gate />);
    expect(screen.queryByTestId('gate-availability')).toBeNull();
    await rerender(<Gate showAvailability fadePreview />);
    expect(screen.getByText('Disponível no Premium')).toBeTruthy();
  });

  it('não exibe preço, valor nem compra dentro do gate', async () => {
    await render(<Gate showAvailability />);
    expect(screen.queryByText(/R\$/)).toBeNull();
    expect(screen.queryByText(/assinar|comprar/i)).toBeNull();
  });
});

describe('PremiumGate no catálogo', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('abre as folhas de recorrência e cor e registra a saída escolhida', async () => {
    await render(<PrimitivesCatalog />);
    await fireEvent.press(screen.getByTestId('catalog-gate-open-repeat'));
    expect(screen.getByTestId('catalog-gate-repeat-availability')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('catalog-gate-repeat-free'));
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByText('ÚLTIMA AÇÃO: SEGUIU NO FREE')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('catalog-gate-open-color'));
    await fireEvent.press(screen.getByTestId('catalog-gate-color-learn-more'));
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.getByText('ÚLTIMA AÇÃO: BENEFÍCIOS')).toBeTruthy();
  });
});
