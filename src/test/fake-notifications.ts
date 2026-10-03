/** `expo-notifications` falso para testes de lembretes (ver notifications-module). */
export function fakeNotifications(permission: 'granted' | 'denied' | 'undetermined' = 'granted') {
  const listeners: ((response: unknown) => void)[] = [];
  const module = {
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(async () => null),
    AndroidImportance: { DEFAULT: 3 },
    IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly' },
    getPermissionsAsync: jest.fn(async () => ({ status: permission, ios: { status: 0 } })),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted', ios: { status: 2 } })),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
    scheduleNotificationAsync: jest.fn(
      async (request: { identifier: string }) => request.identifier,
    ),
    getLastNotificationResponse: jest.fn((): unknown => null),
    clearLastNotificationResponse: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn((listener: (response: unknown) => void) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    }),
    /** Simula o toque num aviso. */
    tap(url: string) {
      for (const listener of listeners) {
        listener({ notification: { request: { content: { data: { url } } } } });
      }
    },
  };
  return module;
}
