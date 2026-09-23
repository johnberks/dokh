import '@/i18n';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { View } from 'react-native';
import { colors } from '@/theme/tokens';
import { HeroCarousel } from './HeroCarousel';
import { TwoToneScrollScreen } from './Layout';
import { MotionCatalog } from './MotionCatalog';

const mockReducedMotion = jest.fn(() => false);
jest.mock('@/theme/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion(),
}));

describe('motion and continuous screen scrolling', () => {
  it('puts the green hero and cream body inside the same vertical scroller', async () => {
    await render(
      <TwoToneScrollScreen hero={<View testID="header-content" />}>
        <View testID="body-content" />
      </TwoToneScrollScreen>,
    );
    const scroll = screen.getByTestId('two-tone-scroll');
    expect(within(scroll).getByTestId('two-tone-hero')).toBeTruthy();
    expect(within(scroll).getByTestId('two-tone-body')).toBeTruthy();
    expect(screen.getByTestId('two-tone-hero')).toHaveStyle({
      backgroundColor: colors.darkBackground,
    });
    expect(screen.getByTestId('two-tone-body')).toHaveStyle({
      backgroundColor: colors.background,
    });
    expect(screen.getByTestId('header-content')).toBeTruthy();
    expect(screen.getByTestId('body-content')).toBeTruthy();
  });

  it('shows two accessible pager controls without changing the hero height', async () => {
    const onPageChange = jest.fn();
    await render(
      <HeroCarousel
        pages={[
          { id: 'month', accessibilityLabel: 'Mês', content: <View /> },
          { id: 'history', accessibilityLabel: 'Histórico', content: <View /> },
        ]}
        height={160}
        onPageChange={onPageChange}
        testID="carousel"
      />,
    );
    expect(screen.getByTestId('carousel')).toHaveStyle({ height: 160 });
    expect(screen.getByRole('button', { name: 'Mês' }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Histórico' }));
    expect(
      screen.getByRole('button', { name: 'Histórico' }).props.accessibilityState.selected,
    ).toBe(true);
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('carousel')).toHaveStyle({ height: 160 });
  });

  it('keeps pagination operable with reduced motion and hides it for a single page', async () => {
    mockReducedMotion.mockReturnValue(true);
    const tree = await render(
      <HeroCarousel
        pages={[
          { id: 'month', accessibilityLabel: 'Mês', content: <View /> },
          { id: 'history', accessibilityLabel: 'Histórico', content: <View /> },
        ]}
        height={160}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Histórico' }));
    expect(
      screen.getByRole('button', { name: 'Histórico' }).props.accessibilityState.selected,
    ).toBe(true);
    await tree.rerender(
      <HeroCarousel
        pages={[{ id: 'month', accessibilityLabel: 'Mês', content: <View /> }]}
        height={160}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Histórico' })).toBeNull();
    mockReducedMotion.mockReturnValue(false);
  });

  it('demonstrates card removal and restoration without inventing a payment success', async () => {
    await render(<MotionCatalog />);
    expect(screen.getByRole('button', { name: /Remover card de demonstração/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Remover card de demonstração/ }));
    expect(screen.queryByRole('button', { name: /Remover card de demonstração/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Restaurar card de demonstração' }));
    expect(screen.getByRole('button', { name: /Remover card de demonstração/ })).toBeTruthy();
  });
});
