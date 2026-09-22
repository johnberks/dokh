# Review Card — recorte da tarefa 2.5

Fonte visual: `design/componentes.dc.html`, anatomia e variantes A–D, aplicações de 390×844 em Home e Finanças. Fonte comportamental: `docs/screens/home.md` e `docs/screens/financas.md`. Os exemplos de nome, data e valor existem apenas em `/dev/primitives`; nenhuma tela de produto recebe dados simulados.

## Contrato implementado

- `ReviewCard`: `tone` neutro/atenção; `size` compacto/padrão/detalhado; contexto, ícone, valor ou título, qualificador, ajuda, ação e callback. O card inteiro é um único alvo acessível; a faixa inferior integra o mesmo toque.
- O compacto não renderiza bandeja. O detalhado exibe até dois previews, com `+ N entradas` calculado pelo total; `ReviewCardStack` seleciona até dois cards e no máximo um de atenção, sempre primeiro. A feature deve encaminhar os demais para sua lista, sem ocultar pendências silenciosamente.
- Pendência usa as cores neutras e bronze do HTML, nunca vermelho. Valores, títulos e estados vêm do chamador, não são inventados pelo componente.
- O card de atenção não alterna localmente para `Recebido`. O HTML demonstra um toggle imediato; a regra de produto exige confirmação real no servidor. `onPress` inicia a operação; a feature remove o card após sucesso confirmado. `busy` impede duplo envio.

## Medidas e limites

O fundo, bordas, bandeja, mini cards, raios, ícones, fontes e tamanhos foram transcritos do HTML. A altura da faixa de ação é 58 no padrão, 60 no tom de atenção e 62 no detalhado. O componente usa os arquivos de fonte carregados pela 2.2 e imports diretos dos ícones. Sombras nativas aproximam o CSS; o brilho inset do HTML não tem equivalente direto em React Native.

Ainda faltam os outros nove componentes da 2.5 (WorkCard, ReceivableRow, EmptyState, ProgressCard, MoneyInput, WorkTypeSelector, CalendarGrid, BottomSheet e PremiumGate), a montagem nas telas reais e inspeção visual/VoiceOver no iPhone. Android/TalkBack foi adiado pelo usuário. O checkbox da tarefa permanece desmarcado.
