import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { palette } from '@/theme/tokens';
import { ReceiptProgressCard } from './ReceiptProgressCard';

describe('ReceiptProgressCard', () => {
  it('mostra os dois lados, a barra proporcional e repassa o toque', async () => {
    const onReceived = jest.fn();
    const onAwaiting = jest.fn();
    await render(
      <ReceiptProgressCard
        receivedLabel="RECEBIDO"
        receivedValue="R$ 8.350"
        awaitingLabel="A RECEBER"
        awaitingValue="R$ 4.100"
        percent={67}
        caption="67% recebido"
        onPressReceived={onReceived}
        onPressAwaiting={onAwaiting}
        testID="split"
      />,
    );
    expect(screen.getByText('R$ 8.350')).toBeTruthy();
    expect(screen.getByText('67% recebido')).toBeTruthy();
    const bar = screen.getByRole('progressbar');
    expect(bar.props.accessibilityValue).toMatchObject({ now: 67 });
    expect(bar.children[0]).toHaveStyle({ width: '67%', backgroundColor: palette.structure });
    // Um card só: as duas caixas e a barra (mais grossa) dentro da mesma superfície.
    const card = screen.getByTestId('split');
    expect(card).toHaveStyle({ backgroundColor: '#F8F6EF', borderRadius: 28 });
    expect(screen.getByTestId('split-bar')).toHaveStyle({ height: 12 });
    expect(card).toContainElement(screen.getByTestId('split-received'));
    expect(card).toContainElement(screen.getByTestId('split-bar'));
    await fireEvent.press(screen.getByTestId('split-received'));
    await fireEvent.press(screen.getByTestId('split-awaiting'));
    expect(onReceived).toHaveBeenCalled();
    expect(onAwaiting).toHaveBeenCalled();
  });

  it('nunca passa de 100%', async () => {
    await render(
      <ReceiptProgressCard
        receivedLabel="RECEBIDO"
        receivedValue="R$ 1"
        awaitingLabel="A RECEBER"
        awaitingValue="R$ 0"
        percent={140}
        caption="100% recebido"
      />,
    );
    expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 100 });
  });
});
