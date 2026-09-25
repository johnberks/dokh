# Coleta de perfil e residência — tarefa 7.3

Fontes: `design/onboarding.html` (telas 06 Vamos começar, 07 Nome, 09 Atuação atual, TELA 04 Informações da residência e 12 Sua rotina) e `docs/screens/onboarding.md`. Dados: `profiles` (3.2) e a RPC `create_or_update_residency` (3.9).

## Fluxo

`06 intro → 07 nome → 09 residência? → (Sim) TELA 04 bolsa → 12 perfil pronto → primeiro Trabalho`

Quem responde **Não** pula a tela da bolsa e vai direto para a conclusão. O rascunho entre telas vive em Zustand (`profile-draft.ts`), apenas em memória; nada de domínio é gravado no device (D20).

## Decisões do usuário (2026-09-25)

- **A busca de residência só existe para quem responde Sim.** Responder Não troca o campo pela etiqueta **GENERALISTA**, que reaparece na conclusão do perfil.
- **A conclusão do perfil não tem `Pular`.** O HTML desenhava `PULAR ›` no topo; o único caminho agora é `Registrar um trabalho`, que leva ao primeiro Trabalho (7.4).

## Teclado e rolagem (ajustes de 2026-09-25)

- A tela do nome perdeu a dica "Só o primeiro nome já basta" e ganhou `KeyboardAvoidingView`: o botão sobe junto com o teclado, então `Continuar` funciona com **um toque só**, sem precisar fechar o teclado antes.
- A tela de residência **não tem área interna rolável** (nada de barra lateral): quando precisa rolar, rola a tela inteira, sem bounce e sem indicador. Com o teclado aberto, `KeyboardAvoidingView` levanta o conteúdo e `keyboardShouldPersistTaps="handled"` deixa tocar direto numa sugestão.
- As sugestões ficam limitadas a quatro (mais `Outra`), para caberem acima do teclado.

## Lista de residências

`src/domain/medical-specialties.ts` traz as **55 especialidades** e as **59 áreas de atuação** da **Resolução CFM nº 2.221/2018 (Portaria CME nº 1/2018)**, com a grafia oficial. As duas listas aparecem juntas (114 opções), porque a pessoa informa o programa que cursa; áreas de atuação exigem especialidade prévia.

`searchResidencyPrograms` sugere **a partir do primeiro caractere**, ignora acentos e caixa, e ordena por início do nome → início de palavra → qualquer trecho. Devolve o intervalo que casou, para o negrito do design. A opção **Outra** grava exatamente o que a pessoa escreveu — o banco aceita texto livre.

Além da portaria, `ADDITIONAL_RESIDENCY_PROGRAMS` guarda programas pedidos pelo usuário que não constam nela — hoje **Traumatologia Bucomaxilofacial**, residência reconhecida na odontologia e também cursada por médicos. As listas oficiais seguem fiéis à resolução.

Atualizar a lista quando a CME publicar nova portaria; não alterar nomes por preferência visual.

## Gravação

`saveOnboardingProfile` faz duas coisas, nesta ordem: grava `profiles` (nome, `professional_status`, especialidade e fuso do aparelho) e, só para residentes, chama `create_or_update_residency`, que cria a bolsa mensal gratuita. Generalista grava `specialty = null` — o banco recusa o contrário. `onboarding_completed_at` **não** é marcado aqui: isso pertence à 7.5.

Sem retry automático e sem atualização otimista: a tela só avança depois da confirmação do servidor, e erro mostra `MutationError` com nova tentativa, preservando o que foi digitado.

`starts_on` da residência usa o primeiro dia do mês corrente no fuso da pessoa; a UX não pergunta essa data, e o Perfil (11.4) permitirá ajustar.

## Limites

- A tela do primeiro Trabalho é um destino provisório até a 7.4.
- Instituição e nível (R1, R2) não são coletados no onboarding; o schema aceita e o Perfil cuidará disso.
- Validação em aparelho (visual, VoiceOver, teclado) e Android seguem pendentes.
