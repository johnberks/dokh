import { router, useLocalSearchParams } from 'expo-router';
import { NewWorkFlow } from '@/features/work/form/NewWorkFlow';

/**
 * Modal do `+`: fechar volta para onde a pessoa estava; salvar termina a animação do botão
 * e abre a Agenda no dia do Trabalho salvo, sem outro toque (pedido do usuário, 2026-09-26).
 * `?date=` (dia escolhido na Agenda) já preenche a data do Trabalho.
 */
export default function NewWorkScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return (
    <NewWorkFlow
      initialDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null}
      onClose={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/agenda');
      }}
      onSaved={(workDate) => router.dismissTo({ pathname: '/agenda', params: { date: workDate } })}
    />
  );
}
