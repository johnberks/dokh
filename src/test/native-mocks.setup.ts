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
