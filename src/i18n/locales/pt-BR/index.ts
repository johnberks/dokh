import { agenda } from './agenda';
import { auth } from './auth';
import { common } from './common';
import { finances } from './finances';
import { home } from './home';
import { navigation } from './navigation';
import { onboarding } from './onboarding';
import { profile } from './profile';

/** Um namespace por feature. Chaves em inglês, conteúdo em pt-BR (D06, D38). */
export const ptBR = { common, navigation, auth, onboarding, home, agenda, finances, profile };
