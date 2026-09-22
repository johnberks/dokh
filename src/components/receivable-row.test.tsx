import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, receivableRowMetrics } from '@/theme/tokens';
import { PrimitivesCatalog } from './PrimitivesCatalog';
import { ReceivableRow } from './ReceivableRow';

const entry = {
  day: '12',
  month: 'SET',
  origin: 'Hospital São Lucas',
  value: 'R$ 1.200',
  onPress: jest.fn(),
};

describe('ReceivableRow — Finanças 05–10', () => {
  beforeEach(() => entry.onPress.mockClear());

  it('shows received with dimmed day, filled green dot and check', async () => {
    await render(<ReceivableRow {...entry} status="received" testID="received" />);
    expect(screen.getByTestId('received-dot')).toHaveStyle({
      backgroundColor: colors.textSecondary,
      width: receivableRowMetrics.dotDiameter,
    });
    expect(screen.getByText('12')).toHaveStyle({ color: colors.receivableReceivedDay });
    expect(screen.getByText('Recebido')).toHaveStyle({ color: colors.textSecondary });
    expect(screen.queryByRole('button', { name: 'Você recebeu?' })).toBeNull();
    await fireEvent.press(screen.getByTestId('received-details'));
    expect(entry.onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a neutral outlined dot and date for future entries', async () => {
    await render(<ReceivableRow {...entry} status="scheduled" testID="expected" />);
    expect(screen.getByTestId('expected-dot')).toHaveStyle({
      backgroundColor: colors.background,
      borderColor: colors.darkTextSecondary,
    });
    expect(screen.getByText('Previsto')).toHaveStyle({ color: colors.textMuted });
    expect(
      screen.getByRole('button', { name: /12, SET, Hospital São Lucas, R\$ 1.200, Previsto/ }),
    ).toBeTruthy();
  });

  it('due today remains forecast until the parent supplies confirmed status', async () => {
    const { rerender } = await render(<ReceivableRow {...entry} status="due_today" />);
    expect(screen.queryByText('Recebido')).toBeNull();
    expect(screen.getByText('Previsto')).toBeTruthy();
    await rerender(<ReceivableRow {...entry} status="received" />);
    expect(screen.getByText('Recebido')).toBeTruthy();
  });

  it('shows a bronze pending panel with a separate accessible confirmation action', async () => {
    const onConfirm = jest.fn();
    await render(
      <ReceivableRow
        {...entry}
        status="confirmation_pending"
        onConfirm={onConfirm}
        testID="pending"
      />,
    );
    expect(screen.getByTestId('pending-dot')).toHaveStyle({ backgroundColor: colors.accent });
    expect(screen.getByTestId('pending')).toHaveStyle({ gap: receivableRowMetrics.gap });
    expect(screen.getByText('Confirmação pendente')).toHaveStyle({
      color: colors.reviewBronzeText,
    });
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('pending-details'));
    expect(entry.onPress).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Você recebeu?' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Confirmação pendente')).toBeTruthy();
  });

  it('does not accept another confirmation while the server mutation is running', async () => {
    const onConfirm = jest.fn();
    await render(
      <ReceivableRow {...entry} status="confirmation_pending" onConfirm={onConfirm} confirming />,
    );
    const confirm = screen.getByRole('button', { name: 'Você recebeu?' });
    expect(confirm.props.accessibilityState).toEqual({ disabled: true, busy: true });
    await fireEvent.press(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Confirmação pendente')).toBeTruthy();
  });

  it('catalog includes all three visual states without claiming a saved confirmation', async () => {
    await render(<PrimitivesCatalog />);
    for (const id of [
      'catalog-receivable-received',
      'catalog-receivable-expected',
      'catalog-receivable-pending',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });
});
