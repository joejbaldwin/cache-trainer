'use strict';
/* Per-level policies: every cache level has its own write policy, replacement policy and write buffer.
   The model is run ahead of time into frames (state snapshots), so the page can step back and forward. */

const PLN = ['L1', 'L2', 'L3', 'RAM'], PLC = [1, 4, 10, 40], PLB = ['A', 'B', 'C', 'D', 'E', 'F'], PLCAP = 2;
const plFresh = () => { const s = { lines: [[], [], []], bufs: [[], [], []], ram: {}, ver: {}, t: 0, wait: 0, bg: 0, op: '' }; PLB.forEach(b => { s.ram[b] = 0; s.ver[b] = 0; }); return s; };
const PL = {
  cfg: [{ wp: 'WT', rp: 'LRU', buf: 1, size: 2 }, { wp: 'WB', rp: 'LRU', buf: 0, size: 3 }, { wp: 'WB', rp: 'LRU', buf: 0, size: 4 }],
  base: plFresh(), ops: [], frames: [], i: 0, play: false, sp: 1, sel: 'A', seen: {}, scen: null, note: null, moving: false, tok: 0
};

function plRules() {
  return [
    ['level', T('Each level obeys only its own switches', 'Cada nivel obedece solo a sus propios interruptores'), 'mix'],
    ['wt', T('Write-through: every write is forwarded down at once', 'Write-through: cada escritura se reenvía abajo al momento'), 'wt0'],
    ['wb', T('Write-back: the write stays here and sets the dirty bit', 'Write-back: la escritura se queda aquí y activa el bit sucio'), 'mix'],
    ['alloc', T('Write miss: the block is fetched first, then written', 'Fallo de escritura: primero se trae el bloque, luego se escribe'), 'wbev'],
    ['copy', T('A block copied up arrives clean (D0)', 'Un bloque copiado hacia arriba llega limpio (D0)'), 'wbev'],
    ['dirty', T('Write-back eviction of a DIRTY line: written to the next level only', 'Expulsión write-back de una línea SUCIA: se escribe solo en el nivel siguiente'), 'wbev'],
    ['clean', T('Write-back eviction of a CLEAN line: dropped, nothing is written', 'Expulsión write-back de una línea LIMPIA: se descarta, no se escribe nada'), 'wbev'],
    ['wtev', T('Write-through eviction: always just dropped', 'Expulsión write-through: siempre se descarta sin más'), 'keep'],
    ['keep', T('Reading a dirty line does not clear its dirty bit', 'Leer una línea sucia no borra su bit sucio'), 'keep'],
    ['rp', T('Replacement policy is per level: LRU and FIFO pick different victims', 'La política de reemplazo es por nivel: LRU y FIFO eligen víctimas distintas'), 'rp'],
    ['bufwt', T('Buffer + write-through: it receives every write', 'Búfer + write-through: recibe cada escritura'), 'wt1'],
    ['bufwb', T('Buffer + write-back: it only receives dirty evicted lines', 'Búfer + write-back: solo recibe líneas sucias expulsadas'), 'raw'],
    ['nowait', T('With a buffer the CPU does not wait for the level below', 'Con búfer la CPU no espera al nivel inferior'), 'wt1'],
    ['raw', T('A read checks the buffer’s pending writes before going down', 'Una lectura consulta las escrituras pendientes del búfer antes de bajar'), 'raw'],
    ['merge', T('Pending writes to the same line merge in the buffer', 'Las escrituras pendientes sobre la misma línea se mezclan en el búfer'), 'merge']
  ];
}
function plScen() {
  const c = (a, b, d) => [a, b, d];
  return {
    mix: { cfg: [c('WT', 'LRU', 1), c('WB', 'LRU', 0), c('WB', 'LRU', 0)], ops: ['RA', 'WA', 'WA'] },
    wt0: { cfg: [c('WT', 'LRU', 0), c('WT', 'LRU', 0), c('WT', 'LRU', 0)], ops: ['RA', 'WA'] },
    wt1: { cfg: [c('WT', 'LRU', 1), c('WT', 'LRU', 1), c('WT', 'LRU', 1)], ops: ['RA', 'WA'] },
    wbev: { cfg: [c('WB', 'LRU', 0), c('WB', 'LRU', 0), c('WB', 'LRU', 0)], ops: ['WA', 'RB', 'RC', 'RD'] },
    keep: { cfg: [c('WT', 'LRU', 0), c('WB', 'LRU', 0), c('WB', 'LRU', 0)], ops: ['WA', 'RB', 'RC', 'RA', 'WA'] },
    raw: { cfg: [c('WB', 'LRU', 1), c('WB', 'LRU', 0), c('WB', 'LRU', 0)], ops: ['WA-', 'WB-', 'WC-', 'RA-', 'D'] },
    merge: { cfg: [c('WT', 'LRU', 1), c('WB', 'LRU', 0), c('WB', 'LRU', 0)], ops: ['RA-', 'WA-', 'WA-', 'D'] },
    rp: { cfg: [c('WB', 'FIFO', 0), c('WB', 'LRU', 0), c('WB', 'LRU', 0)], ops: ['RA', 'RB', 'RA', 'RC', 'RA'] }
  };
}

/* ---------- the model: runs ops and records one frame per event ---------- */
function plSim(base, cfg, ops) {
  const s = JSON.parse(JSON.stringify(base)), F = [], N = PLN;
  let oi = 0;
  const emit = o => F.push(Object.assign({ s: JSON.parse(JSON.stringify(s)), hl: {}, oi, rules: [] }, o));
  const find = (lv, X) => s.lines[lv].find(x => x.b === X);
  const K = (lv, X) => lv + ':' + X, LS = (lv, X) => `#pl-${lv}-${X}`, RS = X => `#pl-r-${X}`, BS = lv => `#pl-b${lv}`;
  const cost = (n, bg) => { if (bg) s.bg += n; else s.wait += n; };
  const victim = lv => s.lines[lv].reduce((a, x) => ((cfg[lv].rp === 'LRU' ? x.used < a.used : x.loaded < a.loaded) ? x : a));

  function install(lv, X, v, from, bg, cap, pre) {
    const L = s.lines[lv], cf = cfg[lv], lru = cf.rp === 'LRU';
    if (L.length >= cf.size) {
      const vic = victim(lv), ord = [...L].sort((a, b) => (lru ? a.used - b.used : a.loaded - b.loaded));
      emit({ at: lv, kind: 'evict', sw: { lv, k: 'rp' }, rules: ['rp'], hl: { [K(lv, vic.b)]: 'evict' },
        ttl: T(`${N[lv]} is full`, `${N[lv]} está llena`),
        txt: T(`No free line for ${X}. ${N[lv]}’s own replacement policy, ${cf.rp}, picks who leaves: ${lru ? 'the line used longest ago' : 'the line loaded first, even if it was used recently'}.`, `No hay línea libre para ${X}. La política de reemplazo propia de ${N[lv]}, ${cf.rp}, elige quién sale: ${lru ? 'la línea que lleva más tiempo sin usarse' : 'la línea que se cargó primero, aunque se haya usado hace poco'}.`),
        choice: { q: cf.rp, opts: ord.map(x => [x.b, lru ? T(`last used ${s.t - x.used} steps ago`, `último uso hace ${s.t - x.used} pasos`) : T(`loaded ${s.t - x.loaded} steps ago`, `cargada hace ${s.t - x.loaded} pasos`)]), pick: 0 } });
      if (cf.wp === 'WT') {
        emit({ at: lv, kind: 'info', sw: { lv, k: 'wp' }, rules: ['wtev'], hl: { [K(lv, vic.b)]: 'drop' },
          ttl: T(`${N[lv]} · write-through eviction`, `${N[lv]} · expulsión write-through`),
          txt: T(`${vic.b} is simply dropped. A write-through level has no dirty bit at all: every write was already passed down the moment it happened, so there is nothing left to save.`, `${vic.b} se descarta sin más. Un nivel write-through no tiene bit sucio: cada escritura ya se pasó abajo en el momento en que ocurrió, así que no queda nada que salvar.`) });
        L.splice(L.indexOf(vic), 1);
      } else {
        emit({ at: lv, kind: vic.d ? 'dirty' : 'info', sw: { lv, k: 'wp' }, rules: [vic.d ? 'dirty' : 'clean'], hl: { [K(lv, vic.b)]: vic.d ? 'dirty' : 'drop' },
          ttl: T(`${N[lv]} · write-back eviction`, `${N[lv]} · expulsión write-back`),
          txt: vic.d ? T(`${vic.b} is dirty: it was modified here and that version has not been written down yet, so no level below has it. It must be written before the line is reused, and only to ${N[lv + 1]}, not to every level below.`, `${vic.b} está sucia: se modificó aquí y esa versión aún no se ha escrito abajo, así que ningún nivel inferior la tiene. Hay que escribirla antes de reutilizar la línea, y solo en ${N[lv + 1]}, no en todos los niveles inferiores.`)
            : T(`${vic.b} is clean: it has not been modified since it was loaded, so an identical copy already exists somewhere below. ${N[lv]} does not check where. Nothing is written; the line is just reused.`, `${vic.b} está limpia: no se ha modificado desde que se cargó, así que ya existe una copia idéntica en algún nivel inferior. ${N[lv]} no comprueba dónde. No se escribe nada; la línea simplemente se reutiliza.`),
          choice: { q: T('dirty bit?', '¿bit sucio?'), opts: [['D1', T(`write it to ${N[lv + 1]} first`, `escribirla antes en ${N[lv + 1]}`)], ['D0', T('discard on the spot, no write', 'descartarla en el acto, sin escritura')]], pick: vic.d ? 0 : 1 } });
        if (vic.d) sendDown(lv, vic.b, vic.v, bg, LS(lv, vic.b), () => L.splice(L.indexOf(vic), 1));
        else L.splice(L.indexOf(vic), 1);
      }
    }
    if (pre) pre();
    L.push({ b: X, v, d: false, used: ++s.t, loaded: s.t });
    emit(Object.assign({ at: lv, kind: 'in', hl: { [K(lv, X)]: 'in' }, fly: { from, to: LS(lv, X), txt: `${X} v${v}`, bg } }, cap));
  }
  function sendDown(lv, X, v, bg, from, pre) {
    const cf = cfg[lv];
    if (!cf.buf) return recv(lv + 1, X, v, bg, from, pre);
    const B = s.bufs[lv], ex = B.find(e => e.b === X), fly = { from, to: BS(lv), txt: `${X} v${v}`, bg };
    if (ex) {
      if (pre) pre(); ex.v = v; cost(1, bg);
      emit({ at: lv, kind: 'buf', sw: { lv, k: 'bf' }, rules: ['merge'], hl: { ['buf' + lv]: 'in' }, fly,
        ttl: T(`${N[lv]} · write buffer: merge`, `${N[lv]} · búfer de escritura: mezcla`),
        txt: T(`A write to ${X} is already waiting here. The new one merges into it: one entry holding the latest value (v${v}), so one transfer to ${N[lv + 1]} instead of two.`, `Ya hay una escritura de ${X} esperando aquí. La nueva se mezcla con ella: una entrada con el último valor (v${v}), así que una transferencia a ${N[lv + 1]} en vez de dos.`) });
      return;
    }
    if (B.length >= PLCAP) {
      emit({ at: lv, kind: 'miss', sw: { lv, k: 'bf' }, hl: { ['buf' + lv]: 'in' },
        ttl: T(`${N[lv]} · write buffer is full`, `${N[lv]} · búfer de escritura lleno`),
        txt: T(`No free entry. This time the CPU does have to wait while the oldest entry is written to ${N[lv + 1]}.`, `No hay entrada libre. Esta vez la CPU sí tiene que esperar mientras la entrada más antigua se escribe en ${N[lv + 1]}.`) });
      drainOne(lv, bg);
    }
    if (pre) pre(); B.push({ b: X, v }); cost(1, bg);
    const wt = cf.wp === 'WT';
    emit({ at: lv, kind: 'buf', sw: { lv, k: 'bf' }, rules: [wt ? 'bufwt' : 'bufwb', 'nowait'], hl: { ['buf' + lv]: 'in' }, fly,
      ttl: T(`${N[lv]} · write buffer`, `${N[lv]} · búfer de escritura`),
      txt: wt ? T(`${N[lv]} is write-through, so every single write lands here. The CPU carries on immediately; ${N[lv + 1]} will be updated in the background.`, `${N[lv]} es write-through, así que cada escritura cae aquí. La CPU continúa de inmediato; ${N[lv + 1]} se actualizará en segundo plano.`)
        : T(`${N[lv]} is write-back, so the buffer only ever receives dirty lines being evicted. The line is free to reuse now; the CPU does not wait for ${N[lv + 1]}.`, `${N[lv]} es write-back, así que el búfer solo recibe líneas sucias expulsadas. La línea ya se puede reutilizar; la CPU no espera a ${N[lv + 1]}.`) });
  }
  function drainOne(lv, bg) { const e = s.bufs[lv][0]; recv(lv + 1, e.b, e.v, bg, BS(lv), () => s.bufs[lv].shift()); }
  function recv(lv, X, v, bg, from, pre) {
    cost(PLC[lv], bg);
    const fly = { from, to: lv === 3 ? RS(X) : LS(lv, X), txt: `${X} v${v}`, bg };
    if (lv === 3) {
      if (pre) pre(); s.ram[X] = v;
      emit({ at: 'ram', kind: 'wr', hl: { ['r' + X]: 'wr' }, fly, ttl: T('RAM is written', 'Se escribe la RAM'),
        txt: T(`${X} is now v${v} in RAM. RAM has no policy and no dirty bit: it is simply written at its address.`, `${X} es ahora v${v} en la RAM. La RAM no tiene política ni bit sucio: simplemente se escribe en su dirección.`) });
      return;
    }
    const cf = cfg[lv]; let ln = find(lv, X);
    if (!ln) {
      install(lv, X, v, from, bg, { ttl: T(`${N[lv]} receives a write`, `${N[lv]} recibe una escritura`), txt: T(`${N[lv]} was not holding ${X}, so it takes a line for it (v${v}).`, `${N[lv]} no tenía ${X}, así que le asigna una línea (v${v}).`) }, pre);
      ln = find(lv, X);
    } else {
      if (pre) pre(); ln.v = v; ln.used = ++s.t;
      emit({ at: lv, kind: 'wr', hl: { [K(lv, X)]: 'wr' }, fly, ttl: T(`${N[lv]} receives a write`, `${N[lv]} recibe una escritura`), txt: T(`${N[lv]} updates its copy of ${X} to v${v}. What it does next depends only on ${N[lv]}’s own write policy.`, `${N[lv]} actualiza su copia de ${X} a v${v}. Lo que haga después depende solo de la política de escritura de ${N[lv]}.`) });
    }
    const differs = cfg[lv - 1].wp !== cf.wp, rl = differs ? ['level'] : [];
    if (cf.wp === 'WT') {
      emit({ at: lv, kind: 'wr', sw: { lv, k: 'wp' }, rules: ['wt', ...rl], hl: { [K(lv, X)]: 'wr' }, ttl: T(`${N[lv]} · write-through`, `${N[lv]} · write-through`),
        txt: T(`${N[lv]}’s switch says: forward every write to ${N[lv + 1]} immediately.${differs ? ` ${N[lv - 1]} had a different policy; that does not matter here.` : ''}`, `El interruptor de ${N[lv]} dice: reenviar cada escritura a ${N[lv + 1]} de inmediato.${differs ? ` ${N[lv - 1]} tenía otra política; aquí eso no importa.` : ''}`) });
      sendDown(lv, X, v, bg, LS(lv, X));
    } else {
      ln.d = true;
      emit({ at: lv, kind: 'dirty', sw: { lv, k: 'wp' }, rules: ['wb', ...rl], hl: { [K(lv, X)]: 'dirty' }, ttl: T(`${N[lv]} · write-back`, `${N[lv]} · write-back`),
        txt: T(`${N[lv]}’s switch says: keep the write here and set the dirty bit. The write stops at ${N[lv]}. Nothing below has this version yet.${differs ? ` ${N[lv - 1]} was write-through, but ${N[lv]} decides for itself.` : ''}`, `El interruptor de ${N[lv]} dice: quedarse la escritura y activar el bit sucio. La escritura se detiene en ${N[lv]}. Nada de lo de abajo tiene todavía esta versión.${differs ? ` ${N[lv - 1]} era write-through, pero ${N[lv]} decide por sí mismo.` : ''}`) });
    }
  }
  function read(X, skipFirst) {
    let top = 2, val, src;
    for (let lv = 0; lv < 3 && src == null; lv++) {
      const ln = find(lv, X);
      if (!(skipFirst && lv === 0)) cost(PLC[lv]);
      if (ln) {
        ln.used = ++s.t;
        emit({ at: lv, kind: 'hit', rules: ln.d ? ['keep'] : [], hl: { [K(lv, X)]: 'hit', ['box' + lv]: 'bh' }, ttl: T(`${N[lv]} · hit`, `${N[lv]} · acierto`),
          txt: ln.d ? T(`${X} is here and it is dirty. Reading it changes nothing: the dirty bit stays set, because this version has still not been written down.`, `${X} está aquí y está sucia. Leerla no cambia nada: el bit sucio sigue activo, porque esta versión todavía no se ha escrito abajo.`) : T(`${X} v${ln.v} is here.`, `${X} v${ln.v} está aquí.`) });
        top = lv - 1; val = ln.v; src = LS(lv, X); break;
      }
      if (!(skipFirst && lv === 0)) emit({ at: lv, kind: 'miss', hl: { ['box' + lv]: 'bm' }, ttl: T(`${N[lv]} · miss`, `${N[lv]} · fallo`), txt: T(`${X} is not in ${N[lv]}.`, `${X} no está en ${N[lv]}.`) });
      const e = cfg[lv].buf ? s.bufs[lv].find(e => e.b === X) : null;
      if (e) {
        emit({ at: lv, kind: 'buf', sw: { lv, k: 'bf' }, rules: ['raw'], hl: { ['buf' + lv]: 'in' }, ttl: T(`${N[lv]} · write buffer checked first`, `${N[lv]} · primero se consulta el búfer`),
          txt: T(`Before asking ${N[lv + 1]}, the pending writes are checked. ${X} v${e.v} is still waiting here, and ${N[lv + 1]} only has an older copy. The value is taken from the buffer.`, `Antes de preguntar a ${N[lv + 1]} se consultan las escrituras pendientes. ${X} v${e.v} sigue esperando aquí, y ${N[lv + 1]} solo tiene una copia más antigua. El valor se toma del búfer.`) });
        top = lv; val = e.v; src = BS(lv);
      }
    }
    if (src == null) {
      cost(PLC[3]); val = s.ram[X]; src = RS(X);
      emit({ at: 'ram', kind: 'hit', hl: { ['r' + X]: 'hit' }, ttl: T('RAM', 'RAM'), txt: T(`RAM always has the block. ${X} is read directly at its address.`, `La RAM siempre tiene el bloque. ${X} se lee directamente en su dirección.`) });
    }
    for (let lv = top; lv >= 0; lv--) {
      const wb = cfg[lv].wp === 'WB';
      install(lv, X, val, lv === top ? src : LS(lv + 1, X), false, { rules: wb ? ['copy'] : [], ttl: T(`${N[lv]} · copy up`, `${N[lv]} · copia hacia arriba`),
        txt: wb ? T(`${X} is copied into ${N[lv]} as clean (D0): ${N[lv]} has not modified it, whatever the dirty bit of the copy it came from says.`, `${X} se copia en ${N[lv]} como limpia (D0): ${N[lv]} no la ha modificado, diga lo que diga el bit sucio de la copia de la que viene.`) : T(`${X} is copied into ${N[lv]}.`, `${X} se copia en ${N[lv]}.`) });
    }
  }
  function write(X) {
    let ln = find(0, X); cost(PLC[0]);
    if (!ln) {
      emit({ at: 0, kind: 'miss', rules: ['alloc'], hl: { box0: 'bm' }, ttl: T('L1 · write miss', 'L1 · fallo de escritura'), txt: T(`${X} is not in L1. The whole block is brought into L1 first; only then is it written.`, `${X} no está en L1. Primero se trae el bloque entero a L1; solo entonces se escribe.`) });
      read(X, true); ln = find(0, X);
    } else ln.used = ++s.t;
    const v = ++s.ver[X]; ln.v = v;
    emit({ at: 0, kind: 'wr', hl: { [K(0, X)]: 'wr' }, fly: { from: '#pl-cpu', to: LS(0, X), txt: `${X} v${v}` }, ttl: T('L1 · the CPU writes', 'L1 · la CPU escribe'), txt: T(`${X} becomes v${v} in L1. Every other copy of ${X} (red) is now out of date.`, `${X} pasa a v${v} en L1. Todas las demás copias de ${X} (en rojo) quedan desactualizadas.`) });
    if (cfg[0].wp === 'WT') {
      emit({ at: 0, kind: 'wr', sw: { lv: 0, k: 'wp' }, rules: ['wt'], hl: { [K(0, X)]: 'wr' }, ttl: 'L1 · write-through', txt: T('L1’s switch says: forward every write to L2 immediately. No dirty bit is needed.', 'El interruptor de L1 dice: reenviar cada escritura a L2 de inmediato. No hace falta bit sucio.') });
      sendDown(0, X, v, false, LS(0, X));
    } else {
      ln.d = true;
      emit({ at: 0, kind: 'dirty', sw: { lv: 0, k: 'wp' }, rules: ['wb'], hl: { [K(0, X)]: 'dirty' }, ttl: 'L1 · write-back', txt: T('L1’s switch says: keep the write here and set the dirty bit. Nothing leaves L1 until this line is evicted.', 'El interruptor de L1 dice: quedarse la escritura y activar el bit sucio. Nada sale de L1 hasta que se expulse esta línea.') });
      if (cfg[0].buf) emit({ at: 0, kind: 'info', sw: { lv: 0, k: 'bf' }, rules: ['bufwb'], hl: { buf0: 'idle', [K(0, X)]: 'dirty' }, ttl: T('L1 · write buffer stays empty', 'L1 · el búfer sigue vacío'), txt: T('With write-back the buffer is not used on a write. It only receives a dirty line at the moment that line is evicted.', 'Con write-back el búfer no se usa al escribir. Solo recibe una línea sucia en el momento en que se expulsa.') });
    }
  }
  function drainAll() {
    let g = 0;
    while (g++ < 40) {
      const lv = s.bufs.findIndex(b => b.length); if (lv < 0) break;
      const e = s.bufs[lv][0];
      emit({ at: lv, kind: 'buf', hl: { ['buf' + lv]: 'in' }, ttl: T(`${N[lv]} · buffer drains (background)`, `${N[lv]} · el búfer se vacía (segundo plano)`), txt: T(`The CPU is already doing something else. The waiting write of ${e.b} v${e.v} now goes on to ${N[lv + 1]}.`, `La CPU ya está en otra cosa. La escritura pendiente de ${e.b} v${e.v} pasa ahora a ${N[lv + 1]}.`) });
      drainOne(lv, true);
    }
  }
  ops.forEach((op, k) => {
    oi = k;
    if (op === 'D') { s.op = T('BUFFERS DRAIN', 'VACIADO DE BÚFERES'); s.wait = 0; s.bg = 0; drainAll(); return; }
    const W = op[0] === 'W', X = op[1], hold = op.endsWith('-');
    s.wait = 0; s.bg = 0; s.op = `${W ? T('WRITE', 'ESCRIBIR') : T('READ', 'LEER')} ${X}`;
    emit({ at: 'cpu', kind: 'info', first: true, hl: { cpu: 'on' }, ttl: s.op, txt: W ? T(`The CPU wants to write block ${X}.`, `La CPU quiere escribir el bloque ${X}.`) : T(`The CPU wants to read block ${X}.`, `La CPU quiere leer el bloque ${X}.`) });
    W ? write(X) : read(X);
    const pend = s.bufs.some(b => b.length);
    emit({ at: 'cpu', kind: 'hit', hl: { cpu: 'on' }, fly: W ? null : { from: LS(0, X), to: '#pl-cpu', txt: `${X} v${find(0, X).v}` }, ttl: T('CPU continues', 'La CPU continúa'),
      txt: T(`The CPU waited ${s.wait} time units for this ${W ? 'write' : 'read'}.${pend ? ' Writes still sitting in a buffer will finish in the background.' : ''}`, `La CPU esperó ${s.wait} unidades de tiempo en esta ${W ? 'escritura' : 'lectura'}.${pend ? ' Las escrituras que siguen en un búfer terminarán en segundo plano.' : ''}`) });
    if (!hold) drainAll();
  });
  return F;
}

View('policies', {
  icon: '⚙', title: () => T('Per-level policies', 'Políticas por nivel'), mins: 20, done: () => ['policies'],
  desc: () => T('Each level has its own switches: write-through or write-back, LRU or FIFO, write buffer or not. Step through every nuance, forward and back.', 'Cada nivel tiene sus interruptores: write-through o write-back, LRU o FIFO, con o sin búfer. Recorre cada matiz paso a paso, adelante y atrás.'),
  render(m) {
    m.classList.add('wide'); let alive = true;
    onLeave(() => { alive = false; PL.play = false; PL.moving = false; PL.tok++; m.classList.remove('wide'); });
    const recompute = () => { PL.frames = PL.ops.length ? plSim(PL.base, PL.cfg, PL.ops) : []; PL.i = Math.min(PL.i, Math.max(0, PL.frames.length - 1)); };
    recompute();
    m.innerHTML = `<div class="fl-top"><div><div class="kicker">${T('Diagram', 'Diagrama')}</div><h1>${T('Per-level policies', 'Políticas por nivel')}</h1></div></div>
      <div class="pl-bar"><button class="btn ghost" id="pb0" title="${T('first step', 'primer paso')}">⏮</button><button class="btn ghost" id="pbB">◀ ${T('Back', 'Atrás')}</button><button class="btn" id="pbN">${T('Next', 'Siguiente')} ▶</button>
        <button class="btn ghost" id="pbP"></button><input type="range" id="pbS" min="0" max="0" value="0"><span class="pl-cnt mono" id="pbC"></span>
        ${segc('psp', [[1, '1×'], [2, '2×']], PL.sp)}<button class="btn ghost" id="prs">↺ ${T('clear', 'vaciar')}</button></div>
      <div class="flow-wrap"><div class="pl-stage" id="pstage"><div class="pl" id="pl"></div><div class="pl-bub" id="pbub"></div></div></div>
      <h2>${T('The nuances — press one to see it happen', 'Los matices — pulsa uno para verlo ocurrir')}</h2>
      <div class="pl-rules" id="prules"></div>
      <div class="fl-leg"><span><b class="pv new">v2</b> ${T('newest version', 'versión más reciente')}</span><span><b class="pv old">v1</b> ${T('out of date', 'desactualizada')}</span><span><b class="pd on">D1</b> ${T('dirty: modified here, not yet written down', 'sucia: modificada aquí, aún no escrita abajo')}</span><span><b class="pd off">D0</b> ${T('clean', 'limpia')}</span><span><b class="pd na">D—</b> ${T('write-through has no dirty bit', 'write-through no tiene bit sucio')}</span><span>${T('illustrative time units', 'unidades de tiempo ilustrativas')}: L1 1 · L2 4 · L3 10 · RAM 40 · ${T('buffer', 'búfer')} 1</span></div>`;
    const host = $('#pl', m), stage = $('#pstage', m), bub = $('#pbub', m);
    const cur = () => PL.frames[PL.i];
    const draw = () => {
      const f = cur(), s = f ? f.s : PL.base, hl = f ? f.hl : {}, cls = k => hl[k] || '';
      const sw = (i, k) => (f && f.sw && f.sw.lv === i && f.sw.k === k ? 'glow' : '');
      const lv = i => {
        const cf = PL.cfg[i], L = s.lines[i], full = L.length >= cf.size;
        const vic = full ? L.reduce((a, x) => ((cf.rp === 'LRU' ? x.used < a.used : x.loaded < a.loaded) ? x : a)) : null;
        const rows = L.map(x => `<div class="pl-ln ${cls(i + ':' + x.b)}" id="pl-${i}-${x.b}"><b>${x.b}</b><span class="pv ${x.v === s.ver[x.b] ? 'new' : 'old'}">v${x.v}</span><span class="pd ${cf.wp === 'WT' ? 'na' : x.d ? 'on' : 'off'}">D${cf.wp === 'WT' ? '—' : x.d ? 1 : 0}</span>${x === vic ? `<em>${cf.rp} ${T('out next', 'sale')}</em>` : ''}</div>`).join('') + '<div class="pl-ln empty"></div>'.repeat(cf.size - L.length);
        return `<div class="fl-box pl-lv ${cls('box' + i)} ${f && f.at === i ? 'act' : ''}" id="pl-box${i}" style="flex:1 1 200px">
          <div class="pl-buf ${cf.buf ? 'on' : 'offb'} ${cls('buf' + i)}" id="pl-b${i}"><small>${cf.buf ? T('write buffer', 'búfer de escritura') : T('no buffer', 'sin búfer')}</small><div>${s.bufs[i].map(e => `<i>${e.b} v${e.v}</i>`).join('') || '<u></u>'}</div></div>
          <div class="fl-h"><b>${PLN[i]}</b><span>${cf.size} ${T('lines', 'líneas')}</span></div>
          <div class="pl-set"><div class="pl-sw ${sw(i, 'wp')}">${segc('wp' + i, [['WT', 'write-through'], ['WB', 'write-back']], cf.wp)}</div><div class="pl-sw ${sw(i, 'rp')}">${segc('rp' + i, [['LRU', 'LRU'], ['FIFO', 'FIFO']], cf.rp)}</div><div class="pl-sw ${sw(i, 'bf')}">${segc('bf' + i, [[1, T('buffer', 'búfer')], [0, T('no buffer', 'sin búfer')]], cf.buf)}</div></div>
          <div class="pl-lines">${rows}</div></div>`;
      };
      const stale = b => s.ram[b] !== s.ver[b];
      host.innerHTML = `
        <div class="fl-box pl-cpu ${cls('cpu')} ${f && f.at === 'cpu' ? 'act' : ''}" id="pl-cpu" style="flex:0 0 150px"><div class="fl-h"><b>CPU</b></div>
          <div class="pl-blk">${PLB.map(b => `<button class="${b === PL.sel ? 'on' : ''}" data-b="${b}">${b}</button>`).join('')}</div>
          <button class="btn ghost" id="pR">${T('Read', 'Leer')} ${PL.sel}</button><button class="btn ghost" id="pW">${T('Write', 'Escribir')} ${PL.sel}</button>
          <div class="pl-m"><span>${T('CPU waited', 'CPU esperó')}</span><b>${s.wait}</b></div><div class="pl-m bgm"><span>${T('background', 'segundo plano')}</span><b>${s.bg}</b></div>
          <div class="pl-op">${s.op}</div></div>
        <div class="fl-arr go"><b>→</b></div>${lv(0)}<div class="fl-arr go"><b>→</b></div>${lv(1)}<div class="fl-arr go"><b>→</b></div>${lv(2)}<div class="fl-arr go"><b>→</b></div>
        <div class="fl-box pl-ram ${f && f.at === 'ram' ? 'act' : ''}" id="pl-ram" style="flex:0 0 170px"><div class="fl-h"><b>RAM</b><span>${T('no policy', 'sin política')}</span></div>
          <div class="pl-lines">${PLB.map(b => `<div class="pl-ln ${cls('r' + b)}" id="pl-r-${b}"><b>${b}</b><span class="pv ${stale(b) ? 'old' : 'new'}">v${s.ram[b]}</span>${stale(b) ? `<em>${T('stale', 'obsoleta')}</em>` : ''}</div>`).join('')}</div></div>`;
      /* callout attached to the box it talks about */
      const note = f || PL.note || { at: 'cpu', kind: 'info', ttl: T('Start here', 'Empieza aquí'), txt: T('Press a nuance below to watch it, or pick a block and press Read or Write. Then use Next and Back. Flip any switch on any level: only that level changes.', 'Pulsa un matiz abajo para verlo, o elige un bloque y pulsa Leer o Escribir. Luego usa Siguiente y Atrás. Cambia cualquier interruptor de cualquier nivel: solo cambia ese nivel.') };
      const anchor = $(note.at === 'cpu' ? '#pl-cpu' : note.at === 'ram' ? '#pl-ram' : '#pl-box' + note.at, m);
      bub.className = 'pl-bub k-' + note.kind;
      bub.innerHTML = `<div class="bh"><b>${note.ttl}</b>${f ? `<span>${T('step', 'paso')} ${PL.i + 1}/${PL.frames.length}</span>` : ''}</div><p>${note.txt}</p>${note.choice ? `<div class="pl-ch"><span class="q">${note.choice.q}</span>${note.choice.opts.map((o, k) => `<div class="${k === note.choice.pick ? 'on' : ''}"><b>${o[0]}</b><span>${o[1]}</span>${k === note.choice.pick ? '<i>◀</i>' : ''}</div>`).join('')}</div>` : ''}`;
      const S = stage.getBoundingClientRect(), A = anchor.getBoundingClientRect(), W = Math.min(430, S.width - 8), cx = A.left + A.width / 2 - S.left;
      const left = Math.max(4, Math.min(S.width - W - 4, cx - W / 2));
      /* sit below every box the callout would overlap; a stem keeps it attached to its own box */
      let low = A.bottom;
      $$('#pl > .fl-box', m).forEach(b => { const r = b.getBoundingClientRect(); if (r.right > S.left + left && r.left < S.left + left + W) low = Math.max(low, r.bottom); });
      bub.style.cssText = `width:${W}px;left:${left}px;top:${low - S.top + 18}px;--px:${Math.max(18, Math.min(W - 18, cx - left))}px;--stem:${Math.max(0, low - A.bottom + 4)}px`;
      if (f) f.rules.forEach(r => (PL.seen[r] = 1));
      $('#prules', m).innerHTML = plRules().map(([k, t, sc]) => `<button class="pl-rule ${PL.seen[k] ? 'seen' : ''} ${f && f.rules.includes(k) ? 'now' : ''}" data-s="${sc}"><i>${PL.seen[k] ? '✓' : '▶'}</i><span>${t}</span></button>`).join('');
      $$('[data-s]', m).forEach(b => (b.onclick = () => startScen(b.dataset.s)));
      const n = PL.frames.length, sl = $('#pbS', m);
      sl.max = Math.max(0, n - 1); sl.value = PL.i; sl.disabled = !n;
      $('#pbC', m).textContent = n ? `${PL.i + 1} / ${n}` : '–';
      $('#pbB', m).disabled = !n || PL.i === 0; $('#pb0', m).disabled = !n || PL.i === 0; $('#pbN', m).disabled = !n || PL.i >= n - 1;
      $('#pbP', m).innerHTML = PL.play ? `⏸ ${T('Pause', 'Pausa')}` : `⏵ ${T('Auto-play', 'Automático')}`; $('#pbP', m).disabled = !n;
      $$('[data-b]', host).forEach(b => (b.onclick = () => { PL.sel = b.dataset.b; sfx.tick(); draw(); }));
      $('#pR', m).onclick = () => manual('R' + PL.sel); $('#pW', m).onclick = () => manual('W' + PL.sel);
      PL.cfg.forEach((cf, i) => { onSeg(m, 'wp' + i, v => setCfg(i, 'wp', v)); onSeg(m, 'rp' + i, v => setCfg(i, 'rp', v)); onSeg(m, 'bf' + i, v => setCfg(i, 'buf', +v)); });
    };
    const snd = k => ({ hit: sfx.hit, miss: sfx.miss, evict: sfx.evict, wr: sfx.pop, in: sfx.pop, dirty: sfx.tick, buf: sfx.tick, info: sfx.tick }[k] || sfx.tick)();
    const fly = async (from, toSel, txt, bg) => {
      const to = $(toSel, m); if (!to || !from) return;
      const chip = document.createElement('div'); chip.className = 'fl-token' + (bg ? ' bgt' : ''); chip.textContent = txt; document.body.appendChild(chip);
      const t = to.getBoundingClientRect(), p = r => `translate(${r.left + r.width / 2}px,${r.top + r.height / 2}px) translate(-50%,-50%)`;
      const a = chip.animate([{ transform: p(from) + ' scale(.6)', opacity: 0.3 }, { opacity: 1, offset: 0.2 }, { transform: p(t), opacity: 1 }], { duration: 650 / PL.sp, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      await Promise.race([a.finished.catch(() => 0), sleep(850 / PL.sp)]); chip.remove();
    };
    const go = async (j, quiet) => {
      const n = PL.frames.length; if (!n || PL.moving) return;
      j = Math.max(0, Math.min(n - 1, j)); if (j === PL.i && !quiet) return;
      const fwd = j === PL.i + 1, f = PL.frames[j];
      let from = null; if (fwd && f.fly) { const e = $(f.fly.from, m); from = e ? e.getBoundingClientRect() : null; }
      PL.i = j; draw(); if (!quiet) snd(f.kind);
      if (from) { PL.moving = true; const tk = PL.tok; await fly(from, f.fly.to, f.fly.txt, f.fly.bg); if (tk === PL.tok) PL.moving = false; }
      if (j === n - 1 && PL.scen && alive) { markDone('policies'); }
    };
    const autoplay = async () => {
      const tk = ++PL.tok; PL.moving = false; PL.play = true; draw();
      while (alive && PL.play && tk === PL.tok && PL.i < PL.frames.length - 1) { await go(PL.i + 1); await sleep(1900 / PL.sp); }
      if (tk === PL.tok) { PL.play = false; if (alive) draw(); }
    };
    const halt = () => { PL.play = false; PL.tok++; PL.moving = false; };
    const startScen = id => {
      const sc = plScen()[id]; halt();
      sc.cfg.forEach((c, i) => Object.assign(PL.cfg[i], { wp: c[0], rp: c[1], buf: c[2] }));
      PL.base = plFresh(); PL.ops = sc.ops.slice(); PL.scen = id; PL.note = null; PL.i = 0; recompute(); sfx.tick(); draw();
      stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const manual = op => {
      halt(); PL.note = null; PL.ops.push(op); PL.scen = null; recompute();
      PL.i = PL.frames.findIndex(f => f.oi === PL.ops.length - 1); go(PL.i, true); snd('info');
    };
    const setCfg = (i, k, v) => {
      halt(); PL.cfg[i][k] = v; PL.base = plFresh(); PL.ops = []; PL.scen = null; PL.i = 0; recompute();
      PL.note = { at: i, kind: 'info', ttl: T(`${PLN[i]} switch changed`, `Interruptor de ${PLN[i]} cambiado`), txt: T(`Only ${PLN[i]} changed. The other levels keep their own settings. The caches were emptied so you can try it from a clean start.`, `Solo ha cambiado ${PLN[i]}. Los demás niveles conservan sus ajustes. Las cachés se han vaciado para que pruebes desde cero.`) };
      draw();
    };
    $('#pbN', m).onclick = () => { halt(); go(PL.i + 1); };
    $('#pbB', m).onclick = () => { halt(); go(PL.i - 1); };
    $('#pb0', m).onclick = () => { halt(); go(0); };
    $('#pbP', m).onclick = () => { if (PL.play) { halt(); draw(); } else { if (PL.i >= PL.frames.length - 1) PL.i = 0; autoplay(); } };
    $('#pbS', m).oninput = e => { halt(); go(+e.target.value); };
    $('#prs', m).onclick = () => { halt(); PL.base = plFresh(); PL.ops = []; PL.scen = null; PL.note = null; PL.i = 0; recompute(); sfx.evict(); draw(); };
    onSeg(m, 'psp', v => { PL.sp = +v; });
    const kh = e => { if (cur_view() !== 'policies' || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') { e.preventDefault(); halt(); go(PL.i + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); halt(); go(PL.i - 1); } };
    document.addEventListener('keydown', kh); onLeave(() => document.removeEventListener('keydown', kh));
    const rz = () => { if (!PL.moving) draw(); };
    window.addEventListener('resize', rz); onLeave(() => window.removeEventListener('resize', rz));
    draw();
  }
});
const cur_view = () => cur;
