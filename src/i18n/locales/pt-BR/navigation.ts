export const navigation = {
  tabs: {
    home: 'Início',
    agenda: 'Agenda',
    create: 'Adicionar trabalho',
    finances: 'Finanças',
    profile: 'Perfil',
  },
  actions: { back: 'Voltar', close: 'Fechar' },
  /** Guia de primeiro uso, logo depois do onboarding (2026-09-28). */
  guide: {
    progress: '{{current}} de {{total}}',
    skip: 'Pular',
    next: 'Próximo',
    done: 'Concluir',
    sections: { index: 'INÍCIO', agenda: 'AGENDA', finances: 'FINANÇAS' },
    goTo: { index: 'Ir para Início', agenda: 'Ir para Agenda', finances: 'Ir para Finanças' },
    going: {
      index: 'Agora, vamos para o Início',
      agenda: 'Agora, vamos para a Agenda',
      finances: 'Agora, vamos para Finanças',
    },
    homeAmount: {
      title: 'Seu mês em um número',
      body: 'Aqui você vê quanto tem para receber neste mês.',
    },
    tabBar: {
      title: 'Tudo a um toque',
      body: 'Navegue entre Início, Agenda, Finanças e Perfil. O + no centro registra um trabalho de qualquer lugar.',
    },
    agendaAdd: {
      title: 'Registre um trabalho',
      body: 'Toque no + para adicionar um plantão, procedimento ou atendimento.',
    },
    agendaCalendar: {
      title: 'Acompanhe seu mês',
      body: 'Os pontos mostram os dias com trabalho. Toque em um dia para ver o que está marcado.',
    },
    financesValue: {
      title: 'Entenda cada valor',
      body: 'Toque no ⓘ ao lado de um valor para saber exatamente o que ele representa.',
    },
    financesPeriod: {
      title: 'Veja o ano inteiro',
      body: 'Troque para Ano aqui no topo e acompanhe como sua renda evolui mês a mês.',
    },
  },
} as const;
