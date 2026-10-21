# Tela da Study Session

Type: prototype
Status: resolved
Blocked by: 01, 03
Labels: wayfinder:prototype

## Question

Como é a Study Session no mobile e no desktop: pergunta, revelar resposta, botões de Rating (escala definida pela pesquisa do algoritmo), progresso da sessão, acesso aos Comments do Card e tela de fim de sessão com resumo?

Modo foco em tela cheia, sem header nem tab bar: só progresso e "X" para sair (confirma se houver Cards pendentes). Entradas: banner da Daily Review, "Estudar" do Deck (só os vencidos hoje daquele Deck) e "Estudar agora" após o lote. Comments em bottom sheet (mobile) ou painel lateral (desktop). O resumo final tem "Voltar" para a origem da sessão (ver Inventário de telas e navegação).

O conteúdo dos Cards é rich text: negrito, itálico, listas, código (na linha e em bloco), imagem e fórmula. A pergunta e a resposta precisam exibir tudo isso. A sessão do "Estudar agora" traz os Cards do lote na ordem em que foram criados (ver Editor de Card e fluxo "Estudar agora").

## Answer

Resolvido em prototype com o usuário (2026-10-20), escolhendo entre três variantes.

- Protótipo: `prototype/study-session.html`. Parâmetros: `?origem=revisao|deck|lote`, `?tela=pergunta|resposta|de-novo|comments|sair|resumo`, `?tema=` e `?frame=mobile`.
- Variantes descartadas (fonte primária): branch `prototype/study-session`, commit `96298f7`. Nunca vai para o main. Eram B, um Card que vira em 3D com Rating numa grade 2×2 e barra segmentada por Card, e C, uma pilha de Cards em que se arrasta → para Bom e ← para Errei.

**Estrutura: Folha** (variante A)
- Página corrida, sem moldura de Card. Em cima ficam o Deck (só na Daily Review, que mistura Decks) e o selo de estado (Novo, Atrasado, De novo). Depois vem a pergunta em fonte grande.
- "Mostrar resposta" é um botão largo embaixo, ao alcance do polegar. A resposta aparece abaixo da pergunta, depois de um divisor "Resposta", e a pergunta continua visível.
- Rating: 4 botões em linha (Errei, Difícil, Bom, Fácil), com Bom preenchido de verde e os outros em contorno, com texto vermelho e âmbar. Abaixo de 340px de largura viram uma grade 2×2.
- **Sem intervalo nos botões**: decisão do usuário. Revoga o item 4 de [Algoritmo de revisão espaçada e escala de Rating](01-algoritmo-de-revisao.md), e o toggle sai de Configurações.
- Sem dica de teclado na tela. Os atalhos continuam: Espaço/Enter mostra a resposta, 1–4 dão o Rating, C abre os Comments, Esc sai.

**Topo (modo foco)**: "X", barra de progresso com "N/total", Desfazer e Comments com a contagem. Abaixo, as contagens do que falta: "N novos · N revisões · N de novo".

**Errei na sessão**: o Card vai para o fim da fila da mesma sessão e volta com o selo âmbar "De novo", até receber outro Rating. É o padrão do Anki, do RemNote e do Quizlet. A nota "Você errou este Card há pouco. Ele já volta amanhã; agora é só para fixar." aparece sob os botões.

**Desfazer o último Rating**: fica, como ícone no topo. Desfaz um Rating por vez e volta ao Card com a resposta à mostra.

**Comments**: abrem a qualquer momento, inclusive antes de mostrar a resposta. No mobile, bottom sheet; no desktop, painel lateral que empurra a sessão. Lista cronológica (o mais antigo em cima), campo "Escreva um Comment…" e toast "Comment salvo.". Ao dar o Rating, o painel passa para o próximo Card.

**Sair**: o "X" só confirma se já houver algum Rating e Cards faltando: "Sair da sessão?", com "Continuar estudando" e "Sair". O texto explica que os Ratings dados ficam salvos e os Cards que faltam continuam para hoje. No lote, eles continuam como Cards novos. Sem nenhum Rating, sai direto para a origem.

**Resumo final** (fora do modo foco)
- Título por origem: "Revisão de hoje concluída" (com "O aviso de hoje sai do Início e as notificações param até amanhã."), "<Deck> em dia" ou "Cards novos estudados".
- Números: Cards, "certos de primeira" e tempo de estudo. Barra com o primeiro Rating de cada Card, por nível. "Próxima revisão: amanhã, N Cards" (no lote: "O primeiro volta amanhã").
- Sessão do Deck: aviso "A revisão de hoje ainda tem N Cards em outros Decks", com o botão "Revisar".
- Botão principal "Voltar ao Início" (Daily Review) ou "Voltar ao Deck" (Deck e lote).
