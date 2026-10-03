import appConfig, { googleIosUrlScheme } from '../../app.config';

const base = { name: 'DOKH', slug: 'dokh', plugins: ['expo-router'] };

describe('app.config (4.4)', () => {
  const original = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  afterEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = original;
  });

  it('o URL scheme do Google sai do client ID do iOS', () => {
    expect(googleIosUrlScheme('123-abc.apps.googleusercontent.com')).toBe(
      'com.googleusercontent.apps.123-abc',
    );
  });

  it('sem o client ID do iOS, o build sai sem o plugin do Google (nunca quebra)', () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    expect(appConfig({ config: base } as never).plugins).toEqual(['expo-router']);
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '123-abc.apps.googleusercontent.com';
    expect(appConfig({ config: base } as never).plugins).toEqual([
      'expo-router',
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: 'com.googleusercontent.apps.123-abc' },
      ],
    ]);
  });
});
