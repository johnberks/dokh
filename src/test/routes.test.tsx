import path from 'node:path';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import * as SplashScreen from 'expo-splash-screen';

const APP_DIR = path.resolve(__dirname, '../../app');

let mockSession: { status: 'loading' | 'signedIn' | 'signedOut'; userId: string | null } = {
  status: 'signedIn',
  userId: 'test-user',
};
let mockOnboarding: { isPending: boolean; isError: boolean; data?: boolean; refetch: jest.Mock } = {
  isPending: false,
  isError: false,
  data: true,
  refetch: jest.fn(),
};
const mockSignOut = jest.fn(async () => {});

jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => ({ ...mockSession, signOut: mockSignOut }),
}));
jest.mock('@/features/auth/onboarding-status', () => ({
  useOnboardingStatus: () => mockOnboarding,
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { status: 'signedIn', userId: 'test-user' };
    mockOnboarding = { isPending: false, isError: false, data: true, refetch: jest.fn() };
  });

  it('abre nas tabs com Início', async () => {
    const router = await openAt('/');
    expect(router.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'Início' })).toBeTruthy();
  });

  it.each([
    ['/finances', 'Finanças'],
    ['/profile', 'Perfil'],
    ['/recover-password', 'Recuperar senha'],
    ['/reset-password', 'Defina uma nova senha.'],
    ['/auth-callback', 'Confirmar conta'],
  ])(
    'resolve deep link %s',
    async (url, heading) => {
      const router = await openAt(url);
      expect(router.getPathname()).toBe(url);
      expect(screen.getByRole('header', { name: heading })).toBeTruthy();
    },
    15_000,
  );

  it('resolve deep link /agenda na Agenda real (mês no topo e calendário em card)', async () => {
    await openAt('/agenda');
    expect(screen.getByTestId('agenda-screen')).toBeTruthy();
    expect(screen.getByText('SUA AGENDA')).toBeTruthy();
    expect(screen.getByTestId('agenda-month')).toBeTruthy();
    expect(screen.getByTestId('agenda-calendar')).toBeTruthy();
  });

  it('ação central abre o fluxo de criação sem virar tab', async () => {
    const router = await openAt('/agenda');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('tab-create'));
    });
    expect(router.getPathname()).toBe('/work/new');
    expect(screen.getByRole('header', { name: 'Adicionar trabalho' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeTruthy();
  });

  it('barra inferior mantém as quatro tabs e o alvo central do HTML', async () => {
    const router = await openAt('/');
    expect(screen.getByRole('tab', { name: 'Início' }).props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByRole('tab', { name: 'Agenda' })).toHaveStyle({ width: 64, minHeight: 44 });
    expect(screen.getByTestId('tab-create')).toHaveStyle({ width: 56, height: 56 });
    await act(async () => {
      await fireEvent.press(screen.getByRole('tab', { name: 'Agenda' }));
    });
    expect(router.getPathname()).toBe('/agenda');
    expect(screen.getByRole('tab', { name: 'Agenda' }).props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('fechar criação retorna à tab anterior', async () => {
    const router = await openAt('/agenda');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('tab-create'));
    });
    expect(router.getPathname()).toBe('/work/new');
    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    });
    expect(router.getPathname()).toBe('/agenda');
  });

  it('deep link /create redireciona para o fluxo de criação', async () => {
    const router = await openAt('/create');
    expect(router.getPathname()).toBe('/work/new');
  });

  it('catálogo interno abre por deep link em desenvolvimento', async () => {
    const router = await openAt('/dev/primitives');
    expect(router.getPathname()).toBe('/dev/primitives');
    expect(screen.getByTestId('gesture-handler-root')).toHaveStyle({ flex: 1 });
    expect(screen.getByRole('header', { name: 'Componentes básicos' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Movimento e transições' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(router.getPathname()).toBe('/');
  });

  it('Home provisória abre o catálogo apenas em desenvolvimento', async () => {
    const router = await openAt('/');
    await fireEvent.press(screen.getByRole('button', { name: 'Componentes básicos' }));
    expect(router.getPathname()).toBe('/dev/primitives');
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
    expect(router.getPathname()).toBe('/');
  });

  it('sessão ausente abre o splash e a tela de criar conta, bloqueando as tabs', async () => {
    mockSession = { status: 'signedOut', userId: null };
    const router = await openAt('/');
    expect(screen.getByTestId('intro-splash')).toBeTruthy();
    await waitFor(() => expect(router.getPathname()).toBe('/intro'));
  });

  it('sessão ausente permite cadastro', async () => {
    mockSession = { status: 'signedOut', userId: null };
    const router = await openAt('/sign-up');
    expect(router.getPathname()).toBe('/sign-up');
  });

  it('deep link privado sem sessão não abre conteúdo protegido', async () => {
    mockSession = { status: 'signedOut', userId: null };
    const router = await openAt('/finances');
    await waitFor(() => expect(router.getPathname()).toBe('/intro'));
    expect(screen.queryByRole('header', { name: 'Finanças' })).toBeNull();
  });

  it('perfil incompleto abre onboarding e bloqueia as tabs', async () => {
    mockOnboarding.data = false;
    const router = await openAt('/finances');
    expect(screen.getByTestId('onboarding-intro')).toBeTruthy();
    expect(
      screen.getByRole('header', { name: 'Vamos deixar a DOKH mais com a sua cara.' }),
    ).toBeTruthy();
    await waitFor(() => expect(router.getPathname()).toBe('/welcome'));
  });

  it('perfil concluído não permite voltar ao login ou onboarding', async () => {
    const router = await openAt('/sign-in');
    expect(router.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'Início' })).toBeTruthy();
  });

  it('perfil concluído não reabre o onboarding por deep link', async () => {
    const router = await openAt('/welcome');
    expect(router.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'Início' })).toBeTruthy();
  });

  it('segura o splash enquanto sessão e perfil não foram resolvidos', async () => {
    mockSession = { status: 'loading', userId: null };
    await openAt('/');
    expect(screen.queryByRole('header', { name: 'Bem-vindo de volta.' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'Início' })).toBeNull();
    expect(screen.getByLabelText('Carregando sua conta')).toBeTruthy();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('perfil pendente não exibe Home nem onboarding durante a troca de sessão', async () => {
    mockOnboarding.isPending = true;
    mockOnboarding.data = undefined;
    await openAt('/');
    expect(screen.getByLabelText('Carregando sua conta')).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Início' })).toBeNull();
    expect(screen.queryByRole('header', { name: 'Vamos organizar sua rotina' })).toBeNull();
  });

  it('ação temporária de sair fica disponível no Perfil provisório', async () => {
    await openAt('/profile');
    await fireEvent.press(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('falha ao consultar o perfil não é tratada como onboarding incompleto', async () => {
    mockOnboarding.isError = true;
    const router = await openAt('/');
    expect(router.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'Não foi possível carregar agora.' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeTruthy();
  });
});
