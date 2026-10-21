# Tela do dashboard

Type: prototype
Status: resolved
Blocked by: 03, 08
Assignee: artgustavobarros
Labels: wayfinder:prototype

## Question

Como o dashboard dispõe as métricas escolhidas em Métricas do dashboard, no mobile e no desktop?

Na navegação, o dashboard se chama "Progresso" (ver Inventário de telas e navegação).

Métricas, filtros e o gráfico de Evolução estão definidos em [Métricas do dashboard](08-metricas-do-dashboard.md). Falta decidir a ordem e o tamanho dos blocos, e o estado vazio (sem nenhum Rating ainda).

## Answer

Resolvido em prototype com o usuário (2026-10-21), escolhendo entre três variantes.

- Protótipo: `prototype/progresso.html`. Parâmetros: `?dados=cheio|vazio`, `?deck=`, `?periodo=7|30|90|tudo`, `?abrir=deck`, `?tema=` e `?frame=mobile`.
- Variantes descartadas (fonte primária): branch `prototype/dashboard`, commit `bd235a9`. Nunca vai para o main. Eram B, coluna única em que cada bloco abre com uma frase ("12 dias seguidos."), e C, a lista de Decks como filtro, com um gráfico por vez em abas. O branch também guarda as formas de erro testadas na Evolução: empilhado, lado a lado e em cinza.

**Estrutura: Painel** (variante A)
- No topo, o título "Progresso" e os filtros numa linha: combobox de Deck e Período em segmentos (7 dias, 30 dias, 90 dias, Tudo). No mobile, os dois ficam empilhados em largura total.
- Combobox de Deck: um botão em pílula com o ícone e o nome do Deck. Ele abre uma lista com a busca "Buscar Deck…" (ignora acentos). Cada item mostra o nome, os cards, "N para hoje", a % de acertos no período e um ✓ no escolhido. Funciona com setas, Enter e Esc. No mobile, a busca não ganha foco sozinha.
- **Desktop**: grade de 3 colunas.
  - 1ª linha: Sequência, Acertos e Cards por estado.
  - 2ª linha: Evolução (2 colunas) e Próximos 7 dias.
  - 3ª linha: Atividade (2 colunas) e Por Deck.
- **Mobile**: blocos parecidos em 2 carrosséis, e Por Deck em lista logo abaixo.
  - "Resumo": Sequência, Acertos e Cards por estado.
  - "Ao longo do tempo": Evolução, Próximos 7 dias e Atividade.
  - Cada card ocupa a largura toda e encaixa com snap.
  - Os pontos no título mostram a posição e levam ao card.
  - O carrossel também se arrasta com o mouse.
- **Sequência**: "12 dias" e "Recorde: N dias", mais uma faixa com os últimos 7 dias.
  - Na faixa: ✓ verde para dia concluído, contorno tracejado para marcado como vista, cinza para sem revisão e anel para hoje pendente.
  - A Sequência vale para todos os Decks. Com um Deck filtrado, aparece "A Sequência vale para todos os Decks".
- **Acertos**: a % em destaque e a linha "N de N revisões no período". No rodapé, um medidor com a marca da meta de 90% e o texto "N pontos abaixo da meta" ou "Acima da meta".
- **Evolução**: dois painéis com a mesma linha do tempo, para evitar dois eixos Y.
  - Em cima, a linha da % de acertos com a meta de 90% tracejada.
  - Embaixo, os acertos sobem e os erros descem a partir do zero.
  - As barras têm cantos retos: a barra empilhada com ponta arredondada parecia um objeto fálico.
  - Os erros usam um coral suave, porque o vermelho forte contrastava demais com o verde.
  - O tooltip de cada dia, semana ou mês mostra revisões, acertos, erros e %.
- **Próximos 7 dias**: uma barra por dia, de hoje até daqui a 6 dias, com o valor em cima e o total no título.
- **Atividade**: calendário estilo GitHub, com cor pelo nº de revisões e contorno tracejado no dia marcado como vista. Em 7 dias, vira uma faixa de 7 blocos. A partir de 90 dias, rola até hoje.
- **Por Deck**: cada linha mostra o nome, "N para hoje · N cards", a % de acertos e uma barrinha. Tocar numa linha aplica o filtro de Deck. Com um Deck filtrado, o bloco mostra esse Deck com "Abrir Deck" e "Ver todos os Decks".

**Cores dos gráficos**: dois tokens novos, `--chart-ok` (verde) e `--chart-err` (coral), com valores próprios para o tema escuro. O par passou no `validate_palette.js` com ressalvas: a separação para daltonismo e o contraste do coral ficaram no limite. Legenda, tooltip e posição fixa compensam.

**Estado vazio** (há Cards, mas nenhum Rating)
- Os filtros somem.
- Um card mostra "Seu progresso aparece depois da primeira revisão" e o botão "Começar revisão de hoje".
- Cards por estado aparece real, com tudo como Novo.
- Sequência, Acertos, Evolução e Próximos 7 dias aparecem como contornos tracejados com "—".

