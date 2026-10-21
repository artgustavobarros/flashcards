# Home, banner da Daily Review e notificações

Type: prototype
Status: resolved
Blocked by: 03
Labels: wayfinder:prototype

## Question

Como é a home após o login: banner da Daily Review (pendente, concluída, marcada como vista), botão "Marcar como vista", sino com dropdown de notificações e atalhos para Decks? Mostrar os três estados do dia.

Incluir no banner a contagem de atrasados ("N atrasados") e o aviso de backlog sugerindo pausar Cards novos (ver Algoritmo de revisão espaçada e escala de Rating).

O banner separa revisões e Cards novos (ex.: "12 revisões · 5 novos"), conforme o limite "Novos por dia" definido nas Notes do mapa.

A home é a tela "Início" (primeira aba). Atalhos = Decks recentes; a lista completa fica em Decks. O sino abre só um dropdown, sem página de notificações (ver Inventário de telas e navegação).

Logo após o cadastro por e-mail, o aviso âmbar "Confirme seu e-mail" fica abaixo do header até a pessoa confirmar. Ele convive com o banner da Daily Review: definir a ordem e se ele aparece em todas as telas ou só no Início. Ver Telas de login e cadastro.

## Answer

Resolvido em prototype com o usuário (2026-10-20), escolhendo entre três variantes.

- Protótipo: `prototype/home.html`. Parâmetros: `?dia=pendente|andamento|backlog|concluida|vista|livre`, `?email=pendente`, `?tema=` e `?frame=mobile`.
- Variantes descartadas (fonte primária): branch `prototype/home`, commit `00ae0df`. Nunca vai para o main. Eram B, um número grande dentro de um anel de progresso com Decks recentes numa fila horizontal, e C, a revisão de hoje dividida por Deck como checklist.

**Estrutura: Faixa** (variante A)
- No topo, "Boa tarde, <nome>" e uma frase sobre o dia: "Você tem N cards para hoje", "Faltam N cards…", "Revisão de hoje concluída. Amanhã: N cards." ou "Nada para revisar hoje. Amanhã: N cards."
- Abaixo vem a faixa da Daily Review, em verde claro, com o título "Revisão de hoje: N cards" e a linha "N revisões · N novos · N atrasados" (atrasados em vermelho). Os botões são "Marcar como vista" (fantasma) e "Começar" (primário). No mobile, os dois dividem uma linha abaixo do texto.
- Em andamento, a faixa diz "N cards restantes", mostra uma barra fina com "feitos/total" e o botão vira "Continuar".
- A faixa some quando o dia é concluído, marcado como visto ou não tem Cards. Nesses casos só a frase da saudação muda.
- Decks recentes: grade 2×2 no desktop e uma coluna no mobile, com "Ver todos", que leva a Decks. Cada card mostra o nome, o total de Cards e os badges "N para hoje" (âmbar) e "N novos", ou então "Feito hoje" ✓, "Em dia" ou "N para amanhã". O card inteiro abre o detalhe do Deck.

**Marcar como vista**
- Age na hora, sem diálogo. O toast "Revisão marcada como vista. Sem avisos até amanhã." tem "Desfazer".
- Depois disso, a frase diz "N cards ficam para amanhã" e há o link "Revisar mesmo assim", que abre a Study Session da Daily Review.
- O botão aparece na faixa e no item do sino.

**Backlog**: com muitos atrasados, um aviso âmbar dentro da faixa diz "N Cards atrasados. Pausar os novos até pôr em dia?", com o botão "Pausar novos". Pausados, os novos saem da contagem e a faixa mostra "Cards novos pausados até você pôr a revisão em dia. Retomar".

**Sino**
- O ponto verde aparece quando a revisão do dia está aberta e some quando a pessoa abre o sino.
- O dropdown mostra o item de hoje e o de ontem. Com a revisão aberta, o item é "Revisão de hoje: N cards", com o detalhe, o horário e os botões "Começar" e "Marcar como vista". Fechada, o item diz "concluída", "marcada como vista" (com "N cards ficam para amanhã") ou "Nada para revisar hoje".

**Aviso "Confirme seu e-mail"**: bloco âmbar logo abaixo do header, acima de tudo, em todas as abas e sem botão de fechar. Texto: "Confirme seu e-mail para receber o aviso da revisão de hoje", com "Reenviar". O toast confirma o envio.

