# Editor de Card e fluxo "Estudar agora"

Type: prototype
Status: resolved
Blocked by: 03
Labels: wayfinder:prototype

## Question

Como é a criação de vários Cards seguidos num Deck, com pergunta e resposta em rich text, terminando no botão "Estudar agora"? Decidir quais recursos de rich text entram (negrito, listas, código, imagem, fórmula), como atribuir Labels durante a criação, e como o usuário vê os Cards já criados nesse lote.

O editor é uma página inteira, sem tab bar no mobile, com dois modos: "lote" (termina em "Estudar agora") e "editar um Card" (abre do detalhe do Card e volta a ele ao salvar). Entradas: "+ Novo" → "Adicionar Cards a…" (escolher Deck) ou "Novo Deck", e "Adicionar Cards" no detalhe do Deck (ver Inventário de telas e navegação).

## Answer

Resolvido em prototype com o usuário (2026-10-20), escolhendo entre três variantes.

- Protótipo: `prototype/editor-de-card.html`. Parâmetros: `?tela=lote|lote-andamento|novo-deck|editar`, `?tema=` e `?frame=mobile`.
- Variantes descartadas (fonte primária): branch `prototype/editor-de-card`, commit `b9b5fc6`. Nunca vai para o main. Eram A, um formulário com "Salvar e criar outro" e a lista do lote numa coluna, e C, uma lista contínua tipo planilha, salva ao sair da linha, com Labels do lote.

**Estrutura: Card em foco** (variante B)
- O editor tem a forma do Card. Um controle "Pergunta | Resposta" no topo troca o lado. Um ponto mostra se cada lado já tem texto.
- O fluxo de um Card: escrever a pergunta, depois "Escrever a resposta", depois "Salvar e próximo". Ctrl/Cmd + Enter faz a mesma ação: no lado da pergunta, vira o Card; no lado da resposta, salva.
- No lado da resposta, a pergunta aparece numa faixa acima do campo, para dar contexto.
- A barra de formatação fica embaixo do Card. No mobile a ação principal fica numa barra fixa embaixo, ao alcance do polegar. No desktop ela fica logo abaixo do Card.
- Header do editor: "X" para fechar, título ("Adicionar Cards" com "em <Deck>", "Novo Deck" ou "Editar Card") e "Estudar agora · N" à direita.

**Cards já criados no lote**
- Ficam numa faixa de pílulas numeradas acima do Card (`1 2 3` mais "+ Card 4", que é o Card atual).
- Tocar numa pílula abre aquele Card para editar. "Salvar alterações" volta ao Card novo, com o rascunho que estava lá.

**Rich text**: negrito, itálico, lista com marcadores, lista numerada, código na linha, bloco de código, imagem (pelo botão, colando ou arrastando) e fórmula (LaTeX). Todos entram.

**Labels**
- Ficam como chips abaixo do Card. "Adicionar Label" abre uma folha (bottom sheet no mobile, diálogo no desktop) com busca, seleção múltipla e "Criar “<nome>”".
- As Labels sempre passam para o próximo Card do lote ("continuam no próximo Card"). Para tirar uma, usa-se o "x" do chip.

**Validação, saída e "Estudar agora"**
- Salvar sem pergunta ou sem resposta: o editor vai para o lado que falta e mostra "Escreva a pergunta." ou "Escreva a resposta.".
- "Estudar agora" salva o Card em edição se ele estiver completo. Se estiver incompleto, um diálogo pergunta "Estudar sem o Card incompleto?". Sem nenhum Card salvo, um toast avisa "Salve pelo menos um Card para estudar.".
- A sessão traz só os Cards do lote, na ordem em que foram criados. Os que não forem estudados entram nas próximas Daily Reviews, conforme o limite "Novos por dia".
- O "X" com texto não salvo abre "Sair sem salvar este Card?". Os Cards já salvos ficam no Deck, e a saída leva ao detalhe do Deck.
- Novo Deck: o nome do Deck é um campo de título no topo do editor e é obrigatório ao salvar o primeiro Card ("Dê um nome ao Deck."). Pressuposto, sem objeção do usuário: o Deck só passa a existir quando o primeiro Card é salvo.

**Modo "editar um Card"**: o mesmo Card em foco, sem a faixa do lote e sem "Estudar agora". "Salvar" volta ao detalhe do Card com o toast "Card salvo.". Sair com alterações abre "Descartar as alterações?".
