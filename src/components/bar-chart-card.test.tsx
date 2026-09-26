import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { palette } from '@/theme/tokens';
import { BarChartCard, type ChartBar } from './BarChartCard';

const bars: ChartBar[] = [
  { key: 'jan', label: 'JAN', value: null, filled: 0, state: 'realized' },
  { key: 'fev', label: 'FEV', value: 500, filled: 500, state: 'realized' },
  { key: 'mar', label: 'MAR', value: 1000, filled: 600, state: 'current' },
  { key: 'abr', label: 'ABR', value: 800, filled: 0, state: 'future' },
];

describe('BarChartCard', () => {
  it('recebido cheio na base, atual com contorno bronze, futuro em contorno e sem dado tracejado', async () => {
    await render(
      <BarChartCard
        eyebrow="GANHOS DE 2026"
        accessibilityLabel="Entradas por mês"
        bars={bars}
        testID="chart"
      />,
    );
    // Sem rótulos em cima das barras (o "15,5k" que quebrava).
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByTestId('chart-bar-fev-body')).toHaveStyle({ height: 66 });
    expect(screen.getByTestId('chart-bar-fev-filled')).toHaveStyle({
      height: 66,
      backgroundColor: palette.workSage,
    });
    expect(screen.getByTestId('chart-bar-mar-body')).toHaveStyle({
      height: 132,
      borderColor: palette.bronze,
    });
    // Recebido do mês atual: 60% da barra.
    expect(screen.getByTestId('chart-bar-mar-filled')).toHaveStyle({ height: 79.2 });
    // Futuro previsto: contorno, sem parte cheia.
    expect(screen.queryByTestId('chart-bar-abr-filled')).toBeNull();
    expect(screen.getByTestId('chart-bar-abr-body')).toHaveStyle({ borderWidth: 1.5 });
    expect(screen.getByTestId('chart-bar-jan-body')).toHaveStyle({
      borderStyle: 'dashed',
      height: 3,
    });
  });

  it('tocar escolhe o mês; mostra o resumo, a média e a legenda', async () => {
    const onSelect = jest.fn();
    await render(
      <BarChartCard
        eyebrow="GANHOS DE 2026"
        accessibilityLabel="Entradas por mês"
        bars={bars}
        selectedKey="mar"
        onSelect={onSelect}
        summary={<Text>{'Março · R$ 1.000'}</Text>}
        reference={{ value: 750, label: 'média 7,5' }}
        legend={[
          { key: 'r', label: 'Recebido', swatch: 'filled' },
          { key: 'e', label: 'Previsto', swatch: 'outline' },
        ]}
        barAccessibilityLabel={(bar) => `${bar.label}: ${bar.value ?? 'sem entradas'}`}
        testID="chart"
      />,
    );
    expect(screen.getByText('Março · R$ 1.000')).toBeTruthy();
    expect(screen.getByText('média 7,5')).toBeTruthy();
    expect(screen.getByTestId('chart-reference')).toHaveStyle({ bottom: 99 });
    expect(screen.getByText('Previsto')).toBeTruthy();
    expect(screen.getByTestId('chart-bar-mar').props.accessibilityState).toMatchObject({
      selected: true,
    });
    await fireEvent.press(screen.getByTestId('chart-bar-fev'));
    expect(onSelect).toHaveBeenCalledWith('fev');
    expect(screen.getByLabelText('FEV: 500')).toBeTruthy();
  });
});
