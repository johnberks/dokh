import '@/i18n';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { palette } from '@/theme/tokens';
import { BarChartCard } from './BarChartCard';

describe('BarChartCard', () => {
  it('destaca o período atual, traceja o que não tem dado e mostra o rodapé', async () => {
    await render(
      <BarChartCard
        eyebrow="JANEIRO → DEZEMBRO"
        legend="mês atual"
        accessibilityLabel="Entradas por mês"
        bars={[
          { key: 'jan', label: 'JAN', value: null },
          { key: 'fev', label: 'FEV', value: 500, valueLabel: '5,0k' },
          { key: 'mar', label: 'MAR', value: 1000, valueLabel: '10,0k', current: true },
        ]}
        footer={<Text>{'média'}</Text>}
        testID="chart"
      />,
    );
    expect(screen.getByText('mês atual')).toBeTruthy();
    expect(screen.getByText('média')).toBeTruthy();
    // Sem dado: nem valor, nem barra cheia.
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText('5,0k')).toBeTruthy();
    const current = screen.getByTestId('chart-bar-mar').children[1] as unknown as {
      props: { style: unknown };
    };
    expect(current).toHaveStyle({ backgroundColor: palette.bronze, height: 128 });
    const half = screen.getByTestId('chart-bar-fev').children[1] as never;
    expect(half).toHaveStyle({ height: 64, backgroundColor: palette.workSage });
    const empty = screen.getByTestId('chart-bar-jan').children[0] as never;
    expect(empty).toHaveStyle({ borderStyle: 'dashed', height: 3 });
  });
});
