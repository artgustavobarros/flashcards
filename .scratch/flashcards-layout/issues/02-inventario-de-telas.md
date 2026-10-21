# Inventário de telas e navegação

Type: grilling
Status: resolved
Blocked by: —
Labels: wayfinder:grilling

## Question

Quais telas o app tem, como se navega entre elas (header, sidebar, tab bar no mobile) e qual é a home após o login? Saída: sitemap com cada tela, seu propósito e de onde se chega nela. Inclui decidir onde vivem Labels, Comments, busca e configurações.

## Answer

Resolvido em grilling com o usuário (2026-10-20).

**Sem login**
- Login (e-mail + senha, Google), com links para Cadastro e "Esqueci a senha". Visitante sem sessão em `/` cai no Login. Sem landing page.
- Sessão expirada: volta ao Login com o aviso "Sua sessão expirou, entre de novo"; após entrar, retorna à página onde estava. É estado do Login, não tela própria.

**Shell (logado)**
- Mobile: header com sino; tab bar `Início · Decks · Progresso · Configurações`; botão flutuante "+ Novo".
- Desktop: header com os mesmos links, "+ Novo", sino e avatar (menu: Configurações, Sair).
- "+ Novo" abre a escolha "Novo Deck" ou "Adicionar Cards a…" (escolher Deck), que leva ao editor.
- Sino: só dropdown (no máximo um aviso de Daily Review por dia), sem página de notificações.

**Telas**
1. **Início** (home após o login): banner da Daily Review, Decks recentes, criar.
2. **Decks**, com duas abas: "Decks" (lista) e "Cards" (todos os Cards: busca por texto, filtros por Deck, Label e estado de agendamento, seleção em massa, gestão de Labels: criar, renomear, apagar).
3. **Detalhe do Deck**: a mesma lista de Cards, pré-filtrada pelo Deck. Topo com nome, contagens (novos, vencidos hoje, total) e ações "Estudar", "Adicionar Cards" e "⋯" (renomear, apagar Deck).
4. **Detalhe do Card**: pergunta, resposta, Labels, Deck, próxima revisão e lista cronológica de Comments. Ações: editar, mover para Deck, adicionar/remover Label, apagar.
5. **Editor de Card**: página inteira, sem tab bar no mobile. Modo "lote" (vários Cards seguidos, termina em "Estudar agora") e modo "editar um Card" (abre do detalhe do Card e volta a ele ao salvar).
6. **Study Session**: modo foco em tela cheia, sem header nem tab bar, só progresso e "X" para sair (confirma se houver Cards pendentes). Entradas: banner da Daily Review, "Estudar" do Deck, "Estudar agora" após o lote. Comments em bottom sheet (mobile) ou painel lateral (desktop). Resumo final com "Voltar" para a origem (Início, ou o Deck no caso do Deck e do lote).
7. **Progresso**: o dashboard.
8. **Configurações**: página única rolável com seções Estudo, Notificações, Aparência e Conta; "Sair" no fim de Conta.
9. **404**: mensagem curta e "Ir para o Início", dentro do shell quando logado; sem shell e com "Entrar" quando não. Cobre Deck ou Card apagado ou inexistente.
10. **Erro genérico**: fora do shell, "Algo deu errado" com "Tentar de novo" e "Ir para o Início".

**Regras de navegação e estudo**
- "Estudar" no Deck abre uma Study Session só com os Cards daquele Deck vencidos hoje; conta para concluir a Daily Review. Não há estudo livre fora do agendamento.
- Seleção em massa na lista de Cards: mover para Deck, adicionar/remover Label, apagar.

**Erros pequenos** não são telas. Padrão (desenhado na fundação visual, usado por cada tela):
- Inline: erro de campo/formulário e falha ao carregar um bloco (com "Tentar de novo" no lugar do bloco).
- Toast: falha de uma ação já disparada (salvar, apagar, mover), com "Tentar de novo" quando fizer sentido.

**Fora do escopo**: landing page, estudo livre fora do agendamento, modo offline.
