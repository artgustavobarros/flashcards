# Decks, Labels e Comments

Type: prototype
Status: resolved
Blocked by: 03
Assignee: artgustavobarros
Labels: wayfinder:prototype

## Question

Como o usuário organiza os Cards: lista de Decks, detalhe do Deck com seus Cards, criação e gestão de Labels, e a visualização de um Card com seus Comments em lista cronológica?

Estrutura definida em Inventário de telas e navegação:
- Seção Decks com duas abas: "Decks" (lista) e "Cards" (todos os Cards, com busca por texto, filtros por Deck, Label e estado de agendamento, seleção em massa e gestão de Labels).
- Detalhe do Deck reaproveita a lista de Cards, pré-filtrada, com contagens (novos, vencidos hoje, total) e ações "Estudar", "Adicionar Cards" e "⋯" (renomear, apagar).
- Seleção em massa: mover para Deck, adicionar/remover Label, apagar.
- Detalhe do Card: pergunta, resposta, Labels, Deck, próxima revisão, Comments; ações editar, mover, Label, apagar.

Filtro de estado: Novo / Em aprendizado / Maduro (Card State, no `GLOSSARY.md`), mais "Vencido hoje" como filtro à parte. O detalhe do Deck ganha o link "Ver progresso", que abre o Progresso filtrado por aquele Deck. Ver [Métricas do dashboard](08-metricas-do-dashboard.md).

O filtro de Deck do Progresso é um combobox com busca: um botão em pílula que abre a lista com nome, cards, "para hoje" e um ✓ no escolhido. Ele pode servir de padrão para os filtros da aba Cards e para "mover para Deck". Ver [Tela do dashboard](09-dashboard.md) e `prototype/progresso.html`.

Decidir também: como a busca exibe resultados.

## Answer

Resolvido em prototype com o usuário (2026-10-21), escolhendo entre três variantes.

- Protótipo: `prototype/decks.html`. Parâmetros: `?tela=decks|cards|deck`, `?deck=`, `?card=`, `?q=`, `?dados=cheio|vazio`, `?tema=` e `?frame=mobile`. O menu "Ir para…" da barra do protótipo abre cada estado.
- Variantes descartadas (fonte primária): branch `prototype/decks-labels-comments`, commit `a80b402`. Nunca vai para o main. Eram B, três colunas no desktop (filtros, lista e Card), como um cliente de e-mail, e C, uma tabela ordenável com "+ Filtro" e o Card numa gaveta lateral com abas Card e Comments.

**Estrutura: Pilha** (variante A)
- Cada nível é uma página: Decks → Deck → Card. No desktop, o link "← Decks" (ou "← Cards") fica acima do título. No mobile, o header troca o título grande por "voltar" e o nome da página.
- No topo da seção, o título "Decks" e as abas em pílula Decks · Cards.

**Lista de Decks**
- Lista em linhas: ícone, nome, "N cards · N novos", badge "N para hoje" (âmbar) ou "Em dia", seta. A linha inteira abre o Deck.
- "Novo Deck" (contorno) no canto. O mesmo item está no "+ Novo" do shell.
- Sem Decks: estado vazio "Crie seu primeiro Deck" com "Novo Deck".

**Detalhe do Deck**
- Nome grande e "⋯" com "Renomear Deck" e "Apagar Deck".
- Três números lado a lado: para hoje (âmbar), novos e cards.
- Botões "Estudar" (primário, desativado se não houver nada para hoje nem novo), "Adicionar Cards" (contorno) e o link "Ver progresso →", que abre o Progresso filtrado pelo Deck.
- Abaixo, a mesma lista da aba Cards, sem o filtro de Deck.
- Deck vazio: "Este Deck ainda não tem Cards" com "Adicionar Cards".
- Renomear abre um diálogo com o nome. Apagar pede confirmação ("Os N Cards deste Deck também são apagados… Para guardar algum, mova antes para outro Deck."). Depois, um toast com "Desfazer".

**Aba Cards**
- Busca em largura total: "Buscar na pergunta, na resposta e nos Comments".
- Abaixo, os chips de filtro, que quebram linha no mobile: Deck ▾, Label ▾, Estado ▾ (Novo, Em aprendizado, Maduro) e o botão "Vencido hoje", que inclui os atrasados. Cada chip abre um menu com ✓ no escolhido. O chip ativo fica escuro e mostra o valor. "Limpar" aparece quando há filtro.
- Linha de contagem: "N cards", ou "N cards com “termo”" durante a busca.
- Cada Card é uma linha numa lista em bloco: pergunta (até 2 linhas), resposta numa linha em cinza, depois o badge de agendamento (Novo, Vencido hoje, Atrasado), as Labels em chips, o Deck (só na aba Cards) e o ícone de Comments com a contagem. A linha abre o Card.
- Sem nenhum Card: "Nenhum Card ainda" com "Ver Decks". Sem resultado: "Nenhum Card encontrado" com "Limpar busca e filtros".

**Busca**
- Filtra a lista enquanto a pessoa digita. Não há tela de resultados. Ignora acentos e soma com os filtros.
- O termo fica destacado em âmbar claro. Se o termo está na resposta ou num Comment, a segunda linha mostra o trecho com "na resposta:" ou "num Comment:".

**Seleção em massa**
- Desktop: caixa de marcação em cada linha e "selecionar todos" na linha de contagem. Mobile: o botão "Selecionar" mostra as caixas, e tocar na linha passa a marcar.
- Com algo marcado, a linha de contagem vira uma barra escura fixa no topo da lista: "N selecionados", Mover, Label, Apagar e ×.
- Mover abre a lista de Decks com busca. O Deck atual aparece desativado. O texto diz que o agendamento não muda. Toast "N Cards movidos para X" com "Desfazer".
- Label abre a lista de Labels com caixas de 3 estados: marcada, vazia ou com traço quando só alguns dos selecionados têm a Label. Tocar aplica na hora. A busca do diálogo oferece "Criar Label “x”". Fecha com "Pronto".
- Apagar pede confirmação ("Os Comments e o histórico de Ratings desses Cards também somem") e depois mostra toast com "Desfazer".
- Os diálogos são centrados no desktop e viram bottom sheet no mobile.

**Detalhe do Card**
- No topo: o nome do Deck, "Editar" (contorno) e "⋯" com "Mover para Deck", "Labels" e "Apagar Card". "Editar" abre o editor no modo "editar um Card".
- Um bloco com "Pergunta" e "Resposta" em rich text, separadas por uma linha.
- Lista de detalhes: Deck (toque para mover), Labels (chips e "+ Editar"), Estado e Próxima revisão ("Hoje", "Atrasado N dias", "Em N dias, sex 30 out"; para Card novo, "Ainda não estudado…").
- Comments no fim: título com a contagem e lista cronológica, com o mais antigo em cima. Cada Comment mostra o texto, a data e hora, "Editar" e "Apagar". "Editar" troca o texto por um campo na própria lista. "Apagar" age na hora e mostra toast com "Desfazer". Sem Comments, uma frase convida a anotar. O campo "Escreva um Comment…" fica abaixo da lista: Enter salva e Shift+Enter quebra a linha. Toast "Comment salvo.".

**Labels**
- Página própria, aberta por "Gerenciar Labels" no fim do menu do chip Label.
- Texto: "Uma Label marca Cards de qualquer Deck. Apagar a Label não apaga os Cards."
- Campo "Nova Label" com "Criar". Não aceita nome repetido, mesmo com outro acento.
- A lista mostra o nome e "N cards", com os botões renomear (o campo aparece na própria linha) e apagar. Apagar pede confirmação ("Ela sai de N Cards. Os Cards continuam onde estão.") e mostra toast com "Desfazer".
- Labels também nascem no diálogo de Labels do Card e da seleção.
