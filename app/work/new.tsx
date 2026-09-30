import { router } from 'expo-router';
import { NewWorkFlow } from '@/features/work/form/NewWorkFlow';

/**
 * Modal do `+`: fechar volta para onde a pessoa estava; salvar termina a animação do botão
 * e abre a Agenda no dia do Trabalho salvo, sem outro toque (pedido do usuário, 2026-09-26).
 */
export default function NewWorkScreen() {
  return (
    <NewWorkFlow
      onClose={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/agenda');
      }}
      onSaved={(date) => router.dismissTo({ pathname: '/agenda', params: { date } })}
    />
  );
}
