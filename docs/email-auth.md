# E-mail, senha e recuperação — 4.2 parcial

Fontes: `decisions.md` D03/D18/D40–D42, `domain-model.md`, `docs/screens/onboarding.md`, `design/onboarding.html` (05B Entrar, 04 Criar conta) e `build-plan.md` 4.2. Os HTMLs são somente leitura. A tela 05B orienta medidas, cores e tipografia do login; o cadastro por e-mail e a recuperação não têm telas desenhadas, por isso usam somente a paleta e os componentes compartilhados, sem criar uma nova regra de produto.

## Fluxo implementado

- `/sign-in` reproduz o topo escuro com blur e os campos/ações de 05B. Apple e Google aparecem conforme o HTML, mas são anunciados como indisponíveis até 4.3/4.4; não simulam autenticação. E-mail/senha chamam `signInWithPassword`, e só uma resposta válida leva à Home. Erro de validação fica no campo; erro de servidor é sanitizado e preserva o rascunho.
- `/sign-up` envia `signUp`. Se Auth devolver sessão (configuração local sem confirmação), segue para `/welcome`; se exigir confirmação, pede para conferir o e-mail. `/auth-callback` aceita somente fragmento de confirmação, grava a sessão pelo cliente Supabase e então segue para `/welcome`.
- `/recover-password` envia `resetPasswordForEmail` com URL de retorno criada por `expo-linking`. A mensagem de sucesso não revela se a conta existe. `/reset-password` aceita apenas `type=recovery` com access/refresh token, chama `setSession`, permite `updateUser({ password })` e segue à Home. Link inválido não exibe formulário.
- Nenhuma tela, teste ou log imprime token, senha ou e-mail. O adapter SecureStore da 4.1 continua sendo o único armazenamento da sessão. O guard da 4.5 deve permitir a rota de recuperação enquanto a sessão temporária de reset é estabelecida.

## Configuração de links

- O projeto local aceita `dokh://auth-callback`, `dokh://reset-password` e `exp://**` em `supabase/config.toml`. A última entrada é **somente para desenvolvimento local**: o endereço do Expo Go muda com a LAN/Metro. Reinicie a instância local após alterar esta configuração, sem `--no-backup` e sem reset de dados.
- `app.json` já define `scheme: "dokh"`. Para testar o retorno por e-mail de forma estável, é necessário um development build/EAS; a documentação do Expo não recomenda Expo Go como callback estável. Nos projetos Supabase preview/production, cadastrar **URLs exatas** de retorno, nunca `exp://**` ou wildcard amplo em produção. Esses projetos não foram alterados nesta tarefa.
- O iPhone físico não alcança `127.0.0.1` do Mac. Para testar Auth local no aparelho, usar URL LAN alcançável e chave pública local no `.env.local`; o e-mail local fica no Mailpit do Mac (`npm run supabase:status`). Não colocar service role no app. Preview precisa SMTP e URLs de Auth configuradas para teste real de confirmação/reset.

## Evidência e lacunas

- Jest cobre schema, métodos, links inválidos, mensagens sem PII, login válido/inválido/erro preservando rascunho, cadastro sem sessão e recuperação. Os testes de rotas abrem cada deep link.
- `scripts/test-email-auth-4.2.mjs`, anexado a `npm run test:db`, cria uma conta sintética no **Supabase local**, verifica cadastro, login, e-mail capturado pelo Mailpit, redirecionamento `dokh://`, troca de senha e novo login; exclui a conta no `finally`. Não executa reset e não acessa preview/production.
- DoD ainda pendente: fluxo completo em iOS e Android com e-mail real e callback nativo, além de logout pela UI (4.1/4.5). Android foi adiado pelo usuário. A composição final da tela 04 Criar conta, carrossel e links legais pertence à 7.2; não marcar a 4.2 nem a 7.2 como concluídas por este recorte.
