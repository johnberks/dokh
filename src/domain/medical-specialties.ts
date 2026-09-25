/**
 * Residências médicas reconhecidas no Brasil.
 *
 * Fonte: Resolução CFM nº 2.221/2018 (Portaria CME nº 1/2018), que relaciona 55 especialidades
 * médicas e 59 áreas de atuação. A grafia é a oficial da resolução (apenas a inicial maiúscula).
 * As áreas de atuação exigem especialidade prévia; na interface as duas listas aparecem juntas,
 * porque a pessoa informa o programa que está cursando.
 *
 * Atualizar quando a CME publicar nova portaria; não editar nomes por preferência visual.
 */

export type ResidencyProgramKind = 'specialty' | 'practice_area';

export type ResidencyProgram = {
  name: string;
  kind: ResidencyProgramKind;
};

/** 55 especialidades reconhecidas (seção A da portaria). */
export const MEDICAL_SPECIALTIES = [
  'Acupuntura',
  'Alergia e imunologia',
  'Anestesiologia',
  'Angiologia',
  'Cardiologia',
  'Cirurgia cardiovascular',
  'Cirurgia da mão',
  'Cirurgia de cabeça e pescoço',
  'Cirurgia do aparelho digestivo',
  'Cirurgia geral',
  'Cirurgia oncológica',
  'Cirurgia pediátrica',
  'Cirurgia plástica',
  'Cirurgia torácica',
  'Cirurgia vascular',
  'Clínica médica',
  'Coloproctologia',
  'Dermatologia',
  'Endocrinologia e metabologia',
  'Endoscopia',
  'Gastroenterologia',
  'Genética médica',
  'Geriatria',
  'Ginecologia e obstetrícia',
  'Hematologia e hemoterapia',
  'Homeopatia',
  'Infectologia',
  'Mastologia',
  'Medicina de emergência',
  'Medicina de família e comunidade',
  'Medicina do trabalho',
  'Medicina de tráfego',
  'Medicina esportiva',
  'Medicina física e reabilitação',
  'Medicina intensiva',
  'Medicina legal e perícia médica',
  'Medicina nuclear',
  'Medicina preventiva e social',
  'Nefrologia',
  'Neurocirurgia',
  'Neurologia',
  'Nutrologia',
  'Oftalmologia',
  'Oncologia clínica',
  'Ortopedia e traumatologia',
  'Otorrinolaringologia',
  'Patologia',
  'Patologia clínica/medicina laboratorial',
  'Pediatria',
  'Pneumologia',
  'Psiquiatria',
  'Radiologia e diagnóstico por imagem',
  'Radioterapia',
  'Reumatologia',
  'Urologia',
] as const;

/** 59 áreas de atuação (seção B da portaria). */
export const MEDICAL_PRACTICE_AREAS = [
  'Administração em saúde',
  'Alergia e imunologia pediátrica',
  'Angiorradiologia e cirurgia endovascular',
  'Atendimento ao queimado',
  'Cardiologia pediátrica',
  'Cirurgia bariátrica',
  'Cirurgia crânio-maxilo-facial',
  'Cirurgia do trauma',
  'Cirurgia videolaparoscópica',
  'Citopatologia',
  'Densitometria óssea',
  'Dor',
  'Ecocardiografia',
  'Ecografia vascular com doppler',
  'Eletrofisiologia clínica invasiva',
  'Emergência pediátrica',
  'Endocrinologia pediátrica',
  'Endoscopia digestiva',
  'Endoscopia ginecológica',
  'Endoscopia respiratória',
  'Ergometria',
  'Estimulação cardíaca eletrônica implantável',
  'Foniatria',
  'Gastroenterologia pediátrica',
  'Hansenologia',
  'Hematologia e hemoterapia pediátrica',
  'Hemodinâmica e cardiologia intervencionista',
  'Hepatologia',
  'Infectologia hospitalar',
  'Infectologia pediátrica',
  'Mamografia',
  'Medicina aeroespacial',
  'Medicina do adolescente',
  'Medicina do sono',
  'Medicina fetal',
  'Medicina intensiva pediátrica',
  'Medicina paliativa',
  'Medicina tropical',
  'Nefrologia pediátrica',
  'Neonatologia',
  'Neurofisiologia clínica',
  'Neurologia pediátrica',
  'Neurorradiologia',
  'Nutrição parenteral e enteral',
  'Nutrição parenteral e enteral pediátrica',
  'Nutrologia pediátrica',
  'Oncologia pediátrica',
  'Pneumologia pediátrica',
  'Psicogeriatria',
  'Psicoterapia',
  'Psiquiatria da infância e adolescência',
  'Psiquiatria forense',
  'Radiologia intervencionista e angiorradiologia',
  'Reprodução assistida',
  'Reumatologia pediátrica',
  'Sexologia',
  'Toxicologia médica',
  'Transplante de medula óssea',
  'Ultrassonografia em ginecologia e obstetrícia',
] as const;

export const RESIDENCY_PROGRAMS: readonly ResidencyProgram[] = [
  ...MEDICAL_SPECIALTIES.map((name) => ({ name, kind: 'specialty' as const })),
  ...MEDICAL_PRACTICE_AREAS.map((name) => ({ name, kind: 'practice_area' as const })),
].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

export type ResidencyProgramMatch = ResidencyProgram & {
  /** Trecho que casou com a busca, para destacar em negrito como no design. */
  start: number;
  end: number;
};

/** Sem acento e em minúsculas: quem digita "cardio" encontra "Cardiologia". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Busca incremental: prioriza início do nome, depois início de palavra e, por fim,
 * qualquer trecho. Empates saem em ordem alfabética.
 */
export function searchResidencyPrograms(query: string, limit = 6): ResidencyProgramMatch[] {
  const term = normalize(query.trim());
  if (term.length === 0) return [];

  const matches: (ResidencyProgramMatch & { rank: number })[] = [];
  for (const program of RESIDENCY_PROGRAMS) {
    const haystack = normalize(program.name);
    const index = haystack.indexOf(term);
    if (index < 0) continue;
    const startsWord = index === 0 || haystack[index - 1] === ' ' || haystack[index - 1] === '/';
    const rank = index === 0 ? 0 : startsWord ? 1 : 2;
    matches.push({ ...program, start: index, end: index + term.length, rank });
  }

  return matches
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, limit)
    .map(({ rank: _rank, ...match }) => match);
}

/** `true` quando o texto corresponde exatamente a um programa da lista oficial. */
export function isKnownResidencyProgram(value: string): boolean {
  const term = normalize(value.trim());
  return RESIDENCY_PROGRAMS.some((program) => normalize(program.name) === term);
}
