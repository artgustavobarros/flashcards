# Algoritmo de revisão espaçada e escala de Rating

Type: research
Status: resolved
Blocked by: —
Labels: wayfinder:research

## Question

Qual algoritmo de repetição espaçada o app deve usar (SM-2, FSRS ou outro) e o que ele implica para o layout? Responder com fontes primárias:

1. Quantos níveis de Rating a escala tem e como se chamam (ex.: Errei / Difícil / Bom / Fácil)?
2. Intervalos iniciais típicos por Rating para um Card novo (ex.: 10 Cards novos estudados hoje: quando cada um volta?). Não é porcentagem fixa: confirmar que cada Card ganha a própria data.
3. Um Card com "Errei" reaparece na mesma Study Session (learning steps) ou só num dia futuro? Dado que os intervalos são em dias inteiros, como tratar steps menores que um dia?
4. É prática comum mostrar o próximo intervalo em cada botão de Rating (ex.: "Bom · 3d")?
5. Como tratar Cards atrasados (o usuário não revisou ontem)?
6. Quais dados o algoritmo produz que servem de métrica no dashboard (retenção, estabilidade, previsão de carga)?

## Answer

Achados completos: branch `research/algoritmo-de-revisao` (commit `cd00599`), arquivo `.scratch/flashcards-layout/research/algoritmo-de-revisao.md`. Fontes citadas lá.

**Algoritmo**: FSRS-6 (pesos padrão, retenção desejada 90%, fuzz ligado), sem learning steps em minutos; toda data agendada é ≥ amanhã. Supera o SM-2 no srs-benchmark (log loss 0,346 vs 0,722); estável em ts-fsrs 5.x / py-fsrs 6.x. FSRS-7 descartado: ainda beta e desenhado para intervalos fracionários.

1. **Rating**: 4 níveis, Errei / Difícil / Bom / Fácil (1–4). Bom é o botão primário. Difícil conta como acerto.
2. **Sem porcentagem**: cada Card ganha a própria data. 1º Rating: Errei +1d, Difícil +1d, Bom +2d, Fácil +8d (6–10 com fuzz). Ex.: 10 novos com 6 Bom, 2 Errei, 1 Difícil, 1 Fácil: 3 voltam em D+1, 6 em D+2, 1 em D+8.
3. **Errei na sessão**: agenda para amanhã; na UI o Card volta ao fim da Study Session atual até receber outro Rating. Esse Rating entra no log como revisão do mesmo dia e não muda a data. "Dia" = data local do usuário.
4. **Intervalo no botão**: sim ("Bom · 2 dias"), como o Anki, com toggle em Configurações. O valor exibido é o que será gravado. **Revisto** em [Tela da Study Session](06-study-session.md): o usuário preferiu não mostrar intervalo nos botões, e o toggle sai.
5. **Atrasados**: continuam devidos; a Daily Review traz tudo com vencimento ≤ hoje, ordenado por menor retrievability. Banner mostra "N atrasados"; com backlog grande, aviso sugerindo pausar Cards novos.
6. **Dados para o dashboard**: por Card, stability, difficulty, retrievability, estado e vencimento; mais o log completo de Ratings. Daí saem previsão de Daily Reviews, carga diária, retenção real vs. meta de 90%, conhecimento estimado, Cards por estado, histogramas, sequência de dias e tempo de estudo.
