'use strict';
/* Lookup flow: one address travelling CPU -> L1 -> L2 -> L3 -> RAM and back. Diagram first, labels only. */

const FL = { addr: 0xB5D6, L: [{ n: 'L1', sets: 8, ways: 2 }, { n: 'L2', sets: 16, ways: 2 }, { n: 'L3', sets: 32, ways: 4 }], busy: false, auto: false };
const flPeek = (c, blk) => c.setView(blk % c.sets).findIndex(v => v && v.block === blk);
function flPlan() {
  const blk = FL.addr >> 4; let hit = -1;
  for (let i = 0; i < 3 && hit < 0; i++) if (flPeek(FL.c[i], blk) >= 0) hit = i;
  const p = [{ t: 'addr' }];
  for (let i = 0; i <= (hit < 0 ? 2 : hit); i++) p.push({ t: 'look', lv: i });
  if (hit < 0) p.push({ t: 'ram' });
  if (hit !== 0) p.push({ t: 'fill', from: hit < 0 ? 2 : hit - 1, src: hit });
  p.push({ t: 'deliver' });
  return p;
}
function flNew() { FL.st = FL.L.map(() => ({ ph: 0 })); FL.ram = 0; FL.cpu = 0; FL.pos = 0; FL.just = -1; FL.plan = flPlan(); }
function flInit() {
  FL.c = FL.L.map(l => new Cache(l.sets, l.ways));
  let x = 7; const nxt = () => { x = (x * 73 + 41) % 4096; return x === 0xB5D ? nxt() : x; };
  [12, 26, 100].forEach((n, i) => { for (let k = 0; k < n; k++) FL.c[i].touch(nxt()); });
  flNew();
}
flInit();
function flFly(from, to, txt) {
  if (!to) return Promise.resolve();
  const chip = document.createElement('div'); chip.className = 'fl-token'; chip.textContent = txt; document.body.appendChild(chip);
  const t = to.getBoundingClientRect(), x0 = from.left + from.width / 2, y0 = from.top + from.height / 2, x1 = t.left + t.width / 2, y1 = t.top + t.height / 2;
  const a = chip.animate([{ transform: `translate(${x0}px,${y0}px) translate(-50%,-50%) scale(.5)`, opacity: 0.2 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${x1}px,${y1}px) translate(-50%,-50%) scale(1)`, opacity: 1 }], { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  return Promise.race([a.finished, sleep(950)]).then(() => chip.remove(), () => chip.remove());
}

View('flow', {
  icon: '⇶', title: () => T('Lookup flow', 'Flujo de búsqueda'), mins: 10, done: () => ['flow'],
  desc: () => T('One address, followed through CPU → L1 → L2 → L3 → RAM and back. Each level splits it its own way.', 'Una dirección, seguida por CPU → L1 → L2 → L3 → RAM y vuelta. Cada nivel la divide a su manera.'),
  render(m) {
    m.classList.add('wide'); let alive = true; onLeave(() => { alive = false; FL.busy = false; FL.auto = false; m.classList.remove('wide'); });
    m.innerHTML = `<div class="fl-top"><div><div class="kicker">${T('Diagram', 'Diagrama')}</div><h1>${T('Lookup flow', 'Flujo de búsqueda')}</h1></div>
      <div class="fl-ctl"><label class="mono">0x<input id="fad" class="inp mono" maxlength="4"></label><button class="btn ghost" id="frnd" title="${T('another address', 'otra dirección')}">🎲</button>
      <button class="btn" id="fnx"></button><button class="btn ghost" id="fpl"></button><button class="btn ghost" id="frs">↺ ${T('reset caches', 'reiniciar cachés')}</button></div></div>
      <div id="fchips" class="fl-chips"></div><div class="flow-wrap"><div class="flow" id="flow"></div></div>
      <div class="fl-leg"><span><i class="c-tag">■</i> ${T('tag', 'etiqueta')}</span><span><i class="c-idx">■</i> ${T('index', 'índice')}</span><span><i class="c-off">■</i> ${T('offset', 'desplazamiento')}</span><span><i class="c-acc">■</i> ${T('block number = address − offset', 'n.º de bloque = dirección − desplazamiento')}</span></div>`;
    const host = $('#flow', m), fad = $('#fad', m);
    const lvHTML = i => {
      const l = FL.L[i], c = FL.c[i], s = FL.st[i], ix = lg(l.sets), tg = 12 - ix, blk = FL.addr >> 4, set = blk % l.sets, b = bin(FL.addr, 16);
      const bits = [...b].map((ch, k) => `<span class="fb ${s.ph >= 1 ? (k < tg ? 'tag' : k < tg + ix ? 'idx' : 'off') : 'raw'}">${ch}</span>`).join('');
      let grid = '';
      for (let r = 0; r < l.sets; r++) {
        const v = c.setView(r);
        grid += `<div class="fr ${s.ph >= 2 && r === set ? 'sel' : ''}">${v.map(x => `<i class="${x ? 'occ' : ''} ${x && x.block === blk && (s.res === 'hit' || s.filled) ? 'mine' : ''}"></i>`).join('')}</div>`;
      }
      const sv = c.setView(set);
      const strip = s.ph >= 2 ? sv.map(x => {
        const me = x && x.block === blk;
        return `<div class="fw ${s.ph >= 3 ? (me ? 'eq' : 'ne') : ''} ${me && s.filled ? 'new' : ''} ${me && FL.just === i ? 'anim' : ''}"><b>${x ? bin(Math.floor(x.block / l.sets), tg) : '—'}</b><em>${s.ph >= 3 ? (me ? '=' : '≠') : ''}</em></div>`;
      }).join('') : '';
      const badge = s.filled ? `<em class="bdg st">${T('stored', 'guardado')}</em>` : s.res === 'hit' ? `<em class="bdg hit">${T('HIT', 'ACIERTO')}</em>` : s.res === 'miss' ? `<em class="bdg miss">${T('MISS', 'FALLO')}</em>` : '';
      return `<div class="fl-box fl-lv ${s.ph ? 'on' : ''}" id="lv${i}" style="flex:${[14, 15, 19][i]} 1 ${[140, 150, 190][i]}px">
        <div class="fl-h"><b>${l.n}</b><span>${l.sets} × ${l.ways}</span>${badge}</div>
        <div class="fl-bits">${bits}</div>
        <div class="fl-cnt ${s.ph >= 1 ? '' : 'off'}"><span class="c-tag" style="flex:${tg}">${tg}</span><span class="c-idx" style="flex:${ix}">${ix}</span><span class="c-off" style="flex:4">4</span></div>
        <div class="fl-grid" style="height:${[112, 176, 288][i]}px">${grid}</div>
        <div class="fl-sl">${s.ph >= 2 ? `${T('set', 'conj.')} ${set}` : '&nbsp;'}</div>
        <div class="fl-strip">${strip}</div><div class="fl-line" id="ln${i}"></div></div>`;
    };
    const arr = (k, go, back) => `<div class="fl-arr ${go ? 'go' : ''} ${back ? 'back' : ''}"><b>→</b><i>←</i></div>`;
    const draw = () => {
      const blk = FL.addr >> 4, off = FL.addr & 15, b = bin(FL.addr, 16), st = FL.st;
      host.innerHTML = `
        <div class="fl-box fl-cpu ${FL.pos > 0 ? 'on' : ''}" style="flex:10 1 100px"><div class="fl-h"><b>CPU</b></div>
          <div class="fl-addr">${hex(FL.addr, 4)}</div><div class="fl-sl">${T('address', 'dirección')}</div>
          <div class="fl-byte ${FL.cpu ? 'got' : ''}" id="flbyte">${FL.cpu ? `byte ${off} ✓` : '?'}</div><div class="fl-sl">${T('data', 'dato')}</div></div>
        ${arr(0, st[0].ph, FL.cpu)}${lvHTML(0)}${arr(1, st[1].ph, st[0].filled)}${lvHTML(1)}${arr(2, st[2].ph, st[1].filled)}${lvHTML(2)}${arr(3, FL.ram, st[2].filled && FL.ram)}
        <div class="fl-box fl-ram ${FL.ram ? 'on' : ''}" style="flex:19 1 190px"><div class="fl-h"><b>RAM</b><span>${T('4096 blocks · no sets, no tags', '4096 bloques · sin conjuntos ni etiquetas')}</span></div>
          <div class="fl-bits">${[...b].map((ch, k) => `<span class="fb ${FL.ram ? (k < 12 ? 'blk' : 'cut') : 'raw'}">${ch}</span>`).join('')}</div>
          <div class="fl-cnt ${FL.ram ? '' : 'off'}"><span class="c-acc" style="flex:12">${T('block', 'bloque')} ${hex(blk, 3)} = ${blk}</span><span class="mute" style="flex:4">✂</span></div>
          <div class="ramgrid">${FL.ram >= 2 ? `<i id="ramcell" style="left:${(blk % 64) / 64 * 100}%;top:${Math.floor(blk / 64) / 64 * 100}%"></i><u style="left:${(blk % 64) / 64 * 100}%;top:${Math.floor(blk / 64) / 64 * 100}%">${blk}</u>` : ''}</div>
          <div class="fl-sl">${FL.ram >= 2 ? T(`block ${blk}: 16 bytes, read directly`, `bloque ${blk}: 16 bytes, lectura directa`) : '&nbsp;'}</div></div>
        <div class="fl-pg"><b>⇄</b><span>${T('paging: the OS swaps pages of the running program’s memory', 'paginación: el SO intercambia páginas de la memoria del programa en ejecución')}</span></div>
        <div class="fl-box fl-disk" style="flex:6 1 56px"><div class="fl-h"><b>${T('Disk', 'Disco')}</b></div><div class="cyl"></div></div>`;
      FL.L.forEach((l, i) => {
        if (st[i].ph < 2) return;
        const box = $('#lv' + i, m), R = box.getBoundingClientRect(), ib = $$('.fb.idx', box), row = $('.fr.sel', box);
        if (!ib.length || !row) return;
        const a = ib[0].getBoundingClientRect(), z = ib[ib.length - 1].getBoundingClientRect(), r = row.getBoundingClientRect(), ln = $('#ln' + i, m);
        ln.style.cssText = `left:${(a.left + z.right) / 2 - R.left - 1}px;top:${a.bottom - R.top}px;height:${Math.max(0, r.top - a.bottom)}px;opacity:1`;
      });
      const lab = p => (p.t === 'addr' ? T('address', 'dirección') : p.t === 'look' ? FL.L[p.lv].n : p.t === 'ram' ? 'RAM' : p.t === 'fill' ? T('fill caches', 'rellenar cachés') : T('byte → CPU', 'byte → CPU'));
      $('#fchips', m).innerHTML = FL.plan.map((p, k) => `<span class="${k < FL.pos ? 'd' : k === FL.pos ? 'c' : ''}">${k + 1} · ${lab(p)}</span>`).join('<i>›</i>');
      const end = FL.pos >= FL.plan.length;
      $('#fnx', m).innerHTML = end ? `↻ ${T('Same address again', 'La misma dirección otra vez')}` : `▶ ${T('Next', 'Siguiente')}: ${lab(FL.plan[FL.pos])}`;
      $('#fpl', m).innerHTML = FL.auto ? `⏸ ${T('Pause', 'Pausa')}` : `⏵⏵ ${T('Play all', 'Reproducir todo')}`;
      if (document.activeElement !== fad) fad.value = FL.addr.toString(16).toUpperCase().padStart(4, '0');
    };
    const step = async () => {
      if (FL.busy) return; FL.busy = true;
      if (FL.pos >= FL.plan.length) flNew();
      const p = FL.plan[FL.pos], blk = FL.addr >> 4, wait = async ms => { await sleep(ms); return alive; };
      FL.just = -1;
      if (p.t === 'addr') { FL.pos = 1; draw(); sfx.pop(); FL.pos = 0; if (!await wait(450)) return; }
      else if (p.t === 'look') {
        const s = FL.st[p.lv];
        s.ph = 1; draw(); sfx.tick(); if (!await wait(750)) return;
        s.ph = 2; draw(); sfx.pop(); if (!await wait(850)) return;
        const hit = flPeek(FL.c[p.lv], blk) >= 0; s.ph = 3; s.res = hit ? 'hit' : 'miss'; if (hit) FL.c[p.lv].touch(blk);
        draw(); hit ? sfx.hit() : sfx.miss(); if (!await wait(650)) return;
      } else if (p.t === 'ram') {
        FL.ram = 1; draw(); sfx.tick(); if (!await wait(850)) return;
        FL.ram = 2; draw(); sfx.hit(); if (!await wait(650)) return;
      } else if (p.t === 'fill') {
        let sel = p.src < 0 ? '#ramcell' : `#lv${p.src} .fw.eq`;
        for (let lv = p.from; lv >= 0; lv--) {
          const src = $(sel, m), from = src ? src.getBoundingClientRect() : host.getBoundingClientRect();
          FL.c[lv].touch(blk); FL.st[lv].filled = true; if (FL.st[lv].ph < 3) FL.st[lv].ph = 3; FL.just = lv; draw();
          await flFly(from, $(`#lv${lv} .fw.new`, m), `${T('block', 'bloque')} ${hex(blk, 3)}`); if (!alive) return;
          sfx.ok(); sel = `#lv${lv} .fw.new`; if (!await wait(350)) return;
        }
      } else {
        const src = $('#lv0 .fw.new', m) || $('#lv0 .fw.eq', m), from = src.getBoundingClientRect();
        FL.cpu = 1; draw(); await flFly(from, $('#flbyte', m), `byte ${FL.addr & 15}`); if (!alive) return;
        sfx.win(); markDone('flow');
      }
      FL.pos++; FL.busy = false; draw();
    };
    const play = async () => {
      if (FL.auto) { FL.auto = false; draw(); return; }
      FL.auto = true; if (FL.pos >= FL.plan.length) flNew(); draw();
      while (FL.auto && alive && FL.pos < FL.plan.length) { await step(); if (!await sleep(250).then(() => alive)) return; }
      FL.auto = false; if (alive) draw();
    };
    const setAddr = a => { if (FL.busy) return; FL.auto = false; FL.addr = a; flNew(); draw(); };
    $('#fnx', m).onclick = () => { FL.auto = false; step(); };
    $('#fpl', m).onclick = play;
    $('#frs', m).onclick = () => { if (FL.busy) return; FL.auto = false; flInit(); sfx.evict(); draw(); };
    $('#frnd', m).onclick = () => {
      const pool = []; FL.c.forEach((c, i) => { if (i) for (let s = 0; s < c.sets; s++) c.setView(s).forEach(v => v && pool.push(v.block)); });
      const blk = Math.random() < 0.45 && pool.length ? pick(pool) : rnd(4096);
      sfx.tick(); setAddr(blk * 16 + rnd(16));
    };
    fad.oninput = () => { if (/^[0-9a-fA-F]{4}$/.test(fad.value)) setAddr(parseInt(fad.value, 16)); };
    const rz = () => { if (!FL.busy) draw(); };
    window.addEventListener('resize', rz); onLeave(() => window.removeEventListener('resize', rz));
    draw();
  }
});
