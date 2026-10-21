/*
  PROTÓTIPO DESCARTÁVEL — ticket "Montagem final do protótipo navegável".
  Peças comuns a todas as páginas do protótipo:
  - daruma(cls): o ícone (silhueta verde, rosto recortado, um olho pintado) para pôr ao lado do wordmark;
  - favicon com o mesmo ícone;
  - tema e aviso "Confirme seu e-mail" que seguem de uma página para outra (sessionStorage, só nesta aba);
  - barra "Protótipo" recolhida num botão no canto, com link para o mapa (index.html).
  Carregar no <head>, antes do script da página: ele ajusta a URL antes de a página lê-la.
*/
(() => {
  const P = new URLSearchParams(location.search);
  const pagina = location.pathname.split('/').pop() || 'index.html';
  const embed = P.get('embed') === '1';
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch {} },
    getL(k) { try { return localStorage.getItem(k); } catch { return null; } },
    setL(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- ícone ---------- */
  // viewBox 32: corpo arredondado, rosto recortado (evenodd), olho esquerdo do boneco (à direita de quem olha) pintado
  const CORPO = 'M16 2.5C8.6 2.5 3.5 8.6 3.5 16.6c0 7.4 5.2 12.9 12.5 12.9s12.5-5.5 12.5-12.9C28.5 8.6 23.4 2.5 16 2.5Z'
    + 'M16 7.6c5 0 8.6 2.6 8.6 6.4 0 3.9-3.8 6.6-8.6 6.6s-8.6-2.7-8.6-6.6c0-3.8 3.6-6.4 8.6-6.4Z';
  const svg = (fill) => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="${fill}">`
    + `<path fill-rule="evenodd" d="${CORPO}"/>`
    + `<circle cx="19.9" cy="13.4" r="2.5"/>`
    + `<circle cx="12.1" cy="13.4" r="1.9" fill="none" stroke="${fill}" stroke-width="1.2"/>`
    + `<path d="M12.3 16.9c.8 1.5 2.7 1.7 3.7.6 1 1.1 2.9.9 3.7-.6" fill="none" stroke="${fill}" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  window.daruma = (cls = 'h-[1.15em] w-[1.15em]') =>
    svg('currentColor').replace('<svg ', `<svg class="${cls} shrink-0" aria-hidden="true" `);

  // favicon: verde de ação do tema claro (hsl 152 42% 32%) e do escuro (hsl 148 40% 55%)
  const fav = svg('#2f7552').replace('</svg>', '<style>@media (prefers-color-scheme: dark){*{fill:#5fbf8a;stroke:#5fbf8a}[fill=none]{fill:none}}</style></svg>');
  const link = document.createElement('link');
  link.rel = 'icon'; link.type = 'image/svg+xml';
  link.href = 'data:image/svg+xml,' + encodeURIComponent(fav);
  document.head.appendChild(link);

  /* ---------- estado que segue entre páginas ---------- */
  // tema: claro|escuro guardado a cada mudança de URL; "sistema" não se guarda (cada página segue o sistema)
  // novos: pausados no Início ("Pausar novos") ou em Configurações; ?novos=ativos desfaz
  // conta: "Confirme seu e-mail" (?email=pendente liga, ?email=ok desliga). Em e-mails e no Login, ?email é outra coisa.
  const usaConta = !['emails.html', 'auth.html', 'index.html'].includes(pagina);
  const lembrar = (search) => {
    const p = new URLSearchParams(search);
    const t = p.get('tema');
    if (t === 'claro' || t === 'escuro') store.set('daruma:tema', t);
    if (t === 'sistema') store.set('daruma:tema', null);
    if (usaConta && p.get('email') === 'pendente') store.set('daruma:email', 'pendente');
    if (usaConta && p.get('email') === 'ok') store.set('daruma:email', null);
    if (p.get('novos') === 'pausados') store.set('daruma:novos', 'pausados');
    if (p.get('novos') === 'ativos') store.set('daruma:novos', null);
  };
  lembrar(location.search);
  const faltam = new URLSearchParams(location.search);
  let mudou = false;
  if (!faltam.get('tema') && store.get('daruma:tema')) { faltam.set('tema', store.get('daruma:tema')); mudou = true; }
  if (usaConta && !faltam.get('email') && store.get('daruma:email')) { faltam.set('email', 'pendente'); mudou = true; }
  if (usaConta && !faltam.get('novos') && store.get('daruma:novos')) { faltam.set('novos', 'pausados'); mudou = true; }
  if (mudou) history.replaceState(null, '', '?' + faltam);
  const replace = history.replaceState.bind(history);
  history.replaceState = (s, t, url) => { if (url) lembrar(String(url).split('?')[1] || ''); return replace(s, t, url); };

  // ir(url): leva junto o tema atual e o modo moldura (embed)
  window.ir = (url) => {
    const [base, q = ''] = url.split('?');
    const p = new URLSearchParams(q), agora = new URLSearchParams(location.search);
    if (!p.get('tema') && agora.get('tema')) p.set('tema', agora.get('tema'));
    if (agora.get('embed') === '1') p.set('embed', '1');
    location.href = base + (String(p) ? '?' + p : '');
  };

  // qualquer elemento com data-ir="<página>" navega (roda antes do handler da página)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-ir]');
    if (el) { e.preventDefault(); ir(el.dataset.ir); }
  });

  /* ---------- header das abas: "+ Novo" e sino (mesmos de home.html) ---------- */
  // ic: a função de ícones da página (precisa de layers, plus, bell, ok)
  const novoItens = (ic) => {
    const item = (icon, t, d, url) => `
    <button data-ir="${url}" class="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent">
      <span class="mt-0.5 text-muted-foreground">${ic(icon, 'h-4 w-4')}</span>
      <span><span class="block text-sm font-medium">${t}</span><span class="block text-xs text-muted-foreground">${d}</span></span>
    </button>`;
    return item('layers', 'Novo Deck', 'Comece uma coleção nova', 'editor-de-card.html?tela=novo-deck')
      + item('plus', 'Adicionar Cards a…', 'Escolha um Deck existente', 'editor-de-card.html?tela=lote');
  };
  window.cabecalho = {
    novoItens,
    novoMenu: (ic, aberto) => !aberto ? '' :
      `<div class="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-pop">${novoItens(ic)}</div>`,
    novoSheet: (ic, aberto) => !aberto ? '' : `
    <div class="fixed inset-0 z-50 md:hidden">
      <div class="absolute inset-0 bg-black/40" data-act="close"></div>
      <div data-keep class="absolute inset-x-0 bottom-0 rounded-t-xl bg-popover p-3 pb-8 text-popover-foreground shadow-pop">
        <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted"></div>
        <p class="px-3 pb-2 font-display text-lg font-semibold">Criar</p>
        ${novoItens(ic)}
      </div>
    </div>`,
    // sino fora do Início: a revisão de hoje pendente (17 cards), como no estado padrão de home.html
    sinoMenu: (ic, aberto, vazio = false) => !aberto ? '' : `
    <div class="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border bg-popover text-popover-foreground shadow-pop">
      <div class="border-b px-4 py-3 text-sm font-medium">Notificações</div>
      ${vazio ? `
      <div class="flex gap-3 p-5 text-muted-foreground">
        <span class="mt-0.5">${ic('bell', 'h-4 w-4')}</span>
        <div><p class="text-sm font-medium text-foreground">Nada por aqui ainda</p>
        <p class="text-xs">O aviso da revisão de hoje aparece aqui às 19:00, quando houver Cards.</p></div>
      </div>` : `
      <div class="space-y-1 p-2">
        <div class="flex gap-3 rounded-md bg-accent/70 p-3">
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">Revisão de hoje: 17 cards</p>
            <p class="text-xs text-muted-foreground">12 revisões · 5 novos · 4 atrasados · às 19:00</p>
            <div class="mt-3 flex gap-2">
              <button data-ir="study-session.html?origem=revisao" class="inline-flex h-8 items-center justify-center gap-2 rounded-btn bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">Começar</button>
              <button data-ir="home.html?dia=vista&vista=1" class="inline-flex h-8 items-center justify-center gap-2 rounded-btn px-3 text-xs font-medium hover:bg-accent">Marcar como vista</button>
            </div>
          </div>
        </div>
        <div class="flex gap-3 p-3 text-muted-foreground">
          <span class="mt-0.5">${ic('ok', 'h-4 w-4')}</span>
          <div><p class="text-sm">Ontem: revisão concluída</p><p class="text-xs">20 de out.</p></div>
        </div>
      </div>`}
    </div>`,
  };

  /* ---------- barra "Protótipo" recolhível ---------- */
  if (embed || pagina === 'index.html') return;
  const css = document.createElement('style');
  css.textContent = `
    html.barra-fechada #switcher > * { display: none !important; }
    /* mobile: acima das barras de ação de baixo (tab bar, "Mostrar resposta", Ratings, "Escrever a resposta") */
    #barra-botao { position: fixed; left: 8px; bottom: 9.5rem; z-index: 101; display: none; align-items: center; gap: 6px;
      height: 28px; padding: 0 10px 0 6px; border-radius: 999px; background: #171717; color: #fff; font: 500 12px system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,.25); outline: 1px solid rgba(255,255,255,.2); opacity: .6; }
    #barra-botao:hover { opacity: 1; }
    html.barra-fechada #barra-botao { display: inline-flex; }
    @media (min-width: 768px) { #barra-botao { bottom: 16px; left: 16px; } }
    .barra-extra { display: inline-flex; align-items: center; gap: 2px; margin-left: 2px; padding-left: 4px; border-left: 1px solid rgba(255,255,255,.15); }
    .barra-extra a, .barra-extra button { display: grid; place-items: center; height: 32px; padding: 0 10px; border-radius: 999px; color: #fff; font: 500 13px system-ui, sans-serif; }
    .barra-extra a:hover, .barra-extra button:hover { background: rgba(255,255,255,.15); }`;
  document.head.appendChild(css);

  const fechada = () => store.getL('daruma:barra') !== 'aberta';
  const aplicar = () => document.documentElement.classList.toggle('barra-fechada', fechada());
  aplicar();

  document.addEventListener('DOMContentLoaded', () => {
    const sw = document.getElementById('switcher');
    if (!sw) return;
    const botao = document.createElement('button');
    botao.id = 'barra-botao'; botao.type = 'button'; botao.title = 'Abrir a barra do protótipo';
    botao.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>Protótipo';
    botao.addEventListener('click', () => { store.setL('daruma:barra', 'aberta'); aplicar(); });
    document.body.appendChild(botao);

    // a página redesenha a barra a cada render: repõe "Mapa" e "Recolher" no fim dela
    const repor = () => {
      const bar = sw.firstElementChild;
      if (!bar || bar.querySelector('.barra-extra')) return;
      const extra = document.createElement('span');
      extra.className = 'barra-extra';
      extra.setAttribute('data-keep', '');
      extra.innerHTML = '<a href="index.html" title="Todas as telas do protótipo">Mapa</a><button type="button" data-recolher title="Recolher a barra">Recolher</button>';
      extra.querySelector('[data-recolher]').addEventListener('click', (e) => { e.stopPropagation(); store.setL('daruma:barra', 'fechada'); aplicar(); });
      bar.appendChild(extra);
    };
    repor();
    new MutationObserver(repor).observe(sw, { childList: true });
  });
})();
