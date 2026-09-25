import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { colors } from '@/theme/tokens';
import { Button, IconButton } from './Button';
import { Input } from './Input';
import { Card, Divider, Screen, ScrollScreen } from './Layout';
import { PrimitivesCatalog } from './PrimitivesCatalog';
import { Chip, SegmentedControl, Toggle } from './Selection';

function luminance(hex: string) {
  const rgb =
    hex
      .slice(1)
      .match(/.{2}/g)
      ?.map((part) => Number.parseInt(part, 16) / 255) ?? [];
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('accessible primitives', () => {
  it('uses AA text contrast on the default light surface', () => {
    for (const color of [colors.textPrimary, colors.textSecondary, colors.errorFill]) {
      expect(contrastRatio(color, colors.background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('buttons expose labels, loading/disabled states and a 44-point target', async () => {
    const onPress = jest.fn();
    await render(
      <View>
        <Button label="Salvar" onPress={onPress} testID="normal" />
        <Button label="Indisponível" onPress={onPress} disabled testID="disabled" />
        <Button label="Aguarde" onPress={onPress} loading testID="loading" />
        <IconButton
          accessibilityLabel="Adicionar"
          icon={<View />}
          onPress={onPress}
          testID="icon"
        />
      </View>,
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveStyle({ minHeight: 44 });
    expect(screen.getByRole('button', { name: 'Adicionar' })).toHaveStyle({ minWidth: 44 });
    expect(screen.getByTestId('disabled').props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(screen.getByTestId('loading').props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
    await fireEvent.press(screen.getByTestId('normal'));
    await fireEvent.press(screen.getByTestId('disabled'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('inputs expose their label, help and error without losing text', async () => {
    const onChangeText = jest.fn();
    await render(
      <Input
        label="Local"
        value="Clínica"
        onChangeText={onChangeText}
        error="Informe um local válido"
      />,
    );
    const input = screen.getByLabelText('Local');
    expect(input.props.value).toBe('Clínica');
    expect(input.props.accessibilityHint).toBe('Informe um local válido');
    expect(screen.getByText('Informe um local válido')).toBeTruthy();
    await fireEvent.changeText(input, 'Hospital');
    expect(onChangeText).toHaveBeenCalledWith('Hospital');
  });

  it('segmented control and chip expose selected state without relying on color', async () => {
    const onChange = jest.fn();
    const onChipPress = jest.fn();
    await render(
      <View>
        <SegmentedControl
          label="Período"
          options={[
            { value: 'month', label: 'Mês' },
            { value: 'year', label: 'Ano' },
          ]}
          value="month"
          onChange={onChange}
        />
        <Chip label="Plantão" selected onPress={onChipPress} />
      </View>,
    );
    expect(screen.getByRole('radio', { name: 'Mês' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: 'Plantão' }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Ano' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Plantão' }));
    expect(onChange).toHaveBeenCalledWith('year');
    expect(onChipPress).toHaveBeenCalledTimes(1);
  });

  it('toggle is labeled and preserves its boolean value', async () => {
    const onValueChange = jest.fn();
    await render(<Toggle label="Notificações" value onValueChange={onValueChange} />);
    const toggle = screen.getByLabelText('Notificações');
    expect(toggle.props.value).toBe(true);
    await fireEvent(toggle, 'valueChange', false);
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('layout primitives and internal catalog render all major states', async () => {
    await render(
      <ScrollScreen>
        <Card>
          <Divider />
        </Card>
        <Screen>
          <View />
        </Screen>
        <PrimitivesCatalog />
      </ScrollScreen>,
    );
    expect(screen.getByRole('header', { name: 'Componentes básicos' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Carregando' }).props.accessibilityState.busy).toBe(
      true,
    );
    expect(screen.getByText('Informe um nome válido.')).toBeTruthy();
  });
});
