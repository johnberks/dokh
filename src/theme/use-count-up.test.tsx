import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useCountUp } from './useCountUp';

let mockReduced = false;
jest.mock('./useReducedMotion', () => ({ useReducedMotion: () => mockReduced }));

function Probe({ value, runKey }: { value: bigint; runKey: number }) {
  return <Text testID="value">{String(useCountUp(value, runKey))}</Text>;
}

describe('useCountUp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReduced = false;
  });
  afterEach(() => jest.useRealTimers());

  it('conta rápido de zero até o valor exato', async () => {
    await render(<Probe value={1245009n} runKey={1} />);
    expect(screen.getByTestId('value').props.children).toBe('0');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    const middle = BigInt(screen.getByTestId('value').props.children);
    expect(middle > 0n && middle < 1245009n).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    expect(screen.getByTestId('value').props.children).toBe('1245009');
  });

  it('com "Reduzir movimento", mostra o valor direto', async () => {
    mockReduced = true;
    await render(<Probe value={1245009n} runKey={1} />);
    expect(screen.getByTestId('value').props.children).toBe('1245009');
  });
});
