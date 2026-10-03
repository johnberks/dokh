import { type Href, router } from 'expo-router';
import { useEffect } from 'react';
import { notificationsModule } from './notifications-module';

type Response = { notification: { request: { content: { data?: Record<string, unknown> } } } };

function destination(response: Response): Href | null {
  const url = response.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? (url as Href) : null;
}

/**
 * Tocar num aviso abre o destino dele: a entrada de um Trabalho abre o detalhe (com "Marcar
 * como recebido"), várias entradas abrem Entradas do mês, o lembrete de Trabalho abre o
 * Trabalho. Montado nas abas: só navega com a pessoa já dentro do app, inclusive quando o
 * toque abriu o app do zero.
 */
export function useNotificationTaps() {
  useEffect(() => {
    const Notifications = notificationsModule();
    if (!Notifications) return;
    const open = (response: Response) => {
      const href = destination(response);
      if (href) router.push(href);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);
}
