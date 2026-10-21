# Configurações e Review Time

Type: prototype
Status: resolved
Blocked by: 03
Assignee: artgustavobarros
Labels: wayfinder:prototype

## Question

Como é a tela de configurações: escolha do Review Time, fuso horário, ligar/desligar e-mail e notificações in-app, conta (contas vinculadas como Google, trocar senha) e tema claro/escuro?

Sem toggle de intervalo: os botões de Rating não mostram intervalo (ver Tela da Study Session).

Incluir o campo "Novos por dia" (padrão 20), conforme as Notes do mapa.

Página única rolável com seções Estudo, Notificações, Aparência e Conta; "Sair" no fim de Conta (ver Inventário de telas e navegação).

Na seção Conta, mostrar o estado "E-mail não confirmado" com "Reenviar". Enquanto isso, o toggle de e-mail da Daily Review fica indisponível, com uma explicação. Ver Telas de login e cadastro.

No Início, "Pausar novos" (quando há muitos atrasados) pausa os Cards novos até a revisão ficar em dia. Definir como isso aparece junto de "Novos por dia" e como retomar por aqui. Ver Home, banner da Daily Review e notificações.

## Answer

Resolvido em prototype com o usuário (2026-10-21), escolhendo entre três variantes.

- Protótipo: `prototype/configuracoes.html`. Parâmetros: `?conta=senha|google|ambos`, `?email=pendente`, `?novos=pausados`, `?tema=claro|escuro|sistema` e `?frame=mobile`.
- Variantes descartadas (fonte primária): branch `prototype/configuracoes`, commit `2b25b12`. Nunca vai para o main. Eram B, um formulário com os campos à vista, índice das seções e barra "Alterações não salvas · Descartar · Salvar", e C, frases com os campos dentro do texto ("Me avise da revisão às 19:00…") e uma prévia do aviso de amanhã.

**Estrutura: Lista** (variante A)
- Página única numa coluna estreita, com quatro grupos: Estudo, Notificações, Aparência e Conta. Cada grupo é um bloco de linhas: ícone, nome (com uma linha de ajuda quando precisa), o valor atual em cinza e a seta.
- Tocar numa linha com valor abre um diálogo, centrado no desktop e em bottom sheet no mobile. "Salvar" grava na hora e mostra um toast com "Desfazer" (ex.: "Aviso da revisão às 20:00."). Não há botão "Salvar" geral.

**Estudo**
- Review Time: campo de hora grande e atalhos 07:00, 12:00, 19:00 e 21:00. O sheet mostra o fuso em uso.
- Fuso horário: "Automático" (fuso do aparelho) ligado por padrão. Desligado, a pessoa escolhe numa lista. A linha mostra "Horário de Brasília (automático)".
- Novos por dia: passos de 5, de 0 a 200, e atalhos 10, 20 (padrão), 30 e 50. Texto: "Quantos Cards novos entram na revisão de cada dia. Não vale para “Estudar agora”."
- Pausa dos novos: não há botão de pausar aqui. Para receber menos novos, a pessoa põe "Novos por dia" em 0. Quando a pausa foi ligada no Início, a linha mostra "Pausados" em âmbar e um aviso abaixo do grupo diz "Novos pausados até você pôr a revisão em dia (N atrasados). O limite volta a valer depois.", com "Retomar".

**Notificações**
- "Aviso por e-mail" (switch): "Às 19:00, para <e-mail>". Com o e-mail não confirmado, o switch fica desligado e travado, com "Confirme seu e-mail para ligar. Reenviar link".
- "Aviso no app" (switch): liga ou desliga só o ponto do sino na hora da revisão. A faixa da revisão no Início aparece sempre.

**Aparência**: linha "Tema" com Claro, Escuro e Sistema (segue o aparelho). Padrão: Sistema.

**Conta**
- No topo, o avatar, o nome e o e-mail. Tocar abre "Seu nome" (aparece na saudação). O e-mail não muda por aqui.
- E-mail não confirmado: badge "Não confirmado" e, abaixo, "Enviamos um link para <e-mail>." com "Reenviar". O aviso âmbar do topo continua, como em todas as abas.
- Senha: "Trocar senha" pede a atual e a nova (pelo menos 8 caracteres) e tem o link "Esqueci a senha atual". Conta só com Google mostra "Criar senha", sem pedir a atual.
- Google: "Vincular", ou "Vinculado · <e-mail>" com "Desvincular". Desvincular fica travado se a conta não tem senha ("Crie uma senha antes de desvincular.").
- "Sair" em vermelho é a última linha de Conta e leva ao Login.
- "Apagar conta" é um link discreto abaixo do grupo. O diálogo diz que Decks, Cards, Labels, Comments e o histórico de Ratings somem para sempre e pede o e-mail digitado para confirmar.
