'use strict';
/* Lesson 3: associativity lab — an 8-line cache you drive block by block */

const LABSEQ = {
  ping: { seq: [0, 8, 0, 8, 0, 8, 0, 8], n: () => T('Ping-pong', 'Ping-pong'), d: () => T('Two blocks with the same index. Try 1 way, then 2.', 'Dos bloques con el mismo índice. Prueba 1 vía y luego 2.') },
  trio: { seq: [0, 8, 16, 0, 8, 16, 0, 8, 16], n: () => T('Three rivals (a, b, c)', 'Tres rivales (a, b, c)'), d: () => T('Exactly the exam situation: a[i], b[i], c[i] land in one set. 2 ways is not enough.', 'Justo la situación del examen: a[i], b[i], c[i] caen en un conjunto. Con 2 vías no basta.') },
  lruf: { seq: [0, 8, 0, 16, 0, 8, 0, 16], n: () => 'LRU vs FIFO', d: () => T('Set 2 ways, then switch policy: block 0 is hot. Who protects it?', 'Pon 2 vías y cambia la política: el bloque 0 es el caliente. ¿Quién lo protege?') },
  cap: { seq: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3], n: () => T('Too much data', 'Demasiados datos'), d: () => T('12 different blocks, 8 lines. No organisation can save you: capacity misses.', '12 bloques distintos, 8 líneas. Ninguna organización te salva: fallos de capacidad.') },
  mix: { seq: [3, 11, 3, 19, 5, 11, 3, 27, 13, 5, 19, 3], n: () => T('Mixed', 'Mixta'), d: () => T('A bit of everything. Predict each one.', 'Un poco de todo. Predice cada acceso.') }
};
const LAB = { ways: 1, policy: 'LRU', sid: 'ping', seq: LABSEQ.ping.seq, pos: 0, predict: true, log: [], ok: 0, n: 0, busy: false, cmp: false };
function labReset() {
  LAB.cache = new Cache(8 / LAB.ways, LAB.ways, LAB.policy); LAB.fa = new Cache(1, 8, LAB.policy);
  LAB.seen = new Set(); LAB.pos = 0; LAB.log = []; LAB.ok = 0; LAB.n = 0; LAB.busy = false; LAB.last = null; LAB.cmp = false;
}
labReset();

function labQs() {
  return [
    { type: 'mc', q: T('Direct mapped: where can a given block go?', 'Correspondencia directa: ¿dónde puede ir un bloque dado?'), opts: [T('Any line', 'Cualquier línea'), T('Exactly one line (block mod lines)', 'Exactamente una línea (bloque mod líneas)'), T('Any line of one set of 2', 'Cualquier línea de un conjunto de 2')], a: 1, why: T('One candidate → one comparison → fast, cheap, but conflict-prone.', 'Un candidato → una comparación → rápida y barata, pero propensa a conflictos.') },
    { type: 'num', q: T('8 lines, 2 ways. How many sets?', '8 líneas, 2 vías. ¿Cuántos conjuntos?'), a: 4, why: '8 / 2 = 4' },
    { type: 'mc', q: T('Blocks 0, 8, 0, 8… on the 8-line direct-mapped cache miss every time. What kind of miss is the 3rd access?', 'Los bloques 0, 8, 0, 8… en la caché directa de 8 líneas fallan siempre. ¿De qué tipo es el fallo del 3.er acceso?'), opts: [T('Compulsory (forzoso)', 'Forzoso / obligatorio'), T('Capacity (capacidad)', 'De capacidad'), T('Conflict (conflicto)', 'De conflicto')], a: 2, why: T('Seven lines are empty — there is room, but both blocks fight for line 0.', 'Hay siete líneas vacías — sitio hay, pero ambos bloques pelean por la línea 0.') },
    { type: 'mc', q: T('In which organisation can conflict misses never happen?', '¿En qué organización no existen los fallos de conflicto?'), opts: [T('Direct mapped', 'Correspondencia directa'), T('2-way set associative', 'Asociativa de 2 vías'), T('Fully associative', 'Totalmente asociativa')], a: 2, why: T('Any block can use any line, so a block is only evicted when the whole cache is full (capacity).', 'Cualquier bloque puede usar cualquier línea; solo se expulsa cuando toda la caché está llena (capacidad).') },
    { type: 'num', q: T('Three arrays whose elements a[i], b[i], c[i] map to the same set are accessed in turn. Minimum number of ways so they stop evicting each other?', 'Tres arrays cuyos elementos a[i], b[i], c[i] caen en el mismo conjunto se acceden por turnos. ¿Mínimo de vías para que dejen de expulsarse?'), a: 3, why: T('You need ways ≥ lines competing. Real caches use powers of two, so 4. With 2 ways: thrash.', 'Hacen falta vías ≥ líneas que compiten. Las cachés reales usan potencias de dos: 4. Con 2 vías: expulsión continua.') },
    { type: 'mc', q: T('Set is full: which line does LRU evict?', 'Conjunto lleno: ¿qué línea expulsa LRU?'), opts: [T('The one loaded first', 'La que se cargó primero'), T('The one used longest ago', 'La que lleva más tiempo sin usarse'), T('A random one', 'Una al azar')], a: 1, why: T('LRU = least recently used. “Loaded first” is FIFO, which ignores later hits.', 'LRU = menos usada recientemente. «La primera cargada» es FIFO, que ignora los aciertos posteriores.') },
    { type: 'mc', q: T('What does more associativity cost?', '¿Qué cuesta más asociatividad?'), opts: [T('More capacity misses', 'Más fallos de capacidad'), T('More tags compared → area, energy and latency', 'Más etiquetas comparadas → área, energía y latencia'), T('A longer offset', 'Un desplazamiento más largo')], a: 1, why: T('And the benefit fades: about eight ways is usually enough.', 'Y el beneficio se agota: unas ocho vías suelen bastar.') },
    { type: 'mc', q: T('Why does L1 use few ways while L2/L3 use more?', '¿Por qué L1 usa pocas vías y L2/L3 más?'), opts: [T('L1 prioritises speed; lower levels can afford slower lookups', 'L1 prioriza rapidez; los niveles inferiores se permiten búsquedas más lentas'), T('L1 has no tags', 'L1 no tiene etiquetas'), T('L2 has no conflicts', 'L2 no tiene conflictos')], a: 0, why: T('Intel Core i7 example from the slides: L1 4/8 ways, L2 8 ways, L3 16 ways.', 'Ejemplo Intel Core i7 de las transparencias: L1 4/8 vías, L2 8 vías, L3 16 vías.') },
    { type: 'num', q: T('Sequence 0, 8, 16, 0, 8, 16 on an 8-line, 2-way LRU cache. How many misses out of 6?', 'Secuencia 0, 8, 16, 0, 8, 16 en una caché de 8 líneas, 2 vías, LRU. ¿Cuántos fallos de 6?'), a: 6, hint: T('All three map to set 0. Trace who is LRU each time.', 'Los tres caen en el conjunto 0. Sigue quién es LRU en cada paso.'), why: T('16 evicts 0, then 0 evicts 8, then 8 evicts 16… every access misses.', '16 expulsa a 0, luego 0 a 8, luego 8 a 16… todos fallan.') }
  ];
}

View('lab', {
  icon: '③', title: () => T('Associativity lab', 'Laboratorio de asociatividad'), mins: 25, done: () => ['lab'],
  desc: () => T('Drive a tiny cache block by block. Call hit or miss before it answers. Feel conflict vs capacity.', 'Conduce una caché diminuta bloque a bloque. Di acierto o fallo antes de que responda. Siente conflicto frente a capacidad.'),
  render(m) {
    m.innerHTML = head(T('Lesson 3', 'Lección 3'), T('Associativity lab', 'Laboratorio de asociatividad'),
      T('A cache with 8 lines. Each access is a block number (the address without its offset). Its low bits are the index, the rest is the tag. Before every access, <b>you</b> say what will happen.',
        'Una caché de 8 líneas. Cada acceso es un número de bloque (la dirección sin su desplazamiento). Sus bits bajos son el índice, el resto la etiqueta. Antes de cada acceso, <b>tú</b> dices qué va a pasar.')) + `
    <div class="card lab">
      <div class="ctl-row">
        <div><div class="lbl">${T('Ways (vías)', 'Vías')}</div>${segc('lw', [[1, '1', T('direct', 'directa')], [2, '2'], [4, '4'], [8, '8', T('fully', 'total')]], LAB.ways)}</div>
        <div><div class="lbl">${T('Replacement', 'Reemplazo')}</div>${segc('lp', [['LRU', 'LRU'], ['FIFO', 'FIFO']], LAB.policy)}</div>
        <div><div class="lbl">${T('Mode', 'Modo')}</div>${segc('lm', [[1, T('I predict', 'Yo predigo')], [0, T('Just watch', 'Solo mirar')]], LAB.predict ? 1 : 0)}</div>
      </div>
      <div class="lbl">${T('Sequence', 'Secuencia')}</div>
      <div class="presets">${Object.keys(LABSEQ).map(k => `<button class="chipb ${LAB.sid === k ? 'on' : ''}" data-s="${k}">${LABSEQ[k].n()}</button>`).join('')}<button class="chipb" data-s="rnd">🎲 ${T('Random', 'Aleatoria')}</button></div>
      <p class="mute" id="sdesc"></p>
      <div class="custom"><input class="inp" id="cust" placeholder="${T('or type your own: 0 8 0 16 …  (0–31)', 'o escribe la tuya: 0 8 0 16 …  (0–31)')}"><button class="btn ghost" id="custGo">${T('Load', 'Cargar')}</button></div>
      <div id="seq" class="seq"></div>
      <div class="lab-main">
        <div class="lab-left">
          <div id="addr" class="blkaddr"></div>
          <div id="ctl" class="lab-ctl"></div>
          <div id="msg" class="lab-msg"></div>
          <div id="stats" class="stats"></div>
        </div>
        <div class="lab-right"><div class="cap" id="lcap"></div><div id="lg" class="lgrid"></div></div>
      </div>
      <div id="cmp"></div>
    </div>
    <div class="card">
      <h3>${T('The three kinds of miss (tipos de fallo)', 'Los tres tipos de fallo')}</h3>
      <div class="three">
        <div><span class="pill comp">${T('Compulsory', 'Forzoso')}</span><p>${T('<i>forzoso / obligatorio</i> — first ever access to the block. Unavoidable (cold start).', 'Primer acceso al bloque. Inevitable (caché inicialmente vacía).')}</p></div>
        <div><span class="pill cap">${T('Capacity', 'Capacidad')}</span><p>${T('<i>de capacidad</i> — the working set is bigger than the cache; a block you used had to go. A bigger cache fixes it.', 'El conjunto de trabajo no cabe; un bloque usado tuvo que salir. Lo arregla una caché mayor.')}</p></div>
        <div><span class="pill conf">${T('Conflict', 'Conflicto')}</span><p>${T('<i>de conflicto</i> — several blocks compete for the same line/set although other places are free. More ways fixes it. Never in fully associative.', 'Varios bloques compiten por la misma línea/conjunto aunque haya sitio libre. Lo arreglan más vías. No existen en totalmente asociativa.')}</p></div>
      </div>
      <p class="mute">${T('The lab labels each miss by replaying the same sequence on a fully associative cache of the same size: if that one would have hit, your miss is a conflict.', 'El laboratorio etiqueta cada fallo repitiendo la secuencia en una caché totalmente asociativa del mismo tamaño: si esa habría acertado, tu fallo es de conflicto.')}</p>
    </div>
    <h2>${T('Checkpoint', 'Punto de control')}</h2><div id="q"></div>${nextLink('theory')}`;

    const sets = () => 8 / LAB.ways, ixb = () => lg(sets());
    const drawSeq = () => {
      $('#seq', m).innerHTML = LAB.seq.map((b, i) => `<span class="sq ${i < LAB.pos ? (LAB.log[i].hit ? 'h' : 'm') : i === LAB.pos ? 'cur' : ''}">${b}</span>`).join('');
      $('#sdesc', m).textContent = LABSEQ[LAB.sid] ? LABSEQ[LAB.sid].d() : '';
    };
    const drawAddr = (stage) => {
      if (LAB.pos >= LAB.seq.length && !LAB.last) { $('#addr', m).innerHTML = ''; return; }
      const b = LAB.last != null ? LAB.last : LAB.seq[LAB.pos], ib = ixb(), s = bin(b, 5);
      $('#addr', m).innerHTML = `<div class="ba-t">${T('Block', 'Bloque')} <b>${b}</b></div>
        <div class="ba-bits">${[...s].map((c, i) => `<span class="bit ${i < 5 - ib ? 'tag' : 'idx'} ${stage === 'idx' && i >= 5 - ib ? 'pulse' : ''} ${stage === 'tag' && i < 5 - ib ? 'pulse' : ''}">${c}</span>`).join('')}</div>
        <div class="ba-d"><span class="c-tag">${T('tag', 'etiqueta')} ${bin(Math.floor(b / sets()), 5 - ib)}</span>${ib ? ` · <span class="c-idx">${T('set', 'conjunto')} ${b % sets()}</span>` : ` · <span class="c-idx">${T('no index', 'sin índice')}</span>`}</div>`;
    };
    const drawGrid = (flash) => {
      const g = $('#lg', m), S_ = sets(), W = LAB.ways;
      $('#lcap', m).innerHTML = `${S_} ${T(S_ === 1 ? 'set' : 'sets', S_ === 1 ? 'conjunto' : 'conjuntos')} × ${W} ${T(W === 1 ? 'way' : 'ways', W === 1 ? 'vía' : 'vías')}`;
      let h = '';
      for (let s = 0; s < S_; s++) {
        const v = LAB.cache.setView(s), full = v.every(x => x);
        const old = full && W > 1 ? v.reduce((a, x, i) => (x.stamp < v[a].stamp ? i : a), 0) : -1;
        h += `<div class="lrow ${flash && flash.probe === s ? 'probe' : ''}"><div class="lset">${ixb() ? bin(s, ixb()) : '∗'}</div>${v.map((x, w) => `<div class="lcell ${x ? 'v' : ''} ${flash && flash.set === s && flash.way === w ? (flash.hit ? 'fh' : 'fm') : ''}">${x ? `<b>B${x.block}</b><small>${T('tag', 'etq')} ${bin(Math.floor(x.block / S_), 5 - ixb())}</small>${w === old ? `<em>${T('next out', 'próx. fuera')}</em>` : ''}` : '<small>—</small>'}</div>`).join('')}</div>`;
      }
      g.innerHTML = h; g.style.setProperty('--w', W);
    };
    const drawStats = () => {
      const hits = LAB.log.filter(x => x.hit).length, ms = LAB.log.length - hits;
      const k = t => LAB.log.filter(x => x.kind === t).length;
      $('#stats', m).innerHTML = `<div><b class="c-hit">${hits}</b> ${T('hits', 'aciertos')}</div><div><b class="c-miss">${ms}</b> ${T('misses', 'fallos')}</div>
        <div class="kinds"><span class="pill comp">${k('comp')}</span><span class="pill cap">${k('cap')}</span><span class="pill conf">${k('conf')}</span></div>
        ${LAB.predict ? `<div>${T('Your calls', 'Tus predicciones')}: <b>${LAB.ok}/${LAB.n}</b></div>` : ''}`;
    };
    const drawCtl = () => {
      const c = $('#ctl', m), end = LAB.pos >= LAB.seq.length;
      if (end) {
        c.innerHTML = `<button class="btn" id="again">↺ ${T('Reset', 'Reiniciar')}</button><button class="btn ghost" id="cmpB">${T('Compare all associativities', 'Comparar todas las asociatividades')}</button>`;
        $('#again', m).onclick = () => { labReset(); all(); };
        $('#cmpB', m).onclick = () => { LAB.cmp = true; drawCmp(); sfx.pop(); };
      } else if (LAB.predict) {
        c.innerHTML = `<div class="ask">${T('Block', 'Bloque')} <b>${LAB.seq[LAB.pos]}</b> — ${T('what happens?', '¿qué ocurre?')}</div>
          <button class="btn hitb" id="pH">✓ ${T('Hit (acierto)', 'Acierto')}</button><button class="btn missb" id="pM">✗ ${T('Miss (fallo)', 'Fallo')}</button>`;
        $('#pH', m).onclick = () => step(true); $('#pM', m).onclick = () => step(false);
      } else {
        c.innerHTML = `<button class="btn" id="st">▶ ${T('Step', 'Paso')}</button><button class="btn ghost" id="rs">↺</button>`;
        $('#st', m).onclick = () => step(null); $('#rs', m).onclick = () => { labReset(); all(); };
      }
    };
    const drawCmp = () => {
      if (!LAB.cmp) { $('#cmp', m).innerHTML = ''; return; }
      const row = p => [1, 2, 4, 8].map(w => { const r = runSeq(LAB.seq, 8, w, p); return `<td class="${w === LAB.ways && p === LAB.policy ? 'hl' : ''}"><b>${r.filter(x => !x).length}</b><small>${r.map(h => (h ? '·' : '✗')).join('')}</small></td>`; }).join('');
      $('#cmp', m).innerHTML = `<table class="tbl cmp"><tr><th>${T('Misses', 'Fallos')}</th><th>1 ${T('way', 'vía')}</th><th>2</th><th>4</th><th>8</th></tr><tr><th>LRU</th>${row('LRU')}</tr><tr><th>FIFO</th>${row('FIFO')}</tr></table>`;
    };
    const all = () => { drawSeq(); drawAddr(); drawGrid(); drawStats(); drawCtl(); drawCmp(); $('#msg', m).innerHTML = ''; };
    let alive = true; onLeave(() => { alive = false; LAB.busy = false; });

    async function step(pred) {
      if (LAB.busy || LAB.pos >= LAB.seq.length) return;
      LAB.busy = true;
      const b = LAB.seq[LAB.pos], S_ = sets();
      $$('button', $('#ctl', m)).forEach(x => (x.disabled = true));
      drawAddr('idx'); sfx.tick(); await sleep(320); if (!alive) return;
      drawGrid({ probe: b % S_ }); drawAddr('tag'); await sleep(380); if (!alive) return;
      const before = LAB.cache.setView(b % S_);
      const r = LAB.cache.access(b), f = LAB.fa.touch(b);
      const kind = r.hit ? null : !LAB.seen.has(b) ? 'comp' : f ? 'conf' : 'cap';
      LAB.seen.add(b); LAB.log.push({ hit: r.hit, kind }); LAB.last = b;
      drawGrid({ set: r.set, way: r.way, hit: r.hit, probe: r.set });
      r.hit ? sfx.hit() : (sfx.miss(), r.evicted >= 0 && setTimeout(() => sfx.evict(), 160));
      const kn = { comp: T('compulsory (forzoso)', 'forzoso'), cap: T('capacity (capacidad)', 'de capacidad'), conf: T('conflict (conflicto)', 'de conflicto') };
      let msg = r.hit ? `<b class="c-hit">${T('HIT', 'ACIERTO')}</b> — ${T(`tag matches in set ${r.set}.`, `la etiqueta coincide en el conjunto ${r.set}.`)}`
        : `<b class="c-miss">${T('MISS', 'FALLO')}</b> <span class="pill ${kind}">${kn[kind]}</span> — ${r.evicted >= 0 ? T(`B${r.evicted} is evicted (${LAB.ways === 1 ? 'only candidate' : LAB.policy}).`, `se expulsa B${r.evicted} (${LAB.ways === 1 ? 'único candidato' : LAB.policy}).`) : T('a free line takes it.', 'lo recibe una línea libre.')}`;
      if (pred != null) { LAB.n++; const good = pred === r.hit; if (good) LAB.ok++; msg += ` <span class="${good ? 'c-hit' : 'c-miss'}">${good ? T('You called it.', 'Lo predijiste.') : T('You said the opposite — look at who was in the set.', 'Dijiste lo contrario — mira quién estaba en el conjunto.')}</span>`; if (!good) setTimeout(() => sfx.bad(), 260); }
      $('#msg', m).innerHTML = msg;
      LAB.pos++; LAB.busy = false; LAB.last = null;
      drawSeq(); drawStats(); drawCtl();
      if (LAB.pos >= LAB.seq.length) { drawAddr(); setTimeout(() => sfx.win(), 350); } else drawAddr();
      void before;
    }
    const kh = e => { if (cur !== 'lab' || e.target.tagName === 'INPUT') return; if (LAB.predict) { if (e.key === 'a' || e.key === 'h') step(true); if (e.key === 'f' || e.key === 'm') step(false); } else if (e.key === ' ') { e.preventDefault(); step(null); } };
    document.addEventListener('keydown', kh); onLeave(() => document.removeEventListener('keydown', kh));

    onSeg(m, 'lw', v => { LAB.ways = +v; labReset(); all(); });
    onSeg(m, 'lp', v => { LAB.policy = v; labReset(); all(); });
    onSeg(m, 'lm', v => { LAB.predict = v === '1'; drawCtl(); drawStats(); });
    $$('[data-s]', m).forEach(b => (b.onclick = () => {
      const k = b.dataset.s;
      if (k === 'rnd') { const pool = [rnd(8), rnd(8)].flatMap(x => [x, x + 8, x + 16]); LAB.seq = Array.from({ length: 12 }, () => pick(pool)); LAB.sid = 'rnd'; }
      else { LAB.sid = k; LAB.seq = LABSEQ[k].seq; }
      $$('[data-s]', m).forEach(x => x.classList.toggle('on', x === b)); sfx.tick(); labReset(); all();
    }));
    $('#custGo', m).onclick = () => {
      const a = ($('#cust', m).value.match(/\d+/g) || []).map(Number).filter(x => x >= 0 && x < 32).slice(0, 24);
      if (a.length) { LAB.seq = a; LAB.sid = 'custom'; $$('[data-s]', m).forEach(x => x.classList.remove('on')); labReset(); all(); }
    };
    all();
    Quiz($('#q', m), 'lab', labQs());
  }
});
