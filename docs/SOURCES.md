# Integridade das fontes (tarefa 0.1)

Hash SHA-256 idêntico entre arquivo original e cópia normalizada.

| Origem (projeto_dokh) | Destino | SHA-256 |
| --- | --- | --- |
| `dokh_commands/README.md` | `README.md` | `d7e21daf381f891e481154e9b4da3fc16cba450ceaf15a59dff7771cc06feef1` |
| `dokh_commands/CLAUDE.md` | `CLAUDE.md` | `91e937181bc2760006d226cf51f56352fcc62aadf8c4d912694d5570b96b6865` |
| `dokh_commands/decisions.md` | `decisions.md` | `61e3235a4d72d69b301132e985e2f0fbe39b5a12bd649250bce583dfe059bd5c` |
| `dokh_commands/domain-model.md` | `domain-model.md` | `33e94307f3a7edeab08e492c73bd42684785a69efe99c3f6c780579e4f2fb8e0` |
| `dokh_commands/build-plan.md` | `build-plan.md` | `8d0faad276fb2677e85cffa85c9bf6fb3f896c5b564b065e79c0648476e198d8` |
| `ux_specs/onboarding.md` | `docs/screens/onboarding.md` | `515dd6e2eead0b20c5761d4dbf159b0792153269d817c5e5fc70e9e38755c79d` |
| `ux_specs/home.md` | `docs/screens/home.md` | `ec04a58ded91764150ce9ecfa958c2e3ead7423077d8f9ecd34e1d514d644331` |
| `ux_specs/agenda.md` | `docs/screens/agenda.md` | `0f476756da950e06ee2c9f3232ec8b08e84c941f1540ed157261872fbc05586a` |
| `ux_specs/financas.md` | `docs/screens/financas.md` | `4dc8b82e0684d3600d8dbf84e4c2d5d69fd3591253863dfe487628f61d007330` |
| `ux_specs/perfil.md` | `docs/screens/perfil.md` | `648f9b7e2bdb244466831c49bf6818e09ab53fbde1c2d856b24c9a0245c390da` |
| `ux_specs/relatorio_simulacao_financeira_dokh.pdf` | `docs/reference/relatorio_simulacao_financeira_dokh.pdf` | `3c1df60e92f7ea93b9d087f8dfacf67c6b50e66e11cff0c1c33617d4a18151a5` |
| `telas_design/DOKH Onboarding MVP.html` | `design/onboarding.html` | `3785d91df1e6c4b82ee8ab9f4fe5c7dabf670d403d380e41556295f2603f8ad5` |
| `telas_design/DOKH Home.html` | `design/home.html` | `39c043a30b486e156f9eed3648389cfee326ef29d70daf2add95afa073b556ac` |
| `telas_design/DOKH Agenda.html` | `design/agenda.html` | `c49152cdd51c2bc5c342da24ac228a2f4ac45f58e90ea823c63eb1b77875b260` |
| `telas_design/DOKH Financas.html` | `design/financas.html` | `884a35a59eeec5488636b5477ee0e44b18e8aef1f30f2b4d1e510829278ea055` |
| `telas_design/PERFIL.dc.html` | `design/perfil.html` | `634a34c71b07cdb4c185d42a7b14e698d453a6d81e99a60caa80b1ea2ea98b29` |
| `telas_design/DOKH Componentes.dc.html` | `design/componentes.dc.html` | `010f14279ed1d963067a47a19ff79e30d85fac18ed44959116de3563e1dde20b` |
| `brandKit_design/DOKH Brand Kit Final.dc.html` | `design/brand-kit.dc.html` | `7b075654ef66bb5dccc16e9a537322dfe2505a71a6cb960be682291dbbb46acb` |

## Alterações intencionais após a cópia

- `CLAUDE.md` (e o espelho `AGENTS.md`) recebeu a seção **Ferramentas de agente e ambiente**, exigida para uso conjunto de Claude Code e Codex. O hash da tabela acima refere-se ao arquivo original; `CLAUDE.md` e `AGENTS.md` são idênticos entre si (`node scripts/sync-agents.mjs --check`).
- `design/perfil.html` é o `PERFIL.dc.html` original renomeado para o caminho citado no README.
- `design/*.dc.html` (perfil, componentes, brand-kit) referenciam `./support.js`, que não veio com os arquivos originais: leem-se como código-fonte, mas não renderizam no navegador.
