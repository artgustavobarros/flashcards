# Nome do app

Type: grilling
Status: resolved
Assignee: artgustavobarros
Blocked by: —
Labels: wayfinder:grilling

## Question

Qual é o nome do app? "Lembra" é provisório e aparece no header de todas as telas, nas telas sem login (`prototype/auth.html`) e vai aparecer como remetente e no topo dos e-mails ([E-mails da Daily Review, confirmação e senha](15-emails.md)). O nome traz um logotipo ou ícone além do texto em Outfit verde da [Fundação visual e shell do app](03-fundacao-visual.md)?

## Answer

Resolvido em grilling com o usuário (2026-10-21).

- **Nome: Daruma.** Substitui "Lembra" em todo lugar: header, telas sem login, e-mails e `<title>` das páginas.
- **Por que não "Lembra"**: já existem dois apps de flashcards com esse nome, um deles open source, PT-BR, PWA e com repetição espaçada ([DottoLeao/lembra](https://github.com/DottoLeao/lembra)), o outro na App Store ([Flashcards com IA - Lembra](https://apps.apple.com/id/app/flashcards-com-ia-lembra/id6756965659)).
- **Por que Daruma**: o boneco Daruma (Bodhidharma) representa persistência. O lema "cai 7 vezes, levanta 8" ecoa o Card com Errei que volta no fim da sessão. Nenhum app de flashcards ou estudo encontrado com o nome. Risco aceito: a Daruma Tecnologia (impressoras fiscais, desde 1971) é marca brasileira conhecida, de outro ramo; para portfólio, pesa pouco.
- **Candidatos descartados na pesquisa**: Penseira, Decoreba, Mnemosyne e Muninn já existem como apps de flashcards; Mímir e Palantír são nomes muito disputados. Revelio, Cuca, Dantalion, Ouroboros e Prometeu estavam livres, mas não foram escolhidos.
- **Ícone**: o boneco Daruma aparece ao lado do wordmark em todo lugar onde o nome aparece (header, Login, topo dos e-mails). Aparece sozinho onde o texto não cabe: favicon, ícone de atalho no celular e avatar do remetente.
- **Forma e cor**: silhueta simples de uma cor só, no verde de ação da [Fundação visual e shell do app](03-fundacao-visual.md), como o wordmark. Tem corpo arredondado, área do rosto recortada e um olho pintado (a imagem clássica de "meta em andamento"). O ícone é estático: o segundo olho não aparece quando o dia é concluído, porque a faixa da revisão já mostra isso. Não se usa o vermelho tradicional, que se confundiria com o coral dos erros.
- **Remetente**: "Daruma <aviso@daruma.app>". O endereço é ilustrativo e o domínio não foi verificado (é infra, fora do escopo).
- **O que fica para a [Montagem final do protótipo navegável](17-montagem-final.md)**: desenhar o SVG do ícone, trocar as 27 ocorrências de "Lembra" nos protótipos, adicionar o favicon a todas as páginas e tirar os avisos de "nome provisório". O assunto "Você lembra?" do e-mail da Daily Review continua igual.
