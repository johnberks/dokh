import { ptBR } from '@/i18n/locales/pt-BR';

it('alias @/ resolve módulos de src/ no Jest', () => {
  expect(ptBR.common.appName).toBe('DOKH');
});
