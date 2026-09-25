import {
  FREE_COLOR_TOKENS,
  isFreeColorToken,
  nextAutomaticColorToken,
  PREMIUM_COLOR_TOKENS,
} from './work-location-colors';

describe('cores de Local', () => {
  it('usa a primeira cor livre ainda não usada', () => {
    expect(nextAutomaticColorToken([])).toBe('sage');
    expect(nextAutomaticColorToken(['sage'])).toBe('bronze');
    expect(nextAutomaticColorToken(['sage', 'bronze', 'blue'])).toBe('green');
  });

  it('entra em rodízio quando todas as cores livres já estão em uso', () => {
    const all = [...FREE_COLOR_TOKENS];
    expect(nextAutomaticColorToken(all)).toBe(FREE_COLOR_TOKENS[0]);
    expect(nextAutomaticColorToken([...all, 'sage'])).toBe(FREE_COLOR_TOKENS[1]);
  });

  it('a paleta Free é um subconjunto da Premium', () => {
    for (const token of FREE_COLOR_TOKENS) {
      expect(PREMIUM_COLOR_TOKENS).toContain(token);
    }
    expect(PREMIUM_COLOR_TOKENS.length).toBeGreaterThan(FREE_COLOR_TOKENS.length);
  });

  it('reconhece token livre e recusa desconhecido', () => {
    expect(isFreeColorToken('sage')).toBe(true);
    expect(isFreeColorToken('terra')).toBe(false);
    expect(isFreeColorToken('#A98A54')).toBe(false);
  });
});
