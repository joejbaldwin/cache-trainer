'use strict';
/* Trade-offs, live: move one of the three design knobs and see what gets better and what gets worse.
   Every effect is the wording of L4_2 slides 4–6; the bit counts are computed. */

const TO = { w: 1, s: 3, b: 1, last: null };            // slider positions
const TR_W = [1, 2, 4, 8, 0], TR_S = [1, 2, 4, 8, 16, 32, 64], TR_B = [16, 32, 64, 128];   // ways (0 = fully), KiB, bytes

function trCfg() {
  const size = TR_S[TO.s] * 1024, block = TR_B[TO.b], lines = size / block, ways = TR_W[TO.w] || lines, sets = lines / ways;
  return { size, block, lines, ways, sets, full: !TR_W[TO.w], off: lg(block), idx: lg(sets), tag: 32 - lg(block) - lg(sets) };
}
/* [goes up?, good?, label, why] for an INCREASE of the knob; a decrease flips direction and colour */
function trEffects(k) {
  return {
    w: [[0, 1, T('conflict misses', 'fallos de conflicto'), T('more lines can hold blocks that share a set', 'más líneas pueden alojar bloques del mismo conjunto')],
      [1, 0, T('tag comparisons', 'comparaciones de etiquetas'), T('one comparator per way', 'un comparador por vía')],
      [1, 0, T('hit latency', 'latencia de acierto'), T('compare more tags, then choose the way', 'comparar más etiquetas y luego elegir la vía')],
      [1, 0, T('silicon area', 'área de silicio'), T('comparators and a wider multiplexer', 'comparadores y un multiplexor más ancho')],
      [1, 0, T('energy per access', 'energía por acceso'), T('every way of the set is read', 'se leen todas las vías del conjunto')]],
    s: [[0, 1, T('capacity misses', 'fallos de capacidad'), T('more of the data fits at once', 'cabe más parte de los datos a la vez')],
      [1, 0, T('latency per access', 'latencia por acceso'), T('a bigger memory is slower to read', 'una memoria mayor tarda más en leerse')],
      [1, 0, T('power per access', 'consumo por acceso'), ''],
      [1, 0, T('silicon area', 'área de silicio'), T('which is why L1 stays small and L2/L3 are large', 'por eso L1 es pequeña y L2/L3 grandes')]],
    b: [[0, 1, T('miss rate', 'tasa de fallos'), T('spatial locality: neighbours arrive with the block', 'localidad espacial: los vecinos llegan con el bloque')],
      [1, 0, T('miss penalty', 'penalización de fallo'), T('more bytes to transfer on each miss', 'más bytes que transferir en cada fallo')],
      [1, 0, T('capacity misses (may)', 'fallos de capacidad (pueden)'), T('same size, fewer lines', 'mismo tamaño, menos líneas')]]
  }[k];
}

View('trade', {
  icon: '⚖', mins: 8, title: () => T('Trade-offs, live', 'Compromisos, en vivo'),
  desc: () => T('Move associativity, cache size and block size and watch what improves and what it costs.', 'Mueve asociatividad, tamaño de caché y tamaño de bloque y mira qué mejora y qué cuesta.'),
  done: () => ['trade'],
  render(m) {
    const wl = i => (TR_W[i] ? (TR_W[i] === 1 ? T('direct', 'directa') : TR_W[i] + T(' ways', ' vías')) : T('fully assoc.', 'totalmente asoc.'));
    m.innerHTML = `${head(T('Lesson 3½ · L4_2 slides 4–6', 'Lección 3½ · L4_2 diapositivas 4–6'), T('Trade-offs, live', 'Compromisos, en vivo'),
      T('Three knobs. Each one buys fewer misses and charges you somewhere else. Move one and say the cost before you read it.', 'Tres mandos. Cada uno compra menos fallos y te cobra en otro sitio. Mueve uno y di el coste antes de leerlo.'))}
    <div class="card trd">
      <div class="trk">
        <label class="on-w"><span>${T('Associativity', 'Asociatividad')} <i>${T('(asociatividad)', '')}</i></span><input type="range" min="0" max="${TR_W.length - 1}" value="${TO.w}" data-k="w"><b id="tv-w"></b><small><em>${T('direct', 'directa')}</em><em>${T('fully associative', 'totalmente asociativa')}</em></small></label>
        <label class="on-s"><span>${T('Cache size', 'Tamaño de caché')}</span><input type="range" min="0" max="${TR_S.length - 1}" value="${TO.s}" data-k="s"><b id="tv-s"></b><small><em>1 KiB</em><em>64 KiB</em></small></label>
        <label class="on-b"><span>${T('Block size', 'Tamaño de bloque')}</span><input type="range" min="0" max="${TR_B.length - 1}" value="${TO.b}" data-k="b"><b id="tv-b"></b><small><em>16 B</em><em>128 B</em></small></label>
      </div>
      <div class="trs"><div class="trc"><div id="trviz"></div><div id="trbar"></div><div class="cfg" id="trnum"></div></div>
        <div class="tre" id="tre"></div></div>
      <p class="trleg"><span class="tra up g">▲</span><span class="tra dn g">▼</span> ${T('green: the change helps', 'verde: el cambio ayuda')} · <span class="tra up r">▲</span><span class="tra dn r">▼</span> ${T('red: the change costs', 'rojo: el cambio cuesta')} · ${T('the arrow says whether that quantity goes up or down', 'la flecha dice si esa magnitud sube o baja')}</p>
    </div>
    <div class="card"><h3>${T('The three knobs on one page', 'Los tres mandos en una página')} ${sref('L4_2 · 4–6')}</h3>
      <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>${T('Increase…', 'Aumentar…')}</th><th>${T('buys', 'compra')}</th><th>${T('costs', 'cuesta')}</th><th>${T('note', 'nota')}</th></tr></thead><tbody>
      <tr><th>${T('Associativity', 'Asociatividad')}</th><td class="c-hit">▼ ${T('conflict misses', 'fallos de conflicto')}</td><td class="c-miss">▲ ${T('area, energy, latency (more tags compared)', 'área, energía, latencia (más etiquetas comparadas)')}</td><td>${T('benefit shrinks at high associativity; eight ways are usually enough', 'el beneficio disminuye con asociatividades altas; ocho vías suelen bastar')}</td></tr>
      <tr><th>${T('Cache size', 'Tamaño de caché')}</th><td class="c-hit">▼ ${T('capacity misses', 'fallos de capacidad')}</td><td class="c-miss">▲ ${T('latency and power per access, silicon area', 'latencia y consumo por acceso, área de silicio')}</td><td>${T('hence a fast L1 plus larger, slower levels', 'de ahí una L1 rápida más niveles mayores y lentos')}</td></tr>
      <tr><th>${T('Block size', 'Tamaño de bloque')}</th><td class="c-hit">▼ ${T('miss rate (spatial locality)', 'tasa de fallos (localidad espacial)')}</td><td class="c-miss">▲ ${T('miss penalty; fewer lines may raise capacity misses', 'penalización; menos líneas pueden aumentar los fallos de capacidad')}</td><td>${T('little benefit with poor spatial locality; high latency and good bandwidth below favour large blocks', 'poco beneficio con poca localidad espacial; latencia alta y buen ancho de banda debajo favorecen bloques grandes')}</td></tr>
      </tbody></table></div></div>
    <h2>${T('Checkpoint', 'Punto de control')}</h2><div id="q"></div>${nextLink('theory')}`;
    const bar = makeBitBar(32); $('#trbar', m).appendChild(bar.el);
    let prev = trCfg();
    function viz(c, k) {
      const rows = Math.min(c.sets, 8), cols = Math.min(c.ways, 8), bw = 26 + lg(c.block / 16) * 14;
      let h = `<div class="trg${k ? ' ch-' + k : ''}" style="--bw:${bw}px"><div class="trgh">${Array.from({ length: cols }, (_, i) => `<span>${T('way', 'vía')} ${i}</span>`).join('')}${c.ways > 8 ? `<span class="more">… ${c.ways}</span>` : ''}</div>`;
      for (let r = 0; r < rows; r++) h += `<div class="trr"><i>${c.sets > 8 && r === rows - 1 ? c.sets - 1 : r}</i>${'<b></b>'.repeat(cols)}${c.ways > 8 ? '<u>…</u>' : ''}</div>${c.sets > 8 && r === rows - 2 ? '<div class="trr gap"><i>⋮</i></div>' : ''}`;
      return h + `</div><div class="trcap">${c.full ? T(`1 set · ${c.ways} ways: a block may go in any line`, `1 conjunto · ${c.ways} vías: un bloque puede ir a cualquier línea`) : c.ways === 1 ? T(`${c.sets} sets × 1 way: each block has exactly one line`, `${c.sets} conjuntos × 1 vía: cada bloque tiene exactamente una línea`) : T(`${c.sets} sets × ${c.ways} ways`, `${c.sets} conjuntos × ${c.ways} vías`)} · ${T('block', 'bloque')} ${c.block} B</div>`;
    }
    function draw(k, dir) {
      const c = trCfg();
      $('#tv-w', m).textContent = wl(TO.w); $('#tv-s', m).textContent = TR_S[TO.s] + ' KiB'; $('#tv-b', m).textContent = TR_B[TO.b] + ' B';
      $('#trviz', m).innerHTML = viz(c, k);
      bar.update(c.tag, c.idx, c.off);
      const d = (a, b) => (a === b ? `<b>${b}</b>` : `<b class="chg">${a} → ${b}</b>`);
      $('#trnum', m).innerHTML = `<span>${T('lines', 'líneas')} ${d(prev.lines, c.lines)}</span><span>${T('sets', 'conjuntos')} ${d(prev.sets, c.sets)}</span><span>${T('comparators', 'comparadores')} ${d(prev.ways, c.ways)}</span><span>${T('tag', 'etiqueta')} ${d(prev.tag, c.tag)} b</span><span>${T('index', 'índice')} ${d(prev.idx, c.idx)} b</span><span>${T('offset', 'despl.')} ${d(prev.off, c.off)} b</span>`;
      const box = $('#tre', m);
      if (!k) { box.innerHTML = `<div class="tre0">← ${T('Move a slider', 'Mueve un mando')}</div>`; prev = c; return; }
      const name = { w: T('associativity', 'asociatividad'), s: T('cache size', 'tamaño de caché'), b: T('block size', 'tamaño de bloque') }[k];
      const fx = trEffects(k).map(([up, good, lab, why], i) => {
        const u = dir > 0 ? up : !up, g = dir > 0 ? good : !good;
        return `<div class="trx ${g ? 'g' : 'r'}" style="animation-delay:${i * 90}ms"><span class="tra ${u ? 'up' : 'dn'} ${g ? 'g' : 'r'}">${u ? '▲' : '▼'}</span><div><b>${lab}</b>${why && dir > 0 ? `<small>${why}</small>` : ''}</div></div>`;
      }).join('');
      const note = k === 'w' && dir > 0 && c.ways > 8 ? `<p class="trn">${T('Past eight ways the extra benefit is small; the costs keep growing.', 'Más allá de ocho vías el beneficio extra es pequeño; los costes siguen creciendo.')}</p>` : '';
      box.innerHTML = `<h4 class="on-${k}">${dir > 0 ? T('More', 'Más') : T('Less', 'Menos')} ${name}</h4>${fx}${note}`;
      dir > 0 ? sfx.pop() : sfx.tick();
      prev = c;
    }
    $$('.trk input', m).forEach(inp => (inp.oninput = () => {
      const k = inp.dataset.k, v = +inp.value, dir = v - TO[k];
      if (!dir) return;
      TO[k] = v; draw(k, dir);
    }));
    draw();
    Quiz($('#q', m), 'trade', [
      { type: 'mc', q: T('Which kind of miss does higher associativity reduce?', '¿Qué tipo de fallo reduce una mayor asociatividad?'), opts: [T('Conflict', 'De conflicto'), T('Capacity', 'De capacidad'), T('Compulsory', 'Forzosos')], a: 0 },
      { type: 'mc', q: T('Which kind of miss does a larger cache reduce?', '¿Qué tipo de fallo reduce una caché mayor?'), opts: [T('Conflict', 'De conflicto'), T('Capacity', 'De capacidad'), T('Compulsory', 'Forzosos')], a: 1 },
      { type: 'mc', q: T('What does a larger block make worse?', '¿Qué empeora un bloque mayor?'), opts: [T('The miss penalty', 'La penalización de fallo'), T('The number of tag comparisons', 'El número de comparaciones de etiquetas'), T('Spatial locality', 'La localidad espacial')], a: 0, why: T('More bytes are transferred on each miss.', 'Se transfieren más bytes en cada fallo.') },
      { type: 'mc', q: T('Why does more associativity raise hit latency?', '¿Por qué más asociatividad aumenta la latencia de acierto?'), opts: [T('More tags are compared', 'Se comparan más etiquetas'), T('Blocks are larger', 'Los bloques son mayores'), T('There are more sets', 'Hay más conjuntos')], a: 0 },
      { type: 'mc', q: T('Same cache size, larger blocks. What happens to the number of lines, and which misses may rise?', 'Mismo tamaño de caché, bloques mayores. ¿Qué pasa con el número de líneas y qué fallos pueden aumentar?'), opts: [T('Fewer lines; capacity misses', 'Menos líneas; fallos de capacidad'), T('More lines; conflict misses', 'Más líneas; fallos de conflicto'), T('Same lines; none', 'Las mismas líneas; ninguno')], a: 0 },
      { type: 'mc', q: T('How many ways are "usually enough" according to the slides?', '¿Cuántas vías "suelen ser suficientes" según las diapositivas?'), opts: ['2', '8', '64'], a: 1 }
    ]);
  }
});
