import '@/i18n';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { palette } from '@/theme/tokens';
import { BarChartCard } from './BarChartCard';

describe('BarChartCard', () => {
  it('destaca o período atual, traceja o que não tem dado e mostra o rodapé', async () => {
    await render(
      <BarChartCard
        eyebrow="GANHOS DE 2026"
        legend={[
          { label: 'Consolidado', kind: 'realized' },
          { label: 'Mês atual', kind: 'current' },
          { label: 'Previsto', kind: 'future' },
        ]}
        accessibilityLabel="Entradas por mês"
        bars={[
          { key: 'jan', label: 'JAN', value: null },
          { key: 'fev', label: 'FEV', value: 500, valueLabel: '5,0k' },
          { key: 'mar', label: 'MAR', value: 1000, valueLabel: '10,0k', current: true },
          { key: 'abr', label: 'ABR', value: 800, valueLabel: '8,0k', future: true },
        ]}
        footer={<Text>{'média'}</Text>}
        testID="chart"
      />,
    );
    expect(screen.getByText('Mês atual')).toBeTruthy();
    expect(screen.getByText('Previsto')).toBeTruthy();
    expect(screen.getByText('média')).toBeTruthy();
    // Sem dado: nem valor, nem barra cheia.
    expect(screen.queryByText('0')).toBeNull();
    const label = screen.getByText('5,0k');
    // Nunca quebra: uma linha, encolhendo se faltar espaço.
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    const current = screen.getByTestId('chart-bar-mar').children[1] as unknown as {
      props: { style: unknown };
    };
    expect(current).toHaveStyle({ backgroundColor: palette.bronze, height: 128 });
    const half = screen.getByTestId('chart-bar-fev').children[1] as never;
    expect(half).toHaveStyle({ height: 64, backgroundColor: palette.workSage });
    const empty = screen.getByTestId('chart-bar-jan').children[0] as never;
    expect(empty).toHaveStyle({ borderStyle: 'dashed', height: 3 });
    // Três tipos: consolidado cheio, atual bronze e futuro só em contorno.
    const future = screen.getByTestId('chart-bar-abr').children[1] as never;
    expect(future).toHaveStyle({ borderWidth: 1.5, borderColor: palette.workSage });
    expect(screen.getByText('8,0k')).toHaveStyle({ color: 'rgba(111,126,103,0.75)' });
  });
});
