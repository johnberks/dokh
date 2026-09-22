import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, progressCardMetrics } from '@/theme/tokens';
import { PrimitivesCatalog } from './PrimitivesCatalog';
import { ProgressCard } from './ProgressCard';

const completed = [
  { id: 'residency', label: 'Residência organizada' },
  { id: 'work', label: 'Primeiro trabalho organizado' },
];

describe('ProgressCard', () => {
  it('follows Home HTML geometry, proportional progress and next-action copy', async () => {
    const onPress = jest.fn();
    await render(
      <ProgressCard
        completed={completed}
        totalSteps={3}
        next={{ id: 'dates', label: 'Adicionar datas a 2 entradas', onPress }}
        testID="progress"
      />,
    );
    expect(screen.getByTestId('progress')).toHaveStyle({
      backgroundColor: colors.progressSurface,
      borderRadius: progressCardMetrics.radius,
      paddingTop: 16,
      paddingHorizontal: 16,
    });
    expect(screen.getByText('2 de 3')).toBeTruthy();
    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '67%' });
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({
      min: 0,
      max: 3,
      now: 2,
    });
    expect(screen.getByText('Falta 1 passo para sua visão do mês ficar completa.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar datas a 2 entradas' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not assume residence and handles any valid milestone count', async () => {
    await render(
      <ProgressCard
        completed={[{ id: 'work', label: 'Primeiro trabalho organizado' }]}
        totalSteps={4}
        next={{ id: 'location', label: 'Adicionar local', onPress: () => {} }}
        testID="progress"
      />,
    );
    expect(screen.queryByText('Residência organizada')).toBeNull();
    expect(screen.getByText('1 de 4')).toBeTruthy();
    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '25%' });
    expect(screen.getByText('Faltam 3 passos para sua visão do mês ficar completa.')).toBeTruthy();
  });

  it('hides the whole object when complete or given an invalid total', async () => {
    const props = {
      completed,
      next: { id: 'next', label: 'Próxima ação', onPress: () => {} },
      testID: 'progress',
    };
    const { rerender } = await render(<ProgressCard {...props} totalSteps={2} />);
    expect(screen.queryByTestId('progress')).toBeNull();
    await rerender(<ProgressCard {...props} totalSteps={0} />);
    expect(screen.queryByTestId('progress')).toBeNull();
    await rerender(<ProgressCard {...props} totalSteps={2.5} />);
    expect(screen.queryByTestId('progress')).toBeNull();
  });

  it('blocks a second action while the destination is busy', async () => {
    const onPress = jest.fn();
    await render(
      <ProgressCard
        completed={[]}
        totalSteps={2}
        next={{ id: 'work', label: 'Adicionar trabalho', onPress }}
        busy
        testID="progress"
      />,
    );
    const button = screen.getByRole('button', { name: 'Adicionar trabalho' });
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '0%' });
  });

  it('catalog exposes all three next actions from the Home HTML', async () => {
    await render(<PrimitivesCatalog />);
    for (const id of [
      'catalog-progress-dates',
      'catalog-progress-location',
      'catalog-progress-work',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });
});
