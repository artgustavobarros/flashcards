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
  - Auth: e-mail + senha e login com Google.
  - Cards com pergunta e resposta em rich text.
  - Fluxo de criação: criar vários Cards seguidos num Deck, depois "Estudar agora" abre uma Study Session só com os novos; em seguida eles entram no agendamento normal.
  - Daily Review: intervalos em dias inteiros; um aviso por dia no Review Time escolhido (e-mail + notificação in-app).
  - "Já vi a de hoje": a Daily Review conclui sozinha quando todos os Cards do dia recebem Rating; há também um botão "Marcar como vista" que conclui o dia e silencia as notificações, sem alterar o agendamento. Os Cards pendentes passam para o dia seguinte.
  - Notificações in-app: sino com dropdown no header + banner da Daily Review na home ("Revisão de hoje: N cards · Começar"), que some quando o dia é concluído ou marcado como visto.
  - Decks privados por usuário; Comments são anotações pessoais em lista cronológica por Card.

## Decisions so far

<!-- one line per closed ticket: [title](issues/NN-slug.md): gist -->

## Not yet specified

- Layout do e-mail da Daily Review (o que mostra, CTA, link "marcar como vista" direto do e-mail?).
- Primeiro acesso e estados vazios: onboarding, como escolher o Review Time na primeira vez, home sem Decks.
- Busca e filtros de Cards (por Label, por Deck, por estado de agendamento), conforme o inventário de telas define onde vivem.
- Edição e reagendamento de Cards já estudados (editar conteúdo reinicia o agendamento?).
- Montagem final: ligar todas as telas num protótipo único navegável e revisar consistência.

## Out of scope

- Stack, backend, banco, provedor de e-mail e infra: o destino é o layout.
- Compartilhamento de Decks entre usuários e Comments de terceiros.
- i18n (só PT-BR) e planos pagos.
- Busca na web em tempo de execução: o algoritmo é escolhido uma vez, na pesquisa.
