import { render, screen } from '@testing-library/react-native';
import { PROFILE_ICONS, ProfileIcon } from '@/features/profile/ProfilePieces';
import * as Heroicons from './heroicons';

describe('Heroicons Solid', () => {
  it('todos os ícones gerados desenham preenchidos na cor e no tamanho pedidos', async () => {
    const icons = Object.entries(Heroicons).filter(([name]) => name.endsWith('Icon'));
    expect(icons.length).toBeGreaterThanOrEqual(40);
    for (const [name, Icon] of icons) {
      if (typeof Icon !== 'function') continue;
      const { unmount } = await render(<Icon size={18} color="#10160F" testID={name} />);
      const svg = screen.getByTestId(name, { includeHiddenElements: true });
      expect(svg.props.fill ?? svg.props.color).toBeDefined();
      await unmount();
    }
  });

  it('os ícones do Perfil usam o conjunto Heroicons', async () => {
    for (const name of Object.keys(PROFILE_ICONS) as (keyof typeof PROFILE_ICONS)[]) {
      const { unmount } = await render(<ProfileIcon name={name} />);
      await unmount();
    }
    expect(PROFILE_ICONS.pin).toBe(Heroicons.MapPinIcon);
    expect(PROFILE_ICONS.logout).toBe(Heroicons.ArrowRightStartOnRectangleIcon);
  });
});
