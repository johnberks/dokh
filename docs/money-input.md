# MoneyInput — tarefa 2.5 (recorte)

Fontes visuais: `design/agenda.html` (formulário 06/09) e `design/onboarding.html` (residência e primeiro Trabalho). Comportamento: `docs/screens/agenda.md` e `docs/screens/onboarding.md`; dinheiro em centavos inteiros conforme `decisions.md` D31 e `domain-model.md`.

- `form` reproduz a linha da Agenda: altura mínima 60, raio 16, inset 18, label IBM Plex Mono 9 e valor Archivo 16. Vazio mostra `R$ 0,00` apenas como placeholder, não como dado; preenchido recebe borda verde escura.
- `residency` reproduz o valor de bolsa do onboarding: label Archivo 17, moeda 20 e número 44 sobre linha inferior. O texto auxiliar é fornecido pela tela.
- `work` reproduz a entrada grande do primeiro Trabalho: moeda 22 e número 48 sobre linha inferior. O título de 32 pontos pertence à tela, não é duplicado dentro do campo.
- O componente é controlado por texto pt-BR. Não faz formatação a cada tecla, evitando deslocar o cursor. O prefixo visual `R$` é separado do texto editável; ao colar uma quantia com prefixo, este é removido uma vez. O campo tem teclado decimal, rótulo e dica de moeda para leitor de tela, foco, estado desabilitado e erro fornecido pelo formulário.
- `parseBRLToCents` em `src/domain/money.ts` converte somente ao validar/enviar: aceita agrupamento brasileiro e até dois decimais, devolve `bigint` positivo ou `null`, rejeita float, valor zero, negativo, formato ambíguo e overflow de `bigint` assinado. O formulário futuro deve usar esse resultado no payload e manter o rascunho textual em erro.
- O catálogo `/dev/primitives` mostra os quatro estados visuais dos HTMLs. Integração com React Hook Form/Zod, persistência de Trabalho/Residência e inspeção visual/VoiceOver em iPhone e Android ficam para as tarefas de feature e a DoD geral da 2.5.

Os HTMLs de referência não foram alterados. `MoneyInput` não decide se um campo é obrigatório nem cria mensagens de validação de produto.
