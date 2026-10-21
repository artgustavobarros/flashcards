# Edição de Card já estudado e agendamento

Type: grilling
Status: resolved
Blocked by: 01, 05
Assignee: artgustavobarros
Labels: wayfinder:grilling

## Question

Quando a pessoa edita a pergunta ou a resposta de um Card que já recebeu Rating, o agendamento do FSRS continua ou volta ao início (o Card vira New Card de novo)? A decisão vale para todas as edições, ou o editor pergunta na hora (por exemplo, "Reiniciar o agendamento deste Card?" ao salvar)? Mudar só as Labels ou o Deck nunca deveria afetar o agendamento: confirmar.

Se houver escolha na hora, onde ela aparece no modo "editar um Card" do editor "Card em foco" (ver Editor de Card e fluxo "Estudar agora") e como o detalhe do Card mostra o resultado (próxima revisão).

O detalhe do Card já existe em [Decks, Labels e Comments](10-decks-labels-comments.md) (`prototype/decks.html`, `?tela=deck&deck=anatomia&card=biceps`). A linha "Próxima revisão" mostra "Hoje", "Atrasado N dias" ou "Em N dias, <data>", e o Card novo mostra "Ainda não estudado…". Mover o Card de Deck já avisa que o agendamento não muda.

## Answer

Resolvido em grilling com o usuário (2026-10-21). Termos novos no `GLOSSARY.md`: New Card (redefinido) e Schedule Reset.

**Editar não mexe no agendamento**
- Editar a pergunta ou a resposta de um Card com Rating nunca altera o agendamento, e o editor não pergunta nada.
- Mudar Labels ou mover de Deck também nunca altera o agendamento, por nenhum caminho: editor, detalhe do Card ou seleção em massa.
- No modo "editar um Card" de um Card com Rating, uma linha discreta abaixo do Card diz "O agendamento deste Card não muda." (o mesmo padrão do aviso de Mover).

**Reiniciar agendamento (Schedule Reset)**
- É uma ação separada de editar, no "⋯" do detalhe do Card: "Reiniciar agendamento". Só aparece para Card com Rating; some para Card Novo. Não entra na seleção em massa nem na Study Session.
- Age na hora, sem diálogo, com o toast "Agendamento reiniciado." e "Desfazer".
- Zera o agendamento (estabilidade, dificuldade, data). O Card volta a "Novo". O histórico de Ratings fica: Sequência, Evolução e Acertos do Progresso não mudam.
- O Card reiniciado entra no fim da fila de New Cards, como se tivesse acabado de ser criado, e respeita o limite "Novos por dia".
- No detalhe: Estado "Novo", Próxima revisão "Entra como novo numa próxima Daily Review" e, em cinza abaixo, "Agendamento reiniciado em 21 out". "Ainda não estudado…" fica só para o Card que nunca recebeu Rating.

**Editar durante a Study Session**
- O header da sessão ganha um ícone de lápis ao lado de Comments, com a pergunta ou a resposta à mostra.
- Ele abre o editor no modo "editar um Card". Ao salvar, a sessão volta ao mesmo Card, no mesmo lado em que estava, com o toast "Card salvo.". O agendamento não muda.
- O "Desfazer" da sessão continua só para Rating; nunca desfaz uma edição.

**Protótipos**: as mudanças entram em [Edição e reinício nos protótipos](13-edicao-e-reinicio-nos-prototipos.md).
