# Mapa: Layout do app de flashcards

Labels: wayfinder:map

## Destination

Protótipo HTML navegável (fidelidade média, dados falsos) de todas as telas do app de flashcards, com as decisões de produto que afetam o layout já tomadas. Pronto para servir de base ao frontend real.

## Notes

- **Domínio**: app web multiusuário de estudo com repetição espaçada; projeto de portfólio, escala pequena. Vocabulário canônico em `GLOSSARY.md` (Card, Deck, Label, Study Session, Rating, Daily Review, Review Time, Comment).
- **Exceção ao "planejar, não fazer"**: tickets `prototype` produzem as telas do protótipo navegável, que é o próprio destino. Stack, backend e infra não se decidem aqui.
- **Skills**: tickets `prototype` chamam `prototype`; tickets `grilling` chamam `grilling` + `domain-modeling`; tickets `research` chamam `research`.
- **Preferências fixadas no charting (2026-10-20)**:
  - Formato: HTML navegável, Tailwind + componentes estilo shadcn, dados falsos.
  - Responsivo mobile-first; Study Session pensada para uso com o polegar; editor de Card otimizado para desktop.
  - Visual minimalista, modo claro e escuro, interface só em PT-BR.
  - Auth: e-mail + senha e login com Google. Revisto: só Google ([Login só com Google](issues/18-login-so-com-google.md)).
  - Cards com pergunta e resposta em rich text.
  - Fluxo de criação: criar vários Cards seguidos num Deck, depois "Estudar agora" abre uma Study Session só com os novos; em seguida eles entram no agendamento normal.
  - Cards novos: "Estudar agora" traz todos os Cards novos do lote, sem limite. Cards novos não estudados na hora entram nas próximas Daily Reviews respeitando o limite "Novos por dia" (padrão 20, ajustável em Configurações).
  - Daily Review: intervalos em dias inteiros; um aviso por dia no Review Time escolhido (e-mail + notificação in-app).
  - "Já vi a de hoje": a Daily Review conclui sozinha quando todos os Cards do dia recebem Rating; há também um botão "Marcar como vista" que conclui o dia e silencia as notificações, sem alterar o agendamento. Os Cards pendentes passam para o dia seguinte.
  - Notificações in-app: sino com dropdown no header + banner da Daily Review na home ("Revisão de hoje: N cards · Começar"), que some quando o dia é concluído ou marcado como visto.
  - Decks privados por usuário; Comments são anotações pessoais em lista cronológica por Card.
- **Protótipo**: cada tela parte de `prototype/fundacao-visual.html` (tokens, shell, componentes base e padrão de erro). Ver [Fundação visual e shell do app](issues/03-fundacao-visual.md). Entrada do protótipo em `prototype/index.html`; toda página carrega `prototype/daruma.js`.

## Decisions so far

<!-- one line per closed ticket: [title](issues/NN-slug.md): gist -->

- [Algoritmo de revisão espaçada e escala de Rating](issues/01-algoritmo-de-revisao.md): FSRS-6 em dias inteiros; Rating Errei/Difícil/Bom/Fácil (o intervalo no botão foi revisto: não aparece); Errei volta no fim da sessão; atrasados entram na Daily Review.
- [Inventário de telas e navegação](issues/02-inventario-de-telas.md): 4 abas (Início, Decks, Progresso, Configurações) + "+ Novo"; Decks com abas Decks/Cards (busca, filtros, Labels); Study Session em modo foco; 404 e erro genérico como telas, erros pequenos inline/toast.
- [Fundação visual e shell do app](issues/03-fundacao-visual.md): estrutura do "Papel" com neutros zinc e verde de ação; Outfit + DM Sans; botões em pílula; "+ Novo" estendido no mobile; toasts de falha e de sucesso. Base em `prototype/fundacao-visual.html`.
- [Telas de login e cadastro](issues/04-telas-de-auth.md): e-mail primeiro numa tela só (o e-mail leva à senha, ao Google ou ao cadastro); cadastro com nome; entra direto, com aviso para confirmar o e-mail, e o e-mail da Daily Review só sai depois da confirmação. Base em `prototype/auth.html`.
- [Editor de Card e fluxo "Estudar agora"](issues/05-editor-de-card.md): "Card em foco": escreve a pergunta, vira, escreve a resposta, "Salvar e próximo"; lote em pílulas numeradas; rich text completo (com imagem e fórmula); Labels passam para o próximo Card; "Estudar agora" salva o Card completo em edição. Base em `prototype/editor-de-card.html`.
- [Tela da Study Session](issues/06-study-session.md): "Folha": a resposta aparece abaixo da pergunta, com 4 botões de Rating sem intervalo; Errei volta no fim da sessão com o selo "De novo"; há Desfazer; Comments abrem a qualquer momento; resumo por origem. Base em `prototype/study-session.html`.
- [Home, banner da Daily Review e notificações](issues/07-home-e-notificacoes.md): "Faixa": saudação, depois a faixa da revisão de hoje com "Começar" e "Marcar como vista" (age na hora, com Desfazer), depois Decks recentes em grade. A faixa some quando o dia fecha. Com backlog, há "Pausar novos". O aviso de e-mail aparece em todas as abas. Base em `prototype/home.html`.
- [Métricas do dashboard](issues/08-metricas-do-dashboard.md): Progresso com Sequência e calendário, previsão de 7 dias, Acertos vs. meta fixa de 90%, Cards por estado (Novo / Em aprendizado / Maduro) e lista Por Deck. A Evolução mostra revisões em acertos e erros ao longo do tempo. Filtros: Deck e Período.
- [Tela do dashboard](issues/09-dashboard.md): "Painel": filtros numa linha (combobox de Deck com busca e Período). No desktop, grade de blocos; no mobile, os carrosséis "Resumo" e "Ao longo do tempo". A Evolução tem a % num painel próprio e os erros descem do zero, com barras retas em coral. A Sequência vale para todos os Decks. O estado vazio tem contornos tracejados. Base em `prototype/progresso.html`.
- [Decks, Labels e Comments](issues/10-decks-labels-comments.md): "Pilha": cada nível é uma página (Decks → Deck → Card). A aba Cards tem busca, que filtra enquanto se digita e destaca o termo, e chips de filtro com menu. A seleção vira uma barra no topo. Labels têm página própria. Os Comments ficam no fim do Card. Mover e apagar têm "Desfazer". Base em `prototype/decks.html`.
- [Configurações e Review Time](issues/11-configuracoes.md): "Lista": linhas agrupadas (Estudo, Notificações, Aparência, Conta); cada valor abre um sheet e salva na hora, com Desfazer. Fuso automático por padrão. Não há botão de pausar novos: só "Retomar" quando a pausa vem do Início. O aviso por e-mail fica travado sem confirmação. Inclui "Apagar conta". Base em `prototype/configuracoes.html`.
- [Edição de Card já estudado e agendamento](issues/12-edicao-e-reagendamento.md): editar texto, Labels ou Deck nunca mexe no agendamento; o editor avisa "não muda". "Reiniciar agendamento" é ação separada no "⋯" do detalhe (com Desfazer): o Card volta a Novo, entra no fim da fila de novos e o histórico fica. A Study Session ganha "Editar" (lápis), que volta ao mesmo Card.
- [Edição e reinício nos protótipos](issues/13-edicao-e-reinicio-nos-prototipos.md): "Reiniciar agendamento" no "⋯" do detalhe do Card; lápis na Study Session, que volta ao mesmo Card; linha "O agendamento deste Card não muda." no editor. Também: carrossel do Progresso com a altura de cada card, e a barra de rolagem escondida abaixo de 768px.
- [Primeiro acesso e Início sem Decks](issues/14-primeiro-acesso.md): sem onboarding nem Deck de exemplo. O Início vazio tem "Boas-vindas", o bloco "Crie seu primeiro Deck" e a linha "O aviso chega às 19:00 · Mudar". O Review Time não é perguntado. Sem Cards, não há faixa e o sino diz "Nada por aqui ainda". Base em `prototype/home.html?dados=vazio`.
- [E-mails da Daily Review, confirmação e senha](issues/15-emails.md): a Daily Review abre com a pergunta do primeiro Card ("Você lembra?") e "Ver a resposta", mais "Marcar como vista" em link. Confirmação e senha são um "Bilhete": texto corrido e um botão. Não há contagens por Deck nem Sequência no e-mail. Base em `prototype/emails.html`.
- [Nome do app](issues/16-nome-do-app.md): o app se chama Daruma, porque "Lembra" já existe em dois apps de flashcards. O ícone é um boneco Daruma em silhueta verde com um olho pintado, ao lado do wordmark, e aparece sozinho no favicon e no remetente. Remetente ilustrativo: "Daruma <aviso@daruma.app>".
- [Login só com Google](issues/18-login-so-com-google.md): a única forma de entrar é a conta Google; a primeira entrada cria a conta. Saem senha, cadastro, "Esqueci a senha", confirmação de e-mail (aviso âmbar e dois e-mails) e, em Configurações, senha e vínculo do Google. Revê os tickets 04, 11 e 15.
- [Montagem final do protótipo navegável](issues/17-montagem-final.md): entrada em `prototype/index.html` (mapa de todas as telas e estados); barra "Protótipo" recolhida num botão; `prototype/daruma.js` comum a todas as páginas (ícone, tema, navegação, "+ Novo" e sino); todos os destinos ligados; dados alinhados (17 Cards hoje, 261 no total).

## Not yet specified

<!-- toda a névoa restante virou tickets em 2026-10-21: Primeiro acesso e Início sem Decks, E-mails, Nome do app, Montagem final -->
<!-- destino alcançado em 2026-10-21: nenhum ticket aberto -->

## Out of scope

- Stack, backend, banco, provedor de e-mail e infra: o destino é o layout.
- Compartilhamento de Decks entre usuários e Comments de terceiros.
- i18n (só PT-BR) e planos pagos.
- Busca na web em tempo de execução: o algoritmo é escolhido uma vez, na pesquisa.
- Landing page pública: visitante sem sessão cai no Login ([Inventário de telas e navegação](issues/02-inventario-de-telas.md)).
- Estudo livre fora do agendamento: só se estudam Cards vencidos, para manter um único caminho de agendamento ([Inventário de telas e navegação](issues/02-inventario-de-telas.md)).
- Modo offline: exige decisões de sincronização, que são de stack ([Inventário de telas e navegação](issues/02-inventario-de-telas.md)).
