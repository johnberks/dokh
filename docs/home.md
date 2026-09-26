# Início (Fase 10) — `src/features/home`

Fontes: `design/home.html` (Home 01–06), `docs/screens/home.md`. Aplica os ajustes combinados com o usuário nas outras seções: topo verde e corpo bege numa rolagem só (`TwoToneScrollScreen`, fundo com blur cobrindo a barra de status, **sem barra de rolagem**), **primeiro card sobre o verde** (como o calendário da Agenda), títulos de card com peso (`CardLabel`), textos que não quebram (`numberOfLines`/`adjustsFontSizeToFit`, sem o espaçamento negativo do heading1 em rótulos pequenos), itens temporários só quando fazem sentido e confirmação de recebimento **só pelo servidor**.

## Dados — `home-data.ts` (10.1)

- `useHomeHero(month)`: mês escolhido, anterior (comparação) e histórico de 4 meses via `finance_month_projection` + contagem das entradas em aberto do mês — tudo em paralelo.
- `useHomeBody(today)`: perfil (primeiro nome, residente), residência ativa, próximos 3 trabalhos (`agenda_work_projection`, de hoje em diante), total de trabalhos, entradas em aberto a partir de amanhã (3), de hoje e vencidas (`receivable_projection`), primeiro trabalho sem data e os totais sem data. Uma única rodada paralela + os nomes dos Locais das entradas (`in`).
- Chaves sob `home-overview` (invalidada por toda escrita de Trabalho/Recebível, inclusive confirmar).
- O corpo é sempre "de hoje em diante"; o mês do topo só muda o topo.

## Topo (10.2)

- Marca DOKH + avatar (inicial do primeiro nome, abre Perfil).
- `HeroCarousel` (2.7) com fundo transparente, altura fixa: página 1 com "Seu setembro, Anna.", troca de mês (`‹ SET 2026 ›`), valor, qualificador (`para receber este mês`, `recebidos em agosto`, `para receber em outubro`) e comparação com o mês anterior **só com base real**; página 2 (histórico) **só quando o mês e pelo menos um anterior têm entrada** — meses sem dado não viram barra zerada. Barras com `HeroBar` (crescem ao abrir a página), atual em bronze.
- Mês sem entrada: "Nenhuma entrada prevista ainda." + `Adicionar trabalho` (nunca `R$ 0,00`).

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
