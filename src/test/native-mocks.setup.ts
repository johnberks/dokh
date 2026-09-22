// Mocks oficiais de módulos nativos que não existem no ambiente Node do Jest.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
