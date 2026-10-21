# Montagem final do protótipo navegável

Type: prototype
Status: resolved
Assignee: artgustavobarros
Blocked by: 14, 15, 16
Labels: wayfinder:prototype

## Question

Como as telas viram um protótipo único navegável, que é o destino deste mapa?

- **Entrada**: qual é a porta de entrada (um `prototype/index.html`? o Login?) e como se navega entre as páginas sem a barra "Protótipo" de cada uma atrapalhar.
- **Ligações**: hoje vários destinos são esboço ou toast ("Configurações fica em outro ticket.", o "fora deste protótipo" da Study Session e do editor, o sino e o "+ Novo" fora do Início). Ligar cada um à tela real.
- **Consistência**: revisar shell, header, tab bar, toasts, sheets, estados vazios, nome do app e tema claro/escuro entre todas as páginas, no desktop e no mobile (DevTools device mode). Listar e corrigir as diferenças.
- Os dados falsos precisam bater entre as telas (os mesmos Decks, Cards e contagens no Início, em Decks, no Progresso e na Study Session)?
- **Nome e ícone**: aplicar o [Nome do app](16-nome-do-app.md). Trocar "Lembra" por "Daruma" em todas as páginas e e-mails, desenhar o SVG do boneco (silhueta verde, um olho pintado) ao lado do wordmark, adicionar o favicon e tirar os avisos de "nome provisório".

## Answer

Protótipo montado. Entrada em [`prototype/index.html`](../../../prototype/index.html).

- **Entrada**: `index.html` é o mapa do protótipo. "Abrir o app" vai ao Login, "Entrar já logado" ao Início, e há um link para cada estado de cada tela.
- **Barra "Protótipo"**: fica recolhida num botão pequeno no canto (aberta ou fechada fica lembrada). Aberta, ganha "Mapa" e "Recolher".
- **Código comum**: `prototype/daruma.js` é carregado por todas as páginas. Ele tem o ícone, o favicon, o tema, o aviso de e-mail e a pausa de novos, que seguem entre páginas, e mais `ir()` / `data-ir` para navegar levando `tema` e `embed`. Também tem o menu "+ Novo" e o sino, iguais em todas as abas.
- **Ligações**: não há mais esboço "fora deste protótipo".
  - Abas, sino e "+ Novo" funcionam em todas as abas.
  - A Study Session volta ao Início (concluída/andamento/pendente) ou ao Deck de origem, e o "Estudar" de um Deck usa os Cards dele.
  - "Estudar agora" no editor abre a sessão com o lote escrito.
  - Login cai no Início; conta nova cai no Início vazio com o aviso de e-mail; sessão expirada volta ao Deck.
  - Links dos e-mails abrem o Início (vista / e-mail confirmado).
- **Dados alinhados à mão** (hoje = qua, 21 out 2026):
  - Revisão de hoje: 17 Cards (12 revisões, 5 novos, 4 atrasados); amanhã 14.
  - Decks: Anatomia 42, Inglês 120, JavaScript 64, História 35, Química vazio (261 Cards). Decks ganhou Cards de enchimento para fechar os totais.
  - A Study Session usa os mesmos Cards de Decks. Os Cards por estado do Progresso batem com Decks.
- **Nome**: Daruma em todas as páginas, `<title>` e e-mails. O ícone (boneco verde com um olho pintado e bigode) aparece no header, no Login, nos e-mails e no favicon. Os avisos de "nome provisório" saíram.
- **Consistência corrigida**:
  - "5para hoje" sem espaço.
  - Nome do Deck cortado no mobile.
  - Ícone de Deck igual em todas as telas.
  - O botão "Protótipo" cobria "Mostrar resposta" e sumia no escuro.
- **Verificação**: 26 estados carregam sem erro de JS; 13 fluxos de clique entre páginas passam (Playwright, fora do repo).
- **Sobras conhecidas (pequenas, não bloqueiam o frontend)**:
  - A conta nova se chama "Bia" no cadastro, mas o Início saúda "Ana".
  - O Progresso sem Ratings mostra Decks mesmo para uma conta sem Decks.
  - Em Configurações, "Fuso horário" quebra linha no mobile, e a coluna é mais estreita que a de Decks.
  - Um Deck criado no editor não existe em Decks, então o editor volta à lista.
  - O logo dos e-mails é SVG inline; um e-mail real precisaria de PNG (infra).
