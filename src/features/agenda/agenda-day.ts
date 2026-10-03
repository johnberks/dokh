import { router } from 'expo-router';
import { create } from 'zustand';
import type { LocalDate } from '@/domain/calendar';

type AgendaDayState = {
  /** Dia escolhido na Agenda enquanto ela está na tela. */
  date: LocalDate | null;
  /** O `+` foi aberto a partir da Agenda: voltar sem salvar mantém o dia que ela mostrava. */
  keepOnReturn: boolean;
};

export const useAgendaDay = create<AgendaDayState>(() => ({ date: null, keepOnReturn: false }));

/**
 * `+` aberto da Agenda (o do topo, o do dia livre ou o central): o novo Trabalho já vem no
 * dia escolhido, para seguir registrando nele (pedido do usuário, 2026-10-03).
 */
export function openNewWorkOnAgendaDay() {
  const { date } = useAgendaDay.getState();
  useAgendaDay.setState({ keepOnReturn: true });
  router.push(date ? { pathname: '/work/new', params: { date } } : '/work/new');
}
