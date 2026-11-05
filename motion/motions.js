/* Motions da Central dos Painéis (plano Ultra).
   Cada motion é um "vídeo" feito com a biblioteca Motion (motion.dev): uma linha do tempo
   animate(sequence) com tocar, pausar, recomeçar, barra de progresso clicável e legenda
   sincronizada pelo relógio da linha do tempo. A cena das tabelas vem de
   dados/cena_tabelas.json, gerado por motion/gerar_cenas.py a partir do modelo real do app.
   Com "reduzir movimento" ativo, o motion abre no quadro final e os passos ficam em texto. */
(function () {
  const M = window.Motion;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = window.__IMG__ || {};
  const CENA = window.__CENA__;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ICON_PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const ICON_PAUSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const CURSOR = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 2l16 9.5-7 1.6 4.2 7.4-3 1.6-4.2-7.4L5 19z" fill="#fe5f21" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  /* ---------- player ---------- */
  function player(root, build) {
    const stage = root.querySelector('.mv-stage');
    const bar = root.querySelector('.mv-bar i');
    const btn = root.querySelector('[data-mv="play"]');
    const cap = root.querySelector('.mv-cap');
    let ctl = null, raf = 0, cena = null, state = 'idle';
    const setBtn = (playing) => { btn.setAttribute('aria-label', playing ? 'Pausar' : 'Tocar'); btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; };
    const legenda = (t) => {
      const caps = cena.caps; let txt = caps[0][1];
      for (const [at, s] of caps) if (t >= at) txt = s;
      if (cap.textContent !== txt) cap.textContent = txt;
    };
    function tick() {
      if (!ctl) return;
      const p = Math.min(1, ctl.time / ctl.duration);
      bar.style.transform = `scaleX(${p})`;
      legenda(ctl.time);
      if (p >= 1) { state = 'end'; setBtn(false); return; }
      if (state === 'play') raf = requestAnimationFrame(tick);
    }
    function montar() { stage.innerHTML = ''; cena = build(stage); }
    function start() {
      cancelAnimationFrame(raf);
      if (ctl) ctl.cancel();
      montar();
      ctl = M.animate(cena.steps, { defaultTransition: { ease: [0.22, 1, 0.36, 1] } });
      if (RM) { ctl.time = ctl.duration; ctl.pause(); state = 'end'; tick(); setBtn(false); return; }
      state = 'play'; setBtn(true); tick();
    }
    btn.addEventListener('click', () => {
      if (state === 'idle' || state === 'end') return start();
      if (state === 'play') { ctl.pause(); state = 'pause'; setBtn(false); }
      else { ctl.play(); state = 'play'; setBtn(true); tick(); }
    });
    root.querySelector('[data-mv="replay"]').addEventListener('click', start);
    root.querySelector('.mv-bar').addEventListener('click', (e) => {
      if (!ctl) return;
      const r = e.currentTarget.getBoundingClientRect();
      ctl.time = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * ctl.duration;
      tick();
    });
    new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting && state === 'idle') start();
      else if (!en.isIntersecting && state === 'play') { ctl.pause(); state = 'pause'; setBtn(false); }
    }), { threshold: 0.4 }).observe(root);
    // quadro inicial completo antes de tocar (miniatura, link compartilhado, leitura rápida)
    montar(); cena.final(); cap.textContent = cena.resumo; setBtn(false);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (state !== 'play') { montar(); cena.final(); cap.textContent = cena.resumo; } }, 200); });
  }

  /* clique: ondinha + cursor afundando */
  const clique = (rip, cur, p, at) => [
    [rip, { x: [p.x - 22, p.x - 22], y: [p.y - 22, p.y - 22], scale: [0.2, 2.2], opacity: [0.9, 0] }, { duration: 0.6, at }],
    [cur, { scale: [1, 0.8, 1] }, { duration: 0.25, at }]
  ];

  /* ---------- 1. ERP: marcar "Participa Relat. Gerenc." ---------- */
  function erp(stage) {
    const W = 1830; // largura original das capturas; posições em px dela
    const k = stage.clientWidth / W;
    const P = (x, y) => ({ x: x * k, y: y * k });
    const alts = ['Tela Tipo de Operação de Saída, aba Cadastro, com a lista de tipos de operação', 'Sub-aba Comercial com a caixa Participa Relat. Gerenc. desmarcada', 'Sub-aba Comercial com a caixa Participa Relat. Gerenc. marcada'];
    const shots = ['erp-1', 'erp-2', 'erp-3'].map((n, i) => { const im = el('img', 'mv-shot'); im.src = IMG[n]; im.alt = alts[i]; im.style.opacity = i ? 0 : 1; stage.append(im); return im; });
    const row = el('div', 'mv-row'); Object.assign(row.style, { left: 112 * k + 'px', top: 381 * k + 'px', width: 1594 * k + 'px', height: 18 * k + 'px', opacity: 0 }); stage.append(row);
    const ring = el('div', 'mv-ring'); ring.style.opacity = 0; stage.append(ring);
    const rip = el('div', 'mv-ripple'); rip.style.opacity = 0; stage.append(rip);
    const cur = el('div', 'mv-cursor', CURSOR); cur.style.opacity = 0; stage.append(cur);
    const toast = el('div', 'mv-toast', '<b>Gravado.</b> Em até 30 minutos este tipo de operação passa a valer no filtro <b>Participa Indicadores</b> dos painéis.'); toast.style.opacity = 0; stage.append(toast);
    const p0 = P(900, 290), pRow = P(330, 389), pTab = P(380, 78), pChk = P(296, 407), pOk = P(1420, 115);
    const steps = [
      [cur, { x: [p0.x, p0.x], y: [p0.y, p0.y], opacity: [0, 1] }, { duration: 0.4, at: 0.2 }],
      [cur, { x: pRow.x, y: pRow.y }, { duration: 1.2, at: 0.8 }],
      ...clique(rip, cur, pRow, 2.1),
      [row, { opacity: [0, 1] }, { duration: 0.3, at: 2.15 }],
      [cur, { x: pTab.x, y: pTab.y }, { duration: 1.1, at: 3.6 }],
      ...clique(rip, cur, pTab, 4.8),
      [shots[1], { opacity: [0, 1] }, { duration: 0.35, at: 4.9 }],
      [row, { opacity: 0 }, { duration: 0.2, at: 4.9 }],
      [cur, { x: pChk.x, y: pChk.y }, { duration: 1.2, at: 6.0 }],
      ...clique(rip, cur, pChk, 7.3),
      [shots[2], { opacity: [0, 1] }, { duration: 0.3, at: 7.4 }],
      [ring, { x: [pChk.x - 20, pChk.x - 20], y: [pChk.y - 20, pChk.y - 20], scale: [0.4, 1], opacity: [0, 1] }, { duration: 0.4, at: 7.4 }],
      [cur, { x: pOk.x, y: pOk.y }, { duration: 1.3, at: 8.8 }],
      ...clique(rip, cur, pOk, 10.2),
      [ring, { opacity: 0 }, { duration: 0.3, at: 10.3 }],
      [toast, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, at: 10.4 }],
      [cur, { opacity: 0 }, { duration: 0.4, at: 13.4 }]
    ];
    return {
      steps,
      caps: [[0, '1. Na lista, clique no tipo de operação de saída que deve contar como venda.'], [3.5, '2. Abra a sub-aba Comercial.'], [5.9, '3. Marque a caixa Participa Relat. Gerenc.'], [8.7, '4. Clique em Confirmar.'], [10.4, 'Pronto: o tipo de operação passa a compor faturamento, vendas e metas.']],
      resumo: 'Tipo de operação → Comercial → Participa Relat. Gerenc. → Confirmar',
      final: () => { shots.forEach((s, i) => (s.style.opacity = i === 2 ? 1 : 0)); toast.style.opacity = 1; Object.assign(ring.style, { opacity: 1, transform: `translate(${pChk.x - 20}px, ${pChk.y - 20}px)` }); }
    };
  }

  /* ---------- 2. Tabelas → métricas → filtro → relatório → alerta ---------- */
  function tabelas(stage) {
    const R = 9 / 16; // proporção do palco; SVG em unidades de 100 x 56.25
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 100 ${100 * R}`); svg.setAttribute('class', 'mv-svg'); svg.setAttribute('aria-hidden', 'true');
    stage.append(svg);
    const diag = el('div', 'mv-diag'); stage.append(diag);
    const nos = {};
    CENA.nos.forEach((n) => {
      const pos = el('div', 'mv-pos'); pos.style.left = n.x + '%'; pos.style.top = n.y + '%';
      const box = el('div', 'mv-node ' + (n.papel === 'fato' ? 'is-fato' : ''), `<span class="mv-role">${n.papel === 'fato' ? 'Fato' : 'Dimensão'}</span><b>${n.nome}</b><small>${n.campos.join(' · ')}</small>`);
      pos.append(box); diag.append(pos); nos[n.id] = { n, box };
    });
    const linhas = CENA.arestas.map((a) => {
      const A = nos[a.de].n, B = nos[a.para].n;
      const x1 = A.x, y1 = A.y * R, x2 = B.x, y2 = B.y * R, mx = (x1 + x2) / 2;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
      p.setAttribute('pathLength', '1'); p.setAttribute('class', 'mv-edge');
      p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1';
      svg.append(p);
      const lab = el('div', 'mv-key', a.chave); lab.title = a.chave_completa; lab.style.left = mx + '%'; lab.style.top = ((y1 + y2) / 2 / R) + '%'; lab.style.opacity = 0; diag.append(lab);
      return { p, lab, a };
    });
    const fato = nos.fato;
    const chips = CENA.metricas.map((m, i) => { const c = el('div', 'mv-chip', `<b>${m.nome}</b><span>= ${m.formula}</span>`); c.style.left = '63%'; c.style.top = (68 + i * 8.5) + '%'; c.style.opacity = 0; diag.append(c); return c; });
    const tipo = Object.values(nos).find((o) => o.n.nome === CENA.filtro.tabela).n;
    const filt = el('div', 'mv-filter', `${CENA.filtro.campo} = <b>${CENA.filtro.valor}</b>`); filt.style.left = tipo.x + '%'; filt.style.top = tipo.y + '%'; filt.style.opacity = 0; diag.append(filt);
    const title = el('div', 'mv-title', '<span>Do dado</span> <span>ao relatório</span> <span>ao alerta</span>'); stage.append(title);
    const rep = el('div', 'mv-report', `<div class="mv-rh"><b>Relatório</b> · Faturamento por cliente <em>exemplo</em></div>
      <div class="mv-tr mv-th"><span>Cliente</span><span>Mês</span><span>Faturamento líquido</span></div>
      ${[82, 64, 47, 30].map((w, i) => `<div class="mv-tr"><span>Cliente ${'ABCD'[i]}</span><span>nov/26</span><span><i style="width:${w}%"></i></span></div>`).join('')}
      <div class="mv-rf"><span>Filtros: Mês atual · Participa Indicadores = Participa</span><span class="mv-pub">Publicar</span></div>`); rep.style.opacity = 0; stage.append(rep);
    const alerta = el('div', 'mv-alert', `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg><div><b>Alerta diário · 08:00</b><span>Se o faturamento líquido do dia ficar abaixo da meta, avisar por WhatsApp e e-mail.</span></div>`); alerta.style.opacity = 0; stage.append(alerta);
    const rows = [...rep.querySelectorAll('.mv-tr:not(.mv-th)')];
    const words = [...title.querySelectorAll('span')];
    const dims = Object.values(nos).filter((o) => o.n.papel !== 'fato');

    const steps = [
      ...words.map((w, i) => [w, { opacity: [0, 1], y: [24, 0] }, { duration: 0.5, at: 0.2 + i * 0.35 }]),
      [title, { opacity: 0, scale: 1.06 }, { duration: 0.5, at: 2.4 }],
      [fato.box, { opacity: [0, 1], scale: [0.6, 1] }, { duration: 0.6, at: 2.8 }],
      ...dims.map((o, i) => [o.box, { opacity: [0, 1], scale: [0.7, 1] }, { duration: 0.45, at: 4.6 + i * 0.22 }]),
      ...linhas.map((l, i) => [l.p, { strokeDashoffset: [1, 0] }, { duration: 0.7, at: 5.2 + i * 0.22 }]),
      ...linhas.map((l, i) => [l.lab, { opacity: [0, 1] }, { duration: 0.3, at: 7.4 + i * 0.12 }]),
      ...chips.map((c, i) => [c, { opacity: [0, 1], y: [-30, 0] }, { duration: 0.5, at: 9.8 + i * 0.3 }]),
      [filt, { opacity: [0, 1], scale: [0.6, 1] }, { duration: 0.4, at: 12.6 }],
      [filt, { left: [tipo.x + '%', fato.n.x + '%'], top: [tipo.y + '%', fato.n.y + '%'] }, { duration: 1.2, at: 13.3, ease: 'easeInOut' }],
      [fato.box, { scale: [1, 1.08, 1] }, { duration: 0.5, at: 14.5 }],
      [filt, { opacity: 0 }, { duration: 0.3, at: 15 }],
      [diag, { opacity: 0.12, scale: 0.97 }, { duration: 0.6, at: 16 }],
      [svg, { opacity: 0.12 }, { duration: 0.6, at: 16 }],
      [rep, { opacity: [0, 1], y: [30, 0] }, { duration: 0.6, at: 16.3 }],
      ...rows.map((r, i) => [r, { opacity: [0, 1], x: [-12, 0] }, { duration: 0.35, at: 17 + i * 0.2 }]),
      [rep.querySelector('.mv-pub'), { scale: [1, 1.12, 1] }, { duration: 0.5, at: 18.8 }],
      [alerta, { opacity: [0, 1], x: [40, 0] }, { duration: 0.6, at: 20 }],
      [alerta, { scale: [1, 1.03, 1] }, { duration: 0.5, at: 21 }],
      [alerta, { opacity: 1 }, { duration: 1.8, at: 21.5 }]
    ];
    return {
      steps,
      caps: [[0, 'Todo relatório e todo alerta começam nas tabelas do app.'], [2.8, 'A tabela de fato guarda os números: cada item vendido, com valor e quantidade.'], [4.6, 'As dimensões descrevem o número: quando, quem e o quê. Cada linha é uma ligação (chave → chave).'], [9.8, 'Métricas são cálculos prontos sobre o fato, como Faturamento líquido = Σ valor líquido.'], [12.6, 'Um filtro numa dimensão chega ao fato pela ligação: só entram itens de operações que participam.'], [16.3, 'No relatório, escolha colunas e métricas, aplique os filtros e publique.'], [20, 'O mesmo cálculo vira alerta: condição, horário e canal (plano Ultra).']],
      resumo: 'Tabelas ligadas → métricas → filtros → relatório publicado → alerta',
      final: () => {
        title.style.opacity = 0;
        Object.values(nos).forEach((o) => (o.box.style.opacity = 1));
        linhas.forEach((l) => { l.p.style.strokeDashoffset = 0; l.lab.style.opacity = 1; });
        chips.forEach((c) => (c.style.opacity = 1));
      }
    };
  }

  /* ---------- 3. Lumia: pergunta vaga x pergunta precisa ---------- */
  function lumia(stage) {
    const chat = el('div', 'mv-chat'); stage.append(chat);
    const bolha = (quem, html, tag) => { const b = el('div', `mv-msg ${quem}`, `${tag ? `<span class="mv-tag ${tag[0]}">${tag[1]}</span>` : ''}${html}`); b.style.opacity = 0; chat.append(b); return b; };
    const palavras = (txt) => txt.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
    const q1 = bolha('eu', `<p>${palavras('Como estão as vendas esse mês?')}</p>`, ['bad', 'Vaga']);
    const a1 = bolha('ia', '<p><b>Lumia:</b> “Vendas” pode ser pedido ou nota, bruto ou líquido, com ou sem cancelados. A resposta pode não ser o número que você procura.</p>');
    const q2 = bolha('eu', `<p>${palavras('Qual o valor líquido de pedidos faturados emitidos esse mês?')}</p>`, ['good', 'Precisa']);
    const a2 = bolha('ia', '<p><b>Lumia:</b> Valor líquido dos pedidos com situação Faturado, emitidos de 01/11 até hoje: <span class="mv-val">R$ ●●●.●●●,●●</span></p><p class="mv-src">Fonte: app Vendas · métrica Valor líquido · filtro Pedidos Faturados</p>');
    const anat = el('div', 'mv-anat', ['<b>métrica</b> valor líquido', '<b>objeto</b> pedidos', '<b>condição</b> faturados', '<b>data</b> emissão', '<b>período</b> esse mês'].map((t) => `<span>${t}</span>`).join('')); anat.style.opacity = 0; stage.append(anat);
    const w1 = [...q1.querySelectorAll('.w')], w2 = [...q2.querySelectorAll('.w')];
    const steps = [
      [q1, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3, at: 0.3 }],
      ...w1.map((w, i) => [w, { opacity: [0, 1] }, { duration: 0.12, at: 0.4 + i * 0.12 }]),
      [a1, { opacity: [0, 1], y: [12, 0] }, { duration: 0.4, at: 1.8 }],
      [q1, { opacity: 0.55 }, { duration: 0.4, at: 5 }], [a1, { opacity: 0.55 }, { duration: 0.4, at: 5 }],
      [q2, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3, at: 5.4 }],
      ...w2.map((w, i) => [w, { opacity: [0, 1] }, { duration: 0.12, at: 5.5 + i * 0.12 }]),
      [a2, { opacity: [0, 1], y: [12, 0] }, { duration: 0.4, at: 7.3 }],
      [anat, { opacity: [0, 1], y: [10, 0] }, { duration: 0.5, at: 9.5 }],
      ...[...anat.children].map((c, i) => [c, { scale: [0.8, 1], opacity: [0, 1] }, { duration: 0.3, at: 9.7 + i * 0.25 }]),
      [anat, { opacity: 1 }, { duration: 2.5, at: 11.2 }]
    ];
    return {
      steps,
      caps: [[0, 'Pergunta vaga: a Lumia precisa adivinhar o que é “vendas”.'], [5.4, 'Pergunta precisa: métrica, objeto, situação, data e período.'], [9.5, 'Monte a pergunta com estas cinco peças.']],
      resumo: 'Pergunte com métrica + objeto + condição + data + período',
      final: () => { [q1, a1].forEach((b) => (b.style.opacity = 0.55)); [q2, a2, anat].forEach((b) => (b.style.opacity = 1)); }
    };
  }

  window.__MOTIONS__ = { player, erp, tabelas, lumia };
})();
