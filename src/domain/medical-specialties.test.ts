import {
  isKnownResidencyProgram,
  MEDICAL_PRACTICE_AREAS,
  MEDICAL_SPECIALTIES,
  RESIDENCY_PROGRAMS,
  searchResidencyPrograms,
} from './medical-specialties';

describe('residências médicas (CFM 2.221/2018)', () => {
  it('traz as 55 especialidades e as 59 áreas de atuação da portaria', () => {
    expect(MEDICAL_SPECIALTIES).toHaveLength(55);
    expect(MEDICAL_PRACTICE_AREAS).toHaveLength(59);
    // 55 + 59 da portaria + os programas adicionais pedidos pelo usuário.
    expect(RESIDENCY_PROGRAMS).toHaveLength(115);
    expect(MEDICAL_SPECIALTIES[0]).toBe('Acupuntura');
    expect(MEDICAL_SPECIALTIES).toContain('Ginecologia e obstetrícia');
    expect(MEDICAL_SPECIALTIES).toContain('Medicina de família e comunidade');
    expect(MEDICAL_PRACTICE_AREAS).toContain('Cardiologia pediátrica');
    expect(MEDICAL_PRACTICE_AREAS).toContain('Neonatologia');
  });

  it('inclui Traumatologia Bucomaxilofacial, fora das listas da portaria', () => {
    expect(MEDICAL_SPECIALTIES).not.toContain('Traumatologia Bucomaxilofacial');
    expect(MEDICAL_PRACTICE_AREAS).not.toContain('Traumatologia Bucomaxilofacial');
    expect(RESIDENCY_PROGRAMS).toContainEqual({
      name: 'Traumatologia Bucomaxilofacial',
      kind: 'extra',
    });
    expect(searchResidencyPrograms('bucomaxilo')[0].name).toBe('Traumatologia Bucomaxilofacial');
  });

  it('não tem nome repetido e está em ordem alfabética pt-BR', () => {
    const names = RESIDENCY_PROGRAMS.map((program) => program.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });

  it('sugere assim que a pessoa começa a escrever', () => {
    const first = searchResidencyPrograms('c');
    expect(first.length).toBeGreaterThan(0);
    expect(first[0].name.toLowerCase().startsWith('c')).toBe(true);
  });

  it('prioriza início do nome, depois início de palavra (exemplo do design)', () => {
    const names = searchResidencyPrograms('car').map((program) => program.name);
    expect(names[0]).toBe('Cardiologia');
    expect(names).toContain('Cardiologia pediátrica');
    expect(names).toContain('Cirurgia cardiovascular');
    expect(names.indexOf('Cardiologia pediátrica')).toBeLessThan(
      names.indexOf('Cirurgia cardiovascular'),
    );
  });

  it('ignora acento e caixa e devolve o trecho para destacar', () => {
    const [match] = searchResidencyPrograms('PEDIATRIA');
    expect(match.name).toBe('Pediatria');
    expect(match.name.slice(match.start, match.end)).toBe('Pediatria');

    const [withAccent] = searchResidencyPrograms('cirurgia toracica');
    expect(withAccent.name).toBe('Cirurgia torácica');
  });

  it('respeita o limite e devolve vazio sem busca', () => {
    expect(searchResidencyPrograms('  ')).toEqual([]);
    expect(searchResidencyPrograms('medicina', 3)).toHaveLength(3);
  });

  it('reconhece um programa da lista oficial, com ou sem acento', () => {
    expect(isKnownResidencyProgram('Cardiologia')).toBe(true);
    expect(isKnownResidencyProgram('cirurgia toracica')).toBe(true);
    expect(isKnownResidencyProgram('Cardiologia Intervencionista de Marte')).toBe(false);
  });
});
