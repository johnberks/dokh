import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { calendarMetrics, colors, workLocationColors } from '@/theme/tokens';
import { CalendarGrid } from './CalendarGrid';
import { PrimitivesCatalog } from './PrimitivesCatalog';

const base = {
  month: '2026-09',
  today: '2026-09-10',
  selected: '2026-09-14',
  weekStartsOn: 0 as const,
  testID: 'cal',
};

describe('CalendarGrid', () => {
  it('ordena o cabeçalho pelo início da semana (D39)', async () => {
    const { rerender } = await render(<CalendarGrid {...base} />);
    const letters = () =>
      screen
        .getAllByText(/^[DSTQ]$/, { includeHiddenElements: true })
        .map((node) => node.props.children);
    expect(letters()).toEqual(['D', 'S', 'T', 'Q', 'Q', 'S', 'S']);
    await rerender(<CalendarGrid {...base} weekStartsOn={1} />);
    expect(letters()).toEqual(['S', 'T', 'Q', 'Q', 'S', 'S', 'D']);
  });

  it('marca hoje com contorno bronze e o selecionado com círculo verde escuro', async () => {
    await render(<CalendarGrid {...base} onSelectDate={jest.fn()} />);
    expect(screen.getByTestId('cal-2026-09-10-marker')).toHaveStyle({
      borderColor: colors.accent,
      borderWidth: calendarMetrics.markerBorderWidth,
    });
    expect(screen.getByTestId('cal-2026-09-14-marker')).toHaveStyle({
      backgroundColor: colors.foreground,
    });
    expect(screen.getByText('14')).toHaveStyle({ color: colors.darkTextPrimary });
    expect(screen.getByText('3')).toHaveStyle({ color: colors.calendarPastDay });
    expect(screen.getByText('20')).toHaveStyle({ color: colors.textPrimary });
  });

  it('anuncia data por extenso, hoje, seleção e quantidade de trabalhos, sem depender de cor', async () => {
    await render(
      <CalendarGrid
        {...base}
        dots={{ '2026-09-22': ['bronze', 'sage'], '2026-09-10': ['sage'] }}
        onSelectDate={jest.fn()}
      />,
    );
    expect(screen.getByLabelText('quinta-feira, 10 de setembro, hoje, 1 trabalho')).toBeTruthy();
    expect(screen.getByLabelText('terça-feira, 22 de setembro, 2 trabalhos')).toBeTruthy();
    const selected = screen.getByLabelText('segunda-feira, 14 de setembro');
    expect(selected.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('desenha um ponto por Trabalho na cor do Local, com no máximo 4 visíveis', async () => {
    await render(
      <CalendarGrid
        {...base}
        dots={{
          '2026-09-22': ['bronze', 'sage'],
          '2026-09-25': ['sage', 'blue', 'terra', 'violet', 'green'],
        }}
      />,
    );
    const pair = screen.getAllByTestId('cal-2026-09-22-dot');
    expect(pair).toHaveLength(2);
    expect(pair[0]).toHaveStyle({ backgroundColor: workLocationColors.bronze });
    expect(screen.getAllByTestId('cal-2026-09-25-dot')).toHaveLength(calendarMetrics.maxDots);
    expect(screen.getByLabelText('sexta-feira, 25 de setembro, 5 trabalhos')).toBeTruthy();
  });

  it('tocar num dia devolve a data local, inclusive dias passados e ocupados', async () => {
    const onSelectDate = jest.fn();
    await render(
      <CalendarGrid {...base} dots={{ '2026-09-03': ['sage'] }} onSelectDate={onSelectDate} />,
    );
    await fireEvent.press(screen.getByTestId('cal-2026-09-03'));
    expect(onSelectDate).toHaveBeenCalledWith('2026-09-03');
    expect(screen.getByTestId('cal-2026-09-03')).toHaveStyle({
      height: calendarMetrics.cellHeight,
    });
  });

  it('sem callback é só leitura', async () => {
    await render(<CalendarGrid {...base} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('aparece no catálogo com Domingo e Segunda', async () => {
    await render(<PrimitivesCatalog />);
    expect(screen.getByTestId('catalog-calendar-agenda')).toBeTruthy();
    expect(screen.getByTestId('catalog-calendar-sheet')).toBeTruthy();
  });
});
