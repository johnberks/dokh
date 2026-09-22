import { DEFAULT_LANGUAGE, i18n, resolveLanguage } from '@/i18n';

describe('i18n', () => {
  it('inicializa em pt-BR de forma síncrona', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe('pt-BR');
    expect(i18n.t('navigation:tabs.finances')).toBe('Finanças');
  });

  it('cai em pt-BR para idioma não suportado ou ausente', () => {
    expect(resolveLanguage('en-US')).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('pt-BR')).toBe('pt-BR');
  });

  it('usa pt-BR como fallback quando o idioma ativo não tem a chave', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common:actions.retry')).toBe('Tentar novamente');
    await i18n.changeLanguage('pt-BR');
  });
});
