import { isWorkType, requiresSchedule, WORK_TYPES } from './work-type';

describe('tipos de Trabalho', () => {
  it('são exatamente Plantão, Procedimento e Atendimento, nesta ordem', () => {
    expect(WORK_TYPES).toEqual(['shift', 'procedure', 'appointment']);
  });

  it('não aceitam residência nem valores desconhecidos', () => {
    expect(isWorkType('residency')).toBe(false);
    expect(isWorkType('SHIFT')).toBe(false);
    expect(isWorkType(undefined)).toBe(false);
    expect(isWorkType('appointment')).toBe(true);
  });

  it('só Plantão exige horário e duração', () => {
    expect(WORK_TYPES.filter(requiresSchedule)).toEqual(['shift']);
  });
});
