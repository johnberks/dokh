import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NavigationControl } from './NavigationControl';

describe('shared navigation controls', () => {
  it.each([
    ['back', 'Voltar'],
    ['close', 'Fechar'],
  ] as const)('%s has an accessible 44-point target', async (kind, label) => {
    const onPress = jest.fn();
    await render(<NavigationControl kind={kind} onPress={onPress} />);
    const button = screen.getByRole('button', { name: label });
    expect(button).toHaveStyle({ width: 44, height: 44 });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
