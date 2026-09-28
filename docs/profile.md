# Perfil — tarefas 11.1 a 11.5 e 11.8

Telas de `design/perfil.html` (01–06, 15–18) e regras de `docs/screens/perfil.md`. Importação (11.6/11.7), calendário e notificações (Fase 12) e benefícios/paywall (5.5, depende de P01) ficam fora por decisão do usuário (2026-09-26).

## Perfil principal (01/18) — `src/features/profile/ProfileScreen.tsx`

- **Topo escuro:**
  - `PERFIL`;
  - avatar 64: foto por URL assinada do bucket privado, ou iniciais do primeiro e do último nome;
  - nome, situação (`Residente de {programa}` ou `Generalista`) e cidade;
  - `Editar perfil →`.
- **Premium:**
  - Free vê o card escuro "Vá além da organização.". Sem o fluxo de benefícios, `Conhecer Premium` aparece com `EM BREVE` e não abre nada.
  - Premium ativo vê a linha compacta `DOKH PREMIUM ✓ ATIVO · Gerenciar assinatura`, que abre a página de assinaturas da App Store ou da Play Store. Sem venda.
- **Grupos:**
  - Seu trabalho: Locais (com a contagem), Residência (com o programa) e Preferências;
  - Preferências: Aparência;
  - Conta e suporte: Conta, Ajuda e Avaliar (`EM BREVE` enquanto não houver link).
- **Privacidade:** Termos e Privacidade vêm de `legalUrls` (P04); sem URL, aparecem com `EM BREVE`.
- **Versão:** lida de `expo-constants`.
- Dados e integrações (importação e calendário) e Notificações não aparecem até existirem.

## Editar perfil (02)

- Foto: `expo-image-picker` com recorte quadrado.
  - Envia um arquivo novo `avatars/{uid}/avatar-{uuid}` e aponta o perfil para ele. Só depois apaga o anterior, porque o bucket não tem UPDATE (3.6).
  - `Remover foto` volta às iniciais.
- Campos:
  - nome (obrigatório);
  - ano de graduação (vazio ou entre 1950 e o ano atual);
  - situação em chips;
  - especialidade, que só aparece com Residência;
  - cidade.
- Sem gênero e sem CRM.
- Grava direto em `profiles`, com RLS do dono. O banco recusa especialidade para generalista.

## Locais (03/03b/04/04b)

- **Lista:** ponto na cor, nome e `N trabalhos registrados` (contagem de `work_entries` ativos), nunca valores. `+` no topo e `Adicionar local` tracejado no fim.
- **Vazio:** tipográfico, com `Adicionar primeiro local`.
- **Formulário:**
  - nome obrigatório, e nome repetido (sem acento e sem caixa) bloqueia;
  - cidade;
  - quatro cores livres;
  - `PALETA AMPLIADA` (Terra, Violeta, Cáqui, Petróleo). No Free fica esmaecida, com cadeado, selo `PREMIUM` e explicação, sem impedir salvar. No Premium fica liberada, sem selo.
- **Gravação:** usa as RPCs da 6.1, e o servidor revalida a paleta.
- **Remover local:** texto discreto com confirmação. Arquiva o local (`archive_work_location`); os trabalhos continuam na Agenda e em Finanças.

## Residência (05/05b + formulário)

- **Card da residência ativa:**
  - acento lateral, `RESIDÊNCIA ATIVA` e o nível;
  - programa, instituição, início, previsão de término, bolsa e dia de pagamento;
  - `Editar informações`.
- **Vazio neutro:** `Não faz residência? Nada muda para você.`
- **Formulário** (não desenhado; usa os componentes da Agenda):
  - campos: programa, nível, início e término (folha de mês e ano), instituição, bolsa (`MoneyInput`) e dia (folha de 1 a 31);
  - grava por `create_or_update_residency` (3.9, só os meses futuros mudam) e deixa o perfil como residente com o programa;
  - `Encerrar residência` pede confirmação e chama `deactivate_residency`: o recebido fica e os meses futuros saem de Finanças.

## Preferências (06) e o `+`

- Duração padrão (6h, 12h, 24h ou `Outro` na folha de duração), início padrão (folha de horário) e prazo padrão (Sem padrão, D30, D60 ou D90). Grava em `work_preferences` com upsert.
- No `+`, um trabalho novo já vem preenchido:
  - Plantão recebe o horário e a duração padrão;
  - todos os tipos recebem o prazo, que vira a data de entrada quando a data do trabalho é escolhida;
  - tudo pode ser trocado no próprio trabalho.
- "Usar novamente" continua trazendo os dados do template.

## Aparência, Conta e Ajuda (15/16/17) — `SettingsScreens.tsx`

- **Aparência:** Claro marcado; Sistema e Escuro com `EM BREVE`.
- **Conta:**
  - e-mail (lido do Auth);
  - `Alterar senha`, que leva ao envio do link de redefinição (`/recover-password`);
  - método de acesso `E-mail`;
  - plano Free ou Premium; com Premium, a linha abre a gestão da assinatura na loja;
  - `Sair da DOKH` em texto, sem vermelho;
  - `Excluir conta` menor, que só explica que a exclusão ainda não existe no app. Nenhuma ação destrutiva foi inventada (P05).
- **Ajuda:**
  - quatro linhas cujos destinos vêm de `supportUrls` em `src/config/legal.ts`; nulos aparecem com `EM BREVE`;
  - convite escuro `Ajude a construir a DOKH.`

## Testes

- `src/features/profile/profile.test.tsx`: 17 testes.
- Preferências no `+`: em `work-form.test.tsx`.
- Caminho real em `scripts/test-location-rpcs-6.1.mjs`:
  - edição do perfil, e outra conta não edita;
  - upsert de preferências;
  - residência criada e encerrada;
  - envio da foto e URL assinada, e outra conta não assina.

## Revisão visual (2026-09-27, referências Mobbin: Cash App, Wise, GoHenry, Marcus, Wispr Flow)

Pedido do usuário: o Perfil estava com cara de template de IA. O bloco Premium (card no Free e linha no Premium) **não mudou**, por decisão do usuário.
- **Topo claro e pessoal**, sem o verde com manchas:
  - avatar de 76 com selo de câmera, que leva a Editar perfil;
  - nome em 30 pt e a linha `Residente de … · Cidade`;
  - números reais: locais, trabalhos no mês e nível da residência, cada um só quando existe;
  - `Editar perfil` em pílula.
- **Listas de um nível** (`InsetList`/`InsetRow`): ícone, texto, valor ou subtítulo, `›` e divisória fina, sem cartão em volta. Títulos de seção em texto normal (`SectionTitle`), não em letra técnica maiúscula. Vale para a principal, Locais, Residência, Conta e Aparência.
- **`Sair da DOKH`** passou a ser a última linha da lista principal e saiu de Conta e segurança.
- **Só o que funciona aparece:**
  - Avaliar, Termos, Privacidade e a Ajuda somem enquanto `supportUrls` e `legalUrls` forem nulos, e voltam sozinhos quando configurados;
  - o convite da Ajuda só mostra o botão com destino;
  - Aparência mantém `EM BREVE` em Sistema e Escuro, como o HTML pede.
- **Residência:** em vez do card, `● Residência ativa · R2`, o programa em 28 pt e a lista plana dos dados.

### Card do topo (2026-09-27, referência Lyft na Mobbin)

- A identidade virou um card claro com borda, como o "Looking good" do Lyft:
  - foto centralizada de 96, com anel e sombra leve;
  - nome em 28 pt centralizado;
  - lápis em círculo no canto superior direito, que leva a Editar perfil.
- Tags embaixo do nome, cada uma só quando o dado existe:
  - situação (`Residente de {programa}` ou `Generalista`), em verde;
  - `Turma de {ano}`;
  - cidade.
- As contagens (locais e trabalhos do mês) e o selo de câmera saíram, a pedido do usuário.

### Subtelas mais robustas (2026-09-27; referências Todoist, Zocdoc, Box Box Club, Subway e Fresha na Mobbin)

Pedido do usuário: as letras estavam finas e sumiam no fundo claro.
- **Listas das subtelas** (`InsetList grouped`) em grupo claro (`previewPaper`) com borda sutil e cantos de 18 sobre o creme. Rótulos em Archivo SemiBold 16 e valores em 15 `mutedCopy`. A lista da tela principal continua plana.
- **Campos preenchidos** (`TextField` e o novo `PickerField`) em superfície clara:
  - rótulo legível de 13 pt em cima, em caixa normal, no lugar da letra técnica de 9 pt;
  - valor em SemiBold 17;
  - a bolsa virou campo com prefixo `R$` no mesmo padrão.
- **Chips** de 48 com texto sempre em SemiBold e fundo claro quando não selecionados.
- **Títulos de seção** dos formulários (`FieldLabel`) em SemiBold 15, na cor do texto principal.
- **Textos de apoio** em 14 a 15 pt.
- Os rótulos do namespace `profile` passaram de CAIXA ALTA para caixa normal. As folhas mantêm o sobretítulo técnico em maiúsculas.

