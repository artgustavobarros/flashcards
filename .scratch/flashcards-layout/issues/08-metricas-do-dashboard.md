# Métricas do dashboard

Type: grilling
Status: resolved
Blocked by: 01
Assignee: artgustavobarros
Labels: wayfinder:grilling

## Question

Quais métricas e visualizações o dashboard mostra (ex.: sequência de dias, Cards por estado, retenção, previsão de Daily Reviews nos próximos dias, desempenho por Deck/Label) e com quais filtros? Usar o que o algoritmo escolhido produz.

## Answer

Grilling com o usuário em 2026-10-20. Os dados vêm da pesquisa do ticket [Algoritmo de revisão espaçada e escala de Rating](01-algoritmo-de-revisao.md), Q6.

**Métricas do Progresso** (painel enxuto, para motivar e planejar):

1. **Sequência** (Streak) e **calendário de atividade** no estilo GitHub. A Sequência conta as Daily Reviews concluídas. Dias sem Cards vencidos e dias marcados como vistos não quebram nem somam.
2. **Previsão**: Cards que vencem em cada um dos próximos 7 dias, em barras. Não depende do filtro de Período.
3. **Acertos**: % de Ratings diferentes de Errei no período, ao lado da meta de 90%. A meta é fixa e não aparece em Configurações.
4. **Cards por estado**: Novo / Em aprendizado (intervalo < 21 dias) / Maduro (≥ 21 dias), com contagem e barra.
5. **Por Deck**: lista com vencidos hoje, total e % de acertos de cada Deck. Essa lista é a comparação entre Decks. Tocar num Deck aplica o filtro de Deck.
6. **Evolução**: barras empilhadas com o nº de revisões, divididas em acertos (Difícil, Bom e Fácil) e erros (Errei).
   - Por cima, uma linha com a % de acertos e a meta de 90% tracejada.
   - Uma "vez" é uma revisão (um Rating), não uma Study Session.
   - Ao lado, "estudado em N dias".
   - Compara o mesmo Deck, ou todos, ao longo do tempo.
   - Cada barra cobre um dia em 7 e 30 dias, uma semana em 90 dias e um mês em Tudo.

**Filtros**, no topo e valendo para a tela toda:
- Deck: Todos ou um.
- Período: 7, 30 ou 90 dias, ou Tudo. Afeta Acertos, calendário e Evolução.
- Não há filtro por Label nem comparação entre períodos.

**Fora do Progresso**: histogramas de stability, difficulty e intervalo; conhecimento estimado; carga diária média; distribuição dos 4 Ratings; tempo de estudo.

**Efeitos em outros tickets**:
- Card State (Novo / Em aprendizado / Maduro) é também o filtro "estado de agendamento" da aba Cards. "Vencido hoje" é um filtro à parte, porque cruza os três estados.
- O detalhe do Deck ganha o link "Ver progresso", que abre o Progresso filtrado por aquele Deck.
- Os termos Card State e Streak entraram no `GLOSSARY.md`.
