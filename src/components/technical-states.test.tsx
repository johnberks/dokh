import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { Input } from './Input';
import { LoadError, MutationError, OfflineBanner, Skeleton } from './TechnicalStates';

describe('shared technical states', () => {
  it('renders structural loading shapes without invented data or an empty state', async () => {
    await render(
      <View>
        <Skeleton layout="summary" testID="summary-skeleton" />
        <Skeleton layout="list" testID="list-skeleton" />
      </View>,
    );
    expect(screen.getAllByRole('progressbar', { name: 'Carregando conteúdo' })).toHaveLength(2);
    expect(screen.getByTestId('summary-skeleton').props.accessibilityState.busy).toBe(true);
    expect(screen.queryByText(/R\$|0%|nenhum|vazio/i)).toBeNull();
  });

  it('read failure has a 44-point accessible retry and never shows EmptyState', async () => {
    const onRetry = jest.fn();
    await render(<LoadError onRetry={onRetry} />);
    expect(screen.getByRole('header', { name: 'Não foi possível carregar' })).toBeTruthy();
    const retry = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(retry).toHaveStyle({ minHeight: 44 });
    await fireEvent.press(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/nenhum|vazio/i)).toBeNull();
  });

  it('blocks duplicate retry while a read is already in progress', async () => {
    const onRetry = jest.fn();
    await render(<LoadError onRetry={onRetry} retrying />);
    const retry = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(retry.props.accessibilityState).toEqual({ disabled: true, busy: true });
    await fireEvent.press(retry);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('write feedback does not own or clear the caller form draft; retry is opt-in', async () => {
    const onRetry = jest.fn();
    const onChangeText = jest.fn();
    const { rerender } = await render(
      <View>
        <Input label="Local" value="Clínica" onChangeText={onChangeText} />
        <MutationError />
      </View>,
    );
    expect(screen.getByLabelText('Local').props.value).toBe('Clínica');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
    await rerender(
      <View>
        <Input label="Local" value="Clínica" onChangeText={onChangeText} />
        <MutationError onRetry={onRetry} />
      </View>,
    );
    expect(screen.getByLabelText('Local').props.value).toBe('Clínica');
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('distinguishes offline from potentially stale in-memory data', async () => {
    const { rerender } = await render(<OfflineBanner />);
    expect(screen.getByText('Sem conexão. Não é possível atualizar agora.')).toBeTruthy();
    await rerender(<OfflineBanner showingCachedData />);
    expect(
      screen.getByText('Sem conexão. Os dados exibidos podem estar desatualizados.'),
    ).toBeTruthy();
  });
});
