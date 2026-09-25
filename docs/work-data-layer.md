# Camada de dados de Locais e Trabalho — tarefas 6.1 e 6.2

Base: as RPCs atômicas da 3.7/3.8, as tabelas da 3.3 e os tipos gerados da 3.12. Não há schema novo aqui — só o acesso tipado do app.

## Locais (6.1) — `src/features/locations/locations-data.ts`

- `listWorkLocations` traz apenas ativos, em ordem alfabética. Arquivados somem dos seletores e permanecem no histórico.
- **Escritas só por RPC** (`create_work_location`, `update_work_location`, `archive_work_location`, migration `20260925000000`): a 3.5 fecha INSERT/UPDATE da tabela para o cliente. O dono vem de `auth.uid()` no servidor. A primeira versão desta camada gravava direto na tabela e só foi pega no iPhone ("permission denied for table work_locations"); agora `scripts/test-location-rpcs-6.1.mjs` exercita o caminho real.
- `updateWorkLocation(current, patch)` aplica o patch sobre o Local atual, porque a RPC substitui nome, cidade e cor de uma vez.
- Sem cor escolhida, a **cor automática** vem de `nextAutomaticColorToken` (`src/features/locations/location-colors.ts`): primeira cor livre não usada e, esgotadas, rodízio. Dois locais podem repetir cor — o calendário nunca depende só dela (D14).
- `color_source` distingue `automatic`, `free_palette` e `premium_palette`; a paleta ampliada é Premium e validada no servidor (D49): automática e paleta livre só aceitam `sage`, `bronze`, `blue` e `green`; `premium_palette` exige entitlement ativo. A cor só é revalidada quando muda, então quem perdeu o Premium ainda renomeia um Local com cor ampliada.
- `archiveWorkLocation` faz remoção lógica. Não existe exclusão definitiva de Local.

## Trabalho e Recebível (6.2) — `src/features/work/work-data.ts`

- `createWorkWithReceivable`, `updateWorkWithReceivable` e `deleteWorkWithReceivable` chamam as RPCs transacionais: Trabalho e Recebível mudam juntos ou não mudam (D27).
- `confirmReceivableReceived` é a única forma de marcar recebido, com horário do servidor (D34).
- Dinheiro trafega em centavos; o `bigint` do domínio vira `number` só na borda do JSON, onde cabe com folga.
- **Chave de idempotência** por tentativa de envio (`newIdempotencyKey`, via `expo-crypto`): repetir a mesma chave não cria um segundo Trabalho. Guarde a chave no formulário antes de enviar e reaproveite no retry.
- Mutations **sem retry automático e sem atualização otimista**: dado financeiro só muda depois da confirmação do servidor.
- Toda escrita invalida Agenda, Home e Finanças (`workAffectedPrefixes` em `src/data/query-keys.ts`), porque as três são projeções do mesmo dado.

## Limites

- Ainda não há leitura de Agenda/Finanças por aqui: as projeções da 3.11 entram com as telas (8.1 e 9.1).
- Preferências de Trabalho (duração e prazo padrão) são da 11.5.
- Testes usam clientes falsos; o caminho real contra o Supabase local será exercitado pelas telas da 7.4 e da Fase 8.
