# Fundação visual e shell do app

Type: prototype
Status: resolved
Blocked by: 02
Labels: wayfinder:prototype

## Question

Como é o esqueleto visual comum a todas as telas: tokens (cores claro/escuro, tipografia, espaçamento), componentes base e o shell de navegação (header com sino, navegação desktop vs mobile) definido no inventário de telas? Saída: página HTML com o shell e um catálogo dos componentes base.

Shell definido em Inventário de telas e navegação: mobile com header (sino), tab bar `Início · Decks · Progresso · Configurações` e botão flutuante "+ Novo"; desktop com header (links, "+ Novo", sino, avatar com Configurações e Sair). Incluir também:
- O padrão de erro: alerta inline (campo, bloco que falhou ao carregar) e toast (ação que falhou), com "Tentar de novo".
- As telas 404 (dentro do shell logado; sem shell com "Entrar" quando deslogado) e erro genérico (fora do shell).

## Answer

Resolvido em prototype com o usuário (2026-10-20), em três rodadas de variantes.

- Protótipo: `prototype/fundacao-visual.html`. Tem o catálogo, o shell, o 404 logado e deslogado e o erro genérico. Parâmetros: `?tela=`, `?tema=`, `?frame=mobile`.
- Variantes descartadas (fonte primária): branch `prototype/fundacao-visual`, commit `870f972`. Nunca vai para o main.

**Direção**: a estrutura da variante "Papel", com os neutros da "Zinc" e verde como cor de ação.
- Cores: neutros zinc (branco e cinzas; no escuro, quase preto). O verde é a única cor de marca: primária `hsl(152 42% 32%)`, no escuro `hsl(148 40% 55%)`. Sucesso usa o mesmo verde. Erro é vermelho e aviso é âmbar. Tokens no formato shadcn (HSL).
- Tipografia: títulos em Outfit e texto em DM Sans. Sem serifa e sem itálico.
- Forma: cantos de 14px nos blocos, botões em pílula, sombra leve nas superfícies.
- Marca: "Lembra" (nome provisório) em verde no header desktop e nas telas sem login.

**Shell**
- Desktop: marca à esquerda e navegação em pílula centrada (`Início · Decks · Progresso · Configurações`). À direita: "+ Novo" (pílula verde), sino redondo com um ponto verde quando há aviso e avatar (Configurações, Sair).
- Mobile: header com o título da página em fonte grande e o sino. Tab bar com um indicador em pílula verde atrás do ícone ativo. "+ Novo" estendido (pílula com texto) fica acima da tab bar e abre um bottom sheet com "Novo Deck" e "Adicionar Cards a…". No desktop, as mesmas opções abrem como menu.

**Componentes base** (no catálogo)
- Botões: primário, secundário, contorno, fantasma, destrutivo e link; tamanhos pequeno, padrão e grande; estado carregando.
- Formulário: campos com texto de 16px no mobile, checkbox, radio e switch.
- Marcadores: chips de Label e badges de estado (Novo, Vencido hoje, Atrasado, Agendado).
- Estrutura: abas em pílula, card de Deck e linha de Card.
- Sobreposições: diálogo de confirmação, bottom sheet e dropdown.

**Erros e feedback**
- Inline: o erro de campo aparece abaixo do campo. Há alertas em bloco de erro, informação e sucesso. Um bloco que falhou mostra a mensagem e "Tentar de novo" no lugar dele, depois um skeleton enquanto carrega.
- Toast: existe o de falha (com "Tentar de novo") e o de sucesso (ex.: "Card salvo"). Some em 5 s. No mobile fica acima da tab bar; no desktop, no canto inferior direito.
- Estado vazio: ícone, frase e a ação principal.
- 404 logado: dentro do shell, "404" grande em verde e "Ir para o Início". 404 deslogado: sem shell, marca no topo e "Entrar". Erro genérico: fora do shell, com "Tentar de novo" e "Ir para o Início".

As próximas telas partem deste arquivo (tokens, shell e componentes).
