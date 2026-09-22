import '@/i18n';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { bottomSheetMetrics, colors } from '@/theme/tokens';
import { BottomSheet } from './BottomSheet';
import { PrimitivesCatalog } from './PrimitivesCatalog';

function Sheet(props: Partial<Parameters<typeof BottomSheet>[0]>) {
  return (
    <BottomSheet
      open
      onClose={jest.fn()}
      accessibilityLabel="Quando será?"
      testID="sheet"
      {...props}
    >
      <Text>{'conteúdo'}</Text>
    </BottomSheet>
  );
}

describe('BottomSheet', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('não renderiza nada enquanto fechado', async () => {
    await render(<Sheet open={false} />);
    expect(screen.queryByText('conteúdo')).toBeNull();
  });

  it('renderiza o conteúdo com nome acessível e modal para o leitor de tela', async () => {
    await render(<Sheet />);
    expect(screen.getByText('conteúdo')).toBeTruthy();
    const panel = screen.getByTestId('sheet-panel');
    expect(panel.props.accessibilityViewIsModal).toBe(true);
    expect(panel.props.accessibilityLabel).toBe('Quando será?');
  });

  it('fecha pelo fundo, pela alça, pelo voltar do Android e pelo escape do VoiceOver', async () => {
    const onClose = jest.fn();
    await render(<Sheet onClose={onClose} />);
    // O fundo fica fora do leitor de tela (painel é modal); o toque visual continua fechando.
    await fireEvent.press(screen.getByTestId('sheet-scrim', { includeHiddenElements: true }));
    await fireEvent.press(screen.getByTestId('sheet-handle'));
    await fireEvent(screen.getByTestId('sheet'), 'requestClose');
    await fireEvent(screen.getByTestId('sheet-panel'), 'accessibilityEscape');
    expect(onClose).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId('sheet-handle').props.accessibilityLabel).toBe('Fechar');
  });

  it('padrão segue Agenda 08: raio 32, superfície creme e paddings', async () => {
    await render(<Sheet />);
    expect(screen.getByTestId('sheet-panel')).toHaveStyle({
      borderTopLeftRadius: bottomSheetMetrics.standardRadius,
      backgroundColor: colors.background,
      paddingTop: bottomSheetMetrics.paddingTop,
      paddingHorizontal: bottomSheetMetrics.paddingHorizontal,
    });
  });

  it('menu segue Agenda 06B: raio 28', async () => {
    await render(<Sheet variant="menu" />);
    expect(screen.getByTestId('sheet-panel')).toHaveStyle({
      borderTopLeftRadius: bottomSheetMetrics.menuRadius,
    });
  });

  it('desmonta depois da animação de saída', async () => {
    const { rerender } = await render(<Sheet />);
    await rerender(<Sheet open={false} />);
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.queryByText('conteúdo')).toBeNull();
  });

  it('o catálogo abre as duas folhas', async () => {
    await render(<PrimitivesCatalog />);
    await fireEvent.press(screen.getByTestId('catalog-sheet-open-standard'));
    expect(screen.getByTestId('catalog-sheet-standard-panel')).toBeTruthy();
    expect(screen.getByText('Os pontos mostram dias em que você já trabalha.')).toBeTruthy();
    await fireEvent.press(
      screen.getByTestId('catalog-sheet-standard-scrim', { includeHiddenElements: true }),
    );
    await act(async () => {
      jest.runAllTimers();
    });
    expect(screen.queryByTestId('catalog-sheet-standard-panel')).toBeNull();
    await fireEvent.press(screen.getByTestId('catalog-sheet-open-menu'));
    expect(screen.getByTestId('catalog-sheet-menu-panel')).toBeTruthy();
  });
});
