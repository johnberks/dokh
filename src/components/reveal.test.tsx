import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { motion } from '@/theme/tokens';
import { useReducedMotion } from '@/theme/useReducedMotion';
import { Reveal, step, WordReveal } from './Reveal';

jest.mock('@/theme/useReducedMotion', () => ({ useReducedMotion: jest.fn(() => false) }));

describe('Reveal (entrada em cascata do onboarding)', () => {
  it('a cascata anda em passos do token e mostra o conteúdo', async () => {
    expect(step(0)).toBe(0);
    expect(step(3)).toBe(3 * motion.revealStagger);
    expect(step(2, 100)).toBe(100 + 2 * motion.revealStagger);
    await render(
      <Reveal delay={step(2)} testID="reveal">
        <Text>Olá</Text>
      </Reveal>,
    );
    expect(screen.getByText('Olá')).toBeTruthy();
  });

  it('título palavra a palavra é lido inteiro pelo leitor de tela', async () => {
    jest.mocked(useReducedMotion).mockReturnValue(true);
    await render(<WordReveal text="Sua DOKH já começou." style={{ fontSize: 30 }} />);
    expect(screen.getByRole('header', { name: 'Sua DOKH já começou.' })).toBeTruthy();
    expect(screen.getByText('começou.')).toBeTruthy();
  });
});
