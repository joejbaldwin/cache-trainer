'use strict';
/* Lesson 6: loop problems — the exam format. Step a real two-level cache through real code. */

const PM = {
  e22: { n: () => T('Exam 2022 · L1 4 ways', 'Examen 2022 · L1 4 vías'), d: () => T('Four 8 MB arrays. a, b, c collide in one set — but 4 ways hold all three.', 'Cuatro arrays de 8 MB. a, b, c colisionan en un conjunto — pero 4 vías los alojan a los tres.') },
  e22w2: { n: () => T('Same code · L1 2 ways', 'Mismo código · L1 2 vías'), d: () => T('The E4_3 twist from your notes: fewer ways than arrays. Watch a, b, c evict each other; L2 saves the day.', 'El giro de E4_3 de tus apuntes: menos vías que arrays. Mira cómo a, b, c se expulsan; L2 salva la situación.') },
  j26: { n: () => T('Exam Jan 2026 · structs', 'Examen ene 2026 · structs'), d: () => T('Array of 32-byte structs, 64 KiB: too big for L1 (32 KiB), fits in L2 (1 MiB).', 'Array de structs de 32 bytes, 64 KiB: no cabe en L1 (32 KiB), sí en L2 (1 MiB).') },
  j26f: { n: () => T('Jan 2026 · loops fused', 'Ene 2026 · bucles fusionados'), d: () => T('The fix: one loop touches every field while the line is still in L1.', 'La solución: un bucle toca todos los campos mientras la línea sigue en L1.') },
  par: { n: () => T('Parallel arrays · 2 ways', 'Arrays paralelos · 2 vías'), d: () => T('Illustration (sizes are mine, idea from L4_4 slide 6): key/val/delta as three arrays in a 2-way L1.', 'Ilustración (tamaños míos, idea de L4_4 transp. 6): key/val/delta como tres arrays en una L1 de 2 vías.') },
  aos: { n: () => T('Merged struct · 2 ways', 'Estructura fusionada · 2 vías'), d: () => T('Same data after array merging (fusión de arrays): one line brings key, val and delta.', 'Los mismos datos tras la fusión de arrays: una línea trae key, val y delta.') }
};
const TR = { pid: 'e22', predict: true };
function trReset() {
  const p = PROGS.find(x => x.id === TR.pid);
  Object.assign(TR, { p, l1: new Cache(p.L1.sets, p.L1.ways), l2: new Cache(p.L2.sets, p.L2.ways), loop: 0, i: 0, k: 0, rows: [], cnt: p.loops.map(() => ({ acc: 0, m1: 0, m2: 0 })), ok: 0, n: 0, pend: null, done: false, res: null, play: false });
}
trReset();
function trAddr(p, lp, i, k) { const a = lp.acc[k], A = progLayout(p)[a[0]]; return A.base + i * A.elem + a[1]; }
function trExec(silent) {
  const p = TR.p, lp = p.loops[TR.loop], a = lp.acc[TR.k], addr = trAddr(p, lp, TR.i, TR.k), blk = Math.floor(addr / p.line), c = TR.cnt[TR.loop];
  c.acc++;
  const h1 = TR.l1.touch(blk), set1 = TR.l1.lastSet, way1 = TR.l1.lastWay, ev = TR.l1.lastEvicted;
  let h2 = null, way2 = -1;
  if (!h1) { c.m1++; h2 = TR.l2.touch(blk); way2 = TR.l2.lastWay; if (!h2) c.m2++; }
  let row = null;
  if (!silent) { row = { label: `${a[0]}[${TR.i}]${a[3] || ''}`, rw: a[2], addr, blk, set1, way1, h1, h2, ev, set2: blk % p.L2.sets, way2, loop: TR.loop, i: TR.i, first: TR.k === 0 }; TR.rows.push(row); }
  TR.k++;
  if (TR.k >= lp.acc.length) { TR.k = 0; TR.i++; if (TR.i >= lp.n) { TR.i = 0; TR.loop++; if (TR.loop >= p.loops.length) TR.done = true; } }
  return row;
}
function trSkip(mode) {
  const p = TR.p, L = TR.loop, lp = p.loops[L], epl = Math.max(1, Math.floor(p.line / progLayout(p)[lp.acc[0][0]].elem));
  do { trExec(true); } while (!TR.done && !(mode === 'line' ? TR.k === 0 && TR.i % epl === 0 : TR.loop !== L));
  TR.rows.push({ skip: true, loop: TR.loop, i: TR.i, done: TR.done });
}
const frac = (a, b) => { if (!b) return '—'; if (a === b) return '1 (100 %)'; if (!a) return '0'; const g = (x, y) => (y ? g(y, x % y) : x), d = g(a, b); return `${a / d}/${b / d}`; };

function loopsQs() {
  return [
    { type: 'num', q: T('64-byte lines, array of <code>double</code> walked in order. One miss every how many elements?', 'Líneas de 64 bytes, array de <code>double</code> recorrido en orden. ¿Un fallo cada cuántos elementos?'), a: 8, why: '64 / 8 = 8' },
    { type: 'mc', q: T('Arrays a, b, c are each 2<sup>23</sup> bytes and consecutive. L1 has 2<sup>7</sup> sets of 64 B lines. Do a[i], b[i], c[i] fall in the same set?', 'Los arrays a, b, c ocupan 2<sup>23</sup> bytes cada uno y son consecutivos. L1 tiene 2<sup>7</sup> conjuntos con líneas de 64 B. ¿Caen a[i], b[i], c[i] en el mismo conjunto?'), opts: [T('Yes — they are 2²³ apart, a multiple of 2¹³ (sets × line), so index bits are equal', 'Sí — distan 2²³, múltiplo de 2¹³ (conjuntos × línea), así que los bits de índice coinciden'), T('No — different arrays always use different sets', 'No — arrays distintos usan siempre conjuntos distintos'), T('Only when i = 0', 'Solo cuando i = 0')], a: 0, why: T('Adding a multiple of 2¹³ changes only the tag bits. Same index, different tag = they compete.', 'Sumar un múltiplo de 2¹³ solo cambia bits de etiqueta. Mismo índice, distinta etiqueta = compiten.') },
    { type: 'num', q: T('<code>c[i] += a[i] * b[i]</code> — 4 accesses per iteration, doubles, 64 B lines, 4-way L1. L1 miss rate? (fraction)', '<code>c[i] += a[i] * b[i]</code> — 4 accesos por iteración, doubles, líneas de 64 B, L1 de 4 vías. ¿Tasa de fallos de L1? (fracción)'), a: 3 / 32, rate: true, show: '3/32', hint: T('Per line: 8 iterations × 4 accesses; one miss per array.', 'Por línea: 8 iteraciones × 4 accesos; un fallo por array.'), why: T('3 new lines (a, b, c) every 32 accesses.', '3 líneas nuevas (a, b, c) cada 32 accesos.') },
    { type: 'num', q: T('Same loop, but L1 has only 2 ways (LRU). L1 miss rate?', 'El mismo bucle, pero L1 solo tiene 2 vías (LRU). ¿Tasa de fallos de L1?'), a: 0.75, rate: true, show: '3/4', hint: T('Order a, b, c, c. Who is in the set when each arrives?', 'Orden a, b, c, c. ¿Quién está en el conjunto cuando llega cada uno?'), why: T('a, b and the first c always miss; only the write to c hits.', 'a, b y el primer c fallan siempre; solo acierta la escritura en c.') },
    { type: 'mc', q: T('In that 2-way case L2 (4 ways) holds all three lines. What does L2 do with the L1 misses?', 'En ese caso de 2 vías, L2 (4 vías) aloja las tres líneas. ¿Qué hace L2 con los fallos de L1?'), opts: [T('Misses them all', 'Los falla todos'), T('Hits them, except the first touch of each line', 'Los acierta, salvo el primer acceso a cada línea'), T('L2 is not consulted', 'No se consulta L2')], a: 1, why: T('“Todos los fallos de L1 no son de L2.” 24 L1 misses per line-group, only 3 reach memory → L2 local = 1/8.', '«Todos los fallos de L1 no son de L2.» 24 fallos de L1 por grupo de líneas, solo 3 llegan a memoria → L2 local = 1/8.') },
    { type: 'mc', q: T('L2 local miss rate = 100 %. What does that tell you?', 'Tasa de fallos local de L2 = 100 %. ¿Qué te dice?'), opts: [T('L2 is broken', 'L2 está rota'), T('Every L1 miss is for a line L2 does not have either (first touch, or long evicted)', 'Cada fallo de L1 es de una línea que L2 tampoco tiene (primer acceso, o expulsada hace mucho)'), T('L1 never misses', 'L1 nunca falla')], a: 1 },
    { type: 'mc', q: T('A 64 KiB array is walked twice. L1 = 32 KiB, L2 = 1 MiB. Second walk:', 'Un array de 64 KiB se recorre dos veces. L1 = 32 KiB, L2 = 1 MiB. Segundo recorrido:'), opts: [T('L1 hits everything', 'L1 lo acierta todo'), T('L1 misses once per line again; L2 hits them all', 'L1 vuelve a fallar una vez por línea; L2 los acierta todos'), T('Both miss everything', 'Ambas lo fallan todo')], a: 1, why: T('Does it fit? Not in L1 (capacity misses), yes in L2.', '¿Cabe? En L1 no (fallos de capacidad), en L2 sí.') },
    { type: 'num', q: T('Struct of 4 doubles, 64 B lines. A loop reads only <code>v[i].r</code>. L1 miss rate?', 'Struct de 4 doubles, líneas de 64 B. Un bucle lee solo <code>v[i].r</code>. ¿Tasa de fallos de L1?'), a: 0.5, rate: true, show: '1/2', why: T('32 B per struct → 2 per line → every second access misses.', '32 B por struct → 2 por línea → falla un acceso de cada dos.') },
    { type: 'num', q: T('Whole program: 8192 accesses, 2048 L1 misses, 1024 L2 misses. Global miss rate?', 'Programa completo: 8192 accesos, 2048 fallos de L1, 1024 de L2. ¿Tasa de fallos global?'), a: 0.125, rate: true, show: '1/8', why: '1024 / 8192 = (2048/8192) · (1024/2048) = 1/4 · 1/2' },
    { type: 'mc', q: T('Fusing the two Jan-2026 loops halves the L1 miss rate (1/4 → 1/8). Why is the global rate still 1/8?', 'Fusionar los dos bucles de ene-2026 reduce a la mitad la tasa de L1 (1/4 → 1/8). ¿Por qué la global sigue en 1/8?'), opts: [T('Each line must still come from memory exactly once — those compulsory misses do not go away', 'Cada línea debe seguir viniendo de memoria exactamente una vez — esos fallos forzosos no desaparecen'), T('L2 got smaller', 'L2 se hizo más pequeña'), T('It is a coincidence', 'Es casualidad')], a: 0, why: T('L1 improves, so L2 local goes to 100 %: all remaining L1 misses are first touches.', 'L1 mejora, y la local de L2 pasa al 100 %: todos los fallos restantes de L1 son primeros accesos.') }
  ];
}

View('loops', {
  icon: '⑥', title: () => T('Loop problems', 'Problemas de bucles'), mins: 40, done: () => ['loops'],
  desc: () => T('The exam format: code + cache → miss rates. A recipe, and a tracer that runs the real exam programs access by access.', 'El formato del examen: código + caché → tasas de fallos. Una receta y un trazador que ejecuta los programas reales de examen acceso a acceso.'),
  render(m, arg) {
    if (arg === 'tracer') setTimeout(() => { const t = $('.tracer', m); if (t) (t.previousElementSibling || t).scrollIntoView({ block: 'start' }); }, 0);
    const R = [
      [T('Convert everything to powers of two', 'Pasa todo a potencias de dos'), T('Cache sizes, line, element size (double = 2³), array length. Array bytes = elements × size.', 'Tamaños de caché, línea, tamaño de elemento (double = 2³), longitud del array. Bytes del array = elementos × tamaño.')],
      [T('Sets, index, offset for each level', 'Conjuntos, índice y desplazamiento de cada nivel'), T('sets = size / (ways × line). “Always calculate tag / index / offset” — even if the tag stays as “address bits − …”.', 'conjuntos = tamaño / (vías × línea). «Siempre calcula etiqueta / índice / desplazamiento» — aunque la etiqueta quede como «bits de dirección − …».')],
      [T('Elements per line', 'Elementos por línea'), T('line / element size. Sequential walk → 1 miss then (n−1) hits per line.', 'línea / tamaño de elemento. Recorrido secuencial → 1 fallo y (n−1) aciertos por línea.')],
      [T('Who competes for a set?', '¿Quién compite por un conjunto?'), T('Arrays whose size is a multiple of (sets × line) put a[i], b[i], c[i]… in the same set. Count the lines alive in one iteration and compare with the ways.', 'Arrays cuyo tamaño es múltiplo de (conjuntos × línea) ponen a[i], b[i], c[i]… en el mismo conjunto. Cuenta las líneas vivas en una iteración y compara con las vías.')],
      [T('Arrays ≤ ways → clean. Arrays > ways → trace LRU', 'Arrays ≤ vías → limpio. Arrays > vías → traza LRU'), T('Clean: one miss per array per line. Otherwise write the F/A table for one iteration by hand — it repeats.', 'Limpio: un fallo por array y línea. Si no, escribe a mano la tabla F/A de una iteración — se repite.')],
      [T('Count accesses per iteration', 'Cuenta los accesos por iteración'), T('<code>c[i] += a[i]*b[i]</code> = read a, read b, read c, write c → 4.', '<code>c[i] += a[i]*b[i]</code> = leer a, leer b, leer c, escribir c → 4.')],
      [T('Does data survive to the next loop?', '¿Sobreviven los datos al siguiente bucle?'), T('Compare array size with each cache’s capacity. Fits → hits. Does not fit → the start was evicted, it misses again.', 'Compara el tamaño del array con la capacidad de cada caché. Cabe → aciertos. No cabe → el principio fue expulsado y vuelve a fallar.')],
      [T('Rates', 'Tasas'), T('m(L1) = L1 misses / accesses. m(L2) local = L2 misses / L1 misses. Global = product = L2 misses / accesses.', 'm(L1) = fallos L1 / accesos. m(L2) local = fallos L2 / fallos L1. Global = producto = fallos L2 / accesos.')]
    ];
    m.innerHTML = head(T('Lesson 6', 'Lección 6'), T('Loop problems', 'Problemas de bucles'),
      T('This is what the exam asks: here is a cache, here is a loop, give me the miss rates. Eight steps solve every one of them.', 'Esto es lo que pide el examen: una caché, un bucle, dame las tasas de fallos. Ocho pasos los resuelven todos.')) + `
    <div class="card"><h3>${T('The recipe', 'La receta')}</h3><ol class="recipe">${R.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('')}</ol></div>
    <h2>${T('Tracer — fill in the professor’s F/A table yourself', 'Trazador — rellena tú la tabla F/A del profesor')}</h2>
    <div class="card tracer">
      <div class="presets">${PROGS.map(p => `<button class="chipb ${TR.pid === p.id ? 'on' : ''}" data-p="${p.id}">${PM[p.id].n()}</button>`).join('')}</div>
      <p class="mute" id="pd"></p>
      <div id="trs"></div>
    </div>
    <h2>${T('Checkpoint', 'Punto de control')}</h2><div id="q"></div>${nextLink('exercises')}`;

    const host = $('#trs', m);
    let timer = null;
    const stop = () => { if (timer) clearInterval(timer); timer = null; TR.play = false; };
    onLeave(stop);
    const setHTML = (c, s, hl, hit) => {
      const v = c.setView(s), full = v.every(x => x), old = full && c.ways > 1 ? v.reduce((a, x, i) => (x.stamp < v[a].stamp ? i : a), 0) : -1;
      return `<div class="tset" style="--w:${Math.min(c.ways, 8)}">${v.map((x, w) => `<div class="lcell ${x ? 'v' : ''} ${w === hl ? (hit ? 'fh' : 'fm') : ''}">${x ? `<b>${lineLabel(TR.p, x.block)}</b>${w === old ? '<em>LRU</em>' : ''}` : '<small>—</small>'}</div>`).join('')}</div>`;
    };
    const draw = (flash) => {
      const p = TR.p, last = TR.rows.length ? TR.rows[TR.rows.length - 1] : null, lr = last && !last.skip ? last : null;
      $('#pd', m).textContent = PM[p.id].d();
      const s1 = p.L1.sets * p.L1.ways * p.line, s2 = p.L2.sets * p.L2.ways * p.line;
      const ix = lg(p.L1.sets), of = lg(p.line), tg = 32 - ix - of;
      /* who competes in the upcoming (or last) iteration */
      const L = TR.done ? p.loops.length - 1 : TR.loop, I = TR.done ? p.loops[L].n - 1 : TR.i, lp = p.loops[L];
      const seen = new Map();
      lp.acc.forEach((a, k) => { const ad = trAddr(p, lp, I, k), b = Math.floor(ad / p.line); if (!seen.has(b)) seen.set(b, { set: b % p.L1.sets, lab: lineLabel(p, b), ad }); });
      const bySet = {}; seen.forEach(v => (bySet[v.set] = (bySet[v.set] || 0) + 1));
      const mx = Math.max(...Object.values(bySet)), fit = mx <= p.L1.ways;
      const tot = TR.cnt.reduce((a, c) => ({ acc: a.acc + c.acc, m1: a.m1 + c.m1, m2: a.m2 + c.m2 }), { acc: 0, m1: 0, m2: 0 });
      const rows = TR.rows.slice(-12);
      host.innerHTML = `
      <div class="tr-top">
        <div class="tr-code"><pre class="code">${p.decl}\n\n${p.loops.map((l, k) => `<span class="${!TR.done && k === TR.loop ? 'curl' : ''}">for (i = 0; i &lt; ${l.n === N20 ? 'max' : l.n}; i++)\n    ${l.code}</span>`).join('\n')}</pre>
          <div class="cfg"><span><b>L1</b> ${p.L1.sets} ${T('sets', 'conj.')} × ${p.L1.ways} ${T('ways', 'vías')} × ${p.line} B = ${fmtB(s1)}</span><span><b>L2</b> ${p.L2.sets} × ${p.L2.ways} × ${p.line} B = ${fmtB(s2)}</span><span>LRU · ${T('base', 'base')} 0x10000000</span></div>
        </div>
        <div class="tr-who"><div class="lbl">${T('Who competes at', 'Quién compite en')} i = ${I}</div>
          ${[...seen.values()].map(v => `<div class="who"><b>${v.lab}</b><span class="mono">${hex(v.ad, 8)}</span><span class="c-idx">${T('set', 'conj.')} ${v.set}</span></div>`).join('')}
          <div class="verdict ${fit ? 'ok' : 'no'}">${mx} ${T(mx === 1 ? 'line' : 'lines', mx === 1 ? 'línea' : 'líneas')} ${T('in one L1 set', 'en un conjunto de L1')} ${fit ? '≤' : '&gt;'} ${p.L1.ways} ${T('ways', 'vías')} → ${fit ? T('they all fit', 'caben todas') : T('they evict each other', 'se expulsan entre sí')}</div>
          <div id="trbb"></div>
        </div>
      </div>
      <div class="tr-mid">
        <div class="tr-tbl"><table class="tbl fa"><tr><th>${T('access', 'acceso')}</th><th>${T('address', 'dirección')}</th><th>L1</th><th>L2</th></tr>
          ${rows.map((r, k) => r.skip ? `<tr class="skip"><td colspan="4">⋯ ${r.done ? T('ran to the end', 'ejecutado hasta el final') : T(`fast-forward to loop ${r.loop + 1}, i = ${r.i}`, `avance rápido al bucle ${r.loop + 1}, i = ${r.i}`)} ⋯</td></tr>`
            : `<tr class="${r.first ? 'it' : ''} ${flash && k === rows.length - 1 ? 'new' : ''}"><td><b>${r.label}</b> <small>${r.rw}</small></td><td class="mono">${hex(r.addr, 8)}</td><td class="${r.h1 ? 'A' : 'F'}">${r.h1 ? 'A' : 'F'}${r.ev >= 0 ? `<small> ↯ ${lineLabel(p, r.ev)}</small>` : ''}</td><td class="${r.h1 ? '' : r === TR.pend ? 'Q' : r.h2 ? 'A' : 'F'}">${r.h1 ? '' : r === TR.pend ? '?' : r.h2 ? 'A' : 'F'}</td></tr>`).join('') || `<tr class="skip"><td colspan="4">${T('A = acierto (hit) · F = fallo (miss)', 'A = acierto · F = fallo')}</td></tr>`}
        </table></div>
        <div class="tr-sets">
          <div class="lbl">L1 · ${T('set', 'conjunto')} ${lr ? lr.set1 : '–'}</div>${lr ? setHTML(TR.l1, lr.set1, flash ? lr.way1 : -1, lr.h1) : '<div class="mute">—</div>'}
          <div class="lbl">L2 · ${T('set', 'conjunto')} ${lr ? lr.set2 : '–'}</div>${lr ? setHTML(TR.l2, lr.set2, flash && !lr.h1 && lr !== TR.pend ? lr.way2 : -1, lr.h2) : '<div class="mute">—</div>'}
          <div class="stats"><div>${T('accesses', 'accesos')} <b>${tot.acc}</b></div><div>${T('L1 misses', 'fallos L1')} <b class="c-miss">${tot.m1}</b></div><div>${T('L2 misses', 'fallos L2')} <b class="c-miss">${tot.m2}</b></div>${TR.n ? `<div>${T('your calls', 'tus predicciones')} <b>${TR.ok}/${TR.n}</b></div>` : ''}</div>
        </div>
      </div>
      <div class="tr-ctl" id="trc"></div>
      <div class="tr-res" id="trr"></div>`;
      const bb = makeBitBar(32); $('#trbb', m).appendChild(bb.el);
      const ad = lr ? lr.addr : [...seen.values()][0].ad; bb.update(tg, ix, of, ad);
      drawCtl(); drawRes();
    };
    const act = (pred) => {
      if (TR.pend) { const r = TR.pend; TR.pend = null; TR.n++; if (pred === r.h2) { TR.ok++; sfx.ok(); } else sfx.bad(); r.h2 ? sfx.hit() : sfx.miss(); draw(true); return; }
      if (TR.done) return;
      const r = trExec(false);
      if (pred != null) { TR.n++; if (pred === r.h1) TR.ok++; else setTimeout(() => sfx.bad(), 200); if (!r.h1) TR.pend = r; }
      r.h1 ? sfx.hit() : (sfx.miss(), r.ev >= 0 && setTimeout(() => sfx.evict(), 140));
      draw(true);
    };
    const drawCtl = () => {
      const c = $('#trc', m);
      if (TR.done && !TR.pend) { c.innerHTML = `<button class="btn" id="t0">↺ ${T('Restart', 'Reiniciar')}</button><span class="mute">${T('Program finished — now predict the rates below.', 'Programa terminado — ahora predice las tasas abajo.')}</span>`; $('#t0', m).onclick = () => { stop(); trReset(); draw(); }; return; }
      const lp = TR.p.loops[TR.loop], nx = TR.pend ? TR.pend.label : `${lp.acc[TR.k][0]}[${TR.i}]${lp.acc[TR.k][3] || ''}`;
      c.innerHTML = `${segc('tm', [[1, T('I predict', 'Yo predigo')], [0, T('Watch', 'Mirar')]], TR.predict ? 1 : 0)}
        ${TR.predict ? `<div class="ask"><b>${nx}</b> ${T('in', 'en')} <b>${TR.pend ? 'L2' : 'L1'}</b>?</div><button class="btn hitb" id="tA">A · ${T('hit', 'acierto')}</button><button class="btn missb" id="tF">F · ${T('miss', 'fallo')}</button>`
          : `<button class="btn" id="tS">▶ ${T('Step', 'Paso')}</button><button class="btn ghost" id="tP">${TR.play ? '⏸' : '⏵⏵'} ${T('Auto', 'Auto')}</button>`}
        <span class="sp"></span>
        <button class="btn ghost" id="tL" ${TR.pend ? 'disabled' : ''}>⏭ ${T('next line boundary', 'siguiente frontera de línea')}</button>
        <button class="btn ghost" id="tE" ${TR.pend ? 'disabled' : ''}>⏭⏭ ${T('end of this loop', 'fin de este bucle')}</button>
        <button class="btn ghost" id="t0">↺</button>`;
      onSeg(m, 'tm', v => { stop(); TR.predict = v === '1'; if (!TR.predict && TR.pend) TR.pend = null; draw(); });
      if (TR.predict) { $('#tA', m).onclick = () => act(true); $('#tF', m).onclick = () => act(false); }
      else {
        $('#tS', m).onclick = () => act(null);
        $('#tP', m).onclick = () => { if (TR.play) { stop(); draw(); } else { TR.play = true; timer = setInterval(() => { if (TR.done) { stop(); draw(); } else act(null); }, 420); drawCtl(); } };
      }
      $('#tL', m).onclick = () => { stop(); trSkip('line'); sfx.pop(); draw(); };
      $('#tE', m).onclick = () => { stop(); trSkip('loop'); sfx.pop(); draw(); };
      $('#t0', m).onclick = () => { stop(); trReset(); draw(); };
    };
    const drawRes = () => {
      const r = $('#trr', m), res = TR.res;
      r.innerHTML = `<div class="lbl">${T('Your final answer for the whole program (fractions welcome: 3/32)', 'Tu respuesta final para el programa completo (valen fracciones: 3/32)')}</div>
        <div class="resrow">
          <label>m(L1)<input class="inp" id="r1" value="${res ? res.v[0] : ''}"></label>
          <label>m(L2) ${T('local', 'local')}<input class="inp" id="r2" value="${res ? res.v[1] : ''}"></label>
          <label>${T('global', 'global')}<input class="inp" id="r3" value="${res ? res.v[2] : ''}"></label>
          <button class="btn" id="rc">${T('Check with simulator', 'Comprobar con el simulador')}</button><button class="btn ghost" id="rv">${T('Reveal', 'Revelar')}</button>
        </div><div id="rout"></div>`;
      ['r1', 'r2', 'r3'].forEach((id, i) => ($('#' + id, m).oninput = e => { TR.res = TR.res || { v: ['', '', ''] }; TR.res.v[i] = e.target.value; }));
      const show = (reveal) => {
        const fs = fullStats(TR.p), t = fs.reduce((a, c) => ({ acc: a.acc + c.acc, m1: a.m1 + c.m1, m2: a.m2 + c.m2 }), { acc: 0, m1: 0, m2: 0 });
        const truth = [t.m1 / t.acc, t.m2 / t.m1, t.m2 / t.acc], v = ['r1', 'r2', 'r3'].map(id => $('#' + id, m).value);
        const ok = v.map((x, i) => { const n = parseNum(x); return !isNaN(n) && (Math.abs(n - truth[i]) < 0.004 || Math.abs(n / 100 - truth[i]) < 0.004); });
        TR.res = { v };
        ['r1', 'r2', 'r3'].forEach((id, i) => { const e = $('#' + id, m); e.classList.toggle('good', ok[i]); e.classList.toggle('badv', !ok[i] && v[i] !== ''); });
        const allok = ok.every(x => x);
        if (!reveal) allok ? (sfx.win(), confetti()) : sfx.bad();
        $('#rout', m).innerHTML = (allok || reveal) ? `<table class="tbl"><tr><th></th><th>${T('accesses', 'accesos')}</th><th>${T('L1 misses', 'fallos L1')}</th><th>m(L1)</th><th>${T('L2 misses', 'fallos L2')}</th><th>m(L2) local</th></tr>
          ${fs.map((c, i) => `<tr><th>${T('loop', 'bucle')} ${i + 1}</th><td>${c.acc}</td><td>${c.m1}</td><td>${frac(c.m1, c.acc)}</td><td>${c.m2}</td><td>${frac(c.m2, c.m1)}</td></tr>`).join('')}
          <tr class="hl"><th>${T('total', 'total')}</th><td>${t.acc}</td><td>${t.m1}</td><td><b>${frac(t.m1, t.acc)}</b></td><td>${t.m2}</td><td><b>${frac(t.m2, t.m1)}</b></td></tr></table>
          <p>${T('Global', 'Global')} = ${frac(t.m1, t.acc)} · ${frac(t.m2, t.m1)} = <b>${frac(t.m2, t.acc)}</b> ≈ ${(100 * t.m2 / t.acc).toFixed(2)} %</p>`
          : `<p class="mute">${ok.filter(x => x).length}/3 ${T('correct. Fix the red ones — use the recipe.', 'correctas. Corrige las rojas — usa la receta.')}</p>`;
      };
      $('#rc', m).onclick = () => show(false); $('#rv', m).onclick = () => show(true);
    };
    $$('[data-p]', m).forEach(b => (b.onclick = () => { stop(); TR.pid = b.dataset.p; trReset(); $$('[data-p]', m).forEach(x => x.classList.toggle('on', x === b)); sfx.tick(); draw(); }));
    const kh = e => { if (cur !== 'loops' || e.target.tagName === 'INPUT' || !TR.predict) return; if (e.key === 'a') act(true); if (e.key === 'f') act(false); };
    document.addEventListener('keydown', kh); onLeave(() => document.removeEventListener('keydown', kh));
    draw();
    Quiz($('#q', m), 'loops', loopsQs());
  }
});
