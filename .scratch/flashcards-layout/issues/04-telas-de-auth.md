# Telas de login e cadastro

Type: prototype
Status: resolved
Blocked by: 03
Labels: wayfinder:prototype

## Question

Como ficam login, cadastro e "esqueci a senha", com e-mail + senha e o botão do Google? Decidir: login e cadastro na mesma tela ou separados; campos do cadastro; estados de erro; o que acontece após o primeiro cadastro.

Sem landing page: visitante sem sessão em `/` cai no Login. Incluir o estado "Sua sessão expirou, entre de novo", que após o login retorna à página anterior (ver Inventário de telas e navegação).

## Answer

Resolvido em prototype com o usuário (2026-10-20), escolhendo entre três variantes.

- Protótipo: `prototype/auth.html`. Parâmetros: `?tela=` (estado inicial), `?tema=` e `?frame=mobile`. Contas de teste estão no comentário do topo.
- Variantes descartadas (fonte primária): branch `prototype/telas-de-auth`, commit `b864a40`. Nunca vai para o main. Eram A, um cartão com Entrar e Criar conta em páginas separadas, e C, um painel verde com abas.

**Estrutura: e-mail primeiro, numa tela só** (variante B)
- Passo 1, "Entre ou crie sua conta": "Continuar com Google", depois "ou", depois o campo E-mail e o botão "Continuar". Não há telas separadas de login e cadastro.
- O e-mail decide o próximo passo. O e-mail fica num chip com "Trocar" no topo dos passos seguintes.
  - Se a conta existe: "Digite sua senha", com o link "Esqueci a senha".
  - Se é conta do Google: "Esta conta usa o Google", só com o botão do Google.
  - Se não há conta: "Criar sua conta", com Nome e Senha (pelo menos 8 caracteres) e o texto dos Termos.
- Layout sem cartão: marca no canto, coluna de até 448px, título grande. No desktop a coluna fica centrada na vertical.

**Cadastro**
- Pede o nome, sem confirmação de senha (há o botão de mostrar a senha).
- Depois do cadastro, a pessoa entra direto no Início, com "Boas-vindas, <nome>". O primeiro acesso é outro ticket.
- A confirmação de e-mail não trava a entrada. Ela aparece como um aviso âmbar, abaixo do header, até a pessoa confirmar: "Confirme seu e-mail para receber o aviso da revisão de hoje", com "Reenviar". Esse é o padrão em apps de consumo: travar a entrada faz mais gente desistir, e travar é comum só onde o e-mail é crítico.
- Enquanto o e-mail não for confirmado, o e-mail da Daily Review não é enviado. A notificação in-app funciona normalmente.
- Quem se cadastra pelo Google entra já confirmado e não vê o aviso.

**Erros e estados**
- Senha errada: alerta em bloco "Não foi possível entrar · E-mail ou senha incorretos." A mensagem é genérica e não revela se o e-mail tem conta. O campo de senha é limpo.
- Google falhou: alerta "Não foi possível entrar com o Google · Tente de novo ou use e-mail e senha." Se a pessoa fechar o popup, nada aparece.
- Campos: os erros aparecem abaixo de cada campo ("Informe seu e-mail.", "Informe um e-mail válido.", "Informe seu nome.", "Use pelo menos 8 caracteres.").
- Sessão expirada: abre direto no passo da senha, com o e-mail preenchido e o alerta "Sua sessão expirou. Entre de novo para voltar a "<página>"". Depois do login, volta para a página anterior.

**Esqueci a senha**
- O fluxo é "Redefinir senha" (e-mail), depois "Confira seu e-mail" e depois "Crie uma senha nova".
- "Confira seu e-mail" não revela se a conta existe e tem "Reenviar link", com espera de 60 s.
- Ao salvar a senha nova, a pessoa volta ao passo da senha com o alerta de sucesso "Senha alterada. Entre com a senha nova."
- Link expirado: "Este link expirou". O link vale por 1 hora e só uma vez. Há o botão "Pedir outro link".
- O fluxo funciona mesmo sem o e-mail confirmado, porque o link prova que a pessoa é dona do e-mail.
