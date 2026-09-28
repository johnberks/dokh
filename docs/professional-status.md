# Situação profissional — tarefa 11.10

Pedido do usuário (2026-09-27): "não faz residência" não pode significar "Generalista". Quem não está em residência pode ser generalista **ou** especialista. A situação passa a ser uma escolha explícita e a residência vira um objeto complementar, só de residentes.

## Modelo

| Conceito | `profiles.professional_status` | `specialty` | Residência (bolsa) |
| --- | --- | --- | --- |
| Em residência | `resident` | obrigatória (programa) | pode existir; é a única que gera a entrada recorrente |
| Generalista | `general_practitioner` | proibida (`null`) | nunca |
| Especialista | `specialist` | obrigatória | nunca |

- O valor `general_practitioner` foi mantido no banco (renomear o enum mexeria em testes e seeds sem ganho); na UI é "Generalista".
- **Nunca inferir a situação a partir da ausência de residência.** Sem residência é um estado válido para qualquer situação.

## Servidor (`20260927000000` e `20260927000100`)

- `specialist` entra no enum em uma migration própria: Postgres não usa um valor novo na mesma transação em que ele foi criado.
- `profiles_specialty_by_status` passa a exigir especialidade para `resident` e `specialist`.
- `create_or_update_residency` recusa (`22023`) quem não é `resident`.
- Trigger `profiles_residency_status` (função `private.sync_residency_with_status`, definer, sem EXECUTE para clientes):
  - sair de `resident` encerra a residência ativa como `deactivate_residency` — recebidos ficam, meses futuros não recebidos são invalidados;
  - continuar residente e trocar a especialidade atualiza o programa da residência ativa.
- Como `profiles` é gravável direto pelo dono (RLS), a regra fica no banco e vale para qualquer caminho.
- Teste: `scripts/test-migration-11.10.sh` (banco descartável, com rollback) e trecho novo em `scripts/test-location-rpcs-6.1.mjs` (PostgREST real).

## Onboarding

`07 nome → 09 situação profissional → (Em residência) TELA 04 bolsa → 12 perfil pronto`

- A rota `/residency` virou `/professional-status` (`ProfessionalStatusScreen`).
- Título "Qual é sua situação profissional hoje?", apoio e três opções no mesmo padrão de seleção, agora com uma linha de descrição.
- Em residência → busca do programa → bolsa. Especialista → busca da especialidade (mesma lista CFM) → conclusão, sem bolsa. Generalista → conclusão direto.
- Conclusão: residente vê `Residente de X` no card da bolsa; generalista e especialista veem `SITUAÇÃO PROFISSIONAL` com `Generalista` ou `Especialista em X`, sem card de residência.

## Perfil

- Cabeçalho: tag derivada por `professionalStatusLabel` (`Residente de X`, `Generalista`, `Especialista em X`).
- Seu trabalho: a linha **Residência** só aparece para residentes.
- Editar perfil: **dropdown** `Situação profissional` (`DropdownField`, referência Lyft no Mobbin): campo preenchido com seta que gira e cartão flutuante com título, descrição e check; abre acima se não couber embaixo, toque fora fecha, `Reduzir movimento` troca na hora (token `motion.dropdown` 180 ms); especialidade com sugestões da mesma lista; para residente, atalho "Dados da residência".
- Trocar de `Em residência` para outra situação com bolsa ativa pede confirmação ("Sair da residência?") antes de salvar.
- Tela Residência: o vazio agora fala só com residentes ("Complete os dados da sua residência."); aberta por quem não é residente, mostra só uma nota, sem convite para adicionar.
