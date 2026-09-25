import { deriveWorkTemplates, type TemplateSourceRow, templateDraft } from './work-templates';

const row = (patch: Partial<TemplateSourceRow>): TemplateSourceRow => ({
  work_entry_id: 'w',
  location_id: 'loc-a',
  location_name: 'Hospital A',
  color_token: 'sage',
  type: 'shift',
  work_date: '2026-09-12',
  start_time: '19:00:00',
  duration_minutes: 720,
  amount_cents: 120000,
  expected_on: '2026-10-12',
  ...patch,
});

const active = new Set(['loc-a', 'loc-b', 'loc-c', 'loc-d']);

describe('Usar novamente (templates do histórico)', () => {
  it('uma combinação por Local/tipo/horário/duração/valor, da mais recente', () => {
    const templates = deriveWorkTemplates(
      [
        row({ work_entry_id: 'w3', work_date: '2026-09-20', expected_on: '2026-10-20' }),
        row({ work_entry_id: 'w2', work_date: '2026-09-12' }),
        row({ location_id: 'loc-b', location_name: 'Clínica B', amount_cents: 85000 }),
      ],
      active,
    );
    expect(templates.map((template) => template.locationName)).toEqual(['Hospital A', 'Clínica B']);
    expect(templates[0]).toMatchObject({ startTime: '19:00', payment: { kind: 'term', days: 30 } });
  });

  it('limita a três e ignora Local arquivado', () => {
    const templates = deriveWorkTemplates(
      [
        row({ location_id: 'arquivado' }),
        row({ location_id: 'loc-a' }),
        row({ location_id: 'loc-b' }),
        row({ location_id: 'loc-c' }),
        row({ location_id: 'loc-d' }),
      ],
      active,
    );
    expect(templates.map((template) => template.locationId)).toEqual(['loc-a', 'loc-b', 'loc-c']);
  });

  it('previsão: sem data vira "não sei"; data fora de D30/60/90 não se repete', () => {
    const [unknown] = deriveWorkTemplates([row({ expected_on: null })], active);
    expect(unknown.payment).toEqual({ kind: 'unknown' });
    const [custom] = deriveWorkTemplates([row({ expected_on: '2026-10-01' })], active);
    expect(custom.payment).toBeNull();
  });

  it('rascunho traz tudo menos a data, com o valor em pt-BR', () => {
    const [template] = deriveWorkTemplates([row({ amount_cents: 120050 })], active);
    expect(templateDraft(template)).toEqual({
      type: 'shift',
      locationName: 'Hospital A',
      workDate: null,
      startTime: '19:00',
      durationMinutes: 720,
      amount: '1.200,50',
      expected: null,
      plannedTermDays: 30,
      idempotencyKey: null,
    });
  });
});
