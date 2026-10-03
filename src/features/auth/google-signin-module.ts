import { TurboModuleRegistry } from 'react-native';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let cached: GoogleSigninModule | null | undefined;

/**
 * A biblioteca do Google exige o código nativo já na importação. Um build anterior a ela (como o
 * de desenvolvimento antes do próximo `eas build`) quebraria ao abrir a tela de login; aqui ela
 * só carrega se o nativo existe — sem ele, o botão do Google fica indisponível.
 */
export function googleSigninModule(): GoogleSigninModule | null {
  if (cached === undefined) {
    cached = TurboModuleRegistry.get('RNGoogleSignin')
      ? (require('@react-native-google-signin/google-signin') as GoogleSigninModule)
      : null;
  }
  return cached;
}
