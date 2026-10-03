import { requireOptionalNativeModule } from 'expo-modules-core';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/**
 * `expo-notifications` exige o código nativo já na importação. Um build anterior a ele (como o de
 * desenvolvimento antes do próximo `eas build`) quebraria ao abrir; aqui o módulo só carrega se
 * o nativo existe — sem ele, a DOKH segue igual, só sem lembretes.
 */
export function notificationsModule(): NotificationsModule | null {
  if (cached === undefined) {
    cached = requireOptionalNativeModule('ExpoNotificationScheduler')
      ? (require('expo-notifications') as NotificationsModule)
      : null;
  }
  return cached;
}
