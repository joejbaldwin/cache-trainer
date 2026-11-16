'use strict';
/* Pure cache simulation (no DOM). Everything numeric in the trainer is computed here. */

class Cache {
  constructor(sets, ways, policy = 'LRU') {
    this.sets = sets; this.ways = ways; this.policy = policy;
    this.tag = new Float64Array(sets * ways).fill(-1);
    this.stamp = new Float64Array(sets * ways);
    this.t = 0;
    this.lastSet = 0; this.lastWay = 0; this.lastEvicted = -1;
  }
  /* block = address / lineSize. Returns true on hit. */
  touch(block) {
    const s = block % this.sets, tg = Math.floor(block / this.sets), b = s * this.ways;
    this.t++; this.lastSet = s; this.lastEvicted = -1;
    let victim = b, free = -1;
    for (let w = 0; w < this.ways; w++) {
      const k = b + w;
      if (this.tag[k] === tg) {
        if (this.policy === 'LRU') this.stamp[k] = this.t;
        this.lastWay = w; return true;
      }
      if (this.tag[k] === -1) { if (free < 0) free = k; }
      else if (this.tag[victim] === -1 || this.stamp[k] < this.stamp[victim]) victim = k;
    }
    const k = free >= 0 ? free : victim;
    if (free < 0) this.lastEvicted = this.tag[k] * this.sets + s;
    this.tag[k] = tg; this.stamp[k] = this.t; this.lastWay = k - b;
    return false;
  }
  access(block) {
    const hit = this.touch(block);
    return { hit, set: this.lastSet, way: this.lastWay, evicted: this.lastEvicted, tag: Math.floor(block / this.sets) };
  }
  /* contents of one set: [{block, stamp}|null] per way */
  setView(s) {
    const out = [];
    for (let w = 0; w < this.ways; w++) {
      const k = s * this.ways + w;
      out.push(this.tag[k] < 0 ? null : { block: this.tag[k] * this.sets + s, stamp: this.stamp[k] });
    }
    return out;
  }
}

const N20 = 2 ** 20;

/* Loop programs. arrays: [name, elemBytes, count]; acc: [array, fieldOffset, 'R'|'W', suffix] */
const PROGS = [
  {
    id: 'e22', line: 64, base: 0x10000000,
    L1: { sets: 128, ways: 4 }, L2: { sets: 1024, ways: 4 },
    arrays: [['a', 8, N20], ['b', 8, N20], ['c', 8, N20], ['d', 8, N20]],
    decl: 'const int max = 1024*1024;\ndouble a[max], b[max], c[max], d[max];',
    loops: [
      { n: N20, code: 'c[i] += a[i] * b[i];', acc: [['a', 0, 'R'], ['b', 0, 'R'], ['c', 0, 'R'], ['c', 0, 'W']] },
      { n: N20, code: 'd[i] += c[i] + d[i];', acc: [['c', 0, 'R'], ['d', 0, 'R'], ['d', 0, 'R'], ['d', 0, 'W']] }
    ]
  },
  {
    id: 'e22w2', line: 64, base: 0x10000000,
    L1: { sets: 256, ways: 2 }, L2: { sets: 1024, ways: 4 },
    arrays: [['a', 8, N20], ['b', 8, N20], ['c', 8, N20], ['d', 8, N20]],
    decl: 'const int max = 1024*1024;\ndouble a[max], b[max], c[max], d[max];',
    loops: [
      { n: N20, code: 'c[i] += a[i] * b[i];', acc: [['a', 0, 'R'], ['b', 0, 'R'], ['c', 0, 'R'], ['c', 0, 'W']] },
      { n: N20, code: 'd[i] += c[i] + d[i];', acc: [['c', 0, 'R'], ['d', 0, 'R'], ['d', 0, 'R'], ['d', 0, 'W']] }
    ]
  },
  {
    id: 'j26', line: 64, base: 0x10000000,
    L1: { sets: 64, ways: 8 }, L2: { sets: 1024, ways: 16 },
    arrays: [['v', 32, 2048]],
    decl: '#define MAX 2048\ntypedef struct { double x, y, z, r; } point;\npoint v[MAX];',
    loops: [
      { n: 2048, code: 's += v[i].r;', acc: [['v', 24, 'R', '.r']] },
      { n: 2048, code: 's += v[i].x + v[i].y + v[i].z;', acc: [['v', 0, 'R', '.x'], ['v', 8, 'R', '.y'], ['v', 16, 'R', '.z']] }
    ]
  },
  {
    id: 'j26f', line: 64, base: 0x10000000,
    L1: { sets: 64, ways: 8 }, L2: { sets: 1024, ways: 16 },
    arrays: [['v', 32, 2048]],
    decl: '#define MAX 2048\ntypedef struct { double x, y, z, r; } point;\npoint v[MAX];',
    loops: [
      { n: 2048, code: 's += v[i].r + v[i].x + v[i].y + v[i].z;', acc: [['v', 24, 'R', '.r'], ['v', 0, 'R', '.x'], ['v', 8, 'R', '.y'], ['v', 16, 'R', '.z']] }
    ]
  },
  {
    id: 'par', line: 64, base: 0x10000000,
    L1: { sets: 256, ways: 2 }, L2: { sets: 1024, ways: 4 },
    arrays: [['key', 8, 65536], ['val', 8, 65536], ['delta', 8, 65536]],
    decl: 'double key[65536], val[65536], delta[65536];',
    loops: [
      { n: 65536, code: 's += key[i] + val[i] + delta[i];', acc: [['key', 0, 'R'], ['val', 0, 'R'], ['delta', 0, 'R']] }
    ]
  },
  {
    id: 'aos', line: 64, base: 0x10000000,
    L1: { sets: 256, ways: 2 }, L2: { sets: 1024, ways: 4 },
    arrays: [['v', 24, 65536]],
    decl: 'struct { double key, val, delta; } v[65536];',
    loops: [
      { n: 65536, code: 's += v[i].key + v[i].val + v[i].delta;', acc: [['v', 0, 'R', '.key'], ['v', 8, 'R', '.val'], ['v', 16, 'R', '.delta']] }
    ]
  }
];

function progLayout(p) {
  if (p._lay) return p._lay;
  let a = p.base; const m = {};
  for (const [n, el, cnt] of p.arrays) { m[n] = { name: n, base: a, elem: el, n: cnt, end: a + el * cnt }; a += el * cnt; }
  return (p._lay = m);
}

/* Human label for a cache line (block number), e.g. "a[8..15]" */
function lineLabel(p, block) {
  const lay = progLayout(p), lo = block * p.line, hi = lo + p.line - 1;
  for (const k in lay) {
    const A = lay[k];
    if (hi >= A.base && lo < A.end) {
      const i0 = Math.max(0, Math.floor((lo - A.base) / A.elem));
      const i1 = Math.min(A.n - 1, Math.floor((hi - A.base) / A.elem));
      return i0 === i1 ? `${k}[${i0}]` : `${k}[${i0}..${i1}]`;
    }
  }
  return 'blk ' + block;
}

/* Whole-program statistics, per loop: {acc, m1, m2} (m2 = L2 misses; L2 accesses = m1) */
function fullStats(p) {
  if (p._fs) return p._fs;
  const lay = progLayout(p);
  const l1 = new Cache(p.L1.sets, p.L1.ways), l2 = new Cache(p.L2.sets, p.L2.ways);
  const out = [];
  for (const lp of p.loops) {
    const st = { acc: 0, m1: 0, m2: 0 };
    const accs = lp.acc.map(a => ({ b: lay[a[0]].base + a[1], e: lay[a[0]].elem }));
    for (let i = 0; i < lp.n; i++) {
      for (let j = 0; j < accs.length; j++) {
        st.acc++;
        const blk = Math.floor((accs[j].b + i * accs[j].e) / p.line);
        if (!l1.touch(blk)) { st.m1++; if (!l2.touch(blk)) st.m2++; }
      }
    }
    out.push(st);
  }
  return (p._fs = out);
}

/* Run a block-number sequence; returns array of booleans (hit) */
function runSeq(seq, lines, ways, policy) {
  const c = new Cache(lines / ways, ways, policy);
  return seq.map(b => c.touch(b));
}

if (typeof module !== 'undefined') module.exports = { Cache, PROGS, fullStats, lineLabel, runSeq, progLayout };
