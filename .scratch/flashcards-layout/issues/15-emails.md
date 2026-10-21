# E-mails da Daily Review, confirmação e senha

Type: prototype
Status: resolved
Blocked by: —
Assignee: artgustavobarros
Labels: wayfinder:prototype

## Question

Como são os três e-mails que o app envia?

- **Daily Review**: sai uma vez por dia no Review Time, e só para e-mail confirmado ([Telas de login e cadastro](04-telas-de-auth.md)). O que mostra (quantos Cards, por Deck, atrasados, Sequência?), qual é o CTA e para onde leva (a Study Session de `prototype/study-session.html?origem=revisao`?). Tem link "Marcar como vista" direto do e-mail, com o mesmo efeito do botão da faixa do Início ([Home, banner da Daily Review e notificações](07-home-e-notificacoes.md))? Como a pessoa desliga o aviso (link para Configurações → Notificações, [Configurações e Review Time](11-configuracoes.md)).
- **Confirmação de conta**: enviado no cadastro e pelo "Reenviar" do aviso âmbar. O que diz e para onde o link leva.
- **Redefinição de senha**: enviado pelo "Esqueci a senha" de `prototype/auth.html`. O que diz, quanto tempo o link vale e para que tela leva.

O provedor e o envio são de stack (fora do escopo). Aqui decide-se só o conteúdo e o layout, em modo claro e escuro do cliente de e-mail.

## Answer

Resolvido em prototype com o usuário (2026-10-21), escolhendo entre três variantes.

- Protótipo: `prototype/emails.html`. Parâmetros: `?email=revisao|atrasados|imagem|confirmacao|senha`, `?tema=` (modo do cliente de e-mail) e `?frame=mobile`. A caixa de entrada e o cabeçalho da mensagem são um cliente falso, fora do design: servem só para ver o assunto e o preheader.
- Variantes descartadas (fonte primária): branch `prototype/emails`, commit `fee2b3b`. Nunca vai para o main. Eram A, "Bilhete" também na Daily Review (texto corrido, com estimativa de tempo "uns 9 minutos"), e B, "Resumo" (faixa verde com a marca, número grande, contagens, lista por Deck e Sequência, "Começar" e "Marcar como vista" lado a lado). C também tinha versões próprias de confirmação e senha.

**Daily Review: "Pergunta"** (variante C), igual com e sem muitos atrasados
- Assunto: "Você lembra? <pergunta do primeiro Card>". Preheader: "O primeiro dos N cards da revisão de hoje."
- Corpo centrado: a marca, "Oi, <nome>. Você lembra?", e um cartão com o nome do Deck, a pergunta do primeiro Card da Study Session da revisão e o botão "Ver a resposta". O botão abre a Study Session da Daily Review (`study-session.html?origem=revisao`).
- Abaixo: "É o primeiro dos N cards de hoje" (com muitos atrasados: ", N deles atrasados") e "Hoje não dá? Marcar como vista". O link tem o mesmo efeito do botão da faixa do Início ([Home, banner da Daily Review e notificações](07-home-e-notificacoes.md)) e leva ao Início com o dia visto.
- O e-mail não tem contagens por Deck, Sequência nem estimativa de tempo.
- Pergunta com imagem ou fórmula: o e-mail mostra só o texto da pergunta e a linha "Este Card tem uma imagem. Abra para ver." (`?email=imagem`).
- Rodapé: "Você recebe este aviso todo dia às <Review Time>, quando há Cards para revisar e a revisão ainda não foi feita." Os links "Mudar horário" e "Desligar o aviso por e-mail" levam a Configurações ([Configurações e Review Time](11-configuracoes.md)).

**Confirmação de conta e redefinição de senha: "Bilhete"** (variante A)
- Texto corrido alinhado à esquerda, a marca no topo, um botão primário e um rodapé cinza: "Você recebe este e-mail porque ele está ligado a uma conta do Lembra."
- Confirmação: assunto "Confirme seu e-mail", preheader "Falta um passo para receber o aviso da revisão de cada dia." O texto diz que, depois de confirmar, o aviso chega às <Review Time>. O botão "Confirmar e-mail" leva ao Início, já sem o aviso âmbar. Há o endereço para copiar e "Se você não criou uma conta no Lembra, ignore este e-mail."
- Senha: assunto "Redefinir sua senha", preheader "O link vale por 1 hora e só funciona uma vez." O botão "Criar senha nova" leva ao passo "Crie uma senha nova" de `auth.html` ([Telas de login e cadastro](04-telas-de-auth.md)). Há o endereço para copiar e "Se não foi você, ignore este e-mail. Sua senha continua a mesma."

**Comum aos três**: coluna de até 560px, remetente "Lembra <aviso@lembra.app>", tokens da fundação visual, modo claro e escuro do cliente. Os links abrem as telas do app.
