/**
 * Tipos de Trabalho do MVP (`work_entries.type` em domain-model.md).
 * Residência não é um tipo de Trabalho: é configurada em Perfil e gera Recebíveis próprios.
 */
export const WORK_TYPES = ['shift', 'procedure', 'appointment'] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export function isWorkType(value: unknown): value is WorkType {
  return typeof value === 'string' && (WORK_TYPES as readonly string[]).includes(value);
}

/** Plantão exige horário e duração; Procedimento e Atendimento os tornam opcionais. */
export function requiresSchedule(type: WorkType): boolean {
  return type === 'shift';
}
