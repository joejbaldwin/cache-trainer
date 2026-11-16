'use strict';
/* Lesson 4: the theory of Tema 4, unit by unit, following slide decks L4_1 – L4_4.
   Every fact here comes from those slides (slide numbers shown on each block). */

const TH_UNITS = () => [
  ['a', T('Why caches exist', 'Por qué existe la caché'), 'L4_1 · 2–5'],
  ['b', T('Placing and finding a block', 'Ubicar e identificar un bloque'), 'L4_1 · 6–9'],
  ['c', T('Writes and the write buffer', 'Escrituras y búfer de escritura'), 'L4_1 · 10–12, L4_3 · 12–14'],
  ['d', T('Basic optimisations', 'Optimizaciones básicas'), 'L4_2'],
  ['e', T('Advanced optimisations', 'Optimizaciones avanzadas'), 'L4_3'],
  ['f', T('Compiler optimisations', 'Optimizaciones del compilador'), 'L4_4']
];
const gc = c => `<span class="gc ${c}">${{ h: T('↓ hit time', '↓ tiempo de acierto'), b: T('↑ bandwidth', '↑ ancho de banda'), p: T('↓ miss penalty', '↓ penalización'), m: T('↓ misses', '↓ fallos') }[c]}</span>`;

/* ---------- unit A: why caches exist ---------- */
function thA() {
  const row = (n, size, t, w, bw, who, cls = '') => `<tr class="${cls}"><th>${n}</th><td>${size}</td><td><span class="hbar" style="width:${w}px"></span>${hn(t + ' ns')}</td><td>${bw} MB/s</td><td>${hk(who)}</td></tr>`;
  return {
    idea: T('The CPU got faster much more quickly than memory did. The cache hides that gap by keeping close what the program is about to use, and it can guess what that is because programs are predictable.',
      'La CPU avanzó mucho más rápido que la memoria. La caché oculta esa brecha manteniendo cerca lo que el programa está a punto de usar, y puede adivinarlo porque los programas son predecibles.'),
    html: cb(T('The memory hierarchy <i>(jerarquía de memoria)</i>', 'La jerarquía de memoria'), 'L4_1 · 2', `
      <table class="tbl hier"><tr><th>${T('Level', 'Nivel')}</th><th>${T('Typical size', 'Tamaño típico')}</th><th>${T('Access time', 'Tiempo de acceso')}</th><th>${T('Bandwidth', 'Ancho de banda')}</th><th>${T('Managed by', 'Gestionado por')}</th></tr>
      ${row(T('Registers <i>(registros)</i>', 'Registros'), '&lt; 4 KB', '0,1', 6, '10.000.000', T('compiler', 'compilador'))}
      ${row(T('Cache <i>(caché)</i>', 'Caché'), '32 KB – 256 MB', '0,5', 14, '50.000', 'hardware', 'hl')}
      ${row(T('Main memory <i>(memoria principal)</i>', 'Memoria principal'), '8 GB – 1024 GB', '30', 38, '30.000', T('operating system', 'sistema operativo'))}
      ${row(T('Disk <i>(almacenamiento en disco)</i>', 'Almacenamiento en disco'), '&gt; 1 TB', '5.000.000', 100, '1000', T('operating system', 'sistema operativo'))}</table>
      <p>${T(`Each step down gives ${hp('more capacity')} and costs ${hc('more latency')}. The cache is the only level managed by the hardware itself.`,
        `Cada escalón hacia abajo da ${hp('más capacidad')} y cuesta ${hc('más latencia')}. La caché es el único nivel gestionado por el propio hardware.`)}</p>
      <p class="mute">${T('The bar is a rough logarithmic scale of the access time: disk is ten million times slower than cache.', 'La barra es una escala logarítmica aproximada del tiempo de acceso: el disco es diez millones de veces más lento que la caché.')}</p>`) +
    cb(T('The memory wall <i>(muro de memoria)</i>', 'El muro de memoria'), 'L4_1 · 3–4', `
      <p>${T(`Lower latency means more performance. Between ${hn('1980 and 2005')} the CPU advanced far more than memory. That gap is the ${hk('memory wall')}: the processor spends more and more time ${hc('waiting for data')}.`,
        `Menor latencia implica mayor rendimiento. Entre ${hn('1980 y 2005')} la CPU avanzó mucho más que la memoria. Esa brecha es el ${hk('muro de memoria')}: el procesador pasa cada vez más tiempo ${hc('esperando datos')}.`)}</p>
      <p>${T(`Since the mid-2000s per-core performance grows more slowly, but the demand on memory keeps rising because of parallelism: a multicore processor generates ${hk('several accesses at the same time')}, and more cores need ${hk('more bandwidth')} <i>(ancho de banda)</i>.`,
        `Desde mediados de los 2000 el rendimiento por núcleo crece más despacio, pero la demanda sobre la memoria sigue aumentando por el paralelismo: un procesador multinúcleo genera ${hk('múltiples accesos simultáneos')}, y más núcleos exigen ${hk('mayor ancho de banda')}.`)}</p>
      <div class="pills"><b>${T('What narrows the gap', 'Qué reduce la brecha')}</b>${hk(T('multilevel caches', 'cachés multinivel'))}${hk(T('banks', 'bancos'))}${hk(T('separate instruction and data caches', 'separación de instrucciones y datos'))}</div>
      <p>${T(`These ${hc('do not remove the latency')}. They ${hp('reduce how many accesses reach memory')}.`, `${hc('No eliminan la latencia')}, pero ${hp('reducen los accesos a memoria')}.`)}</p>
      <p>${T(`The unit of transfer between levels is the ${hk('block')} <i>(bloque)</i>, made of contiguous words. Each block occupies one ${hk('cache line')} <i>(línea)</i>.`,
        `La unidad de transferencia es el ${hk('bloque')}, formado por palabras contiguas. Cada bloque ocupa una ${hk('línea de caché')}.`)}</p>`) +
    cb(T('The principle of locality <i>(principio de localidad)</i>', 'El principio de localidad'), 'L4_1 · 5', `
      <p>${T('Programs use few addresses during short intervals. The cache takes advantage of both kinds of locality.', 'Los programas usan pocas direcciones durante intervalos breves. La caché aprovecha ambas localidades.')}</p>
      <div class="grid2 tight">
        <div class="mini t"><h4>${hk(T('Temporal locality', 'Localidad temporal'))}</h4><p>${T('What was used recently tends to be used again. Examples: loops and reused variables.', 'Lo usado recientemente suele reutilizarse. Ejemplos: bucles y variables reutilizadas.')}</p>
          <pre class="code">for (int i = 0; i &lt; T; i++) {
  <span class="cg">suma</span> += 5;   // ${T('same variable every time', 'la misma variable cada vez')}
}</pre></div>
        <div class="mini s"><h4>${hk(T('Spatial locality', 'Localidad espacial'))}</h4><p>${T('After an access, nearby addresses tend to be accessed. Examples: sequential instructions and ordered traversals.', 'Tras un acceso suelen accederse direcciones cercanas. Ejemplos: instrucciones secuenciales y recorridos ordenados.')}</p>
          <pre class="code">for (int i = 0; i &lt; FILAS; i++) {
  <span class="cb2">vector[i]</span> = 5;   // ${T('the neighbour is next', 'el vecino va después')}
}</pre></div>
      </div>
      ${why(T('Why does a cache line hold a whole block of bytes rather than one?', '¿Por qué una línea de caché guarda un bloque entero de bytes y no uno solo?'),
        T('Spatial locality. Bringing the neighbours along with the byte you asked for means the next accesses are already in the cache. (L4_2: big blocks exploit spatial locality.)', 'Localidad espacial. Traer los vecinos junto con el byte pedido hace que los siguientes accesos ya estén en caché. (L4_2: los bloques grandes aprovechan la localidad espacial.)'))}
      ${why(T('In the first loop, which locality does the counter <code>i</code> itself show?', 'En el primer bucle, ¿qué localidad muestra el propio contador <code>i</code>?'),
        T('Temporal: it is read and written again on every iteration.', 'Temporal: se lee y se escribe de nuevo en cada iteración.'))}`),
    qs: [
      { type: 'mc', q: T('Which level of the hierarchy is managed by the hardware?', '¿Qué nivel de la jerarquía gestiona el hardware?'), opts: [T('Registers', 'Registros'), T('Cache', 'Caché'), T('Main memory', 'Memoria principal')], a: 1, why: T('Registers: compiler. Main memory and disk: operating system.', 'Registros: compilador. Memoria principal y disco: sistema operativo.') },
      { type: 'mc', q: T('The “memory wall” means…', 'El «muro de memoria» significa que…'), opts: [T('memory ran out of capacity', 'la memoria se quedó sin capacidad'), T('the CPU improved much faster than memory, so it waits more for data', 'la CPU avanzó mucho más que la memoria, así que espera más por los datos'), T('caches cannot grow any further', 'las cachés no pueden crecer más')], a: 1 },
      { type: 'mc', q: T('Multilevel caches, banks and split instruction/data caches…', 'Las cachés multinivel, los bancos y la separación de instrucciones y datos…'), opts: [T('remove the memory latency', 'eliminan la latencia de memoria'), T('reduce the accesses that reach memory', 'reducen los accesos a memoria'), T('raise the clock frequency', 'suben la frecuencia de reloj')], a: 1, why: T('The slide is explicit: they do not eliminate the latency.', 'La diapositiva es explícita: no eliminan la latencia.') },
      { type: 'mc', q: T('A loop writes <code>vector[i] = 5</code> for i = 0, 1, 2… The accesses to <code>vector</code> show…', 'Un bucle escribe <code>vector[i] = 5</code> para i = 0, 1, 2… Los accesos a <code>vector</code> muestran…'), opts: [T('temporal locality', 'localidad temporal'), T('spatial locality', 'localidad espacial')], a: 1, why: T('Each access is next to the previous one. No element is reused.', 'Cada acceso está junto al anterior. Ningún elemento se reutiliza.') },
      { type: 'mc', q: T('What is transferred between levels, and where does it land?', '¿Qué se transfiere entre niveles y dónde queda?'), opts: [T('a word, in a register', 'una palabra, en un registro'), T('a block of contiguous words, in one cache line', 'un bloque de palabras contiguas, en una línea de caché'), T('a page, in a set', 'una página, en un conjunto')], a: 1 }
    ]
  };
}

/* ---------- unit B: placing and finding ---------- */
function thB() {
  const pm = (on, gap) => `<div class="pm">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<i class="${on.includes(i) ? 'on' : ''}${gap && i && i % gap === 0 ? ' gp' : ''}"></i>`).join('')}</div>`;
  return {
    idea: T('Two questions per access: where is this block allowed to live, and is it really there? Associativity answers the first, the tag and valid bit answer the second.',
      'Dos preguntas en cada acceso: ¿dónde puede vivir este bloque? y ¿está realmente ahí? La asociatividad responde a la primera; la etiqueta y el bit de validez, a la segunda.'),
    html: cb(T('Where can a block go? <i>(ubicación)</i>', '¿Dónde puede ir un bloque? (ubicación)'), 'L4_1 · 6', `
      <table class="tbl vs"><tr><th></th><th>${T('Allowed lines for one block', 'Líneas permitidas para un bloque')}</th><th>${T('Good', 'Bueno')}</th><th>${T('Price', 'Precio')}</th></tr>
      <tr><th>${hk(T('Direct mapped', 'Correspondencia directa'))}<small>${T('correspondencia directa / mapeo directo', 'o mapeo directo')}</small></th><td>${pm([5])}${T('exactly one line', 'una única línea')}</td><td>${hp(T('fast and simple', 'rápida y simple'))}</td><td>${hc(T('generates conflicts', 'genera conflictos'))}</td></tr>
      <tr><th>${hk(T('Set associative', 'Asociativa por conjuntos'))}<small>${T('asociativa por conjuntos', '')}</small></th><td>${pm([4, 5], 2)}${T('the address chooses the set, the block takes a way <i>(vía)</i>', 'la dirección elige un conjunto y el bloque una vía')}</td><td colspan="2">${T('the compromise between the two', 'el compromiso entre ambas')}</td></tr>
      <tr><th>${hk(T('Fully associative', 'Totalmente asociativa'))}<small>${T('totalmente asociativa', '')}</small></th><td>${pm([0, 1, 2, 3, 4, 5, 6, 7])}${T('any line', 'cualquier línea')}</td><td>${hp(T('fewer conflicts', 'reduce conflictos'))}</td><td>${hc(T('compares many tags', 'compara muchas etiquetas'))}</td></tr></table>
      <div class="law2">${T(`More associativity → ${hp('fewer conflicts')}, but ${hc('more cost, energy and latency')}.`, `Más asociatividad → ${hp('menos conflictos')}, pero ${hc('más coste, energía y latencia')}.`)}</div>`) +
    cb(T('Is it really there? <i>(identificación)</i>', '¿Está realmente ahí? (identificación)'), 'L4_1 · 8', `
      <ul class="keyl">
        <li>${T(`The ${IDX()} selects the line or the set. The tags of that set are compared ${hk('in parallel')}.`, `El ${IDX()} selecciona la línea o el conjunto. Las etiquetas se comparan ${hk('en paralelo')}.`)}</li>
        <li>${T(`The ${TAG()} identifies which block is stored. The ${hk('valid bit')} <i>(bit de validez)</i> confirms the line is usable.`, `La ${TAG()} identifica el bloque almacenado. El ${hk('bit de validez')} confirma si la línea es utilizable.`)}</li>
        <li>${T(`The ${OFF()} selects the data inside the block.`, `El ${OFF()} selecciona el dato dentro del bloque.`)}</li>
        <li>${T(`More associativity means ${hk('fewer index bits and more tag bits')}.`, `Más asociatividad implica ${hk('menos bits de índice y más de etiqueta')}.`)}</li>
      </ul>
      <p class="mute">${T('A hit needs both: a matching tag <b>and</b> valid = 1. The numbers are drilled in Lessons 1–2.', 'Un acierto exige ambas cosas: etiqueta coincidente <b>y</b> validez = 1. Los números se practican en las Lecciones 1–2.')}</p>`) +
    cb(T('Why misses happen: the three causes', 'Por qué hay fallos: las tres causas'), 'L4_1 · 7, L4_2 · 3', `
      <div class="tri">
        <div class="tc c1"><h4>${hk(T('Compulsory', 'Obligatorios'))}</h4><small>${T('obligatorios / forzosos · cold start misses', 'o forzosos · cold start misses')}</small><p>${T('Appear on the first access. Unavoidable: the cache starts empty.', 'Aparecen en el primer acceso y son inevitables: la caché está inicialmente vacía.')}</p></div>
        <div class="tc c2"><h4>${hk(T('Capacity', 'De capacidad'))}</h4><small>${T('de capacidad', '&nbsp;')}</small><p>${T('The working set <i>(conjunto de trabajo)</i> is bigger than the space available, so a block that was already used has to be evicted.', 'El conjunto de trabajo supera el espacio disponible y un bloque previamente utilizado debe ser expulsado.')}</p></div>
        <div class="tc c3"><h4>${hk(T('Conflict', 'De conflicto'))}</h4><small>${T('de conflicto', '&nbsp;')}</small><p>${T(`Several blocks compete for the same line or set, ${hk('even though other positions are free')}. They do not exist in fully associative caches.`, `Varios bloques compiten por la misma línea o conjunto, ${hk('aunque existan otras posiciones libres')}. No existen en cachés totalmente asociativas.`)}</p></div>
      </div>
      <div class="flowq"><b>${T('How to classify a miss (the method the lab uses)', 'Cómo clasificar un fallo (el método del laboratorio)')}</b>
        <span>${T('First time this block is touched?', '¿Primera vez que se toca el bloque?')}<em>${T('yes → compulsory', 'sí → obligatorio')}</em></span><i>→</i>
        <span>${T('Would a fully associative cache of the same size still have it?', '¿Lo conservaría una caché totalmente asociativa del mismo tamaño?')}<em>${T('no → capacity · yes → conflict', 'no → capacidad · sí → conflicto')}</em></span></div>
      <div class="pills"><b>${T('Solutions on the slide', 'Soluciones de la diapositiva')}</b>${hk('prefetch')}${hk(T('bigger blocks', 'bloques mayores'))}${hk(T('more capacity', 'más capacidad'))}${hk(T('more associativity', 'más asociatividad'))}</div>
      ${trap(T('A conflict miss needs free room somewhere else in the cache. If every line is busy with blocks you are still using, it is a capacity miss, and more ways will not fix it.', 'Un fallo de conflicto exige que haya sitio libre en otra parte de la caché. Si todas las líneas están ocupadas por bloques que sigues usando, es de capacidad, y más vías no lo arreglan.'))}`) +
    cb(T('Who gets evicted? <i>(política de reemplazo)</i>', '¿A quién se expulsa? (política de reemplazo)'), 'L4_1 · 9', `
      <p>${T(`Replacement only acts when ${hk('every way of the set is occupied')}.`, `El reemplazo actúa cuando ${hk('todas las vías están ocupadas')}.`)}</p>
      <table class="tbl vs"><tr><th>${hk(T('Direct mapped', 'Correspondencia directa'))}</th><td colspan="2">${T('no choice: it evicts one determined block', 'no hay elección: expulsa un bloque determinado')}</td></tr>
      <tr><th>${hk(T('Random', 'Aleatoria'))}</th><td>${hp(T('simple', 'simple'))}</td><td>${T(`effective with ${hk('high associativity')}`, `eficaz con ${hk('alta asociatividad')}`)}</td></tr>
      <tr><th>${hk('LRU')}</th><td>${T('evicts the least recently used block', 'expulsa el bloque menos usado recientemente')}</td><td>${hc(T('its cost grows with the number of ways', 'su coste aumenta con el número de vías'))}</td></tr>
      <tr><th>${hk('FIFO')}</th><td>${T('evicts the oldest block in the set', 'expulsa el bloque más antiguo del conjunto')}</td><td>${hp(T('simpler than LRU', 'más simple que LRU'))}, ${hc(T('but does not predict reuse', 'pero no predice la reutilización'))}</td></tr></table>
      <div class="exbox"><b>${T('Tell them apart', 'Distínguelas')}</b> ${T(`A 2-way set receives A, B, A, and then C arrives. ${hk('LRU evicts B')} (A was just used). ${hk('FIFO evicts A')} (it was loaded first, and its reuse is ignored).`, `Un conjunto de 2 vías recibe A, B, A, y entonces llega C. ${hk('LRU expulsa B')} (A se acaba de usar). ${hk('FIFO expulsa A')} (se cargó primero, y su reutilización se ignora).`)}</div>`),
    qs: [
      { type: 'mc', q: T('Which kind of miss cannot occur in a fully associative cache?', '¿Qué tipo de fallo no existe en una caché totalmente asociativa?'), opts: [T('Compulsory', 'Obligatorio'), T('Capacity', 'De capacidad'), T('Conflict', 'De conflicto')], a: 2, why: T('Any block can use any line, so nobody is forced to fight over one position.', 'Cualquier bloque puede usar cualquier línea, así que nadie compite por una posición.') },
      { type: 'mc', q: T('The tag matches but the valid bit is 0. Result?', 'La etiqueta coincide pero el bit de validez es 0. ¿Resultado?'), opts: [T('Hit', 'Acierto'), T('Miss', 'Fallo')], a: 1, why: T('The valid bit says whether the line is usable at all.', 'El bit de validez indica si la línea es utilizable.') },
      { type: 'mc', q: T('Same cache size and line size, 2 ways → 4 ways. The address fields change how?', 'Mismo tamaño de caché y de línea, 2 vías → 4 vías. ¿Cómo cambian los campos?'), opts: [T('index −1 bit, tag +1 bit, offset unchanged', 'índice −1 bit, etiqueta +1 bit, desplazamiento igual'), T('index +1 bit, tag −1 bit, offset unchanged', 'índice +1 bit, etiqueta −1 bit, desplazamiento igual'), T('offset −1 bit, tag +1 bit', 'desplazamiento −1 bit, etiqueta +1 bit')], a: 0 },
      { type: 'mc', q: T('A 2-way set receives A, B, A. Then C arrives. Who does <b>FIFO</b> evict?', 'Un conjunto de 2 vías recibe A, B, A. Entonces llega C. ¿A quién expulsa <b>FIFO</b>?'), opts: ['A', 'B'], a: 0, why: T('A is the oldest loaded. FIFO does not notice it was just reused. LRU would evict B.', 'A es la más antigua. FIFO no ve que se acaba de reutilizar. LRU expulsaría B.') },
      { type: 'mc', q: T('A big array is walked once. Every 16th access misses and each of those blocks had never been touched before. These misses are…', 'Se recorre un array grande una vez. Falla uno de cada 16 accesos y ninguno de esos bloques se había tocado antes. Estos fallos son…'), opts: [T('compulsory', 'obligatorios'), T('capacity', 'de capacidad'), T('conflict', 'de conflicto')], a: 0 },
      { type: 'mc', q: T('Random replacement is described as effective when…', 'La política aleatoria se describe como eficaz cuando…'), opts: [T('the cache is direct mapped', 'la caché es de correspondencia directa'), T('associativity is high', 'la asociatividad es alta'), T('lines are small', 'las líneas son pequeñas')], a: 1 }
    ]
  };
}

/* ---------- unit C: writes ---------- */
function thC() {
  const tl = (name, cells, note) => `<div class="tl"><b>${name}</b><div>${cells.map(([t, d]) => `<span class="${d ? 'dn' : ''}${t === 'E' ? ' ev' : ''}">${t === 'E' ? T('evict', 'expulsar') : T('write', 'escribir')}${d ? '<i>↓</i>' : ''}</span>`).join('')}</div><small>${note}</small></div>`;
  const be = (a, v) => `<div class="be"><code>${a}</code>${v.map(x => `<i class="${x ? 'v' : ''}">${x ? 'V' : ''}</i>`).join('')}</div>`;
  return {
    idea: T('A write creates two versions of the truth: the copy in the cache and the copy below. Write-through keeps them equal by paying on every write. Write-back lets them differ and pays once, at eviction.',
      'Una escritura crea dos versiones de la verdad: la copia en caché y la de abajo. Write-through las mantiene iguales pagando en cada escritura. Write-back deja que difieran y paga una vez, al expulsar.'),
    html: cb(T('Write-through vs write-back', 'Write-through frente a write-back'), 'L4_1 · 10–11', `
      <table class="tbl vs wide"><tr><th></th><th>Write-through<small>${T('escritura inmediata', 'escritura inmediata')}</small></th><th>Write-back<small>${T('post-escritura', 'post-escritura')}</small></th></tr>
      <tr><th>${T('A write hit…', 'Un acierto de escritura…')}</th><td>${T(`updates the cache ${hk('and the next level')}`, `actualiza la caché ${hk('y el siguiente nivel')}`)}</td><td>${T(`modifies ${hk('only the cached copy')}; the line is marked ${hk('modified')} <i>(modificada / sucia)</i>`, `modifica ${hk('únicamente la copia en caché')}; la línea se marca como ${hk('modificada')}`)}</td></tr>
      <tr><th>${T('The level below', 'El nivel inferior')}</th><td>${hp(T('always holds a recent copy', 'mantiene una copia reciente'))}</td><td>${T('is updated only when the line is replaced', 'se actualiza solo cuando la línea es reemplazada')}</td></tr>
      <tr><th>${T('Evicting a line', 'Al expulsar una línea')}</th><td>${hp(T('no extra operation needed', 'no es necesaria ninguna operación adicional'))}</td><td>${T(`a modified line must be ${hk('copied down before its position is reused')}`, `una línea modificada debe ${hk('copiarse al nivel inferior antes de reutilizar su posición')}`)}</td></tr>
      <tr><th>${T('Repeated writes to one line', 'Escrituras repetidas sobre una línea')}</th><td>${hc(T('heavy traffic: every one goes down', 'tráfico elevado: bajan todas'))}</td><td>${hp(T('penalised less: one transfer', 'penalizan menos: una transferencia'))}</td></tr>
      <tr><th>${T('The price', 'La contrapartida')}</th><td>${hc(T('traffic to lower levels', 'tráfico a niveles inferiores'))}</td><td>${hc(T('more complexity; a miss may first have to write out the line it replaces', 'más complejidad; un fallo puede requerir primero escribir la línea que va a reemplazar'))}</td></tr></table>
      <div class="tlw">${tl('Write-through', [['W', 1], ['W', 1], ['W', 1], ['E', 0]], T('3 writes → 3 transfers. Eviction is free.', '3 escrituras → 3 transferencias. La expulsión sale gratis.'))}
      ${tl('Write-back', [['W', 0], ['W', 0], ['W', 0], ['E', 1]], T('3 writes → 0 transfers. One transfer when the line leaves.', '3 escrituras → 0 transferencias. Una transferencia cuando la línea se va.'))}</div>
      ${trap(T('Write-back writes down on eviction <b>only if the line is modified</b>. A line that was only read is discarded with no write at all. The “Per-level policies” page lets you watch both cases.', 'Write-back escribe abajo al expulsar <b>solo si la línea está modificada</b>. Una línea que solo se leyó se descarta sin ninguna escritura. La página «Políticas por nivel» te deja ver ambos casos.'))}`) +
    cb(T('The write buffer <i>(búfer de escritura)</i>', 'El búfer de escritura'), 'L4_1 · 12, L4_3 · 12', `
      <div class="wbuf"><span>CPU</span><i>→</i><span class="bf">${T('buffer: address + data', 'búfer: dirección + dato')}</span><i class="slow">⇢</i><span>${T('lower level', 'nivel inferior')}</span></div>
      <ul class="keyl">
        <li>${T(`It ${hk('decouples the CPU')} from writes to the lower level: by storing address and data, the write is finished as far as the CPU is concerned.`, `${hk('Desacopla la CPU')} de las escrituras al nivel inferior: al almacenar dirección y dato, la escritura queda completada para la CPU.`)}</li>
        <li>${T(`The CPU continues ${hk('while the buffer has room')}. It absorbs bursts and the speed difference between CPU and memory.`, `La CPU continúa ${hk('mientras el búfer tenga espacio')}. Absorbe ráfagas y diferencias de velocidad entre CPU y memoria.`)}</li>
        <li>${T(`With write-through it receives ${hk('every write')}. With write-back it is used ${hk('when a modified line is evicted')}.`, `En write-through recibe ${hk('cada escritura')}. En write-back se usa ${hk('al expulsar una línea modificada')}.`)}</li>
        <li>${T(`Before a read, pending writes in the buffer are checked to avoid ${hk('RAW hazards')} <i>(riesgos RAW, read after write)</i>.`, `Antes de leer, se comprueban las escrituras pendientes en el búfer para evitar ${hk('riesgos RAW')}.`)}</li>
      </ul>
      ${why(T('What goes wrong if a read skips the buffer check?', '¿Qué sale mal si una lectura no consulta el búfer?'),
        T('The newest value of that address may still be waiting in the buffer. Reading from the level below would return the old one.', 'El valor más reciente de esa dirección puede seguir esperando en el búfer. Leer del nivel inferior devolvería el antiguo.'))}`) +
    cb(T('Write merging <i>(mezcla de escrituras)</i>', 'Mezcla de escrituras en el búfer'), 'L4_3 · 13–14', `
      <p>${T(`Before creating a new entry, the address and valid bytes are compared with the pending writes. Writes to ${hk('the same line')} are combined and keep the last value of each byte.`, `Antes de crear una entrada, se comparan dirección y bytes válidos con las escrituras pendientes. Las escrituras sobre ${hk('la misma línea')} se combinan y conservan el último valor de cada byte.`)}</p>
      <div class="mrg"><div><b>${T('No merging: 4 entries', 'Sin mezcla: 4 entradas')}</b>${be(100, [1, 0, 0, 0])}${be(108, [1, 0, 0, 0])}${be(116, [1, 0, 0, 0])}${be(124, [1, 0, 0, 0])}</div><i>→</i>
        <div><b>${T('Merged: 1 entry', 'Con mezcla: 1 entrada')}</b>${be(100, [1, 1, 1, 1])}<small>${T('validity masks say which words are present', 'las máscaras de validez indican qué palabras están')}</small></div></div>
      <p>${T(`Writes to ${hn('100, 108, 116 and 124')} take separate entries if the buffer stores words. If they belong to the same line they are grouped with ${hk('validity masks')}.`, `Las escrituras en ${hn('100, 108, 116 y 124')} ocupan entradas separadas si el búfer almacena palabras. Si pertenecen a la misma línea, se agrupan mediante ${hk('máscaras de validez')}.`)}</p>
      <p>${hp(T('Fewer transactions and bus cycles, no saturation, fewer stalls for lack of space.', 'Menos transacciones y ciclos de bus, evita la saturación, menos paradas por falta de espacio.'))} ${hc(T('The comparison adds cost,', 'La comparación añade coste,'))} ${T('but it pays off in bursts and accesses to nearby positions.', 'pero compensa en ráfagas y accesos a posiciones próximas.')}</p>`),
    qs: [
      { type: 'mc', q: T('Write-back cache. A line was read several times but never written. It is evicted. What happens?', 'Caché write-back. Una línea se leyó varias veces pero nunca se escribió. Se expulsa. ¿Qué ocurre?'), opts: [T('It is written to the next level first', 'Se escribe antes en el siguiente nivel'), T('It is discarded with no write', 'Se descarta sin ninguna escritura'), T('It goes to the write buffer', 'Va al búfer de escritura')], a: 1, why: T('Only a modified line has to be copied down.', 'Solo una línea modificada debe copiarse abajo.') },
      { type: 'num', q: T('Write-through, no buffer tricks. Ten writes hit the same line. How many of them are sent to the next level?', 'Write-through. Diez escrituras aciertan sobre la misma línea. ¿Cuántas se envían al siguiente nivel?'), a: 10, why: T('That is the “heavy traffic” drawback. Write-back would send the line once.', 'Es el inconveniente del «tráfico elevado». Write-back enviaría la línea una vez.') },
      { type: 'mc', q: T('With <b>write-through</b>, the write buffer receives…', 'Con <b>write-through</b>, el búfer de escritura recibe…'), opts: [T('every write', 'cada escritura'), T('only evicted modified lines', 'solo las líneas modificadas expulsadas'), T('nothing', 'nada')], a: 0 },
      { type: 'mc', q: T('After handing a write to the buffer, the CPU can carry on as long as…', 'Tras entregar una escritura al búfer, la CPU puede continuar mientras…'), opts: [T('the lower level has confirmed it', 'el nivel inferior lo confirme'), T('the buffer has free space', 'el búfer tenga espacio'), T('no read is pending', 'no haya lecturas pendientes')], a: 1 },
      { type: 'num', q: T('Writes to 100, 108, 116 and 124 all fall in the same line. With write merging, how many buffer entries do they use?', 'Las escrituras en 100, 108, 116 y 124 caen en la misma línea. Con mezcla de escrituras, ¿cuántas entradas del búfer usan?'), a: 1, why: T('One entry, four validity bits.', 'Una entrada, cuatro bits de validez.') },
      { type: 'mc', q: T('Which policy can make a <b>miss</b> slower because something must be written first?', '¿Qué política puede hacer más lento un <b>fallo</b> porque antes hay que escribir algo?'), opts: ['Write-through', 'Write-back'], a: 1, why: T('The victim may be modified and has to be saved before its position is reused.', 'La víctima puede estar modificada y hay que salvarla antes de reutilizar su posición.') }
    ]
  };
}

/* ---------- unit D: basic optimisations ---------- */
function thD() {
  return {
    idea: T('Everything in this unit pulls one of three levers in a single formula. Learn the formula, then file each technique under the lever it pulls.',
      'Todo en esta unidad tira de una de tres palancas de una sola fórmula. Apréndete la fórmula y archiva cada técnica bajo su palanca.'),
    html: cb(T('Three goals <i>(tres objetivos)</i>', 'Tres objetivos de optimización'), 'L4_2 · 2', `
      ${fx([['', 't<sub>M</sub>', T('average access time', 'tiempo medio de acceso')], '=', ['va', 't<sub>A</sub>', T('hit time', 'tiempo de acierto')], '+', ['vm', 'm', T('miss rate', 'tasa de fallos')], '·', ['vf', 't<sub>F</sub>', T('miss penalty', 'penalización')]])}
      <div class="goals">
        <div class="gl vm"><b>${T('Fewer misses', 'Reducir fallos')}</b>${T(`adjust ${hk('block size, capacity and associativity')}`, `ajustar ${hk('bloque, capacidad y asociatividad')}`)}</div>
        <div class="gl vf"><b>${T('Smaller penalty', 'Reducir la penalización')}</b>${T(`use ${hk('several levels')}, ${hk('prioritise reads')}, overlap transfers`, `usar ${hk('varios niveles')}, ${hk('priorizar lecturas')} y solapar transferencias`)}</div>
        <div class="gl va"><b>${T('Faster hit', 'Reducir el tiempo de acierto')}</b>${T(`simplify lookups and improve ${hk('address translation')}`, `simplificar búsquedas y mejorar la ${hk('traducción de direcciones')}`)}</div>
      </div>
      <p class="mute">${T('…while balancing performance, area, energy, cost and complexity. Improving one variable can hurt another.', '…equilibrando rendimiento, área, energía, coste y complejidad. Mejorar una variable puede perjudicar otra.')}</p>`) +
    cb(T('Lever 1 — fewer misses', 'Palanca 1 — reducir fallos'), 'L4_2 · 4–6', `
      <table class="tbl vs wide"><tr><th>${T('Technique', 'Técnica')}</th><th>${T('Which misses fall', 'Qué fallos bajan')}</th><th>${T('What it costs', 'Qué cuesta')}</th></tr>
      <tr><th>${hk(T('Bigger block', 'Bloque mayor'))}</th><td>${hp(T('uses spatial locality', 'aprovecha la localidad espacial'))}<br><span class="mute">${T('the benefit shrinks when there is little spatial locality', 'el beneficio disminuye cuando hay poca localidad espacial')}</span></td><td>${hc(T('fewer lines → capacity misses can rise', 'menos líneas → pueden aumentar los fallos de capacidad'))}<br>${hc(T('bigger penalty: more bytes to transfer', 'más penalización: se transfieren más bytes'))}</td></tr>
      <tr><th>${hk(T('Bigger cache', 'Caché mayor'))}</th><td>${hp(T('capacity misses', 'fallos de capacidad'))}</td><td>${hc(T('more latency and power per access, more silicon area', 'más latencia y consumo por acceso, más área de silicio'))}</td></tr>
      <tr><th>${hk(T('More associativity', 'Más asociatividad'))}</th><td>${hp(T('conflict misses', 'fallos de conflicto'))}<br><span class="mute">${T('the benefit shrinks at high associativity', 'el beneficio disminuye con asociatividades altas')}</span></td><td>${hc(T('comparing more tags: more area, energy and latency', 'comparar más etiquetas: más área, energía y latencia'))}</td></tr></table>
      <div class="grid2 tight">
        <div><svg class="bsz" viewBox="0 0 280 130" role="img"><line x1="34" y1="8" x2="34" y2="108" /><line x1="34" y1="108" x2="272" y2="108" />
          <polyline class="p1" points="50,26 102,42 154,42 206,34 258,14" /><polyline class="p2" points="50,96 102,98 154,100 206,101 258,101" />
          <text x="150" y="126" text-anchor="middle">${T('block size →', 'tamaño de bloque →')}</text><text x="12" y="60" text-anchor="middle" transform="rotate(-90 12 60)">${T('miss rate', 'tasa de fallos')}</text>
          <text class="t1" x="128" y="20" text-anchor="middle">${T('small cache (4K)', 'caché pequeña (4K)')}</text><text class="t2" x="262" y="92" text-anchor="end">${T('big cache (256K)', 'caché grande (256K)')}</text></svg>
          <p class="mute">${T('Shape of the chart on slide 4, not its exact values: in a small cache, very big blocks make the miss rate climb again.', 'Forma del gráfico de la diapositiva 4, no sus valores exactos: en una caché pequeña, bloques muy grandes hacen subir de nuevo la tasa de fallos.')}</p></div>
        <div><ul class="keyl">
          <li>${T(`The block penalty depends on the ${hk('latency and bandwidth')} of the level below. ${hk('High latency with good bandwidth favours big blocks')}.`, `La penalización depende de la ${hk('latencia y el ancho de banda')} del nivel inferior. ${hk('Una latencia alta y buen ancho de banda favorecen bloques grandes')}.`)}</li>
          <li>${T(`About ${hn('eight ways')} are usually enough.`, `${hn('Ocho vías')} suelen ser suficientes.`)}</li>
          <li>${T(`${hk('L1 prioritises speed')}; lower levels can afford more ways because speed matters less there.`, `${hk('L1 prioriza rapidez')}; los niveles inferiores admiten más vías al no ser tan prioritaria la velocidad.`)}</li>
        </ul></div>
      </div>
      ${why(T('Same cache size, block twice as big. Why can the miss rate go <i>up</i>?', 'Mismo tamaño de caché, bloque el doble de grande. ¿Por qué puede <i>subir</i> la tasa de fallos?'),
        T('Half as many lines. If the program needs many different places at once, they no longer all fit: capacity misses.', 'La mitad de líneas. Si el programa necesita muchos sitios distintos a la vez, ya no caben todos: fallos de capacidad.'))}`) +
    cb(T('Lever 2 — smaller penalty', 'Palanca 2 — reducir la penalización'), 'L4_2 · 7–9', `
      <h4>${hk(T('Multilevel caches', 'Cachés multinivel'))}</h4>
      <p>${T(`A single cache cannot be both as fast and as big as possible. ${hk('L1 reduces the hit time')}; ${hk('L2 and L3 provide capacity')}. Each level catches some accesses and reduces the load on the next.`, `Una sola caché no puede maximizar rapidez y capacidad. ${hk('L1 reduce el tiempo de acierto')}; ${hk('L2 y L3 aportan capacidad')}. Cada nivel resuelve parte de los accesos y reduce la carga al siguiente.`)}</p>
      <div class="lg2"><div><b>${hk(T('Local miss rate', 'Tasa local'))}</b>${T('measured against the accesses that <u>reach that level</u>. For L2: only the references that already missed in L1.', 'respecto a los accesos que <u>alcanzan ese nivel</u>. Para L2: solo las referencias que fallaron antes en L1.')}</div>
        <div><b>${hk(T('Global miss rate', 'Tasa global'))}</b>${T('measured against <u>all</u> memory accesses of the processor.', 'respecto al <u>total</u> de accesos a memoria del procesador.')}<code>m<sub>G</sub>(L2) = m<sub>L</sub>(L1) · m<sub>L</sub>(L2)</code></div></div>
      <p class="mute">${T('A rate written m(Lx) with nothing else is assumed to be the local one. The arithmetic is Lesson 5.', 'Una tasa escrita m(Lx) sin más se asume que es la local. La aritmética está en la Lección 5.')}</p>
      <h4>${hk(T('Priority to reads over writes', 'Prioridad de lecturas sobre escrituras'))}</h4>
      <p>${T('Reads are critical to keep executing; writes can be postponed. So read misses go first.', 'Las lecturas son críticas para continuar la ejecución; las escrituras pueden aplazarse. Se priorizan los fallos de lectura.')}</p>
      <table class="tbl vs"><tr><th>Write-through</th><td>${T(`the buffer may hold the most recent data → the read ${hk('checks the buffer, or waits for it to drain')}`, `el búfer puede tener el dato más reciente → la lectura ${hk('consulta el búfer o espera su vaciado')}`)}</td></tr>
      <tr><th>Write-back</th><td>${T(`the miss may replace a line in use → ${hk('the victim is parked in a buffer and the read starts first')}`, `el fallo puede reemplazar una línea usada → ${hk('la víctima se guarda en un búfer y la lectura comienza antes')}`)}</td></tr></table>
      <p class="mute">${T('The priority cuts latency without breaking dependencies, order or coherence.', 'La prioridad reduce latencia sin romper dependencias, orden ni coherencia.')}</p>`) +
    cb(T('Lever 3 — faster hit: do not wait for translation', 'Palanca 3 — reducir el tiempo de acierto: no esperar a la traducción'), 'L4_2 · 10', `
      <p>${T(`${hc('Problem:')} the CPU uses ${hk('virtual')} addresses and the cache uses ${hk('physical')} ones. Translating adds latency to every access.`, `${hc('Problema:')} la CPU usa direcciones ${hk('virtuales')} y la caché, ${hk('físicas')}. La traducción añade latencia a cada acceso.`)}</p>
      <div class="tlb"><div class="tlbA"><span class="pn">${T('virtual page number', 'n.º de página virtual')}</span><span class="po">${T('page offset', 'desplazamiento de página')}</span></div>
        <div class="tlbB"><div class="pn">↓ TLB<br><b>${T('physical address', 'dirección física')}</b><br><small>${T('used for the tag check, and for L2', 'para comprobar la etiqueta, y para L2')}</small></div><div class="po">↓ ${T('no translation', 'sin traducción')}<br><b>${T('indexes L1 directly', 'indexa L1 directamente')}</b><br><small>${T('identical in virtual and physical', 'es el mismo en virtual y en física')}</small></div></div>
        <div class="tlbC">⟵ ${T('both happen at the same time', 'ambas cosas ocurren a la vez')} ⟶</div></div>
      <p>${T(`${hp('Solution:')} index L1 with the ${hk('page offset')}, which is the same in the virtual and the physical address, while the ${hk('TLB')} obtains the physical address simultaneously. If the data is not in L1, L2 is accessed with the ${hk('physical address')}.`, `${hp('Solución:')} indexar L1 con el ${hk('desplazamiento de página')}, que es el mismo en la dirección virtual y en la física, mientras la ${hk('TLB')} obtiene la dirección física de forma simultánea. Si el dato no está en L1, se accede a L2 con la ${hk('dirección física')}.`)}</p>`),
    qs: [
      { type: 'mc', q: T('Which technique attacks <b>conflict</b> misses?', '¿Qué técnica ataca los fallos de <b>conflicto</b>?'), opts: [T('Bigger cache', 'Caché mayor'), T('More associativity', 'Más asociatividad'), T('Bigger block', 'Bloque mayor')], a: 1 },
      { type: 'mc', q: T('The level below has high latency but good bandwidth. That favours…', 'El nivel inferior tiene alta latencia pero buen ancho de banda. Eso favorece…'), opts: [T('big blocks', 'bloques grandes'), T('small blocks', 'bloques pequeños')], a: 0, why: T('Getting there is expensive, but once the transfer starts the extra bytes are cheap.', 'Llegar es caro, pero una vez empieza la transferencia los bytes extra salen baratos.') },
      { type: 'num', q: T('About how many ways are usually enough, according to the slides?', 'Según las diapositivas, ¿cuántas vías suelen ser suficientes?'), a: 8 },
      { type: 'mc', q: T('In a multilevel hierarchy, what is each level for?', 'En una jerarquía multinivel, ¿para qué sirve cada nivel?'), opts: [T('L1 gives capacity; L2/L3 give speed', 'L1 aporta capacidad; L2/L3, rapidez'), T('L1 reduces hit time; L2/L3 provide capacity', 'L1 reduce el tiempo de acierto; L2/L3 aportan capacidad'), T('All levels do the same job', 'Todos hacen lo mismo')], a: 1 },
      { type: 'mc', q: T('Why can L1 be indexed before the address is translated?', '¿Por qué se puede indexar L1 antes de traducir la dirección?'), opts: [T('L1 stores virtual tags', 'L1 guarda etiquetas virtuales'), T('The page offset is the same in the virtual and the physical address', 'El desplazamiento de página es el mismo en la dirección virtual y en la física'), T('The TLB is faster than the cache', 'La TLB es más rápida que la caché')], a: 1 },
      { type: 'mc', q: T('Write-back, and a read miss has to replace a line in use. How does the read get priority?', 'Write-back, y un fallo de lectura debe reemplazar una línea usada. ¿Cómo se prioriza la lectura?'), opts: [T('The read waits for the victim to be written', 'La lectura espera a que se escriba la víctima'), T('The victim is saved in a buffer and the read starts first', 'La víctima se guarda en un búfer y la lectura comienza antes'), T('The victim is discarded', 'La víctima se descarta')], a: 1 }
    ]
  };
}

/* ---------- unit E: advanced optimisations ---------- */
function thE() {
  const st = { F: ['F', T('miss', 'fallo')], A: ['A', T('hit', 'acierto')], B: ['B', T('blocked', 'bloqueo')] };
  const nb = (name, seq, note) => `<div class="nb"><b>${name}</b><div>${seq.split('').map((s, i) => `<span class="${st[s][0]}"><code>lw R${i + 1}</code>${st[s][1]}</span>`).join('<i>→</i>')}</div><small>${note}</small></div>`;
  const wd = (name, ord, at, note) => `<div class="wd"><b>${name}</b><div>${ord.map((w, i) => `<span class="${w === 3 ? 'crit' : ''}">P${w}</span>${i === at ? '<em>▶ CPU</em>' : ''}`).join('')}</div><small>${note}</small></div>`;
  return {
    idea: T('Same three levers, cleverer tricks, plus a fourth aim: serving more accesses at once. For each technique know the idea, what it buys and what it costs.',
      'Las mismas tres palancas con trucos más finos, y un cuarto propósito: atender más accesos a la vez. De cada técnica: la idea, qué gana y qué cuesta.'),
    html: `<p class="mute gnote">${T('The coloured goal labels follow the Hennessy & Patterson classification that the slides reference.', 'Las etiquetas de objetivo siguen la clasificación de Hennessy y Patterson que citan las diapositivas.')}</p>` +
    cb(T('Small and simple caches', 'Cachés pequeñas y simples'), 'L4_3 · 3–4', `
      <p>${T(`Finding a block means ${hk('select the index, read the tag, compare it')}. More capacity means longer physical distances and more complexity, so ${hc('access time goes up')}.`, `Buscar un bloque exige ${hk('seleccionar el índice, leer la etiqueta y compararla')}. Más capacidad aumenta las distancias físicas y la complejidad, ${hc('elevando el tiempo de acceso')}.`)}</p>
      <ul class="keyl">
        <li>${T(`A small cache close to the CPU ${hp('answers in a few cycles')}: key for ${hk('L1')}. ${hc('Smaller means more misses')}; the bigger levels compensate.`, `Una caché pequeña, cercana a la CPU, ${hp('responde en pocos ciclos')}: clave en ${hk('L1')}. ${hc('Reducir el tamaño aumenta los fallos')}; los niveles mayores lo compensan.`)}</li>
        <li>${T(`A simpler cache allows a ${hp('higher clock frequency')}.`, `Simplificar la caché permite una ${hp('mayor frecuencia de reloj')}.`)}</li>
        <li>${T(`In direct mapped the index selects a single line, so ${hk('the data is read in parallel with the tag check')}. ${hp('Low latency and cost')}, but ${hc('blocks with the same index conflict')}.`, `En correspondencia directa el índice selecciona una única línea: ${hk('el dato se lee en paralelo con la comprobación de la etiqueta')}. ${hp('Baja latencia y coste')}, pero ${hc('bloques con el mismo índice provocan conflictos')}.`)}</li>
        <li>${T('Real processors choose a small, fast L1 with a little associativity to limit misses.', 'Los procesadores priorizan una L1 pequeña y rápida, con pequeña asociatividad para limitar fallos.')}</li>
      </ul>
      <table class="tbl i7"><caption>${T('Example: Intel Core i7', 'Ejemplo: Intel Core i7')} ${sref('L4_3 · 5')}</caption><tr><th></th><th>${T('Size', 'Tamaño')}</th><th>${T('Ways', 'Vías')}</th><th>${T('Latency', 'Latencia')}</th><th></th></tr>
      <tr><th>L1</th><td>${hn('32 KB')} ${T('instr.', 'instr.')} + ${hn('32 KB')} ${T('data', 'datos')}</td><td>${hn('4')} (${T('instr.', 'instr.')}) · ${hn('8')} (${T('data', 'datos')})</td><td>${hn(T('3 cycles', '3 ciclos'))}</td><td>${T('per core, separate', 'por núcleo, separadas')}</td></tr>
      <tr><th>L2</th><td>${hn('256 KB')}</td><td>${hn('8')}</td><td>${hn(T('9 cycles', '9 ciclos'))}</td><td>${hk(T('private', 'privada'))}</td></tr>
      <tr><th>L3</th><td>${hn('8 MB')}</td><td>${hn('16')}</td><td>${hn(T('39 cycles', '39 ciclos'))}</td><td>${hk(T('shared', 'compartida'))}</td></tr></table>
      <p class="mute">${T('Going down: bigger, slower, and more ways each time.', 'Hacia abajo: más grande, más lenta y con más vías cada vez.')}</p>`, gc('h')) +
    cb(T('Way prediction <i>(predicción de vía)</i>', 'Predicción de vía'), 'L4_3 · 6–8', `
      <p>${T(`Direct mapped is fast but conflicts; associativity fixes conflicts but has to compare several tags and select a way. Way prediction keeps state bits that ${hk('guess which way holds the block')}.`, `La correspondencia directa es rápida pero genera conflictos; la asociatividad los reduce pero compara varias etiquetas y selecciona una vía. La predicción de vía conserva bits de estado que ${hk('anticipan qué vía contiene el bloque')}.`)}</p>
      <div class="wp"><span class="b0">${T('check <b>only</b> the predicted way', 'se consulta <b>solo</b> la vía prevista')}</span><i>→</i>
        <div><span class="ok">✓ ${T('tag matches', 'etiqueta coincide')}<small>${T('cost close to direct mapped', 'coste cercano a correspondencia directa')}</small></span>
        <span class="no">✗ ${T('wrong guess', 'predicción incorrecta')}<small>${T('the other ways are examined: extra cycles, then hit or miss', 'se examinan las demás vías: ciclos extra, y luego acierto o fallo')}</small></span></div></div>
      <p>${T(`Accuracy is above ${hn('80 %')} in ${hn('4-way')} caches. It works when memory access patterns are ${hk('stable and predictable')}.`, `Precisión superior al ${hn('80 %')} en cachés de ${hn('4 vías')}. Su eficacia depende de patrones de acceso ${hk('estables y predecibles')}.`)}</p>
      ${trap(T('A wrong way prediction is <b>not</b> a cache miss. The block may well be in another way; you only pay extra cycles to look.', 'Una predicción de vía incorrecta <b>no</b> es un fallo de caché. El bloque puede estar en otra vía; solo se pagan ciclos extra para mirar.'))}`, gc('h')) +
    cb(T('Pipelined access and multibanked caches', 'Acceso segmentado y caché multibanco'), 'L4_3 · 9', `
      <div class="grid2 tight"><div><h4>${hk(T('Pipelined access', 'Acceso segmentado'))}</h4>
        <div class="stg"><span>${T('decode address', 'decodificar dirección')}</span><span>${T('read', 'lectura')}</span><span>${T('compare tag', 'comparar etiqueta')}</span><span>${T('select block', 'seleccionar bloque')}</span></div>
        <p>${T(`${hc('Each access takes more cycles')}, but ${hk('one reference can start every cycle')}. ${hp('More throughput and bandwidth, shorter clock cycle.')}`, `${hc('Cada acceso tarda más ciclos')}, pero ${hk('puede iniciarse una referencia por ciclo')}. ${hp('Más throughput y ancho de banda, ciclos de reloj más cortos.')}`)}</p></div>
      <div><h4>${hk(T('Multibanked cache', 'Caché multibanco'))}</h4>
        <div class="bk">${[0, 1, 2, 3].map(b => `<div><b>${T('Bank', 'Banco')} ${b}</b>${[0, 1, 2, 3].map(r => `<i class="${r === 1 ? 'on' : ''}">${r * 4 + b}</i>`).join('')}</div>`).join('')}</div>
        <p>${T(`${hk('Simultaneous accesses to different banks')}: blocks 4, 5, 6 and 7 are accessed at once. ${hc('The latency of each access goes up.')}`, `${hk('Accesos simultáneos a bancos distintos')}: los bloques 4, 5, 6 y 7 se acceden a la vez. ${hc('Aumenta la latencia de cada acceso.')}`)}</p></div></div>
      <p class="mute">${T('Both suit superscalar processors, which issue several memory accesses per cycle.', 'Ambas resultan adecuadas para procesadores superescalares.')}</p>`, gc('b')) +
    cb(T('Non-blocking caches <i>(no bloqueantes)</i>', 'Cachés no bloqueantes'), 'L4_3 · 10', `
      <p>${T(`A ${hk('blocking')} cache accepts no new access while it resolves a miss, even if the later references would find their data in other lines.`, `Una caché ${hk('bloqueante')} impide nuevos accesos mientras resuelve un fallo, incluso cuando las referencias posteriores encontrarían sus datos en otras líneas.`)}</p>
      <div class="nbw">${nb(T('Blocking', 'Bloqueante'), 'FBB', T('everything waits behind the miss', 'todo espera detrás del fallo'))}
      ${nb('Hit under miss', 'FAA', T('hits are served during the miss; relies on out-of-order execution to continue with independent instructions', 'se atienden aciertos durante el fallo; aprovecha la ejecución fuera de orden para seguir con instrucciones independientes'))}
      ${nb('Miss under miss', 'FFA', T('several misses outstanding at once; must record pending requests and combine accesses to the same block', 'varios fallos simultáneos; hay que registrar solicitudes pendientes y combinar accesos al mismo bloque'))}</div>
      <p>${hp(T('They reduce the exposed penalty,', 'Reducen la penalización expuesta,'))} ${hc(T('but the control gets more complex.', 'pero aumentan la complejidad del control.'))}</p>`, gc('p')) +
    cb(T('Critical word first and early restart', 'Palabra crítica primero y reinicio temprano'), 'L4_3 · 11', `
      <p>${T('The processor is stuck because it needs <b>one word</b>, not the whole line. Block = {P1, P2, P3, P4} and the CPU asked for P3:', 'El procesador está parado porque necesita <b>una palabra</b>, no toda la línea. Bloque = {P1, P2, P3, P4} y la CPU pidió P3:')}</p>
      <div class="wdw">${wd(T('Plain', 'Normal'), [1, 2, 3, 4], 3, T('wait for the complete block', 'espera a la transferencia completa'))}
      ${wd(T('Critical word first', 'Palabra crítica primero'), [3, 1, 2, 4], 0, T('the transfer is <b>reordered</b>: the missed word goes first', 'la transferencia se <b>reordena</b>: la palabra del fallo va primero'))}
      ${wd(T('Early restart', 'Reinicio temprano'), [1, 2, 3, 4], 2, T('<b>natural order</b>, but the CPU resumes as soon as its word arrives', '<b>orden natural</b>, pero la CPU continúa en cuanto llega su palabra'))}</div>
      <p>${T(`The benefit grows with ${hk('big lines and transfers that take several cycles')}.`, `El beneficio aumenta con ${hk('líneas grandes y transferencias de varios ciclos')}.`)}</p>
      ${trap(T('The two are told apart by the <b>order of arrival</b>. Order changed → critical word first. Order unchanged → early restart.', 'Se distinguen por el <b>orden de llegada</b>. Orden cambiado → palabra crítica primero. Orden intacto → reinicio temprano.'))}`, gc('p')) +
    cb(T('Prefetch <i>(lectura adelantada)</i>', 'Prefetch (lectura adelantada)'), 'L4_3 · 15–16', `
      <div class="grid2 tight"><div><h4>${hk(T('Instruction prefetch', 'De instrucciones'))}</h4>
        <p>${T(`Instructions have high spatial locality: except for jumps, the program counter advances sequentially. On a miss the cache fetches ${hk('the requested block and the next one')}; the next one waits ${hk('in a buffer')}.`, `El flujo de instrucciones tiene alta localidad espacial: salvo saltos, el contador de programa avanza secuencialmente. Ante un fallo se recuperan ${hk('el bloque solicitado y el siguiente')}; este último queda ${hk('en un búfer')}.`)}</p>
        <pre class="code">add R1, R2, R3   // ${T('starts loading the block of sub', 'se inicia la carga del bloque de sub')}
sub R2, R3, R4</pre>
        <p>${T(`Sequential execution → ${hp('the next access does not wait for memory')}. A jump appears → ${hc('the prefetched block is discarded')}.`, `Ejecución secuencial → ${hp('el siguiente acceso se atiende sin esperar a la memoria')}. Aparece un salto → ${hc('el bloque adelantado se descarta')}.`)}</p></div>
      <div><h4>${hk(T('Data prefetch', 'De datos'))}</h4>
        <p>${T(`Detects ${hk('regular patterns')} and starts the requests before they are demanded. The Pentium 4 detected nearby misses within ${hn('4 KB')} pages and anticipated sequences.`, `Detecta ${hk('patrones regulares')} e inicia las solicitudes antes de que se demanden. El Pentium 4 detectaba fallos próximos en páginas de ${hn('4 KB')} y anticipaba secuencias.`)}</p>
        <pre class="code">lw R1, dir1 → lw R2, dir2 → lw R3, dir3
   ${T('loads dir2', 'se carga dir2')}     ${T('loads dir3', 'se carga dir3')}</pre>
        <p>${T(`Timing is the key: ${hc('too late hides no latency')}; ${hc('too early can evict lines still in use')}. Modern prefetchers combine history tables, stream detection and dynamic throttling to control traffic.`, `El momento es clave: ${hc('si es tarde no oculta latencia')}; ${hc('demasiado pronto puede causar expulsiones')}. Los prefetchers modernos combinan tablas de historial, detección de streams y limitación dinámica para controlar el tráfico.`)}</p></div></div>`, gc('m')) +
    `<p class="mute gnote">${T('Write-buffer merging is also in this deck (slides 12–14): it is in unit 3.', 'La mezcla de escrituras en el búfer también es de esta presentación (diapositivas 12–14): está en la unidad 3.')}</p>`,
    qs: [
      { type: 'mc', q: T('Way prediction guesses wrong. What happens next?', 'La predicción de vía falla. ¿Qué ocurre?'), opts: [T('It counts as a cache miss', 'Cuenta como fallo de caché'), T('The other ways are examined, costing extra cycles', 'Se examinan las demás vías, con ciclos extra'), T('The set is flushed', 'Se vacía el conjunto')], a: 1 },
      { type: 'mc', q: T('Way prediction accuracy quoted for 4-way caches:', 'Precisión de la predicción de vía citada para cachés de 4 vías:'), opts: [T('above 50 %', 'superior al 50 %'), T('above 80 %', 'superior al 80 %'), T('above 99 %', 'superior al 99 %')], a: 1 },
      { type: 'mc', q: T('A pipelined cache…', 'Una caché con acceso segmentado…'), opts: [T('makes each access take fewer cycles', 'hace que cada acceso tarde menos ciclos'), T('makes each access take more cycles but lets one start every cycle', 'hace que cada acceso tarde más ciclos pero deja iniciar uno por ciclo'), T('removes the tag comparison', 'elimina la comparación de etiqueta')], a: 1, why: T('Latency per access goes up; throughput goes up too.', 'Sube la latencia por acceso; también sube el throughput.') },
      { type: 'mc', q: T('<code>lw R1</code> misses, <code>lw R2</code> also misses and is started anyway, <code>lw R3</code> hits. This is…', '<code>lw R1</code> falla, <code>lw R2</code> también falla y se inicia igualmente, <code>lw R3</code> acierta. Esto es…'), opts: [T('a blocking cache', 'una caché bloqueante'), 'hit under miss', 'miss under miss'], a: 2 },
      { type: 'mc', q: T('The CPU wants P3. The block arrives as P3, P1, P2, P4. This is…', 'La CPU quiere P3. El bloque llega como P3, P1, P2, P4. Esto es…'), opts: [T('critical word first', 'palabra crítica primero'), T('early restart', 'reinicio temprano')], a: 0, why: T('The order was changed.', 'El orden se ha cambiado.') },
      { type: 'mc', q: T('Instruction prefetch loaded the next block, but the program jumps elsewhere. The prefetched block…', 'El prefetch de instrucciones cargó el bloque siguiente, pero el programa salta a otro sitio. El bloque adelantado…'), opts: [T('is discarded', 'se descarta'), T('replaces the current line', 'reemplaza la línea actual'), T('is written to L2', 'se escribe en L2')], a: 0 },
      { type: 'mc', q: T('In the Core i7 example, which level is shared and has the most ways?', 'En el ejemplo del Core i7, ¿qué nivel es compartido y tiene más vías?'), opts: ['L1', 'L2', 'L3'], a: 2, why: T('L3: 8 MB, 16 ways, 39 cycles.', 'L3: 8 MB, 16 vías, 39 ciclos.') }
    ]
  };
}

/* ---------- unit F: compiler optimisations ---------- */
function thF() {
  const ba = (name, slots, note) => `<div class="ba"><b>${name}</b><div class="bal">${[0, 1].map(l => `<div>${slots.slice(l * 4, l * 4 + 4).map(s => `<i class="${s}"></i>`).join('')}</div>`).join('')}</div><small>${note}</small></div>`;
  return {
    idea: T('The hardware stays the same; the compiler rearranges the program so that what is used together sits together. Instructions get moved; data loops get rewritten.',
      'El hardware no cambia; el compilador reorganiza el programa para que lo que se usa junto esté junto. Las instrucciones se recolocan; los bucles de datos se reescriben.'),
    html: cb(T('The map', 'El mapa'), 'L4_4 · 2', `
      <div class="goals two"><div class="gl va"><b>${T('On instructions', 'En instrucciones')}</b>${hk(T('reorder procedures', 'reordena procedimientos'))} · ${hk(T('align basic blocks', 'alinea bloques básicos'))} · ${hk(T('linearise branches', 'lineariza saltos'))}</div>
      <div class="gl vr"><b>${T('On data', 'En datos')}</b>${hk(T('merge arrays', 'fusiona arrays'))} · ${hk(T('interchange loops', 'intercambia bucles'))} · ${hk(T('fuse loops', 'fusiona bucles'))} · ${hk(T('blocking', 'acceso por bloques'))}</div></div>
      <p class="mute">${T('How well each works depends on the data layout, the profile, the cache and the dependencies.', 'La eficacia depende de la disposición de datos, el perfil, la caché y las dependencias.')}</p>`) +
    cb(T('Procedure reordering <i>(reordenación de procedimientos)</i>', 'Reordenación de procedimientos'), 'L4_4 · 3', `
      <p>${T(`${hc('Problem:')} frequently used procedures that land on ${hk('the same cache indices')} keep evicting each other.`, `${hc('Problema:')} los procedimientos frecuentes con ${hk('los mismos índices de caché')} provocan expulsiones repetidas.`)}</p>
      <p>${T(`Reordering separates the ones that conflict and brings together the ones that call each other often. ${hk('Profiles')} <i>(perfiles)</i> identify the active functions. ${hp('Fewer conflicts and better spatial locality of the instructions.')}`, `La reordenación separa conflictos y aproxima procedimientos que se invocan con frecuencia. Los ${hk('perfiles')} identifican las funciones activas. ${hp('Reduce conflictos y mejora la localidad espacial de las instrucciones.')}`)}</p>`) +
    cb(T('Basic-block alignment <i>(alineación de bloques básicos)</i>', 'Alineación de bloques básicos'), 'L4_4 · 4', `
      <p>${T(`A ${hk('basic block')} <i>(bloque básico)</i> has ${hk('a single entry, no internal jumps, and runs completely')}. If it starts at the end of a cache line it can occupy two lines even though it would fit in one.`, `Un ${hk('bloque básico')} tiene ${hk('una sola entrada, no contiene saltos internos y se ejecuta completo')}. Si comienza al final de una línea de caché, puede ocupar dos líneas aunque quepa en una.`)}</p>
      <div class="baw">${ba(T('Not aligned', 'Sin alinear'), ['', '', 'blk', 'blk', 'blk', 'blk', '', ''], T('4 instructions, 2 lines touched', '4 instrucciones, 2 líneas tocadas'))}
      ${ba(T('Aligned', 'Alineado'), ['', '', 'pad', 'pad', 'blk', 'blk', 'blk', 'blk'], T('padding added, 1 line touched', 'se añade relleno, 1 línea tocada'))}</div>
      <p>${T(`${hp('Fewer cache misses.')} ${hc('The padding <i>(relleno)</i> makes the code bigger')}, so it is applied only to ${hk('frequent or critical blocks')}.`, `${hp('Menos fallos de caché.')} ${hc('El relleno aumenta el código')}, por lo que se aplica a ${hk('bloques frecuentes o críticos')}.`)}</p>`) +
    cb(T('Branch linearisation <i>(linearización de saltos)</i>', 'Linearización de saltos'), 'L4_4 · 5', `
      <p>${T(`Jumps break the sequence and waste the line and the prefetch. If the likely branch is known, the compiler makes it ${hk('the linear continuation')} (the fall-through).`, `Los saltos rompen la secuencia y reducen el aprovechamiento de línea y prefetch. Si se conoce la rama probable, el compilador la convierte en ${hk('la continuación lineal')}.`)}</p>
      <div class="grid2 tight"><div><h4>${T('Version 1 — not linearised', 'Versión 1 — no linealizada')}</h4><pre class="code"><span class="cg">mv   R1, R2</span>
<span class="cg">beq  R1, R2, SALTO</span>   // ${T('always taken', 'siempre salta')}
<span class="cr">sub  R1, R1, R3</span>
<span class="cr">sub  R2, R2, R3</span>
<span class="cm">────── 16 B ──────</span>
SALTO: add R3, R3, #1
mult R1, R2, R3</pre><p class="mute">${T(`The line holds mv, beq, sub, sub. ${hc('The last two are never accessed.')}`, `La línea contiene mv, beq, sub y sub. ${hc('Las dos últimas no se acceden.')}`)}</p></div>
      <div><h4>${T('Version 2 — linearised', 'Versión 2 — linealizada')}</h4><pre class="code"><span class="cg">mv   R1, R2</span>
<span class="cg">bneq R1, R2, SALTO</span>   // ${T('never taken', 'nunca salta')}
<span class="cg">add  R3, R3, #1</span>
<span class="cg">mult R1, R2, R3</span>
<span class="cm">────── 16 B ──────</span>
SALTO: sub R1, R1, R3
sub R2, R2, R3</pre><p class="mute">${T(`The line holds mv, bneq, add, mult. ${hp('All four are accessed.')}`, `La línea contiene mv, bneq, add y mult. ${hp('Todas se acceden.')}`)}</p></div></div>
      <p>${T(`${hp('Better locality and branch prediction')}, but ${hc('a wrong estimate of the likely branch can make both worse')}.`, `${hp('Mejora la localidad y la predicción')}, pero ${hc('una estimación errónea puede perjudicarlas')}.`)}</p>`) +
    cb(T('Array merging <i>(fusión de arrays)</i>', 'Fusión de arrays'), 'L4_4 · 6', `
      <div class="grid2 tight"><div><h4>${T('Parallel arrays', 'Arrays paralelos')}</h4><pre class="code">int <span class="cr">key</span>[MAX];
int <span class="cr">val</span>[MAX];
for (int i = 0; i &lt; MAX; ++i)
  printf("%d, %d\\n", key[i], val[i]);</pre></div>
      <div><h4>${T('Merged array', 'Array fusionado')}</h4><pre class="code">struct entry { int key; int val; };
struct entry <span class="cg">v</span>[MAX];
for (int i = 0; i &lt; MAX; ++i)
  printf("%d, %d\\n", v[i].key, v[i].val);</pre></div></div>
      <p>${T(`Parallel arrays accessed at the same time ${hc('can conflict in the cache')}. Merging puts the related fields of each element ${hk('in one structure')}, so one line brings them all: ${hp('better spatial locality, fewer conflicts')}.`, `Los arrays paralelos accedidos simultáneamente ${hc('pueden generar conflictos de caché')}. La fusión agrupa los campos relacionados de cada elemento ${hk('en una estructura')}, así una línea los trae todos: ${hp('mejor localidad espacial, menos conflictos')}.`)}</p>
      ${trap(T('It only helps <b>when all the fields are used</b>. If the loop uses a single field, the struct drags unnecessary data into the cache and you get fewer useful elements per line.', 'Solo ayuda <b>cuando se usan todos los campos</b>. Si el bucle usa un único campo, la estructura transfiere información innecesaria y caben menos elementos útiles por línea.'))}`) +
    cb(T('Loop interchange <i>(intercambio de bucles)</i>', 'Intercambio de bucles'), 'L4_4 · 7', `
      <div class="grid2 tight"><div><h4>${hc(T('Access with jumps', 'Acceso con saltos'))}</h4><pre class="code">int v[5000][100];
for (int <span class="cr">j</span> = 0; j &lt; 100; ++j)
  for (int <span class="cr">i</span> = 0; i &lt; 5000; ++i)
    v[i][j] = k * v[i][j];</pre></div>
      <div><h4>${hp(T('Sequential accesses', 'Accesos secuenciales'))}</h4><pre class="code">int v[5000][100];
for (int <span class="cg">i</span> = 0; i &lt; 5000; ++i)
  for (int <span class="cg">j</span> = 0; j &lt; 100; ++j)
    v[i][j] = k * v[i][j];</pre></div></div>
      <p>${T(`${hk('C and C++ store matrices by rows; Fortran by columns')}. The interchange puts ${hk('the dimension that is contiguous in memory in the inner loop')}: ${hp('better spatial locality, better use of each line, more effective prefetch')}.`, `${hk('C y C++ almacenan por filas; Fortran, por columnas')}. El intercambio sitúa ${hk('en el bucle interno la dimensión contigua en memoria')}: ${hp('mejor localidad espacial, mejor uso de línea y prefetch más eficaz')}.`)}</p>
      <div class="liw"><div class="lih"><b>${T('See it: a 4 × 8 matrix stored by rows, 4 elements per line', 'Míralo: matriz 4 × 8 almacenada por filas, 4 elementos por línea')}</b>
        <span><button class="chipb" data-li="c">▶ ${T('j outside, i inside', 'j fuera, i dentro')}</button><button class="chipb" data-li="r">▶ ${T('i outside, j inside', 'i fuera, j dentro')}</button></span></div>
        <div class="lig" id="lig"></div><div class="lio" id="lio">${T('Predict first: which order touches a new cache line on <i>every</i> access? Red = that access had to move to a different line.', 'Predice primero: ¿qué orden toca una línea nueva en <i>cada</i> acceso? Rojo = ese acceso tuvo que cambiar de línea.')}</div></div>`) +
    cb(T('Loop fusion <i>(fusión de bucles)</i>', 'Fusión de bucles'), 'L4_4 · 8', `
      <div class="grid2 tight"><div><h4>${T('Separate loops', 'Bucles separados')}</h4><pre class="code">for (i..rows) for (j..cols)
  <span class="cr">a[i][j]</span> = b[i][j] * c[i][j];
for (i..rows) for (j..cols)
  d[i][j] = <span class="cr">a[i][j]</span> + c[i][j];</pre></div>
      <div><h4>${T('Fused loop', 'Bucles fusionados')}</h4><pre class="code">for (i..rows) for (j..cols) {
  <span class="cg">a[i][j]</span> = b[i][j] * c[i][j];
  d[i][j] = <span class="cg">a[i][j]</span> + c[i][j];
}</pre></div></div>
      <p>${T(`Two loops with ${hk('the same iteration space')} can be combined. Each value is used again ${hk('before it leaves the cache')}: ${hp('better temporal locality')}, and ${hp('less loop-control cost')}.`, `Dos bucles con ${hk('el mismo espacio de iteración')} pueden combinarse. Se accede a cada valor ${hk('antes de que abandone la caché')}: ${hp('mejora la localidad temporal')} y ${hp('reduce el coste de control')}.`)}</p>`) +
    cb(T('Blocking <i>(acceso por bloques)</i>', 'Acceso por bloques (blocking)'), 'L4_4 · 9–11', `
      <div class="grid2 tight"><div><pre class="code">for (int <span class="cg">bj</span> = 0; bj &lt; size; bj += bsize)
 for (int <span class="cg">bk</span> = 0; bk &lt; size; bk += bsize)
  for (int i = 0; i &lt; size; ++i)
   for (int j = bj; j &lt; MIN(bj+bsize, size); ++j) {
     double r = 0.0;
     for (int k = bk; k &lt; MIN(bk+bsize, size); ++k)
       r += b[i][k] * c[k][j];
     a[i][j] += r;
   }</pre><p class="mute">${T('The matrix product from the slides, with two extra outer loops that walk block by block.', 'El producto de matrices de las diapositivas, con dos bucles externos extra que avanzan bloque a bloque.')}</p></div>
      <div><div class="blk4">${Array.from({ length: 16 }, (_, n) => `<i class="${n % 4 < 2 && n < 8 ? 'on' : ''}"></i>`).join('')}</div><p class="mute">SIZE = 4, Bsize = 2: ${T('finish one 2 × 2 sub-matrix before moving to the next.', 'se termina una submatriz 2 × 2 antes de pasar a la siguiente.')}</p></div></div>
      <ul class="keyl">
        <li>${T(`Split the problem into blocks ${hk('whose working set fits in the cache')}; in matrices, ${hk('reuse each sub-matrix')} before moving on.`, `Divide el problema en bloques ${hk('cuyo conjunto de trabajo cabe en caché')}; en matrices, ${hk('reutiliza submatrices')} antes de avanzar.`)}</li>
        <li>${T(`The block factor is chosen from the ${hk('cache capacity, associativity, line size')} and the data competing at the same time.`, `El factor de bloque se elige considerando ${hk('capacidad de la caché, asociatividad, tamaño de línea')} y los datos que compiten simultáneamente.`)}</li>
        <li>${hc(T('More complexity,', 'Aumenta la complejidad,'))} ${hp(T('but less traffic and higher arithmetic intensity.', 'pero reduce el tráfico y eleva la intensidad aritmética.'))}</li>
      </ul>`) +
    cb(T('One table to file them all', 'Una tabla para archivarlas'), '', `
      <table class="tbl vs wide"><tr><th>${T('Technique', 'Técnica')}</th><th>${T('Acts on', 'Actúa sobre')}</th><th>${T('What improves', 'Qué mejora')}</th></tr>
      <tr><th>${T('Procedure reordering', 'Reordenación de procedimientos')}</th><td>${T('instructions', 'instrucciones')}</td><td>${hk(T('fewer conflicts + spatial locality', 'menos conflictos + localidad espacial'))}</td></tr>
      <tr><th>${T('Basic-block alignment', 'Alineación de bloques básicos')}</th><td>${T('instructions', 'instrucciones')}</td><td>${hk(T('fewer lines used per block', 'menos líneas usadas por bloque'))}</td></tr>
      <tr><th>${T('Branch linearisation', 'Linearización de saltos')}</th><td>${T('instructions', 'instrucciones')}</td><td>${hk(T('locality + branch prediction', 'localidad + predicción'))}</td></tr>
      <tr><th>${T('Array merging', 'Fusión de arrays')}</th><td>${T('data', 'datos')}</td><td>${hk(T('spatial locality, fewer conflicts', 'localidad espacial, menos conflictos'))}</td></tr>
      <tr><th>${T('Loop interchange', 'Intercambio de bucles')}</th><td>${T('data', 'datos')}</td><td>${hk(T('spatial locality', 'localidad espacial'))}</td></tr>
      <tr><th>${T('Loop fusion', 'Fusión de bucles')}</th><td>${T('data', 'datos')}</td><td>${hk(T('temporal locality', 'localidad temporal'))}</td></tr>
      <tr><th>${T('Blocking', 'Acceso por bloques')}</th><td>${T('data', 'datos')}</td><td>${hk(T('working set fits in cache; less traffic', 'el conjunto de trabajo cabe en caché; menos tráfico'))}</td></tr></table>`),
    qs: [
      { type: 'mc', q: T('A basic block is a piece of code that…', 'Un bloque básico es un fragmento de código que…'), opts: [T('fits in one cache line', 'cabe en una línea de caché'), T('has a single entry, no internal jumps, and runs completely', 'tiene una sola entrada, no contiene saltos internos y se ejecuta completo'), T('is called from one place only', 'se llama desde un único sitio')], a: 1 },
      { type: 'mc', q: T('Why is alignment applied only to frequent or critical blocks?', '¿Por qué la alineación se aplica solo a bloques frecuentes o críticos?'), opts: [T('The padding makes the code bigger', 'El relleno aumenta el código'), T('It breaks branch prediction', 'Rompe la predicción de saltos'), T('It needs a profile of the data', 'Necesita un perfil de los datos')], a: 0 },
      { type: 'num', q: T('Version 1 of the branch example: the 16 B line holds mv, beq, sub, sub and the branch is always taken. How many of the 4 instructions in that line are actually used?', 'Versión 1 del ejemplo de saltos: la línea de 16 B contiene mv, beq, sub, sub y el salto siempre se toma. ¿Cuántas de las 4 instrucciones de esa línea se usan?'), a: 2, why: T('The two subs are skipped. After linearisation all 4 are used.', 'Las dos sub se saltan. Tras linealizar se usan las 4.') },
      { type: 'mc', q: T('In C, for <code>v[5000][100]</code> accessed as <code>v[i][j]</code>, which index should the <b>inner</b> loop run over?', 'En C, para <code>v[5000][100]</code> accedido como <code>v[i][j]</code>, ¿qué índice debe recorrer el bucle <b>interno</b>?'), opts: ['i', 'j'], a: 1, why: T('C stores by rows, so consecutive j are neighbours in memory.', 'C almacena por filas, así que los j consecutivos son vecinos en memoria.') },
      { type: 'mc', q: T('Loop fusion improves mainly…', 'La fusión de bucles mejora sobre todo…'), opts: [T('spatial locality', 'la localidad espacial'), T('temporal locality', 'la localidad temporal'), T('the tag size', 'el tamaño de etiqueta')], a: 1, why: T('The value is reused before it leaves the cache.', 'El valor se reutiliza antes de abandonar la caché.') },
      { type: 'mc', q: T('A loop reads only <code>v[i].key</code> from an array of structs {key, val, delta}. Compared with a plain <code>key[]</code> array, the merged version…', 'Un bucle lee solo <code>v[i].key</code> de un array de estructuras {key, val, delta}. Frente a un array <code>key[]</code>, la versión fusionada…'), opts: [T('misses less', 'falla menos'), T('transfers unnecessary data and misses more', 'transfiere información innecesaria y falla más'), T('is identical', 'es idéntica')], a: 1 },
      { type: 'mc', q: T('Which of these does <b>not</b> enter the choice of the block factor?', '¿Cuál de estos <b>no</b> entra en la elección del factor de bloque?'), opts: [T('cache capacity', 'capacidad de la caché'), T('associativity and line size', 'asociatividad y tamaño de línea'), T('the clock frequency', 'la frecuencia de reloj')], a: 2 }
    ]
  };
}

/* loop-interchange mini animation */
function liInit(root) {
  const g = $('#lig', root), out = $('#lio', root); if (!g) return;
  const R = 4, C = 8, L = 4; let tm = null;
  g.innerHTML = Array.from({ length: R * C }, (_, n) => `<i class="b${Math.floor(n / L) % 2}"></i>`).join('');
  const cells = $$('i', g);
  const run = byRow => {
    clearInterval(tm); cells.forEach(c => c.classList.remove('on', 'seen', 'jmp'));
    const seq = [];
    if (byRow) for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) seq.push(i * C + j);
    else for (let j = 0; j < C; j++) for (let i = 0; i < R; i++) seq.push(i * C + j);
    let n = 0, last = -1, ch = 0;
    tm = setInterval(() => {
      if (n) cells[seq[n - 1]].classList.remove('on');
      if (n >= seq.length) {
        clearInterval(tm); sfx.pop();
        out.innerHTML = byRow
          ? T(`<b class="c-hit">${ch} new lines for 32 accesses.</b> Three out of four accesses stay inside the line just loaded: that is spatial locality at work.`, `<b class="c-hit">${ch} líneas nuevas en 32 accesos.</b> Tres de cada cuatro accesos se quedan en la línea recién cargada: eso es la localidad espacial funcionando.`)
          : T(`<b class="c-miss">${ch} new lines for 32 accesses.</b> Every access lands in a different line. On a matrix too big for the cache that is close to 100 % misses.`, `<b class="c-miss">${ch} líneas nuevas en 32 accesos.</b> Cada acceso cae en una línea distinta. En una matriz que no cabe en caché, eso es cerca del 100 % de fallos.`);
        return;
      }
      const c = seq[n], ln = Math.floor(c / L), jump = ln !== last; if (jump) ch++; last = ln;
      cells[c].classList.add('on', 'seen'); if (jump) cells[c].classList.add('jmp');
      out.innerHTML = `${T('access', 'acceso')} ${n + 1}/32 · ${T('changes of cache line', 'cambios de línea de caché')}: <b>${ch}</b>`;
      n++;
    }, 120);
  };
  $$('[data-li]', root).forEach(b => (b.onclick = () => run(b.dataset.li === 'r')));
  onLeave(() => clearInterval(tm));
}

/* ---------- recall deck: flashcards, sorting game, final checkpoint ---------- */
function flashData() {
  return [
    [T('Name the three kinds of cache miss.', 'Nombra los tres tipos de fallo de caché.'), T('Compulsory (forzoso/obligatorio), capacity (capacidad), conflict (conflicto).', 'Forzoso/obligatorio, de capacidad, de conflicto.')],
    [T('Which miss type cannot occur in a fully associative cache?', '¿Qué tipo de fallo no existe en una caché totalmente asociativa?'), T('Conflict misses.', 'Los de conflicto.')],
    [T('Who manages each level: registers, cache, main memory, disk?', '¿Quién gestiona cada nivel: registros, caché, memoria principal, disco?'), T('Compiler, hardware, operating system, operating system.', 'Compilador, hardware, sistema operativo, sistema operativo.')],
    [T('What is the memory wall?', '¿Qué es el muro de memoria?'), T('The gap opened because the CPU advanced much faster than memory (1980–2005): more time waiting for data.', 'La brecha creada porque la CPU avanzó mucho más que la memoria (1980–2005): más espera por datos.')],
    [T('Temporal vs spatial locality, with one example each.', 'Localidad temporal y espacial, con un ejemplo de cada una.'), T('Temporal: recently used is reused (loops, reused variables). Spatial: nearby addresses are used next (sequential instructions, ordered traversals).', 'Temporal: lo usado recientemente se reutiliza (bucles, variables reutilizadas). Espacial: se usan direcciones cercanas (instrucciones secuenciales, recorridos ordenados).')],
    [T('What does the valid bit do?', '¿Qué hace el bit de validez?'), T('Confirms that the line is usable. A matching tag with valid = 0 is a miss.', 'Confirma si la línea es utilizable. Etiqueta coincidente con validez = 0 es fallo.')],
    [T('Write-through in one sentence.', 'Write-through en una frase.'), T('Every write updates the cache and the next level; memory stays current, traffic is high.', 'Cada escritura actualiza la caché y el siguiente nivel; la memoria está al día, mucho tráfico.')],
    [T('Write-back in one sentence.', 'Write-back en una frase.'), T('Writes stay in the cache (line marked modified) and go down only when the line is replaced.', 'Las escrituras se quedan en caché (línea marcada como modificada) y bajan solo al reemplazarla.')],
    [T('What is the write buffer for, and how does each policy use it?', '¿Para qué sirve el búfer de escritura y cómo lo usa cada política?'), T('Lets the CPU continue without waiting for the lower level. WT: receives every write. WB: receives evicted modified lines.', 'Deja continuar a la CPU sin esperar al nivel inferior. WT: recibe cada escritura. WB: recibe las líneas modificadas expulsadas.')],
    [T('The three goals of cache optimisation.', 'Los tres objetivos de optimización de caché.'), T('Reduce misses, reduce miss penalty, reduce hit time.', 'Reducir fallos, reducir la penalización, reducir el tiempo de acierto.')],
    [T('Bigger blocks: pro and con.', 'Bloques mayores: ventaja e inconveniente.'), T('Pro: spatial locality. Con: fewer lines (capacity misses) and a bigger transfer penalty.', 'Ventaja: localidad espacial. Inconveniente: menos líneas (fallos de capacidad) y más penalización de transferencia.')],
    [T('Local vs global miss rate of L2.', 'Tasa de fallos local y global de L2.'), T('Local: L2 misses / accesses that reach L2 (= L1 misses). Global: L2 misses / all CPU accesses = mL(L1) × mL(L2).', 'Local: fallos de L2 / accesos que llegan a L2 (= fallos de L1). Global: fallos de L2 / todos los accesos = mL(L1) × mL(L2).')],
    [T('The two components of the miss penalty.', 'Los dos componentes de la penalización de fallo.'), T('Access to the lower level (latency) + transfer of the block (block size and bandwidth).', 'Acceso al nivel inferior (latencia) + transferencia del bloque (tamaño de bloque y ancho de banda).')],
    [T('What is exposed latency (latencia expuesta)?', '¿Qué es la latencia expuesta?'), T('The part of the miss penalty that parallelism does not hide: what really enters the stall cycles.', 'La fracción de la penalización no ocultada por el paralelismo: lo que realmente entra en los ciclos de detención.')],
    [T('How do you avoid address translation slowing down L1 hits?', '¿Cómo se evita que la traducción de direcciones frene los aciertos de L1?'), T('Index L1 with the page offset (identical in virtual and physical addresses) while the TLB translates in parallel.', 'Indexando L1 con el desplazamiento de página (igual en virtual y física) mientras la TLB traduce en paralelo.')],
    [T('Core i7: size, ways and latency of L1, L2, L3.', 'Core i7: tamaño, vías y latencia de L1, L2, L3.'), T('L1 32 KB + 32 KB, 4/8 ways, 3 cycles. L2 256 KB, 8 ways, 9 cycles. L3 8 MB shared, 16 ways, 39 cycles.', 'L1 32 KB + 32 KB, 4/8 vías, 3 ciclos. L2 256 KB, 8 vías, 9 ciclos. L3 8 MB compartida, 16 vías, 39 ciclos.')],
    [T('Way prediction: idea and accuracy.', 'Predicción de vía: idea y precisión.'), T('Guess the way first; if right it costs like direct mapped. Over 80 % accurate with 4 ways.', 'Se consulta primero la vía prevista; si acierta cuesta como directa. Más del 80 % con 4 vías.')],
    [T('Hit under miss vs miss under miss.', 'Hit under miss frente a miss under miss.'), T('Non-blocking caches. Hit under miss: serve hits during one miss. Miss under miss: several outstanding misses.', 'Cachés no bloqueantes. Hit under miss: atiende aciertos durante un fallo. Miss under miss: varios fallos pendientes.')],
    [T('Critical word first vs early restart.', 'Palabra crítica primero frente a reinicio temprano.'), T('CWF: the missed word is transferred first. ER: normal order, CPU resumes when its word arrives.', 'PCP: se transfiere primero la palabra del fallo. RT: orden natural, la CPU continúa cuando llega su palabra.')],
    [T('Data prefetch: what goes wrong if it is too late? Too early?', 'Prefetch de datos: ¿qué pasa si llega tarde? ¿Y demasiado pronto?'), T('Too late: hides no latency. Too early: can evict lines still in use.', 'Tarde: no oculta latencia. Demasiado pronto: puede expulsar líneas aún en uso.')],
    [T('Define a basic block.', 'Define bloque básico.'), T('One entry, no internal jumps, executes completely.', 'Una sola entrada, sin saltos internos, se ejecuta completo.')],
    [T('C stores matrices by…? Fortran by…?', 'C almacena matrices por…? ¿Fortran por…?'), T('C/C++: rows. Fortran: columns.', 'C/C++: filas. Fortran: columnas.')],
    [T('When is array merging a bad idea?', '¿Cuándo es mala idea la fusión de arrays?'), T('When the loop only uses one field: you drag unused data into the cache.', 'Cuando el bucle solo usa un campo: se transfiere información innecesaria.')],
    [T('What does loop fusion improve?', '¿Qué mejora la fusión de bucles?'), T('Temporal locality (values reused before eviction) and loop-control cost.', 'La localidad temporal (se reutilizan los valores antes de salir de caché) y el coste de control.')],
    [T('What decides the block factor in blocking?', '¿Qué decide el factor de bloque en el acceso por bloques?'), T('Cache capacity, associativity, line size, and the data competing at the same time.', 'Capacidad de la caché, asociatividad, tamaño de línea y los datos que compiten simultáneamente.')],
    [T('Formula: average memory access time.', 'Fórmula: tiempo medio de acceso a memoria.'), 't<sub>M</sub> = t<sub>A</sub> + (1 − h) · t<sub>F</sub>'],
    [T('LRU vs FIFO.', 'LRU frente a FIFO.'), T('LRU evicts the least recently used; FIFO the oldest loaded (ignores reuse).', 'LRU expulsa el menos usado recientemente; FIFO el más antiguo (ignora la reutilización).')],
    [T('More associativity does what to index and tag?', '¿Qué hace más asociatividad con índice y etiqueta?'), T('Fewer index bits, more tag bits. Offset unchanged.', 'Menos bits de índice, más de etiqueta. El desplazamiento no cambia.')]
  ];
}

let SORTQ = null;
function sortQs() {
  const G = [T('Fewer misses', 'Reducir fallos'), T('Smaller miss penalty', 'Reducir penalización'), T('Faster hit time', 'Reducir tiempo de acierto'), T('More bandwidth / throughput', 'Más ancho de banda')];
  const items = [
    [T('Bigger block size', 'Aumentar el tamaño de bloque'), 0], [T('Multilevel caches', 'Cachés multinivel'), 1],
    [T('Way prediction', 'Predicción de vía'), 2], [T('Pipelined cache access', 'Acceso segmentado a la caché'), 3],
    [T('More associativity', 'Más asociatividad'), 0], [T('Giving reads priority over writes', 'Prioridad de lecturas sobre escrituras'), 1],
    [T('Indexing L1 with the page offset', 'Indexar L1 con el desplazamiento de página'), 2], [T('Multibanked cache', 'Caché multibanco'), 3],
    [T('Critical word first', 'Palabra crítica primero'), 1], [T('Small, simple L1', 'L1 pequeña y simple'), 2],
    [T('Loop interchange', 'Intercambio de bucles'), 0], [T('Non-blocking cache', 'Caché no bloqueante'), 1],
    [T('Write-buffer merging', 'Mezcla de escrituras en el búfer'), 1], [T('Bigger cache', 'Caché mayor'), 0]
  ];
  if (!SORTQ) SORTQ = items.map((_, i) => i).sort(() => Math.random() - 0.5);
  return SORTQ.map(i => ({ type: 'mc', q: `<span class="mute">${T('Main goal of…', 'Objetivo principal de…')}</span><br><b class="bigq">${items[i][0]}</b>`, opts: G, a: items[i][1] }));
}

function theoryQs() {
  return [
    { type: 'mc', q: T('A line is evicted from a <b>write-through</b> cache. What extra work is needed?', 'Se expulsa una línea de una caché <b>write-through</b>. ¿Qué trabajo extra hace falta?'), opts: [T('Write it to the next level', 'Escribirla en el siguiente nivel'), T('None — the lower level is already up to date', 'Ninguno — el nivel inferior ya está actualizado'), T('Flush the whole set', 'Vaciar todo el conjunto')], a: 1, why: T('That is the upside of paying for every write immediately.', 'Es la ventaja de pagar cada escritura al momento.') },
    { type: 'mc', q: T('Ten writes hit the same line. Which policy sends less traffic down?', 'Diez escrituras aciertan sobre la misma línea. ¿Qué política genera menos tráfico?'), opts: ['Write-through', 'Write-back'], a: 1, why: T('Write-back sends the line once, when it is replaced.', 'Write-back envía la línea una vez, al reemplazarla.') },
    { type: 'mc', q: T('In write-back, when is the write buffer used?', 'En write-back, ¿cuándo se usa el búfer de escritura?'), opts: [T('On every write', 'En cada escritura'), T('When a modified line is evicted', 'Al expulsar una línea modificada'), T('Never', 'Nunca')], a: 1 },
    { type: 'mc', q: T('Why must a read check the write buffer first?', '¿Por qué una lectura debe consultar antes el búfer de escritura?'), opts: [T('To save energy', 'Para ahorrar energía'), T('The newest value may still be waiting there (RAW hazard)', 'El valor más reciente puede seguir ahí (riesgo RAW)'), T('To update LRU', 'Para actualizar LRU')], a: 1 },
    { type: 'mc', q: T('Increasing block size while keeping cache size can <i>increase</i>…', 'Aumentar el tamaño de bloque manteniendo el tamaño de caché puede <i>aumentar</i>…'), opts: [T('compulsory misses', 'los fallos forzosos'), T('capacity misses (fewer lines) and the miss penalty', 'los fallos de capacidad (menos líneas) y la penalización'), T('the tag size', 'el tamaño de la etiqueta')], a: 1 },
    { type: 'mc', q: T('Miss penalty has two components:', 'La penalización de fallo tiene dos componentes:'), opts: [T('access to the lower level (latency) + transfer of the block (size / bandwidth)', 'acceso al nivel inferior (latencia) + transferencia del bloque (tamaño / ancho de banda)'), T('tag compare + index decode', 'comparar etiqueta + decodificar índice'), T('TLB + page fault', 'TLB + fallo de página')], a: 0 },
    { type: 'mc', q: T('lw R1,dir1 misses; lw R2,dir2 and lw R3,dir3 are in the cache and are served meanwhile. This is…', 'lw R1,dir1 falla; lw R2,dir2 y lw R3,dir3 están en caché y se atienden mientras tanto. Esto es…'), opts: [T('a blocking cache', 'una caché bloqueante'), 'hit under miss', 'miss under miss'], a: 1 },
    { type: 'mc', q: T('Block = {P1,P2,P3,P4}; the CPU wants P3. The block arrives in order P1,P2,P3,P4 and the CPU resumes at P3. This is…', 'Bloque = {P1,P2,P3,P4}; la CPU quiere P3. El bloque llega en orden P1,P2,P3,P4 y la CPU continúa al llegar P3. Esto es…'), opts: [T('critical word first', 'palabra crítica primero'), T('early restart', 'reinicio temprano'), T('prefetch', 'prefetch')], a: 1, why: T('Critical word first would <i>reorder</i> the transfer: P3 first.', 'Palabra crítica primero <i>reordenaría</i> la transferencia: P3 primero.') },
    { type: 'mc', q: T('A C program walks <code>x[i][j]</code> with <code>j</code> in the outer loop and <code>i</code> in the inner loop on a big matrix. Fix?', 'Un programa C recorre <code>x[i][j]</code> con <code>j</code> en el bucle externo e <code>i</code> en el interno sobre una matriz grande. ¿Solución?'), opts: [T('Loop fusion', 'Fusión de bucles'), T('Loop interchange', 'Intercambio de bucles'), T('Array merging', 'Fusión de arrays')], a: 1, why: T('C stores by rows; the inner loop must run along the row (j). From your notes: wrong order on a big matrix ≈ 100 % misses — no need to calculate.', 'C almacena por filas; el bucle interno debe recorrer la fila (j). De tus apuntes: orden incorrecto en una matriz grande ≈ 100 % de fallos — no hace falta calcular.') },
    { type: 'mc', q: T('<code>key[i]</code>, <code>val[i]</code>, <code>delta[i]</code> are used together and collide in a 2-way L1. Best compiler fix?', '<code>key[i]</code>, <code>val[i]</code>, <code>delta[i]</code> se usan juntos y colisionan en una L1 de 2 vías. ¿Mejor solución del compilador?'), opts: [T('Array merging into one struct', 'Fusión de arrays en una estructura'), T('Blocking', 'Acceso por bloques'), T('Branch linearisation', 'Linearización de saltos')], a: 0, why: T('“Muy típico de examen” — your notes. One line now brings all three fields.', '«Muy típico de examen» — tus apuntes. Una línea trae ahora los tres campos.') },
    { type: 'mc', q: T('Data prefetch issued too early…', 'Un prefetch de datos lanzado demasiado pronto…'), opts: [T('hides no latency', 'no oculta latencia'), T('can evict lines still in use', 'puede expulsar líneas aún en uso'), T('causes RAW hazards', 'provoca riesgos RAW')], a: 1, why: T('Too late hides nothing; too early causes evictions.', 'Tarde no oculta nada; demasiado pronto causa expulsiones.') },
    { type: 'mc', q: T('Basic-block alignment helps because a block that starts at the end of a line…', 'La alineación de bloques básicos ayuda porque un bloque que empieza al final de una línea…'), opts: [T('occupies two lines even if it would fit in one', 'ocupa dos líneas aunque quepa en una'), T('cannot be predicted', 'no se puede predecir'), T('disables prefetch', 'desactiva el prefetch')], a: 0 }
  ];
}

const FC = { q: null, flip: false, got: 0 };
const TH_BODY = { a: thA, b: thB, c: thC, d: thD, e: thE, f: thF };

View('theory', {
  icon: '④', title: () => T('Theory, slide by slide', 'Teoría, diapositiva a diapositiva'), mins: 60,
  done: () => ['th-a', 'th-b', 'th-c', 'th-d', 'th-e', 'th-f', 'theory-sort', 'theory'],
  desc: () => T('Six short units that follow decks L4_1–L4_4: colour-coded reading, a recall mode that blanks the key terms, and a check after every unit.', 'Seis unidades cortas que siguen las presentaciones L4_1–L4_4: lectura con código de colores, un modo de recuerdo que oculta los términos clave y una comprobación tras cada unidad.'),
  render(m, p) {
    const U = TH_UNITS();
    const id = TH_BODY[p] || p === 'p' ? p : store.get('thu', 'a');
    store.set('thu', id);
    const k = U.findIndex(u => u[0] === id);
    const tabs = `<nav class="utabs">${U.map((u, i) => `<a href="#/theory/${u[0]}" class="utab ${u[0] === id ? 'on' : ''} ${S.done['th-' + u[0]] ? 'dn' : ''}"><b>${S.done['th-' + u[0]] ? '✓' : i + 1}</b><span>${u[1]}</span><small>${u[2]}</small></a>`).join('')}
      <a href="#/theory/p" class="utab pr ${id === 'p' ? 'on' : ''} ${S.done.theory && S.done['theory-sort'] ? 'dn' : ''}"><b>★</b><span>${T('Recall deck', 'Baraja de repaso')}</span><small>${T('cards · sorting · final check', 'tarjetas · clasificar · control final')}</small></a></nav>`;
    const top = head(T('Lesson 4', 'Lección 4'), T('Theory, slide by slide', 'Teoría, diapositiva a diapositiva'),
      T('One unit at a time. Read it in Study mode, switch to Recall and fill every blank from memory, then pass the check. The slide numbers tell you where each fact comes from.', 'Una unidad cada vez. Léela en modo Estudiar, pasa a Recordar y rellena cada hueco de memoria, y después supera la comprobación. Los números de diapositiva indican de dónde sale cada dato.'));
    if (id === 'p') {
      m.innerHTML = `<div class="lesson">${top}${tabs}
        <h2>${T('Flashcards — say it out loud first', 'Tarjetas — dilo en voz alta primero')}</h2><div id="fc"></div>
        <h2>${T('Sorting game — which goal does it serve?', 'Juego de clasificación — ¿a qué objetivo sirve?')}</h2><div id="sq"></div>
        <h2>${T('Final checkpoint', 'Punto de control final')}</h2><div id="q"></div>${nextLink('formulas')}</div>`;
      const data = flashData();
      if (!FC.q) { FC.q = data.map((_, i) => i).sort(() => Math.random() - 0.5); FC.got = 0; FC.flip = false; }
      const fc = $('#fc', m);
      const draw = () => {
        if (!FC.q.length) { fc.innerHTML = `<div class="quiz done"><div class="big">🧠</div><h3>${T('Deck cleared', 'Baraja completada')}</h3><button class="btn ghost" id="fr">${T('Shuffle again', 'Barajar otra vez')}</button></div>`; $('#fr', m).onclick = () => { FC.q = null; route(true); }; return; }
        const [q, a] = data[FC.q[0]];
        fc.innerHTML = `<div class="flash ${FC.flip ? 'flip' : ''}"><div class="fcount">${T('Left', 'Quedan')}: ${FC.q.length} · ${T('Known', 'Sabidas')}: ${FC.got}</div><div class="fq">${q}</div>
          ${FC.flip ? `<div class="fa">${a}</div><div class="frow"><button class="btn missb" id="fa2">↻ ${T('Again', 'Otra vez')}</button><button class="btn hitb" id="fg">✓ ${T('I knew it', 'La sabía')}</button></div>` : `<button class="btn" id="ff">${T('Show answer', 'Ver respuesta')}</button>`}</div>`;
        if (FC.flip) {
          $('#fg', m).onclick = () => { FC.q.shift(); FC.got++; FC.flip = false; sfx.ok(); draw(); };
          $('#fa2', m).onclick = () => { FC.q.push(FC.q.shift()); FC.flip = false; sfx.tick(); draw(); };
        } else $('#ff', m).onclick = () => { FC.flip = true; sfx.pop(); draw(); };
      };
      draw();
      Quiz($('#sq', m), 'theory-sort', sortQs());
      Quiz($('#q', m), 'theory', theoryQs());
      return;
    }
    const u = TH_BODY[id](), nx = k + 1 < U.length ? U[k + 1] : null;
    m.innerHTML = `<div class="lesson">${top}${tabs}${learnBar()}
      <div class="uhead"><span>${T('Unit', 'Unidad')} ${k + 1}/${U.length} · ${sref(U[k][2])}</span><h2>${U[k][1]}</h2><p class="idea">${u.idea}</p></div>
      ${u.html}
      <div class="ucheck"><h2>${T('Check this unit', 'Comprueba esta unidad')}</h2><p class="mute">${T('Try Recall mode on the text above first. Then answer without scrolling back.', 'Prueba antes el modo Recordar con el texto de arriba. Después responde sin volver atrás.')}</p><div id="uq"></div></div>
      <a class="next" href="#/theory/${nx ? nx[0] : 'p'}"><span>${T('Next', 'Siguiente')}</span><b>${nx ? `${T('Unit', 'Unidad')} ${k + 2} · ${nx[1]}` : '★ ' + T('Recall deck', 'Baraja de repaso')} →</b></a></div>`;
    const root = m.firstElementChild;
    learnInit(root); liInit(root);
    Quiz($('#uq', m), 'th-' + id, u.qs);
  }
});
