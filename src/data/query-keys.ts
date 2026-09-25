/**
 * Chaves de cache por feature (CLAUDE.md > Queries e mutations).
 * Toda query recebe o usuário implicitamente pela sessão; a chave carrega o `userId`
 * para trocar de conta nunca reaproveitar dados da anterior.
 */
export const queryKeys = {
  workLocations: (userId: string) => ['work-locations', userId] as const,
  agendaMonth: (userId: string, month: string) => ['agenda', userId, month] as const,
  agendaDay: (userId: string, date: string) => ['agenda-day', userId, date] as const,
  workDetail: (userId: string, workId: string) => ['work', userId, workId] as const,
  financeMonth: (userId: string, month: string) => ['finance-month', userId, month] as const,
  financeYear: (userId: string, year: number) => ['finance-year', userId, year] as const,
  homeOverview: (userId: string) => ['home-overview', userId] as const,
} as const;

/** Prefixos invalidados por qualquer escrita de Trabalho/Recebível. */
export const workAffectedPrefixes = [
  'agenda',
  'agenda-day',
  'work',
  'finance-month',
  'finance-year',
  'home-overview',
] as const;
