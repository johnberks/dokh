import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Vibração com significado (pedido do usuário, 2026-10-03 — só o grupo 1): sucesso quando algo
 * importante é confirmado pelo servidor (Trabalho salvo, recebimento marcado, DOKH pronta) e
 * erro quando essa confirmação falha. Nunca em toque comum, digitação ou rolagem.
 */
export type HapticEvent = 'success' | 'error';

/**
 * Dispara junto com o retorno visual. O iPhone respeita "Hápticos do Sistema" sozinho; no
 * Android usa os efeitos de confirmar/recusar, que dispensam vibrador. Sem o módulo nativo
 * (build anterior ao `expo-haptics`) ou sem motor de vibração, nada acontece: a tela nunca
 * depende da vibração.
 */
export function haptic(event: HapticEvent): void {
  try {
    const done =
      Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(
            event === 'success' ? Haptics.AndroidHaptics.Confirm : Haptics.AndroidHaptics.Reject,
          )
        : Haptics.notificationAsync(
            event === 'success'
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Error,
          );
    void Promise.resolve(done).catch(() => {});
  } catch {
    // Módulo ausente: segue sem vibrar.
  }
}
