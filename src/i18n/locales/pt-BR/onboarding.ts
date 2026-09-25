export const onboarding = {
  intro: { title: 'Vamos organizar sua rotina' },
  /** Splash 00B e carrossel 01–03 de `design/onboarding.html`. */
  welcome: {
    splash: { label: 'DOKH' },
    skip: 'Pular',
    continue: 'Continuar',
    start: 'Começar',
    pagination: 'Apresentação, tela {{current}} de {{total}}',
    slides: {
      work: {
        title: 'Tudo o que você trabalha.\nTudo o que você ganha.\nEm um só lugar.',
        description:
          'Organize onde você trabalha, acompanhe seus plantões e saiba quanto cada um vai gerar.',
        // Exemplo ilustrativo do design, lido de uma vez pelo leitor de tela.
        art: 'Exemplo: calendário de setembro com plantão no dia 12, Hospital São Lucas, das 19:00 às 07:00, R$ 1.200, entrada prevista para 12 de outubro.',
      },
      entries: {
        title: 'Saiba o que você tem para receber.',
        description:
          'Acompanhe seus pagamentos e tenha mais previsibilidade sobre os próximos meses.',
        art: 'Exemplo: R$ 8.450 a receber, distribuídos entre setembro, outubro e novembro, com entradas do Hospital São Lucas e da Clínica Central.',
      },
      earnings: {
        title: 'Entenda quanto você realmente ganha.',
        description:
          'Acompanhe sua renda ao longo dos meses e veja como seus ganhos estão evoluindo.',
        art: 'Exemplo: ganhos do mês de R$ 18.420, alta de 12,4% sobre o mês anterior, com plantões e consultas detalhados.',
      },
    },
  },
} as const;
