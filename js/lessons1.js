'use strict';
/* Home, Lesson 1 (foundations + powers of two), Lesson 2 (address anatomy) */

View('home', {
  icon: '🏠', title: () => T('Start', 'Inicio'),
  render(m) {
    const ids = Order.filter(id => id !== 'home');
    const all = ids.flatMap(id => Views[id].done()), n = all.filter(x => S.done[x]).length;
    m.innerHTML = `
    <section class="hero">
      <div class="kicker">Arquitectura de Computadores · Tema 4</div>
      <h1>${T('Cache memory, built to stick', 'Memoria caché, para que se te quede')}</h1>
      <p class="lead">${T(
        'Every screen makes you predict before it shows you. Three colours carry the whole topic — learn them once and they never change:',
        'Cada pantalla te obliga a predecir antes de enseñarte la respuesta. Tres colores sostienen todo el tema — apréndelos una vez y no cambian nunca:')}</p>
      <div class="legend">
        <div class="lg t"><b>${T('TAG', 'ETIQUETA')}</b><span>${T('etiqueta — “which block is this?”', '“¿qué bloque es este?”')}</span></div>
        <div class="lg i"><b>${T('INDEX', 'ÍNDICE')}</b><span>${T('índice — “which set (conjunto) do I look in?”', '“¿en qué conjunto miro?”')}</span></div>
        <div class="lg o"><b>${T('OFFSET', 'DESPLAZAMIENTO')}</b><span>${T('desplazamiento — “which byte inside the line?”', '“¿qué byte dentro de la línea?”')}</span></div>
      </div>
      <div class="prog"><div class="bar"><i style="width:${(100 * n / all.length).toFixed(0)}%"></i></div><span>${n}/${all.length} ${T('checkpoints done', 'hitos completados')}</span></div>
    </section>
    <section class="cards">${ids.map((id, k) => {
      const v = Views[id];
      return `<a class="card link ${isDone(id) ? 'isdone' : ''}" href="#/${id}"><div class="cnum">${k + 1}</div><div><h3>${v.icon} ${v.title()} ${isDone(id) ? '<span class="ck">✓</span>' : ''}</h3><p>${v.desc()}</p><small>≈ ${v.mins} min</small></div></a>`;
    }).join('')}</section>
    <section class="card tip">
      <h3>${T('How to use it before the exam', 'Cómo usarlo antes del examen')}</h3>
      <ol>
        <li>${T('Lessons 1–3 in one sitting: they build the picture of associativity (asociatividad).', 'Lecciones 1–3 de una sentada: construyen la imagen mental de la asociatividad.')}</li>
        <li>${T('Lessons 4–6 the next sitting: theory, formulas, and the loop problems the exam is made of.', 'Lecciones 4–6 en la siguiente: teoría, fórmulas y los problemas de bucles de los que se compone el examen.')}</li>
        <li>${T('Then the exercises on paper first — only type your answer in to check it.', 'Después los ejercicios, primero en papel — escribe la respuesta solo para comprobarla.')}</li>
        <li>${T('The day before: mock drill in Spanish mode, and redo anything you missed.', 'El día anterior: simulacro en modo español y repite lo que hayas fallado.')}</li>
      </ol>
      <p class="mute">${T('Sources: L4_1–L4_4 slides, solved sheets E4_1, E4_2, E4_4, and your class notes (2022 exam, L4_4/E4_3). Numbers in the loop problems are checked by a real cache simulator running in this page.',
        'Fuentes: transparencias L4_1–L4_4, boletines resueltos E4_1, E4_2, E4_4 y tus apuntes de clase (examen 2022, L4_4/E4_3). Los números de los problemas de bucles los comprueba un simulador de caché real que corre en esta página.')}</p>
    </section>`;
  }
});

/* ============ Lesson 1: foundations ============ */
let BASQ = null;
function genBasics() {
  const types = [['char', 1], ['int', 4], ['float', 4], ['double', 8]];
  const out = [];
  const kb = pick([4, 8, 16, 32, 64, 256, 512]); out.push({ k: 'kb', n: kb });
  out.push({ k: 'type', t: 'double', b: 8 });
  const mb = pick([1, 2, 4, 8]); out.push({ k: 'mb', n: mb });
  const a = 12 + rnd(8), b = 4 + rnd(6); out.push({ k: 'div', a, b });
  out.push({ k: 'type', t: 'int', b: 4 });
  const L = pick([32, 64, 128]); out.push({ k: 'log', v: L });
  const ty = pick(types.slice(1)); out.push({ k: 'fit', line: 64, t: ty[0], b: ty[1] });
  const e = pick([16, 18, 20]); const t2 = pick([['int', 4], ['double', 8]]); out.push({ k: 'arr', e, t: t2[0], b: t2[1] });
  const sz = pick([15, 18, 20]), w = pick([1, 2, 3]); out.push({ k: 'sets', sz, w });
  out.push({ k: 'back', e: pick([13, 16, 23]) });
  return out;
}
function basicsQs() {
  if (!BASQ) BASQ = genBasics();
  return BASQ.map(p => {
    switch (p.k) {
      case 'kb': return { type: 'num', q: T(`${p.n} KB = 2<sup>?</sup> bytes`, `${p.n} KB = 2<sup>?</sup> bytes`), a: 10 + lg(p.n), ph: T('exponent', 'exponente'), why: `${p.n} = 2<sup>${lg(p.n)}</sup>, KB = 2<sup>10</sup> → 2<sup>${10 + lg(p.n)}</sup>`, hint: 'KB = 2¹⁰' };
      case 'mb': return { type: 'num', q: `${p.n} MB = 2<sup>?</sup> bytes`, a: 20 + lg(p.n), ph: T('exponent', 'exponente'), why: `MB = 2<sup>20</sup>`, hint: 'MB = 2²⁰' };
      case 'type': return { type: 'num', q: T(`How many bytes is a <code>${p.t}</code>?`, `¿Cuántos bytes ocupa un <code>${p.t}</code>?`), a: p.b, unit: 'B', why: T(`The professor expects you to know this without being told: char 1, int 4, float 4, double 8.`, `El profesor espera que lo sepas sin que te lo digan: char 1, int 4, float 4, double 8.`) };
      case 'div': return { type: 'num', q: `2<sup>${p.a}</sup> / 2<sup>${p.b}</sup> = 2<sup>?</sup>`, a: p.a - p.b, ph: T('exponent', 'exponente'), why: T('Dividing powers = subtracting exponents. This one move solves “how many sets”.', 'Dividir potencias = restar exponentes. Con este gesto se resuelve “cuántos conjuntos”.') };
      case 'log': return { type: 'num', q: T(`A line (línea) is ${p.v} bytes. How many ${OFF()} bits?`, `Una línea ocupa ${p.v} bytes. ¿Cuántos bits de ${OFF()}?`), a: lg(p.v), unit: 'bits', why: `log<sub>2</sub>(${p.v}) = ${lg(p.v)}` };
      case 'fit': return { type: 'num', q: T(`How many <code>${p.t}</code> elements fit in one ${p.line}-byte line?`, `¿Cuántos elementos <code>${p.t}</code> caben en una línea de ${p.line} bytes?`), a: p.line / p.b, why: `${p.line} / ${p.b} = ${p.line / p.b}. ${T('So a sequential walk misses once every ' + p.line / p.b + ' elements.', 'Así que un recorrido secuencial falla una vez cada ' + p.line / p.b + ' elementos.')}` };
      case 'arr': return { type: 'num', q: T(`An array of 2<sup>${p.e}</sup> <code>${p.t}</code> occupies 2<sup>?</sup> bytes`, `Un array de 2<sup>${p.e}</sup> <code>${p.t}</code> ocupa 2<sup>?</sup> bytes`), a: p.e + lg(p.b), ph: T('exponent', 'exponente'), why: `2<sup>${p.e}</sup> × 2<sup>${lg(p.b)}</sup> = 2<sup>${p.e + lg(p.b)}</sup>` };
      case 'sets': return { type: 'num', q: T(`Cache of 2<sup>${p.sz}</sup> B, ${2 ** p.w} ways (vías), 64 B lines. Sets (conjuntos) = 2<sup>?</sup>`, `Caché de 2<sup>${p.sz}</sup> B, ${2 ** p.w} vías, líneas de 64 B. Conjuntos = 2<sup>?</sup>`), a: p.sz - p.w - 6, ph: T('exponent', 'exponente'), hint: T('size / (ways × line)', 'tamaño / (vías × línea)'), why: `2<sup>${p.sz}</sup> / (2<sup>${p.w}</sup> · 2<sup>6</sup>) = 2<sup>${p.sz - p.w - 6}</sup>` };
      case 'back': return { type: 'txt', q: T(`2<sup>${p.e}</sup> bytes in KB or MB? (e.g. “32KB”)`, `¿2<sup>${p.e}</sup> bytes en KB o MB? (p. ej. «32KB»)`), a: p.e >= 20 ? [2 ** (p.e - 20) + 'mb', 2 ** (p.e - 20) + 'mib'] : [2 ** (p.e - 10) + 'kb', 2 ** (p.e - 10) + 'kib'], why: p.e >= 20 ? `2<sup>${p.e}</sup> = 2<sup>${p.e - 20}</sup> · 2<sup>20</sup>` : `2<sup>${p.e}</sup> = 2<sup>${p.e - 10}</sup> · 2<sup>10</sup>` };
    }
  });
}

View('basics', {
  icon: '①', title: () => T('Foundations', 'Fundamentos'), mins: 10, done: () => ['basics'],
  desc: () => T('Why caches exist, locality, and the powers-of-two reflexes every exercise needs.', 'Por qué existen las cachés, localidad y los reflejos de potencias de dos que pide cada ejercicio.'),
  render(m) {
    m.innerHTML = head(T('Lesson 1', 'Lección 1'), T('Foundations', 'Fundamentos'),
      T('The CPU got fast; memory did not. The cache is a small, fast copy of the bits of memory you are using right now.', 'La CPU se hizo rápida; la memoria no. La caché es una copia pequeña y rápida de los trozos de memoria que estás usando ahora mismo.')) + `
    <div class="grid2">
      <div class="card">
        <h3>${T('The memory wall (muro de memoria)', 'El muro de memoria')}</h3>
        <table class="tbl"><tr><th>${T('Level', 'Nivel')}</th><th>${T('Size', 'Tamaño')}</th><th>${T('Access', 'Acceso')}</th><th>${T('Managed by', 'Gestiona')}</th></tr>
          <tr><td>${T('Registers', 'Registros')}</td><td>&lt; 4 KB</td><td>0,1 ns</td><td>${T('compiler', 'compilador')}</td></tr>
          <tr class="hl"><td><b>Caché</b></td><td>32 KB – 256 MB</td><td>0,5 ns</td><td>hardware</td></tr>
          <tr><td>${T('Main memory', 'Memoria principal')}</td><td>8 – 1024 GB</td><td>30 ns</td><td>${T('OS', 'SO')}</td></tr>
          <tr><td>${T('Disk', 'Disco')}</td><td>&gt; 1 TB</td><td>5 000 000 ns</td><td>${T('OS', 'SO')}</td></tr></table>
        <p>${T('Data moves in <b>blocks</b> (bloques) of contiguous words. Each block sits in one cache <b>line</b> (línea). When you touch one byte, the whole line comes along.',
          'Los datos se mueven en <b>bloques</b> de palabras contiguas. Cada bloque ocupa una <b>línea</b> de caché. Al tocar un byte, viaja la línea entera.')}</p>
      </div>
      <div class="card">
        <h3>${T('Locality (principio de localidad)', 'Principio de localidad')}</h3>
        <p><b>${T('Temporal', 'Temporal')}</b> — ${T('what you used recently, you will use again. A loop reusing <code>suma</code>.', 'lo usado recientemente se reutiliza. Un bucle que reutiliza <code>suma</code>.')}</p>
        <pre class="code">for (i = 0; i &lt; T; i++) suma += 5;</pre>
        <p><b>${T('Spatial (espacial)', 'Espacial')}</b> — ${T('after one address, you touch its neighbours. Walking <code>vector[i]</code> in order.', 'tras una dirección se accede a las vecinas. Recorrer <code>vector[i]</code> en orden.')}</p>
        <pre class="code">for (i = 0; i &lt; N; i++) vector[i] = 5;</pre>
        <p class="mute">${T('Spatial locality is why a 64-byte line holding 8 doubles gives you 1 miss then 7 free hits.', 'La localidad espacial explica que una línea de 64 bytes con 8 doubles dé 1 fallo y 7 aciertos gratis.')}</p>
      </div>
    </div>
    <div class="card">
      <h3>${T('The reflex table', 'La tabla de reflejos')}</h3>
      <p>${T('Every exam problem starts by turning the statement into powers of two. The professor, in your notes: “hay que saber los tipos básicos”.', 'Todo problema de examen empieza convirtiendo el enunciado a potencias de dos. El profesor, en tus apuntes: «hay que saber los tipos básicos».')}</p>
      <div class="chips">
        <span>KB = 2<sup>10</sup></span><span>MB = 2<sup>20</sup></span><span>GB = 2<sup>30</sup></span>
        <span>32 KB = 2<sup>15</sup></span><span>256 KB = 2<sup>18</sup></span><span>64 B = 2<sup>6</sup></span>
        <span class="alt">char = 1 B</span><span class="alt">int = 4 B</span><span class="alt">float = 4 B</span><span class="alt">double = 8 B = 2<sup>3</sup></span>
      </div>
      <p>${T('Multiply → add exponents. Divide → subtract exponents. Number of bits to choose among N things → log<sub>2</sub> N.', 'Multiplicar → sumar exponentes. Dividir → restar exponentes. Bits para elegir entre N cosas → log<sub>2</sub> N.')}</p>
    </div>
    <h2>${T('Speed drill — no calculator', 'Ejercicio de velocidad — sin calculadora')}</h2>
    <div id="q"></div>${nextLink('anatomy')}`;
    Quiz($('#q', m), 'basics', basicsQs(), { again: T('New numbers', 'Números nuevos'), onAgain: () => { BASQ = null; route(true); } });
  }
});

/* ============ Lesson 2: address anatomy ============ */
const AN = { ways: 1, addr: 0x3A7C, c: { bits: 32, size: 15, line: 6, ways: 2 } };

function anatomyQs() {
  return [
    { type: 'mc', q: T(`The number of ${OFF()} bits depends only on…`, `El número de bits de ${OFF()} depende solo de…`), opts: [T('the cache size', 'el tamaño de la caché'), T('the line (block) size', 'el tamaño de línea (bloque)'), T('the number of ways', 'el número de vías'), T('the replacement policy', 'la política de reemplazo')], a: 1, why: T('offset = log₂(line size). Changing associativity never touches it.', 'desplazamiento = log₂(tamaño de línea). Cambiar la asociatividad nunca lo toca.') },
    { type: 'num', q: T('1 KiB cache, 16 B lines, direct mapped (correspondencia directa). How many index bits?', 'Caché de 1 KiB, líneas de 16 B, correspondencia directa. ¿Cuántos bits de índice?'), a: 6, unit: 'bits', hint: T('lines = 1024/16', 'líneas = 1024/16'), why: '1024/16 = 64 = 2<sup>6</sup>' },
    { type: 'num', q: T('Same cache, now 4-way set associative. Index bits?', 'La misma caché, ahora asociativa por conjuntos de 4 vías. ¿Bits de índice?'), a: 4, unit: 'bits', why: T('64 lines / 4 ways = 16 sets = 2⁴.', '64 líneas / 4 vías = 16 conjuntos = 2⁴.') },
    { type: 'num', q: T('…and with 16-bit addresses, how many tag bits in that 4-way cache?', '…y con direcciones de 16 bits, ¿cuántos bits de etiqueta en esa caché de 4 vías?'), a: 8, unit: 'bits', why: '16 − 4 − 4 = 8' },
    { type: 'num', q: T('Fully associative (totalmente asociativa): how many index bits?', 'Totalmente asociativa: ¿cuántos bits de índice?'), a: 0, unit: 'bits', why: T('One single set — nothing to choose, so no index. The tag swallows those bits.', 'Un único conjunto — no hay nada que elegir, así que no hay índice. La etiqueta absorbe esos bits.') },
    { type: 'mc', q: T('Same size, same line. You go from 4 ways to 8 ways. What happens?', 'Mismo tamaño, misma línea. Pasas de 4 a 8 vías. ¿Qué ocurre?'), opts: [T('index +1, tag −1', 'índice +1, etiqueta −1'), T('index −1, tag +1', 'índice −1, etiqueta +1'), T('offset −1, tag +1', 'desplazamiento −1, etiqueta +1'), T('nothing changes', 'no cambia nada')], a: 1, why: T('Ways ×2 → sets ÷2 → one index bit moves into the tag.', 'Vías ×2 → conjuntos ÷2 → un bit de índice pasa a la etiqueta.') },
    { type: 'num', q: T('Address 0x3A7C = 0011 1010 0111 1100. 4-way cache above (tag 8 | index 4 | offset 4). Which set (decimal)?', 'Dirección 0x3A7C = 0011 1010 0111 1100. Caché de 4 vías anterior (etiqueta 8 | índice 4 | despl. 4). ¿Qué conjunto (decimal)?'), a: 7, why: '00111010 | <b>0111</b> | 1100 → 7' },
    { type: 'num', q: T('Exam 2022 — L1: 32 KB, 4 ways, 64 B lines. Index bits?', 'Examen 2022 — L1: 32 KB, 4 vías, líneas de 64 B. ¿Bits de índice?'), a: 7, unit: 'bits', hint: '2¹⁵ / (2² · 2⁶)', why: '2<sup>15</sup> / 2<sup>8</sup> = 2<sup>7</sup>' },
    { type: 'num', q: T('Exam 2022 — L2: 256 KB, 4 ways, 64 B lines. Index bits?', 'Examen 2022 — L2: 256 KB, 4 vías, líneas de 64 B. ¿Bits de índice?'), a: 10, unit: 'bits', why: '2<sup>18</sup> / 2<sup>8</sup> = 2<sup>10</sup>' },
    { type: 'mc', q: T('The statement does not give the address width. What can you say about the tag?', 'El enunciado no da el ancho de la dirección. ¿Qué puedes decir de la etiqueta?'), opts: [T('It is always 16 bits', 'Siempre son 16 bits'), T('It cannot be computed — say “address bits − index − offset”', 'No se puede calcular — di «bits de dirección − índice − desplazamiento»'), T('It equals the index', 'Es igual al índice')], a: 1, why: T('Exactly what the professor said in the 2022 exam walkthrough: not enough data for the tag.', 'Justo lo que dijo el profesor al resolver el examen 2022: faltan datos para la etiqueta.') }
  ];
}

View('anatomy', {
  icon: '②', title: () => T('Address anatomy', 'Anatomía de la dirección'), mins: 20, done: () => ['anatomy'],
  desc: () => T('Tag | index | offset — and what associativity does to each. Drag the ways and watch the bits move.', 'Etiqueta | índice | desplazamiento — y qué les hace la asociatividad. Cambia las vías y mira moverse los bits.'),
  render(m) {
    m.innerHTML = head(T('Lesson 2', 'Lección 2'), T('Address anatomy', 'Anatomía de la dirección'),
      T(`The cache cuts every address into three fields. From the right: ${OFF()} picks the byte inside the line, ${IDX()} picks the set, and ${TAG()} is the name-badge that proves the line in that set is really yours.`,
        `La caché corta cada dirección en tres campos. Desde la derecha: el ${OFF()} elige el byte dentro de la línea, el ${IDX()} elige el conjunto y la ${TAG()} es la credencial que prueba que la línea de ese conjunto es de verdad la tuya.`)) + `
    <div class="card">
      <h3>${T('Same 64 lines, three organisations', 'Las mismas 64 líneas, tres organizaciones')}</h3>
      <p>${T('This is the cache of sheet E4_1: 1 KiB, 16-byte lines → 64 lines, 16-bit addresses. Change only the number of ways (vías) and watch the lines regroup into sets (conjuntos).',
        'Es la caché del boletín E4_1: 1 KiB, líneas de 16 bytes → 64 líneas, direcciones de 16 bits. Cambia solo el número de vías y mira cómo las líneas se reagrupan en conjuntos.')}</p>
      ${segc('ways', [[1, '1', T('direct', 'directa')], [2, '2'], [4, '4'], [8, '8'], [16, '16'], [32, '32'], [64, '64', T('fully assoc.', 'tot. asociativa')]], AN.ways)}
      <div class="an-wrap">
        <div>
          <div class="addr-row"><label>${T('Address', 'Dirección')} 0x</label><input id="ad" class="inp mono" maxlength="4" value="${AN.addr.toString(16).toUpperCase().padStart(4, '0')}"><button class="btn ghost" id="rndA">🎲</button></div>
          <div id="dec" class="decode"></div>
          <button class="btn" id="lk">▶ ${T('Play the lookup, step by step', 'Reproducir la búsqueda, paso a paso')}</button>
          <div id="lkcap" class="lkcap"></div>
          <div id="law" class="law"></div>
        </div>
        <div class="an-right" id="anr">
          <div class="cap" id="gcap"></div>
          <div id="bb"></div>
          <div class="cg-pad"><div class="cgrid" id="cg">${Array.from({ length: 64 }, (_, k) => `<div class="ln" data-k="${k}"></div>`).join('')}</div><div class="rowmark" id="rm"></div></div>
          <div class="zoom" id="zm"></div>
          <svg class="links" id="lnk"></svg>
        </div>
      </div>
    </div>
    <div class="card">
      <h3>${T('The one rule to remember', 'La única regla que hay que recordar')}</h3>
      <div class="rule">
        <div><span class="c-off">■</span> ${T('<b>Offset</b> = log₂(line size). Never moves.', '<b>Desplazamiento</b> = log₂(tamaño de línea). Nunca se mueve.')}</div>
        <div><span class="c-idx">■</span> ${T('<b>Index</b> = log₂(sets), with sets = size / (line × ways).', '<b>Índice</b> = log₂(conjuntos), con conjuntos = tamaño / (línea × vías).')}</div>
        <div><span class="c-tag">■</span> ${T('<b>Tag</b> = whatever is left: address bits − index − offset.', '<b>Etiqueta</b> = lo que sobra: bits de dirección − índice − desplazamiento.')}</div>
      </div>
      <p class="big-rule">${T('Ways ×2 → sets ÷2 → index −1 bit → tag +1 bit', 'Vías ×2 → conjuntos ÷2 → índice −1 bit → etiqueta +1 bit')}</p>
      <p class="mute">${T('Why the tag must grow: with fewer sets, more different blocks land in the same set, so the badge needs more bits to tell them apart. And more ways = more tags compared in parallel = more area, energy and latency.',
        'Por qué crece la etiqueta: con menos conjuntos, más bloques distintos caen en el mismo conjunto, así que la credencial necesita más bits para distinguirlos. Y más vías = más etiquetas comparadas en paralelo = más área, energía y latencia.')}</p>
    </div>
    <div class="card">
      <h3>${T('Any cache calculator', 'Calculadora para cualquier caché')}</h3>
      <div class="ctl-row">
        <label>${T('Address bits', 'Bits de dirección')}<select id="cb">${[16, 32, 48, 64].map(v => `<option ${v === AN.c.bits ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>${T('Cache size', 'Tamaño')}<select id="cs">${[10, 12, 13, 14, 15, 16, 18, 20, 23].map(v => `<option value="${v}" ${v === AN.c.size ? 'selected' : ''}>${fmtB(2 ** v)}</option>`).join('')}</select></label>
        <label>${T('Line', 'Línea')}<select id="cl">${[4, 5, 6, 7].map(v => `<option value="${v}" ${v === AN.c.line ? 'selected' : ''}>${2 ** v} B</option>`).join('')}</select></label>
        <label>${T('Ways', 'Vías')}<select id="cw">${[0, 1, 2, 3, 4, 99].map(v => `<option value="${v}" ${v === AN.c.ways ? 'selected' : ''}>${v === 99 ? T('fully associative', 'totalmente asociativa') : v === 0 ? T('1 (direct)', '1 (directa)') : 2 ** v}</option>`).join('')}</select></label>
      </div>
      <div id="cbb"></div><div id="cwork" class="work"></div>
    </div>
    <h2>${T('Checkpoint — from memory', 'Punto de control — de memoria')}</h2>
    <div id="q"></div>${nextLink('lab')}`;

    /* demo */
    const bb = makeBitBar(16); $('#bb', m).appendChild(bb.el);
    const grid = $('#cg', m), cells = $$('.ln', grid);
    const anr = $('#anr', m), svg = $('#lnk', m), rm = $('#rm', m), zm = $('#zm', m);
    let tracing = 0, alive = true;
    onLeave(() => { alive = false; tracing++; });
    /* connectors: index -> row, tag -> stored tags of that row, offset -> byte in the matching line */
    const drawLinks = () => {
      const g = AN.g; if (!g || !alive) return;
      const R = anr.getBoundingClientRect();
      const bx = e => { const r = e.getBoundingClientRect(); return { l: r.left - R.left, r: r.right - R.left, t: r.top - R.top, b: r.bottom - R.top, cx: (r.left + r.right) / 2 - R.left, cy: (r.top + r.bottom) / 2 - R.top }; };
      const tg = $$('.ln.tgt', grid), c0 = tg[0], c1 = tg[tg.length - 1];
      rm.style.cssText = `left:${c0.offsetLeft - 3}px;top:${c0.offsetTop - 3}px;width:${c1.offsetLeft + c1.offsetWidth - c0.offsetLeft + 6}px;height:${c1.offsetTop + c1.offsetHeight - c0.offsetTop + 6}px`;
      rm.innerHTML = `<span>${g.ix ? T('set', 'conj.') + ' ' + g.set : T('one single set', 'un único conjunto')}</span>`;
      const M = bx(rm), pad = bx($('.cg-pad', m)), st = AN.stage, an = AN.anim;
      const sT = bx($('.s-tag', bb.el)), sI = bx($('.s-idx', bb.el)), sO = bx($('.s-off', bb.el));
      const C = bx($('.ln.mw', grid)), B = bx($('.ln.mw .on', grid));
      const ixx = Math.max(M.l + 8, Math.min(M.r - 8, sI.cx)), cw = C.r - C.l, inset = Math.min(cw * 0.3, 14);
      let tx = C.l + inset; if (g.ix && Math.abs(tx - ixx) < 9) tx = C.r - inset;
      let h = '';
      if (g.ix && st >= 1) h += `<path class="lk i ${an === 1 ? 'draw' : ''}" pathLength="1" d="M${ixx} ${sI.b} V${M.t}"/><circle class="lkd i" cx="${ixx}" cy="${M.t}" r="5"/>`;
      if (st >= 2) h += `<path class="lk t ${an === 2 ? 'draw' : ''}" pathLength="1" d="M${sT.cx} ${sT.b} V${sT.b + 10} H${tx} V${C.t}"/><circle class="lkd t" cx="${tx}" cy="${C.t}" r="5"/>`;
      if (st >= 3) { const gx = pad.r - 13, yb = M.b + 11; h += `<path class="lk o ${an === 3 ? 'draw' : ''}" pathLength="1" d="M${sO.cx} ${sO.b} V${sO.b + 10} H${gx} V${yb} H${B.cx} V${B.b}"/><circle class="lkd o" cx="${B.cx}" cy="${B.b}" r="5"/>`; }
      svg.setAttribute('width', R.width); svg.setAttribute('height', R.height); svg.innerHTML = h;
    };
    const follow = () => { const t0 = performance.now(); const f = () => { if (!alive || AN.anim) return; drawLinks(); if (performance.now() - t0 < 900) requestAnimationFrame(f); }; requestAnimationFrame(f); };
    const drawZoom = () => {
      const g = AN.g, shown = Math.min(g.w, 8), mw = g.mw, mod = 2 ** g.tg;
      const other = k => { let t = (g.tagv + 1 + k * 37) % mod; if (t === g.tagv) t = (t + 1) % mod; return t; };
      zm.innerHTML = `<div class="zm-h">${g.ix ? T(`Set ${g.set}, zoomed in`, `Conjunto ${g.set}, ampliado`) : T('The single set, zoomed in', 'El único conjunto, ampliado')} — ${g.w} ${T(g.w === 1 ? 'line (way)' : 'lines (ways)', g.w === 1 ? 'línea (vía)' : 'líneas (vías)')}${g.w > 8 ? T(', first 8 shown', ', se muestran 8') : ''}</div>
        <div class="zm-cmp"><span class="zchip" id="ztag">${T('tag', 'etiqueta')} ${bin(g.tagv, g.tg)}</span><span>${T('compared with each stored tag', 'se compara con cada etiqueta guardada')} ↓</span></div>
        <div class="zways">${Array.from({ length: shown }, (_, k) => `<div class="zway ${k === mw ? 'match' : ''}"><small>${T('way', 'vía')} ${k}</small><b>${bin(k === mw ? g.tagv : other(k), g.tg)}</b><i>${k === mw ? '= ✓' : '≠'}</i></div>`).join('')}</div>
        <div class="zm-h2">${T(`The matching line holds 16 bytes — the offset picks one`, `La línea que coincide guarda 16 bytes — el desplazamiento elige uno`)}</div>
        <div class="zbytes">${Array.from({ length: 16 }, (_, k) => `<span ${k === g.off ? 'class="on" id="zbyte"' : ''}>${k}</span>`).join('')}</div>`;
    };
    const stage = () => {
      const g = AN.g, st = AN.stage, an = AN.anim;
      anr.dataset.st = st;
      bb.update(g.tg, g.ix, 4, AN.addr, an === 1 && g.ix ? 'idx' : an === 2 ? 'tag' : an === 3 ? 'off' : null);
      const steps = [
        ['i', g.ix ? T(`<b class="c-idx">Index ${bin(g.set, g.ix)}</b> = ${g.set} → go straight to row (set) ${g.set}. No other row is even looked at.`, `<b class="c-idx">Índice ${bin(g.set, g.ix)}</b> = ${g.set} → directo a la fila (conjunto) ${g.set}. No se mira ninguna otra fila.`)
          : T('<b class="c-idx">No index bits</b>: there is one single set, so the whole cache is “the row”.', '<b class="c-idx">Sin bits de índice</b>: hay un único conjunto, así que toda la caché es «la fila».')],
        ['t', T(`<b class="c-tag">Tag ${bin(g.tagv, g.tg)}</b> is compared with the tag stored in ${g.w === 1 ? 'the one line of that row' : `each of the ${g.w} lines of that row, all at once`}. A match is a hit (acierto); no match is a miss (fallo).`,
          `La <b class="c-tag">etiqueta ${bin(g.tagv, g.tg)}</b> se compara con la etiqueta guardada en ${g.w === 1 ? 'la única línea de esa fila' : `cada una de las ${g.w} líneas de esa fila, a la vez`}. Si coincide, acierto; si no, fallo.`)],
        ['o', T(`<b class="c-off">Offset ${bin(g.off, 4)}</b> = ${g.off} → inside the matching line, take byte ${g.off}.`, `<b class="c-off">Desplazamiento ${bin(g.off, 4)}</b> = ${g.off} → dentro de la línea que coincide, toma el byte ${g.off}.`)]
      ];
      $('#lkcap', m).innerHTML = steps.map(([c, s], k) => `<div class="lks ${c} ${an && an !== k + 1 ? 'dimd' : ''} ${st < k + 1 ? 'hid' : ''}"><b>${k + 1}</b><span>${s}</span></div>`).join('');
      drawLinks();
    };
    const trace = async () => {
      const id = ++tracing;
      for (let s = 0; s <= 3; s++) {
        AN.stage = s; AN.anim = s; stage();
        if (s === 1) sfx.tick(); if (s === 2) sfx.hit(); if (s === 3) sfx.ok();
        await sleep(s === 0 ? 350 : 1700);
        if (id !== tracing || !alive) return;
      }
      AN.anim = 0; stage();
    };
    $('#lk', m).onclick = trace;
    const rz = () => { if (!AN.anim) drawLinks(); };
    window.addEventListener('resize', rz); onLeave(() => window.removeEventListener('resize', rz));
    const stp = f => `<div class="stp"><button data-f="${f}" data-d="1" aria-label="+1">▲</button><button data-f="${f}" data-d="-1" aria-label="−1">▼</button></div>`;
    const apply = () => {
      const w = AN.ways, sets = 64 / w, ix = lg(sets), tg = 16 - ix - 4;
      grid.style.gridTemplateColumns = `repeat(${w},1fr)`; grid.style.gridTemplateRows = `repeat(${sets},1fr)`;
      const set = (AN.addr >> 4) & (sets - 1), tagv = AN.addr >> (4 + ix), off = AN.addr & 15;
      const mw = tagv % Math.min(w, 8);
      cells.forEach((c, k) => {
        const hit = k === set * w + mw;
        c.classList.toggle('tgt', Math.floor(k / w) === set); c.classList.toggle('mw', hit); c.classList.toggle('col', hit && w >= 16);
        c.innerHTML = hit ? Array.from({ length: 16 }, (_, b) => `<span ${b === off ? 'class="on"' : ''}></span>`).join('') : '';
      });
      tracing++; AN.stage = 3; AN.anim = 0;
      AN.g = { w, sets, ix, tg, set, tagv, off, mw };
      drawZoom(); stage(); follow();
      $('#gcap', m).innerHTML = `<b>${sets}</b> ${T(sets === 1 ? 'set' : 'sets', sets === 1 ? 'conjunto' : 'conjuntos')} × <b>${w}</b> ${T(w === 1 ? 'way' : 'ways', w === 1 ? 'vía' : 'vías')} = 64 ${T('lines', 'líneas')} · ${w === 1 ? T('direct mapped', 'correspondencia directa') : w === 64 ? T('fully associative', 'totalmente asociativa') : T(w + '-way set associative', `asociativa por conjuntos de ${w} vías`)}`;
      $('#dec', m).innerHTML = `
        <div class="d t"><span>${T('tag', 'etiqueta')}</span><b>${bin(tagv, tg)}</b><em>= ${tagv}</em>${stp('t')}</div>
        <div class="d i"><span>${T('set', 'conjunto')}</span><b>${ix ? bin(set, ix) : '—'}</b><em>${ix ? '= ' + set : T('no index', 'sin índice')}</em>${ix ? stp('i') : ''}</div>
        <div class="d o"><span>${T('offset', 'despl.')}</span><b>${bin(off, 4)}</b><em>= ${off}</em>${stp('o')}</div>`;
      $$('#dec [data-f]', m).forEach(b => (b.onclick = () => {
        const d = +b.dataset.d, f = b.dataset.f, wrap = (v, bits) => (v + d + 2 ** bits) % 2 ** bits;
        const t2 = f === 't' ? wrap(tagv, tg) : tagv, s2 = f === 'i' ? wrap(set, ix) : set, o2 = f === 'o' ? wrap(off, 4) : off;
        AN.addr = t2 * 2 ** (4 + ix) + s2 * 16 + o2;
        $('#ad', m).value = AN.addr.toString(16).toUpperCase().padStart(4, '0');
        sfx.tick(); apply();
      }));
      $('#law', m).innerHTML = w === 1
        ? T(`The block can live in <b>exactly one</b> line: line ${set}. Fast (one comparison) but two blocks with the same index keep kicking each other out.`, `El bloque solo puede vivir en <b>una única</b> línea: la ${set}. Rápido (una comparación), pero dos bloques con el mismo índice se expulsan mutuamente.`)
        : w === 64 ? T('The block can live in <b>any</b> of the 64 lines. No conflict misses — but 64 tags compared at once.', 'El bloque puede vivir en <b>cualquiera</b> de las 64 líneas. Sin fallos de conflicto — pero 64 etiquetas comparadas a la vez.')
          : T(`The index picks set ${set}; the block may take any of its <b>${w}</b> lines (lines ${set * w}–${set * w + w - 1}). ${w} tags compared in parallel.`, `El índice elige el conjunto ${set}; el bloque puede ocupar cualquiera de sus <b>${w}</b> líneas (líneas ${set * w}–${set * w + w - 1}). ${w} etiquetas comparadas en paralelo.`);
    };
    apply();
    onSeg(m, 'ways', v => {
      const before = cells.map(c => c.getBoundingClientRect());
      AN.ways = +v; apply();
      cells.forEach((c, i) => {
        const b = before[i], a = c.getBoundingClientRect();
        if (!a.width || !a.height) return;
        c.animate([{ transformOrigin: '0 0', transform: `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${b.width / a.width},${b.height / a.height})` }, { transformOrigin: '0 0', transform: 'none' }],
          { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', delay: i * 3 });
      });
      sfx.pop();
    });
    const ad = $('#ad', m);
    ad.oninput = () => { const v = parseInt(ad.value, 16); if (!isNaN(v) && /^[0-9a-fA-F]{1,4}$/.test(ad.value)) { AN.addr = v; apply(); } };
    $('#rndA', m).onclick = () => { AN.addr = rnd(65536); ad.value = AN.addr.toString(16).toUpperCase().padStart(4, '0'); sfx.tick(); apply(); };

    /* calculator */
    let cbar = null, cbits = 0;
    const calc = () => {
      const c = AN.c, lines = c.size - c.line;
      const w = c.ways === 99 ? lines : Math.min(c.ways, lines), ix = lines - w, tg = c.bits - ix - c.line;
      if (cbits !== c.bits) { cbar = makeBitBar(c.bits); $('#cbb', m).innerHTML = ''; $('#cbb', m).appendChild(cbar.el); cbits = c.bits; }
      cbar.update(tg, ix, c.line);
      $('#cwork', m).innerHTML = `
        <div><span class="c-off">${T('offset', 'despl.')}</span> = log₂(${2 ** c.line}) = <b>${c.line}</b></div>
        <div>${T('sets', 'conjuntos')} = 2<sup>${c.size}</sup> / (2<sup>${w}</sup> · 2<sup>${c.line}</sup>) = 2<sup>${ix}</sup> = ${2 ** ix} → <span class="c-idx">${T('index', 'índice')}</span> = <b>${ix}</b></div>
        <div><span class="c-tag">${T('tag', 'etiqueta')}</span> = ${c.bits} − ${ix} − ${c.line} = <b>${tg}</b></div>`;
    };
    [['cb', 'bits'], ['cs', 'size'], ['cl', 'line'], ['cw', 'ways']].forEach(([id, k]) => ($('#' + id, m).onchange = e => { AN.c[k] = +e.target.value; sfx.tick(); calc(); }));
    calc();
    Quiz($('#q', m), 'anatomy', anatomyQs());
  }
});
