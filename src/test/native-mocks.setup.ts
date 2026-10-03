// Mocks oficiais de módulos nativos que não existem no ambiente Node do Jest.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// Jest has no native font loader/splash. Route tests exercise the ready path;
// getTypography() covers the error fallback separately.
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: jest.fn(() => [true, null]),
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => {}),
}));

// Reanimated 4 / worklets e gesture handler: mocks oficiais publicados pelas bibliotecas.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
require('react-native-reanimated').setUpTests();
require('react-native-gesture-handler/jestSetup');

// Login com Apple (4.3): indisponível por padrão; testes específicos sobrescrevem.
// Vibração (grupo 1): os testes conferem quando ela dispara.
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(async () => {}),
  performAndroidHapticsAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  AndroidHaptics: { Confirm: 'confirm', Reject: 'reject' },
}));
// Entrar com Google (4.4): cada teste define a resposta do `signIn`.
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(),
    signOut: jest.fn(async () => null),
  },
  isCancelledResponse: (response: { type?: string }) => response?.type === 'cancelled',
  isErrorWithCode: (error: unknown) =>
    error != null && typeof error === 'object' && 'code' in error,
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

// Teclado (Onboarding v2): mock oficial da biblioteca.
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
