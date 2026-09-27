/**
 * URLs legais (P04, pendente de produto/jurídico). Enquanto forem nulas, o texto aparece
 * sem link — nada de destino inventado (7.2: "usam URLs configuradas quando disponíveis").
 */
export const legalUrls: { terms: string | null; privacy: string | null } = {
  terms: null,
  privacy: null,
};

/**
 * Destinos de suporte do Perfil 17 (ainda sem definição de produto). Nulos aparecem como
 * "Em breve", sem abrir nada — preencher aqui quando existirem.
 */
export const supportUrls: {
  helpCenter: string | null;
  contact: string | null;
  feedback: string | null;
  problem: string | null;
  rate: string | null;
} = {
  helpCenter: null,
  contact: null,
  feedback: null,
  problem: null,
  rate: null,
};

/** Gerenciar assinatura nas lojas (links oficiais de Apple e Google). */
export const subscriptionManagementUrls = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
} as const;
