import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, moneyInputMetrics } from '@/theme/tokens';
import { MoneyInput } from './MoneyInput';
import { PrimitivesCatalog } from './PrimitivesCatalog';

describe('MoneyInput', () => {
  it('shows the empty Agenda field without treating its placeholder as a real zero', async () => {
    const onChangeText = jest.fn();
    await render(
      <MoneyInput
        label="QUANTO VOCÊ VAI RECEBER?"
        value=""
        onChangeText={onChangeText}
        testID="money"
      />,
    );
    expect(screen.getByTestId('money')).toBeTruthy();
    expect(screen.getByTestId('money-field')).toHaveStyle({
      minHeight: 60,
      borderRadius: 16,
      borderColor: colors.moneyFieldBorder,
    });
    expect(screen.getByText('QUANTO VOCÊ VAI RECEBER?')).toHaveStyle({ fontSize: 9 });
    expect(screen.getByText('R$')).toBeTruthy();
    const input = screen.getByLabelText('QUANTO VOCÊ VAI RECEBER?');
    expect(input.props.value).toBe('');
    expect(input.props.placeholder).toBe('0,00');
    expect(input.props.keyboardType).toBe('decimal-pad');
    expect(input.props.accessibilityHint).toBe('Valor em reais');
    expect(input).toHaveStyle({ fontSize: moneyInputMetrics.formValueSize });
    await fireEvent.changeText(input, '1.200,50');
    expect(onChangeText).toHaveBeenCalledWith('1.200,50');
  });

  it('uses the filled Agenda border and preserves the raw pt-BR string during editing', async () => {
    const onChangeText = jest.fn();
    await render(
      <MoneyInput
        label="QUANTO VOCÊ VAI RECEBER?"
        value="1.200"
        onChangeText={onChangeText}
        testID="money"
      />,
    );
    expect(screen.getByTestId('money')).toBeTruthy();
    expect(screen.getByTestId('money-field')).toHaveStyle({ borderColor: colors.textPrimary });
    expect(screen.getByLabelText('QUANTO VOCÊ VAI RECEBER?').props.value).toBe('1.200');
    await fireEvent.changeText(screen.getByTestId('money-input'), 'R$ 1.234,56');
    expect(onChangeText).toHaveBeenCalledWith('1.234,56');
  });

  it('matches the two Onboarding large-value sizes without duplicating the work heading', async () => {
    const { rerender } = await render(
      <MoneyInput
        variant="residency"
        label="Quanto você recebe por mês?"
        hint="Valor líquido padrão da bolsa · toque para ajustar."
        value="3.654,42"
        onChangeText={() => {}}
        testID="money"
      />,
    );
    expect(screen.getByText('Quanto você recebe por mês?')).toHaveStyle({ fontSize: 17 });
    expect(screen.getByText('Valor líquido padrão da bolsa · toque para ajustar.')).toBeTruthy();
    expect(screen.getByTestId('money-input')).toHaveStyle({
      fontSize: moneyInputMetrics.residencyValueSize,
    });
    expect(screen.getByTestId('money-field')).toHaveStyle({
      borderBottomWidth: moneyInputMetrics.heroUnderlineWidth,
    });
    await rerender(
      <MoneyInput
        variant="work"
        label="Quanto você recebe por esse trabalho?"
        value="1.200"
        onChangeText={() => {}}
        testID="money"
      />,
    );
    expect(screen.getByTestId('money-input')).toHaveStyle({
      fontSize: moneyInputMetrics.workValueSize,
    });
    expect(screen.queryByText('Quanto você recebe por esse trabalho?')).toBeNull();
    expect(screen.getByLabelText('Quanto você recebe por esse trabalho?')).toBeTruthy();
  });

  it('keeps entered text on error and exposes disabled state', async () => {
    await render(
      <MoneyInput
        label="Valor"
        value="1,23"
        onChangeText={() => {}}
        error="Confira o valor"
        disabled
        testID="money"
      />,
    );
    const input = screen.getByLabelText('Valor');
    expect(input.props.value).toBe('1,23');
    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toEqual({ disabled: true });
    expect(input.props.accessibilityHint).toBe('Valor em reais. Confira o valor');
    expect(screen.getByText('Confira o valor')).toHaveStyle({ color: colors.errorFill });
  });

  it('catalog renders each HTML treatment for inspection', async () => {
    await render(<PrimitivesCatalog />);
    for (const id of [
      'catalog-money-form-empty',
      'catalog-money-form-filled',
      'catalog-money-residency',
      'catalog-money-work',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });
});
