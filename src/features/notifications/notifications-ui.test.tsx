import '@/i18n';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Linking } from 'react-native';
import { useGuideTour } from '@/features/guide/guide-tour';
import { fakeNotifications } from '@/test/fake-notifications';
import { renderWithProviders } from '@/test/render';
import { NotificationPrompt } from './NotificationPrompt';
import { NotificationSync } from './NotificationSync';
import { NotificationsScreen } from './NotificationsScreen';
import { useNotificationPermission } from './notification-permission';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './notification-preferences';
import { notificationsModule } from './notifications-module';
import { resetSchedulerForTests } from './scheduler';
import { useNotificationTaps } from './useNotificationTaps';

let mockSession: { status: string; userId: string | null } = { status: 'signedIn', userId: 'u1' };
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/features/auth/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthSession: () => mockSession,
}));
// Os hooks leem de dentro do próprio módulo; a tela recebe o estado por eles.
let mockPreferences = DEFAULT_PREFERENCES_FOR_TESTS();
const mockSave = jest.fn(async (_userId: string, _preferences: unknown) => undefined);
jest.mock('./notification-preferences', () => {
  const actual = jest.requireActual('./notification-preferences');
  const { useMutation } = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useNotificationPreferences: () => ({
      data: mockPreferences,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    }),
    useSaveNotificationPreferences: () =>
      useMutation({ mutationFn: (preferences: unknown) => mockSave('u1', preferences) }),
  };
});
const mockSources = jest.fn((_enabled: boolean) => ({
  receivables: [],
  works: [],
  undatedCount: 2,
}));
jest.mock('./reminder-sources', () => ({
  ...jest.requireActual('./reminder-sources'),
  useReminderSources: (_today: string, enabled: boolean) => ({
    data: enabled ? mockSources(enabled) : undefined,
  }),
}));

function DEFAULT_PREFERENCES_FOR_TESTS() {
  return jest.requireActual('./notification-preferences').DEFAULT_NOTIFICATION_PREFERENCES;
}

const mockedModule = jest.mocked(notificationsModule);
const mockedSave = mockSave;
const mockedSources = mockSources;

beforeEach(() => {
  jest.clearAllMocks();
  resetSchedulerForTests();
  mockSession = { status: 'signedIn', userId: 'u1' };
  mockPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  mockedModule.mockReturnValue(null);
  useNotificationPermission.setState({ state: null });
  useGuideTour.getState().finish();
});

describe('Perfil › Notificações (Perfil 14)', () => {
  it('quatro escolhas em dois grupos, ligadas por padrão, com a personalização à mostra', async () => {
    await renderWithProviders(<NotificationsScreen />);
    expect(await screen.findByText('Lembrar no dia previsto')).toBeTruthy();
    expect(screen.getByText('Trabalhos sem data de entrada')).toBeTruthy();
    expect(screen.getByText('Lembrete de próximo trabalho')).toBeTruthy();
    for (const id of [
      'notifications-due-day',
      'notifications-undated',
      'notifications-upcoming-work',
    ]) {
      expect(screen.getByTestId(id).props.value).toBe(true);
    }
    expect(screen.getByTestId('notifications-due-time')).toBeTruthy();
    expect(screen.getByTestId('notifications-lead')).toBeTruthy();
    // "Alterações importantes" não aparece enquanto não tiver definição.
    expect(screen.queryByText('Alterações importantes')).toBeNull();
  });

  it('desligar grava na hora e esconde a personalização daquele lembrete', async () => {
    await renderWithProviders(<NotificationsScreen />);
    const toggle = await screen.findByTestId('notifications-due-day');
    await act(async () => {
      await fireEvent(toggle, 'valueChange', false);
    });
    expect(mockedSave).toHaveBeenCalledWith('u1', {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      receivableDueDay: false,
    });
    expect(screen.queryByTestId('notifications-due-time')).toBeNull();
  });

  it('horário e antecedência personalizam o lembrete', async () => {
    await renderWithProviders(<NotificationsScreen />);
    await screen.findByTestId('notifications-due-time');
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: '07h' }));
    });
    expect(mockedSave).toHaveBeenLastCalledWith('u1', {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      receivableDueTime: '07:00',
    });
    await act(async () => {
      await fireEvent.press(screen.getByRole('radio', { name: '1 dia' }));
    });
    expect(mockedSave).toHaveBeenLastCalledWith('u1', {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      receivableDueTime: '07:00',
      workReminderMinutes: 1440,
    });
  });

  it('falha ao gravar volta ao que estava e avisa', async () => {
    mockedSave.mockRejectedValueOnce(new Error('offline'));
    await renderWithProviders(<NotificationsScreen />);
    const toggle = await screen.findByTestId('notifications-undated');
    await act(async () => {
      await fireEvent(toggle, 'valueChange', false);
    });
    await waitFor(() => expect(screen.getByTestId('notifications-error')).toBeTruthy());
    expect(screen.getByTestId('notifications-undated').props.value).toBe(true);
  });

  it('permissão negada no iPhone: escolhas mantidas e atalho para os Ajustes', async () => {
    mockedModule.mockReturnValue(fakeNotifications('denied') as never);
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await renderWithProviders(<NotificationsScreen />);
    expect(await screen.findByTestId('notifications-system-denied')).toBeTruthy();
    expect(screen.getByTestId('notifications-due-day').props.value).toBe(true);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('notifications-system-action'));
    });
    expect(settings).toHaveBeenCalled();
  });
});

describe('convite para os lembretes', () => {
  it('aparece uma vez com a permissão não pedida; "Ativar" pede ao sistema e guarda a resposta', async () => {
    const fake = fakeNotifications('undetermined');
    mockedModule.mockReturnValue(fake as never);
    useNotificationPermission.setState({ state: 'undetermined' });
    await renderWithProviders(<NotificationPrompt />);
    expect(
      await screen.findByText('A DOKH avisa na hora certa', {}, { timeout: 3000 }),
    ).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('notification-prompt-allow'));
    });
    expect(fake.requestPermissionsAsync).toHaveBeenCalled();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'dokh.notifications.prompt-answered',
      'yes',
    );
  });

  it('não aparece durante o guia, nem depois de respondido, nem com a permissão já decidida', async () => {
    useNotificationPermission.setState({ state: 'undetermined' });
    useGuideTour.getState().start(null);
    const view = await renderWithProviders(<NotificationPrompt />);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    expect(screen.queryByText('A DOKH avisa na hora certa')).toBeNull();
    await view.unmount();

    useGuideTour.getState().finish();
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('yes');
    const answered = await renderWithProviders(<NotificationPrompt />);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    expect(screen.queryByText('A DOKH avisa na hora certa')).toBeNull();
    await answered.unmount();

    useNotificationPermission.setState({ state: 'granted' });
    await renderWithProviders(<NotificationPrompt />);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    expect(screen.queryByText('A DOKH avisa na hora certa')).toBeNull();
  });
});

describe('sincronização dos lembretes', () => {
  it('com permissão e dados, agenda o plano; sair da conta cancela tudo', async () => {
    const fake = fakeNotifications('granted');
    mockedModule.mockReturnValue(fake as never);
    const view = await renderWithProviders(<NotificationSync />);
    await waitFor(() => expect(fake.scheduleNotificationAsync).toHaveBeenCalled());
    expect(fake.scheduleNotificationAsync.mock.calls[0][0]).toMatchObject({
      identifier: 'undated-weekly',
    });

    mockSession = { status: 'signedOut', userId: null };
    await view.rerender(<NotificationSync />);
    await waitFor(() => expect(fake.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2));
  });

  it('sem permissão, não lê nem agenda nada', async () => {
    const fake = fakeNotifications('denied');
    mockedModule.mockReturnValue(fake as never);
    await renderWithProviders(<NotificationSync />);
    await waitFor(() => expect(useNotificationPermission.getState().state).toBe('denied'));
    expect(mockedSources).not.toHaveBeenCalled();
    expect(fake.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

function Taps() {
  useNotificationTaps();
  return null;
}

describe('toque no aviso', () => {
  it('abre o destino do aviso, inclusive o que abriu o app', async () => {
    const fake = fakeNotifications('granted');
    fake.getLastNotificationResponse.mockReturnValue({
      notification: { request: { content: { data: { url: '/work/w1' } } } },
    });
    mockedModule.mockReturnValue(fake as never);
    await renderWithProviders(<Taps />);
    expect(router.push).toHaveBeenCalledWith('/work/w1');
    expect(fake.clearLastNotificationResponse).toHaveBeenCalled();
    await act(async () => {
      fake.tap('/finances/entries?month=2026-10');
    });
    expect(router.push).toHaveBeenLastCalledWith('/finances/entries?month=2026-10');
  });
});
