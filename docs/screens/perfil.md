# UX — Perfil

## Escopo

Este documento descreve Perfil, configurações, importação e o fluxo Premium representados em `PERFIL.dc.html`. Valores, nomes, e-mails, datas e quantidades dos layouts são exemplos de dados.

## Objetivo da seção

Ser o lugar onde a pessoa configura como a DOKH funciona para ela. A seção organiza:

- identidade;
- locais de trabalho;
- residência;
- preferências de trabalho;
- importação e integrações;
- notificações e aparência;
- conta, suporte e privacidade;
- descoberta e gerenciamento do Premium.

## Hierarquia da tela principal

### Identidade

O header deve conter:

- iniciais ou foto;
- nome;
- situação profissional e especialidade, quando aplicável;
- cidade;
- ação `Editar perfil`.

O nome aparece como identidade no header do Perfil, não como decoração repetida pelo restante da tela.

### Objetos de produto

- Premium: superfície escura com acento bronze.
- Migração/importação: superfície clara com acento bronze.
- Residência e local: superfícies claras com acento lateral quando apresentados como objetos.
- Configurações: listas agrupadas, silenciosas e previsíveis.

### Grupos obrigatórios

- Seu trabalho: Locais de trabalho, Residência, Preferências de trabalho.
- Dados e integrações: Importar dados, Calendário.
- Preferências: Notificações, Aparência.
- Conta e suporte: Conta e segurança, Ajuda e feedback, Avaliar a DOKH.
- Privacidade: Termos de uso, Política de privacidade.
- Versão do app.

## Free e Premium na tela principal

### Usuário Free

- Exibir card DOKH Premium com proposta de valor e `Conhecer Premium`.
- Não ocultar importação, configurações ou dados pessoais.
- Mostrar o plano `Free` em Conta e segurança.

### Premium ativo

- Substituir o card de venda por uma linha compacta.
- Exibir símbolo, estado `Ativo` e `Gerenciar assinatura`.
- Não continuar vendendo Premium para assinante ativo.

## Editar perfil

Informações obrigatórias na tela:

- foto/iniciais e `Alterar foto`;
- nome;
- ano de graduação;
- situação profissional: Generalista ou Residência;
- especialidade/programa somente quando a situação for Residência;
- cidade;
- `Salvar alterações`.

Regras:

- Não solicitar gênero.
- Não solicitar CRM nesta tela.
- Especialidade é condicional à situação de residência.
- O design não identifica visualmente quais campos bloqueiam o salvamento nem define validações.

## Locais de trabalho

### Lista com dados

Cada local deve mostrar:

- ponto na cor associada;
- nome;
- quantidade de trabalhos registrados;
- chevron de navegação.

Não mostrar valores financeiros. `Adicionar local` existe no header/fluxo e ao fim da lista.

### Estado vazio

- Mostrar `Nenhum local cadastrado`.
- Explicar o benefício de cadastrar locais.
- Exibir `Adicionar primeiro local`.
- Não usar ilustração.

### Novo local

Informações:

- nome do local;
- cidade;
- cor do local;
- paleta ampliada Premium;
- ação `Salvar local`.

Comportamento:

- Salvar fica desabilitado até existir nome.
- Cores básicas permanecem livres.
- Paleta ampliada fica visível, explicada e bloqueada para Free.
- O bloqueio Premium não impede salvar o local.

### Editar local

- Usar o mesmo formulário, preenchido.
- Exibir `Salvar alterações`.
- Exibir `Remover local` como texto discreto.
- A remoção exige confirmação posterior, mas essa confirmação não está desenhada.
- O tratamento de trabalhos vinculados ao local removido não está especificado.

## Residência

### Residência cadastrada

Informações obrigatórias:

- estado ativo;
- ano/nível e especialidade;
- instituição;
- início;
- previsão de término;
- bolsa mensal;
- dia previsto de pagamento;
- ação de editar.

A bolsa entra automaticamente em Finanças como fonte de renda recorrente. A tela não calcula outras métricas.

### Sem residência

- Mostrar `Nenhuma residência cadastrada`.
- Perguntar de forma neutra se a pessoa está em residência.
- Oferecer `Adicionar residência`.
- Informar explicitamente que nada muda para quem não faz residência.
- Não presumir residência nem tratar a ausência como incompletude.

## Preferências de trabalho

Informações:

- duração padrão: 6h, 12h, 24h ou Outro;
- horário padrão de início;
- prazo padrão de entrada: sem padrão, D30, D60 ou D90;
- explicação de que D30 significa sugestão 30 dias após o trabalho;
- ação `Salvar preferências`.

Esses dados funcionam como sugestões no cadastro. A pessoa pode alterá-los em cada trabalho.

## Importação de dados

Importação é Free e nunca deve ficar atrás do Premium.

### Entrada

- Explicar que a pessoa não precisa começar do zero.
- Oferecer importação do Plantãozinho.
- Oferecer arquivo CSV/formato compatível.
- Informar que nada entra na DOKH antes da confirmação.

### Já importou

- Exibir resumo da última importação: origem, quantidade de trabalhos, quantidade de locais e data.
- Manter as opções de importar novos arquivos.
- Não limitar importações por já existir histórico.

### Instruções do Plantãozinho

Mostrar quatro etapas:

1. exportar no Plantãozinho;
2. selecionar o arquivo;
3. conferir o conteúdo encontrado;
4. confirmar a importação.

Exibir `Como exportar meus dados?` e a garantia de que a confirmação ocorre antes da escrita.

### Analisando

- Mostrar nome do arquivo e quantidade de linhas.
- Mostrar etapas com estados reais: arquivo recebido, leitura, organização de locais e preparação.
- Usar barra fina bronze.
- Não usar spinner genérico.

### Preview

Exibir somente o que foi encontrado:

- quantidade de trabalhos;
- quantidade de locais;
- valor histórico presente no arquivo;
- quantidade de itens que precisam de atenção;
- categorias que serão importadas;
- campos não encontrados explicitamente marcados como `não encontrado no arquivo`.

Nunca inventar dado ausente. Ações: `Importar para a DOKH` e `Cancelar`.

### Conclusão

- Usar tela escura de satisfação, sem confete.
- Exibir trabalhos importados, locais criados e pendências.
- Oferecer `Ver minha agenda` e, quando necessário, `Revisar N registros`.

### Pendências

- Informar que os registros válidos já foram importados.
- Manter os incompletos guardados até serem completados.
- Para cada pendência, mostrar contexto e o dado ausente.
- Oferecer `Concluir depois`.
- Usar bronze e chip de ação necessária; não usar vermelho.

## Erros de importação

### Arquivo não reconhecido

- Informar que o arquivo não pôde ser lido sem culpar a pessoa.
- Mostrar nome e tamanho do arquivo selecionado.
- Oferecer `Tentar novamente` e `Como preparar meu arquivo?`.
- Não usar vermelho.

### Arquivo lido, sem dados

- Diferenciar claramente de erro de leitura.
- Mostrar `Arquivo lido · 0 plantões`.
- Explicar que o arquivo pode estar vazio ou ser de outro período.
- Oferecer `Selecionar outro arquivo` e ajuda de exportação.

## Calendário

Informações e ações:

- início da semana: Domingo ou Segunda-feira;
- estado da sincronização externa;
- explicação de que os trabalhos aparecem no calendário do celular;
- ação `Conectar calendário` quando desconectado.

O design mostra apenas o estado `Não conectado`. Autorização, sucesso, revogação e falha não estão especificados.

## Notificações

Quatro toggles em dois grupos:

### Entradas

- lembrar no dia previsto — aviso na manhã da entrada;
- trabalhos sem data de entrada — lembrete semanal para completar.

### Agenda

- lembrete de próximo trabalho — duas horas antes;
- alterações importantes — mudanças em trabalhos já cadastrados.

Cada toggle deve incluir rótulo e subtexto. O design não especifica permissão do sistema, horário alternativo ou estado bloqueado.

## Aparência

- Exibir tema atual como `Sistema`/claro conforme contexto do design.
- Indicar `Escuro` como `Em breve`.
- Informar que o app usa tema claro por enquanto.
- Não apresentar tema escuro como funcional.

## Conta e segurança

Informações e ações:

- e-mail;
- alterar senha;
- método de acesso;
- plano/assinatura e gerenciamento;
- sair da DOKH;
- excluir conta.

Regras:

- `Sair` usa texto discreto, sem vermelho.
- `Excluir conta` tem hierarquia ainda menor e exige confirmação posterior.
- O fluxo de confirmação/exclusão não está desenhado.

## Ajuda e feedback

Itens:

- Central de ajuda;
- Falar com a DOKH;
- Enviar feedback;
- Reportar um problema.

Além da lista, mostrar um convite editorial `Ajude a construir a DOKH` com CTA de feedback.

## Fluxo Premium

A ordem é obrigatória: mostrar valor → explicar benefícios → oferecer planos. O paywall só aparece após os quatro slides.

### Slide 1 — visão profissional

- Explicar uma visão mais completa da vida profissional.
- Mostrar preview realista de ano, evolução e valor/hora.

### Slide 2 — insights

- Explicar padrões e evolução.
- Números exibidos são demonstração do benefício, não dados bloqueados da pessoa.

### Slide 3 — finanças

- Explicar visão anual, origem da renda e valor/hora.
- Mostrar dados fictícios claramente como preview do recurso.

### Slide 4 — organização

Listar:

- trabalhos recorrentes;
- personalização de cores;
- análises financeiras completas;
- insights profissionais;
- histórico e comparações.

`Ver planos` leva ao paywall. `Agora não` encerra o fluxo sem perda de funcionalidade Free.

### Paywall

Informações obrigatórias:

- benefícios resumidos;
- plano mensal;
- plano anual;
- periodicidade e renovação;
- ação de assinar;
- restaurar compra;
- Termos e Privacidade.

Os preços estão como placeholders no design (`R$ XX,XX` e `R$ XXX,XX`). Não inventar preço, desconto ou trial.

### Premium desbloqueado

- Confirmar `DOKH Premium está ativo`.
- Usar o símbolo DOKH com bronze, não um check genérico.
- Oferecer: explorar Finanças, criar trabalho recorrente e voltar ao Perfil.
- Não usar confete nem celebração exagerada.

## Cenários de dados na tela

| Dados disponíveis | Resultado esperado |
| --- | --- |
| Perfil Free | Card de descoberta Premium e todas as configurações base. |
| Premium ativo | Linha compacta de assinatura, sem card de venda. |
| Locais cadastrados | Lista com cor, nome e contagem; sem valores. |
| Nenhum local | Estado vazio tipográfico e CTA. |
| Residência ativa | Dados da residência e fonte recorrente em Finanças. |
| Sem residência | Estado neutro e saída explícita para generalista. |
| Nenhuma importação | Ofertas de importação. |
| Importação anterior | Resumo do último arquivo e possibilidade de importar novamente. |
| Arquivo parcial | Importar registros válidos e separar pendências. |
| Campo ausente no arquivo | Mostrar `não encontrado`; nunca preencher por inferência. |
| Arquivo ilegível | Estado `Arquivo não reconhecido`. |
| Arquivo válido vazio | Estado `0 plantões`, distinto de erro. |

## Erros, pendências e lacunas

### Estados definidos

- Pendências de importação usam bronze e não bloqueiam registros válidos.
- Arquivo não reconhecido é erro de leitura, sem vermelho.
- Arquivo válido sem registros é estado vazio, não erro técnico.
- Ausência de residência ou local é estado vazio, não falha.

### Estados não especificados no design

Não há telas ou regras para:

- falha de rede ao salvar perfil, local, residência ou preferências;
- e-mail inválido, alteração de senha ou reautenticação;
- foto inválida ou permissão de fotos/câmera;
- falha de conexão com calendário;
- permissão de notificações negada;
- arquivo grande, importação interrompida ou duplicatas;
- rollback de importação;
- confirmação de remoção de local, logout ou exclusão de conta;
- falha, cancelamento, restauração ou expiração de assinatura;
- indisponibilidade de Termos, Privacidade, ajuda ou feedback.

Esses estados permanecem como lacunas. A tela vazia correspondente não deve substituir um erro técnico.
