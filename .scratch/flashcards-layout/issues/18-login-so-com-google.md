# Login só com Google

Type: grilling
Status: resolved
Blocked by: —
Assignee: artgustavobarros
Labels: wayfinder:grilling

## Question

Ao transformar o protótipo no app real, vale manter e-mail + senha ou entrar só com a conta Google? O que sai do layout?

## Answer

Resolvido com o usuário (2026-10-21), no grilling de stack e infra. Revê [Telas de login e cadastro](04-telas-de-auth.md), a parte de Conta de [Configurações e Review Time](11-configuracoes.md) e dois dos três [E-mails](15-emails.md).

**A única forma de entrar é a conta Google.** Na primeira vez, a conta no Daruma é criada na hora, com nome e e-mail vindos do Google. Ainda existe uma conta (os Decks são de alguém), mas a pessoa nunca a cria à mão.

- **Login** (`prototype/auth.html`): uma tela, "Entre no Daruma", com "Continuar com Google" e o texto dos Termos. Estados: `?tela=primeira-vez` (cai no Início vazio), `google-erro` ("Tente de novo em alguns instantes.") e `sessao-expirada` (volta à página anterior).
- **Saíram**: o passo do e-mail, a senha, o cadastro com nome, "Esqueci a senha" e as telas do link; o aviso âmbar "Confirme seu e-mail" em todas as abas; os e-mails de confirmação e de redefinição de senha.
- **Configurações → Conta**: avatar, nome (editável) e e-mail; a linha "Google · Você entra com <e-mail>", só informativa; "Sair"; "Apagar conta". Saíram trocar/criar senha, vincular/desvincular o Google e o badge "Não confirmado". O "Aviso por e-mail" nunca fica travado.
- **Termos e privacidade** (`prototype/privacidade.html`): página pública só, em texto simples, com `#termos` e `#privacidade`. É linkada do texto dos Termos no Login e do rodapé de Configurações ("Termos e privacidade · Apagar conta"). Diz o que se guarda, para quê, os três serviços (Google, Resend, Hostinger), o cookie de sessão, que backups somem em até 3 semanas e o contato para a LGPD. Também serve de URL da política na tela de consentimento do Google.
- **E-mail**: sobra só o da Daily Review. Remetente real: `Daruma <aviso@daruma.artbarros.tech>`.
- **Contato**: `contato@artbarros.tech`, sem caixa própria. O ImprovMX (grátis) encaminha para o Gmail do dono. O plano da Hostinger não inclui e-mail, e o "Reach" de lá é e-mail marketing, não caixa. O aviso pode levar `Reply-To` para esse endereço.

**Por quê**: o Daruma é de uso pessoal e de portfólio. Sem senha, somem a confirmação de e-mail, o reset, a enumeração de contas do fluxo "e-mail primeiro" e duas telas de e-mail. O custo é que quem não tem conta Google não entra, e perder o Google é perder o acesso.

**Reavaliado no mesmo dia**: como o Resend entra de qualquer jeito, voltaram à mesa e-mail + senha e "Google + link mágico" (sem senha). Os dois foram descartados. O envio era só um dos custos: as telas, a segurança da senha e o vínculo de contas continuavam. O link mágico só ajuda quem não tem Google, e isso não é objetivo do app.

**Para o app real**: testes e2e e dev local entram por um login de dev que só existe fora de produção. Dá para voltar atrás: e-mail + senha é um provider a mais no Better Auth, mais as telas antigas (histórico do git, commit `586ceec`).
