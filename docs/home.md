# Início (Fase 10) — `src/features/home`

Fontes: `design/home.html` (Home 01–06), `docs/screens/home.md`. Aplica os ajustes combinados com o usuário nas outras seções: topo verde e corpo bege numa rolagem só (`TwoToneScrollScreen`, fundo com blur cobrindo a barra de status, **sem barra de rolagem**), **primeiro card sobre o verde** (como o calendário da Agenda), títulos de card com peso (`CardLabel`), textos que não quebram (`numberOfLines`/`adjustsFontSizeToFit`, sem o espaçamento negativo do heading1 em rótulos pequenos), itens temporários só quando fazem sentido e confirmação de recebimento **só pelo servidor**.

## Dados — `home-data.ts` (10.1)

- `useHomeHero(month)`: mês escolhido, anterior (comparação) e histórico de 4 meses via `finance_month_projection` + contagem das entradas em aberto do mês — tudo em paralelo.
- `useHomeBody(today)`: perfil (primeiro nome, residente), residência ativa, próximos 3 trabalhos (`agenda_work_projection`, de hoje em diante), total de trabalhos, entradas em aberto a partir de amanhã (3), de hoje e vencidas (`receivable_projection`), primeiro trabalho sem data e os totais sem data. Uma única rodada paralela + os nomes dos Locais das entradas (`in`).
- Chaves sob `home-overview` (invalidada por toda escrita de Trabalho/Recebível, inclusive confirmar).
- O corpo é sempre "de hoje em diante"; o mês do topo só muda o topo.

## Topo (10.2) — visão **2A "cards com peek"** (`HOME.dc.html` do Claude Design, pedido do usuário em 2026-09-26) — `HomeHero.tsx`

- Marca DOKH + avatar (inicial do primeiro nome, abre Perfil); saudação "Seu setembro, Anna." com a troca de mês (`‹ SET 2026 ›`).
- As visões viram **cards de vidro escuro** (verde translúcido, borda sálvia, raio 22, altura mínima 190) num `ScrollView` horizontal com snap: o card do mês ocupa a tela menos 66 pt, então o **histórico aparece na borda direita** ("peek"). Arrasta; tocar no card ou nos pontos leva a ele. Pontos: ativo largo (22) em bronze.
- Card do mês: `PARA RECEBER · SETEMBRO` (ou `RECEBIDO · AGOSTO`), valor, **olho** que oculta os valores (`R$ ••••`, também no histórico e na comparação; só na sessão), "N entradas previstas" e a comparação com o mês anterior só com base real.
- Card do histórico (`HISTÓRICO · 4 MESES →`) só quando o mês e pelo menos um anterior têm entrada; meses sem dado não viram barra zerada. Sem histórico, só o card do mês, na largura toda e sem pontos.
- Mês sem entrada: o card do mês traz "Nenhuma entrada prevista ainda." + `Adicionar trabalho` (nunca `R$ 0,00`).
- O `HeroCarousel` de página inteira (2.7) não é mais usado na Início.

## Corpo (10.3/10.4/10.5)

1. **Próximo trabalho** (`WorkCard featured`) sobre o verde: HOJE/AMANHÃ/`SEX 02 OUT`, horário, local, tipo · duração, valor e `Previsto para entrar · 12 OUT` / `Entrada a definir`. Sem trabalho: `EmptyState homeWork`.
2. **Pendências** (`ReviewCardStack`, no máximo 2, uma de atenção): entrada de hoje (atenção, `Você recebeu?`), vencida sem confirmação (neutra, `Confirmar entrada`) e valores sem data (compacto → editar o primeiro trabalho sem data). Confirmar: spinner no card, sem otimismo; falha avisa e mantém; sucesso some e atualiza Finanças. A entrada de hoje não se repete na lista.
3. **Próximas entradas** (`HomeListCard` + `HomeEntryRow`, até 3, a partir de amanhã) → `Ver todas as entradas` (Entradas do mês atual).
4. **Próximos trabalhos** (os seguintes ao próximo, `WorkCard row`) → `Ver agenda`.
5. **Progresso inicial** (`ProgressCard`): residência (só residentes, quando organizada), primeiro trabalho e "visão do mês completa" (sem valores sem data e com próximo trabalho). Próxima ação: primeiro trabalho → datas → próximo trabalho. Completo, o card não existe; depois de 10 trabalhos a fase inicial acabou e ele não volta.

Free e Premium: nada da Home é exclusivo (UX). Falha de leitura mostra `LoadError`, nunca um estado vazio.

## Lacunas

- 10.6 (E2E Maestro) pendente.
- Os nomes dos Locais das entradas vêm numa segunda consulta (o `receivable_projection` não traz o Local).
