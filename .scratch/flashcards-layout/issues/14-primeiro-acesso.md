# Primeiro acesso e Início sem Decks

Type: prototype
Status: resolved
Blocked by: —
Assignee: artgustavobarros
Labels: wayfinder:prototype

## Question

Como é o primeiro acesso, do fim do cadastro até o primeiro Card estudado?

- **Início sem Decks**: depois do cadastro, a pessoa cai no Início com "Boas-vindas, <nome>" (ver [Telas de login e cadastro](04-telas-de-auth.md)). O Início com dados está em `prototype/home.html` ([Home, banner da Daily Review e notificações](07-home-e-notificacoes.md)), mas o Início sem Decks ainda não existe. A seção Decks vazia ("Crie seu primeiro Deck") já existe em `prototype/decks.html?dados=vazio`, e o Progresso sem Ratings em `prototype/progresso.html?dados=vazio`.
- **Onboarding**: há algum passo guiado (tour, checklist, Deck de exemplo) ou só os estados vazios bastam?
- **Review Time na primeira vez**: a pessoa escolhe a hora do aviso no primeiro acesso, ou vale o padrão 19:00 até ela mudar em Configurações (`prototype/configuracoes.html`, [Configurações e Review Time](11-configuracoes.md))? Se escolher, em que momento e com que tela.
- Como ficam a faixa da Daily Review e o sino enquanto não há nenhum Card.

## Answer

Resolvido em prototype com o usuário (2026-10-21), escolhendo entre três variantes.

- Protótipo: `prototype/home.html?dados=vazio` (conta nova) e `?dados=primeiro` (depois do primeiro estudo). O seletor fica na barra do protótipo, ao lado de "Com dados".
- Variantes descartadas (fonte primária): branch `prototype/primeiro-acesso`, commit `e2fd935`. Nunca vai para o main. Eram B, um checklist "Primeiros passos" (criar Deck, escrever Cards e estudar, escolher a hora do aviso) no topo do Início, e C, duas telas de boas-vindas em modo foco (hora do aviso, depois "Criar meu primeiro Deck" ou um Deck de exemplo).

**Estrutura: só estados vazios** (variante A)
- Não há onboarding: sem tour, sem checklist e sem Deck de exemplo. A pessoa começa sempre criando o próprio Deck.
- Início sem Decks: "Boas-vindas, <nome>", depois a frase "Comece criando um Deck. Os Cards que você escrever nele viram a sua revisão de cada dia." Abaixo, o bloco tracejado "Crie seu primeiro Deck" (o mesmo texto de `prototype/decks.html?dados=vazio`), com o botão "Criar Deck", que abre o editor no modo Novo Deck (`editor-de-card.html?tela=novo-deck`).
- O caminho até o primeiro Card estudado é o fluxo já decidido: Criar Deck, escrever os Cards no editor e "Estudar agora" ([Editor de Card e fluxo "Estudar agora"](05-editor-de-card.md)).

**Review Time na primeira vez**
- Não se pergunta. Vale o padrão 19:00 até a pessoa mudar em Configurações.
- Abaixo do bloco vazio fica a linha "O aviso da revisão chega às 19:00, no app e no e-mail. Mudar". "Mudar" leva a Configurações.

**Faixa e sino sem Cards**
- Sem Cards, a faixa da Daily Review não aparece.
- O sino fica sem o ponto verde. O dropdown mostra "Nada por aqui ainda", com "O aviso da revisão de hoje aparece aqui às 19:00, quando houver Cards."

**Depois do primeiro estudo**
- A saudação volta a ser "Boa tarde, <nome>", com a frase "Primeira sessão feita. Amanhã: N cards, com aviso às 19:00."
- O Deck aparece em Decks recentes com o badge "N para amanhã". A linha do Review Time some.
- O sino mostra "Amanhã às 19:00: aviso da revisão de N cards."

