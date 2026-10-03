/**
 * Chaves de cache por feature (CLAUDE.md > Queries e mutations).
 * Toda query recebe o usuário implicitamente pela sessão; a chave carrega o `userId`
 * para trocar de conta nunca reaproveitar dados da anterior.
 */
export const queryKeys = {
  workLocations: (userId: string) => ['work-locations', userId] as const,
  agendaMonth: (userId: string, month: string) => ['agenda', userId, month] as const,
  /** Só os pontos do mês (seletor de data do formulário); mesmo prefixo, invalidado junto. */
  agendaMonthDots: (userId: string, month: string) => ['agenda', userId, month, 'dots'] as const,
  agendaDay: (userId: string, date: string) => ['agenda-day', userId, date] as const,
  workDetail: (userId: string, workId: string) => ['work', userId, workId] as const,
  /** "Usar novamente": derivado do histórico; prefixo `work`, invalidado a cada escrita. */
  workTemplates: (userId: string) => ['work', userId, 'templates'] as const,
  /** Próxima ocorrência de uma série (detalhe); prefixo `work`, invalidado a cada escrita. */
  workSeriesNext: (userId: string, seriesId: string, after: string) =>
    ['work', userId, 'series', seriesId, after] as const,
  financeMonth: (userId: string, month: string) => ['finance-month', userId, month] as const,
  financeYear: (userId: string, year: number) => ['finance-year', userId, year] as const,
  homeOverview: (userId: string) => ['home-overview', userId] as const,
  entitlement: (userId: string) => ['entitlement', userId] as const,
  /** Perfil (11.x): identidade, residência ativa, preferências e contagem por Local. */
  profile: (userId: string) => ['profile', userId] as const,
  profileResidency: (userId: string) => ['profile', userId, 'residency'] as const,
  workPreferences: (userId: string) => ['profile', userId, 'work-preferences'] as const,
  locationWorkCounts: (userId: string) => ['work', userId, 'location-counts'] as const,
  account: (userId: string) => ['profile', userId, 'account'] as const,
  financeNextEntry: (userId: string, month: string) =>
    ['finance-month', userId, month, 'next'] as const,
  financeUndated: (userId: string) => ['finance-month', userId, 'undated'] as const,
  /** Preferências de notificação (Perfil 14). */
  notificationPreferences: (userId: string) => ['profile', userId, 'notifications'] as const,
  /** O que os lembretes locais agendam; prefixo `finance-month`, invalidado a cada escrita. */
  reminderSources: (userId: string, today: string) =>
    ['finance-month', userId, 'reminders', today] as const,
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
