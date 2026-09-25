export const onboarding = {
  intro: { title: 'Vamos organizar sua rotina' },
  welcome: {
    splash: { label: 'DOKH' },
    /** Tela 04 de `design/onboarding.html`, com o título aprovado pelo usuário. */
    account: {
      headline: 'Organize sua rotina e suas finanças em um só lugar.',
      subtitle: 'Leva menos de um minuto.',
      email: 'Continuar com e-mail',
      hasAccount: 'Já tem uma conta?',
      signIn: 'Entrar',
      legalBefore: 'Ao continuar, você concorda com os ',
      terms: 'Termos de Uso',
      legalBetween: ' e a ',
      privacy: 'Política de Privacidade',
      legalAfter: '.',
      preview:
        'Prévia do produto: plantão de 12 de setembro no Hospital São Lucas por R$ 1.200, R$ 8.450 a receber e ganhos do mês de R$ 18.420, com alta de 12,4%.',
      shiftLabel: 'PLANTÃO · 12 SET',
      shiftPlace: 'Hospital São Lucas',
      shiftAmount: 'R$ 1.200',
      receivableLabel: 'A RECEBER',
      receivableAmount: 'R$ 8.450',
      earningsLabel: 'GANHOS DO MÊS',
      earningsAmount: 'R$ 18.420',
      earningsVariation: '↑ 12,4%',
    },
    /**
     * Ilustrações guardadas dos slides 01–03 do HTML. Saíram do fluxo a pedido do usuário
     * e seguem disponíveis no catálogo interno para telas futuras.
     */
    art: {
      title: 'Ilustrações do onboarding',
      work: {
        title: 'Plantões',
        summary:
          'Exemplo: calendário de setembro com plantão no dia 12, Hospital São Lucas, das 19:00 às 07:00, R$ 1.200, entrada prevista para 12 de outubro.',
        month: 'SETEMBRO',
        week: 'SEM 37',
        badge: '12 SEX · PLANTÃO',
        place: 'Hospital São Lucas',
        hours: '19:00 — 07:00',
        amount: 'R$ 1.200',
        entryLabel: 'Entrada',
        entryDate: '12 OUT',
      },
      entries: {
        title: 'A receber',
        summary:
          'Exemplo: R$ 8.450 a receber, distribuídos entre setembro, outubro e novembro, com entradas do Hospital São Lucas e da Clínica Central.',
        label: 'A RECEBER',
        total: 'R$ 8.450',
        september: 'SET',
        septemberAmount: 'R$ 3.200',
        october: 'OUT',
        octoberAmount: 'R$ 4.050',
        november: 'NOV',
        novemberAmount: 'R$ 1.200',
        firstPlace: 'Hospital São Lucas',
        firstDate: '18 OUT',
        firstAmount: 'R$ 1.200',
        secondPlace: 'Clínica Central',
        secondDate: '05 OUT',
        secondAmount: 'R$ 850',
      },
      earnings: {
        title: 'Ganhos do mês',
        summary:
          'Exemplo: ganhos do mês de R$ 18.420, alta de 12,4% sobre o mês anterior, com plantões e consultas detalhados.',
        label: 'GANHOS DO MÊS',
        total: 'R$ 18.420',
        variation: '↑ 12,4%',
        comparisonLabel: 'vs. mês anterior',
        comparisonValue: '+ R$ 2.040',
        shifts: 'PLANTÕES',
        shiftsAmount: 'R$ 14.800',
        appointments: 'CONSULTAS',
        appointmentsAmount: 'R$ 3.620',
      },
    },
  },
} as const;
