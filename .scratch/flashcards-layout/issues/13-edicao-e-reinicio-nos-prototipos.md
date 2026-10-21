# Edição e reinício nos protótipos

Type: prototype
Status: resolved
Blocked by: 12
Assignee: artgustavobarros
Labels: wayfinder:prototype

## Question

Como ficam, nos protótipos já existentes, as decisões de [Edição de Card já estudado e agendamento](12-edicao-e-reagendamento.md)? Aplicar e revisar com o usuário:

- `prototype/decks.html`, detalhe do Card: "Reiniciar agendamento" no "⋯" (só para Card com Rating), toast "Agendamento reiniciado." com "Desfazer", e o estado do Card reiniciado (Estado "Novo", "Entra como novo numa próxima Daily Review", "Agendamento reiniciado em <data>" em cinza). Um parâmetro para abrir um Card reiniciado.
- `prototype/study-session.html`: ícone de lápis ao lado de Comments no header; ao voltar do editor, o mesmo Card no mesmo lado, com toast "Card salvo.".
- `prototype/editor-de-card.html`, modo "editar um Card": a linha "O agendamento deste Card não muda." para Card com Rating, e o destino de volta à Study Session (além do detalhe do Card).

## Answer

Aprovado pelo usuário (2026-10-21). As decisões de [Edição de Card já estudado e agendamento](12-edicao-e-reagendamento.md) foram aplicadas nos protótipos sem variantes: não havia escolha de forma em aberto.

**Detalhe do Card** (`prototype/decks.html`)
- O "⋯" ganha "Reiniciar agendamento" (ícone de seta circular) entre "Labels" e "Apagar Card", só para Card com Rating.
- Age na hora: toast "Agendamento reiniciado." com "Desfazer". O Card fica com Estado "Novo", Próxima revisão com o badge "Novo" e "Entra como novo numa próxima Daily Review", e abaixo, em cinza, "Agendamento reiniciado em 21 out". A opção some do "⋯".
- Card já reiniciado: `?tela=deck&deck=historia&card=cabanagem` (também em "Ir para…" → "Card reiniciado").

**Study Session** (`prototype/study-session.html`)
- Lápis ("Editar Card") no header, entre Desfazer e Comments, com a pergunta ou a resposta à mostra.
- Ao salvar, a sessão volta à mesma posição da fila, no mesmo Card e no mesmo lado, com o toast "Card salvo.". Fechar o editor sem salvar volta sem toast. O Desfazer continua só para Rating.

**Editor** (`prototype/editor-de-card.html`, modo "editar um Card")
- Para Card com Rating, a linha "O agendamento deste Card não muda." fica abaixo das Labels, em texto cinza sem ícone (o mesmo padrão do aviso de Mover). Card Novo não mostra a linha (`?tela=editar-novo`).
- Com `?de=card|sessao`, o editor abre o Card de onde veio. Ao salvar ou fechar, volta ao detalhe do Card ou à Study Session. O "X" diz "Voltar à Study Session" quando vem da sessão.
- Só no protótipo: o Card editado e a sessão em andamento passam entre as páginas pelo `sessionStorage` da aba (`lembra:editar`, `lembra:edicoes`, `lembra:sessao`).

**Ajustes de layout feitos na mesma sessão** (pedido do usuário, fora da pergunta)
- Progresso mobile: cada card do carrossel tem a altura do próprio conteúdo. A moldura acompanha a altura do card à mostra enquanto desliza, e "Próximos 7 dias" e "Atividade" não sobram mais espaço embaixo.
- Todos os protótipos: abaixo de 768px (e na moldura `?frame=mobile`), a barra de rolagem da página fica escondida. Ela não ocupa largura, como num celular. Antes, no DevTools, ela aparecia depois do carregamento e encolhia o layout.
