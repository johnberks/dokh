import { i18n } from '@/i18n';
import type { FinanceMonth } from './finance-data';
import {
  heroCaption,
  hoursLabel,
  isEmptyMonth,
  monthTense,
  noNextEntryReason,
  originShares,
  receivedPercent,
  relativeDay,
  splitCaption,
} from './finance-format';

const t = i18n.getFixedT('pt-BR', 'finances');

const month = (patch: Partial<FinanceMonth> = {}): FinanceMonth => ({
  hasExpectedEntries: true,
  expectedTotalCents: 1245000n,
  receivedCents: 835000n,
  awaitingCents: 410000n,
  undatedCount: 0,
  undatedTotalCents: 0n,
  workGeneratedCents: 1480000n,
  workCount: 7,
  workDurationMinutes: 5040,
  hourlyValueCents: 17600n,
  ...patch,
});

describe('regras de apresentação de Finanças', () => {
  it('passado, atual e futuro a partir de hoje', () => {
    expect(monthTense('2026-08', '2026-09-26')).toBe('past');
    expect(monthTense('2026-09', '2026-09-26')).toBe('current');
    expect(monthTense('2026-10', '2026-09-26')).toBe('future');
  });

  it('topo: previsto no mês atual, "entraram" no passado e R$ — sem previsão', () => {
    expect(heroCaption(month(), 'current', 'Setembro', t)).toEqual({
      amount: 1245000n,
      caption: 'previstos para entrar este mês',
    });
    expect(
      heroCaption(month({ awaitingCents: 0n, receivedCents: 1632000n }), 'past', 'Agosto', t),
    ).toEqual({
      amount: 1632000n,
      caption: 'entraram em agosto · mês fechado',
    });
    expect(heroCaption(month(), 'future', 'Outubro', t).caption).toBe(
      'previstos para entrar em outubro',
    );
    expect(
      heroCaption(month({ hasExpectedEntries: false, undatedCount: 3 }), 'current', 'Setembro', t),
    ).toEqual({ amount: null, caption: 'nada previsto para entrar ainda' });
    const empty = month({ hasExpectedEntries: false, workCount: 0 });
    expect(isEmptyMonth(empty)).toBe(true);
    expect(heroCaption(empty, 'current', 'Setembro', t).caption).toBe('nada registrado ainda');
  });

  it('percentual recebido nunca arredonda para 100% antes da hora', () => {
    expect(receivedPercent(month())).toBe(67);
    expect(receivedPercent(month({ receivedCents: 1244999n, awaitingCents: 1n }))).toBe(99);
    expect(splitCaption(month(), 'current', t)).toBe('67% recebido');
    expect(splitCaption(month({ awaitingCents: 0n }), 'current', t)).toBe(
      '100% recebido · nada em aberto',
    );
    expect(splitCaption(month({ awaitingCents: 0n }), 'past', t)).toBe(
      '100% recebido · mês fechado',
    );
  });

  it('próxima entrada relativa e motivo quando não há', () => {
    expect(relativeDay('2026-09-26', '2026-09-26', t)).toBe('hoje');
    expect(relativeDay('2026-09-27', '2026-09-26', t)).toBe('amanhã');
    expect(relativeDay('2026-10-05', '2026-09-26', t)).toBe('em 9 dias');
    expect(noNextEntryReason(month({ awaitingCents: 0n }), 'past', 'Agosto', t)).toBe(
      'Agosto está fechado: nenhuma entrada ficou pendente neste mês.',
    );
    expect(
      noNextEntryReason(month({ hasExpectedEntries: false }), 'current', 'Setembro', t),
    ).toMatch(/sem data de entrada/);
  });

  it('origem: só o que existe, do maior para o menor, com percentual', () => {
    expect(
      originShares([
        { origin: 'shift', amountCents: 300000n },
        { origin: 'procedure', amountCents: 0n },
        { origin: 'appointment', amountCents: null },
        { origin: 'residency', amountCents: 900000n },
      ]),
    ).toEqual([
      { origin: 'residency', amountCents: 900000n, percent: 75 },
      { origin: 'shift', amountCents: 300000n, percent: 25 },
    ]);
    expect(originShares([{ origin: 'shift', amountCents: null }])).toEqual([]);
  });

  it('horas trabalhadas', () => {
    expect(hoursLabel(5040)).toBe('84h');
    expect(hoursLabel(450)).toBe('7,5h');
  });
});
