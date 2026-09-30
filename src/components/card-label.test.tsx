import '@/i18n';
import { render, screen } from '@testing-library/react-native';
import { colors, palette } from '@/theme/tokens';
import { CardLabel } from './CardLabel';

describe('CardLabel', () => {
  it('título de card com peso: escuro, 11 pt e espaçado (não o sálvia de 10 pt apagado)', async () => {
    await render(<CardLabel>{'ORIGEM DAS ENTRADAS'}</CardLabel>);
    expect(screen.getByText('ORIGEM DAS ENTRADAS')).toHaveStyle({
      fontSize: 11,
      letterSpacing: 1.65,
      color: colors.textPrimary,
    });
  });

  it('tons para cards escuros e de atenção', async () => {
    await render(<CardLabel tone="bronze">{'INSIGHT'}</CardLabel>);
    expect(screen.getByText('INSIGHT')).toHaveStyle({ color: palette.bronze });
  });
});
