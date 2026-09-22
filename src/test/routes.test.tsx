import path from 'node:path';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const APP_DIR = path.resolve(__dirname, '../../app');

/**
 * No RNTL 14 `render` é assíncrono, mas `renderRouter` do expo-router ainda devolve o valor
 * sem aguardar. Aguardamos o resultado antes de consultar a rota ou a tela.
 */
async function openAt(initialUrl: string) {
  const router = renderRouter(APP_DIR, { initialUrl });
  await router;
  // Não devolver `router` diretamente: ele é thenable e seria desembrulhado pelo `await`.
  return { getPathname: () => router.getPathname() };
}

describe('rotas', () => {
  it('abre nas tabs com Início', async () => {
    const router = await openAt('/');
    expect(router.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'Início' })).toBeTruthy();
  });

  it.each([
    ['/agenda', 'Sua agenda'],
    ['/finances', 'Finanças'],
    ['/profile', 'Perfil'],
    ['/sign-in', 'Entrar'],
    ['/welcome', 'Vamos organizar sua rotina'],
  ])('resolve deep link %s', async (url, heading) => {
    const router = await openAt(url);
    expect(router.getPathname()).toBe(url);
    expect(screen.getByRole('header', { name: heading })).toBeTruthy();
  });

  it('ação central abre o fluxo de criação sem virar tab', async () => {
    const router = await openAt('/agenda');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('tab-create'));
    });
    expect(router.getPathname()).toBe('/work/new');
    expect(screen.getByRole('header', { name: 'Adicionar trabalho' })).toBeTruthy();
  });

  it('deep link /create redireciona para o fluxo de criação', async () => {
    const router = await openAt('/create');
    expect(router.getPathname()).toBe('/work/new');
  });

  it('catálogo interno abre por deep link em desenvolvimento', async () => {
    const router = await openAt('/dev/primitives');
    expect(router.getPathname()).toBe('/dev/primitives');
    expect(screen.getByRole('header', { name: 'Componentes básicos' })).toBeTruthy();
  });
});
