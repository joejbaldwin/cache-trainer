'use strict';
/* Guided exercises: every course exercise, one forced step at a time */

function exData() {
  const e41 = T('A processor uses 16-bit addresses; memory is byte-addressable. Cache: total capacity 1 KiB (1024 bytes), block/line size 16 bytes. Address to analyse: <b>0x3A7C</b>.',
    'Un procesador utiliza direcciones de 16 bits; la memoria es direccionable por bytes. Caché: capacidad total 1 KiB (1024 bytes), tamaño de bloque/línea 16 bytes. Dirección a analizar: <b>0x3A7C</b>.');
  const code22 = `<pre class="code">const int max = 1024*1024;
double a[max], b[max], c[max], d[max];
void f() {
  for (int i = 0; i &lt; max; i++) c[i] += a[i] * b[i];
  for (int i = 0; i &lt; max; i++) d[i] += c[i] + d[i];
}</pre>`;
  const code26 = `<pre class="code">#define MAX 2048
typedef struct { double x; double y; double z; double r; } point;
point v[MAX];
double f(void) {
  double s = 0.0;
  for (int i = 0; i &lt; MAX; i++) s += v[i].r;
  for (int i = 0; i &lt; MAX; i++) s += v[i].x + v[i].y + v[i].z;
  return s / MAX;
}</pre>`;
  const mc = (q, opts, a, why) => ({ type: 'mc', q, opts, a, why });
  const yes = T('Yes', 'Sí'), no = T('No', 'No');
  return [
    {
      id: 'exA', src: 'E4_1 · Ej. 1', t: T('Direct mapped: split 0x3A7C', 'Correspondencia directa: divide 0x3A7C'), st: e41,
      steps: [
        { type: 'txt', q: T('Convert 0x3A7C to 16-bit binary (spaces optional).', 'Convierte 0x3A7C a binario de 16 bits (espacios opcionales).'), a: ['0011101001111100'], show: '0011 1010 0111 1100', hint: '3 = 0011, A = 1010, 7 = 0111, C = 1100' },
        { type: 'num', q: T('How many lines does the cache have?', '¿Cuántas líneas tiene la caché?'), a: 64, why: '1024 / 16 = 64' },
        { type: 'num', q: T('Offset bits?', '¿Bits de desplazamiento?'), a: 4, why: 'log₂(16) = 4 → 1100' },
        { type: 'txt', q: T('Main-memory block number, in hex (drop the offset bits).', 'Número de bloque de memoria principal, en hexadecimal (quita los bits de desplazamiento).'), a: ['3a7'], show: '0x3A7' },
        { type: 'num', q: T('Direct mapped: how many index (line) bits?', 'Correspondencia directa: ¿cuántos bits de índice (línea)?'), a: 6, why: T('64 lines = 2⁶', '64 líneas = 2⁶') },
        { type: 'num', q: T('Tag bits?', '¿Bits de etiqueta?'), a: 6, why: '16 − 6 − 4 → 001110 | 100111 | 1100' },
        { type: 'num', q: T('Line number (decimal)?', '¿Número de línea (decimal)?'), a: 39, why: '100111₂ = 32 + 4 + 2 + 1 = 39' },
        { type: 'num', q: T('Tag (decimal)?', '¿Etiqueta (decimal)?'), a: 14, why: '001110₂ = 14' }
      ]
    },
    {
      id: 'exB', src: 'E4_1 · Ej. 2', t: T('4-way set associative: same address', 'Asociativa de 4 vías: la misma dirección'), st: e41 + ' ' + T('Now the cache is <b>4-way set associative</b>.', 'Ahora la caché es <b>asociativa por conjuntos de 4 vías</b>.'),
      steps: [
        { type: 'num', q: T('Offset bits now?', '¿Bits de desplazamiento ahora?'), a: 4, why: T('Unchanged — it only depends on the line size.', 'No cambia — solo depende del tamaño de línea.') },
        { type: 'num', q: T('How many sets?', '¿Cuántos conjuntos?'), a: 16, why: '64 / 4 = 16' },
        { type: 'num', q: T('Index bits and…', 'Bits de índice y…'), a: 4, why: '16 = 2⁴' },
        { type: 'num', q: T('…tag bits?', '…¿bits de etiqueta?'), a: 8, why: '00111010 | 0111 | 1100' },
        { type: 'num', q: T('Set number (decimal)?', '¿Número de conjunto (decimal)?'), a: 7 },
        { type: 'num', q: T('Tag (decimal)?', '¿Etiqueta (decimal)?'), a: 58, why: '00111010₂ = 32 + 16 + 8 + 2 = 58' },
        { type: 'num', q: T('If each set groups four consecutive lines, what is the first line of set 7?', 'Si cada conjunto agrupa cuatro líneas consecutivas, ¿cuál es la primera línea del conjunto 7?'), a: 28, why: T('7 × 4 = 28 → lines 28, 29, 30, 31; the block may take any of them.', '7 × 4 = 28 → líneas 28, 29, 30, 31; el bloque puede ocupar cualquiera.') }
      ]
    },
    {
      id: 'exC', src: 'E4_1 · Ej. 3', t: T('Fully associative: same address', 'Totalmente asociativa: la misma dirección'), st: e41 + ' ' + T('Now the cache is <b>fully associative</b>.', 'Ahora la caché es <b>totalmente asociativa</b>.'),
      steps: [
        { type: 'num', q: T('Index bits?', '¿Bits de índice?'), a: 0, why: T('Any block can use any line: nothing to select.', 'Cualquier bloque puede ocupar cualquier línea: no hay nada que seleccionar.') },
        { type: 'num', q: T('Tag bits?', '¿Bits de etiqueta?'), a: 12, why: '16 − 0 − 4 → 001110100111 | 1100' },
        { type: 'num', q: T('Tag (decimal)? It equals the block number 0x3A7.', '¿Etiqueta (decimal)? Coincide con el número de bloque 0x3A7.'), a: 935, why: '3·256 + 10·16 + 7 = 935' },
        mc(T('Where can the block be placed?', '¿Dónde puede ubicarse el bloque?'), [T('Line 39 only', 'Solo en la línea 39'), T('Lines 28–31', 'Líneas 28–31'), T('Any line from 0 to 63', 'Cualquier línea entre 0 y 63')], 2)
      ]
    },
    {
      id: 'exD', src: 'E4_2 · Ej. 1', t: T('Impact of misses on CPU time', 'Impacto de los fallos en el tiempo de CPU'),
      st: T('Ideal CPI (all hits) = 1,5. 30 % of instructions read or write memory. Data-cache miss rate 4 %. Each miss costs 40 extra clock cycles. Compute the speed-up obtained by eliminating all cache misses.',
        'CPI ideal (todo aciertos) = 1,5. El 30 % de las instrucciones lee o escribe en memoria. Tasa de fallos de la caché de datos: 4 %. Cada fallo cuesta 40 ciclos adicionales. Calcula la aceleración obtenida al eliminar por completo los fallos.'),
      steps: [
        mc(T('Which formula gives the stall cycles?', '¿Qué fórmula da los ciclos de detención?'), ['IC · CPI · T<sub>clk</sub>', 'IC · R<sub>mem</sub> · m · t<sub>F</sub>', 't<sub>A</sub> + (1 − h) · t<sub>F</sub>'], 1),
        { type: 'num', q: T('Stall cycles per instruction?', '¿Ciclos de detención por instrucción?'), a: 0.48, why: '0,30 · 0,04 · 40 = 0,48' },
        { type: 'num', q: T('Real cycles per instruction (ideal + stalls)?', '¿Ciclos reales por instrucción (ideal + detención)?'), a: 1.98, why: '1,5 + 0,48' },
        { type: 'num', q: T('Speed-up S = t<sub>real</sub> / t<sub>ideal</sub>?', '¿Aceleración S = t<sub>real</sub> / t<sub>ideal</sub>?'), a: 1.32, tol: 0.006, why: '1,98 / 1,5 = 1,32' }
      ]
    },
    {
      id: 'exE', src: 'E4_2 · Ej. 2', t: T('Two levels, write policies and buffers', 'Dos niveles, políticas de escritura y búfer'),
      st: `<table class="tbl"><tr><th></th><th>${T('Access time (ns)', 'Tiempo de acceso (ns)')}</th><th>${T('Hit rate', 'Tasa de aciertos')}</th></tr><tr><th>L1</th><td>1,5</td><td>0,85</td></tr><tr><th>L2</th><td>6</td><td>0,92</td></tr><tr><th>RAM</th><td>80</td><td>1</td></tr></table>
        ${T('All accesses are writes. On a write miss the block is first brought to L1. In (b) cases assume a written line is never replaced.', 'Todos los accesos son escrituras. En un fallo de escritura primero se trae el bloque a L1. En los casos (b) asume que nunca se reemplaza una línea escrita.')}`,
      steps: [
        { type: 'num', q: T('First the “miss term”: 0,15 · (6 + 0,08 · 80) = ?', 'Primero el «término de fallo»: 0,15 · (6 + 0,08 · 80) = ?'), a: 1.86, unit: 'ns', why: '0,15 · 12,4 = 1,86' },
        { type: 'num', q: T('1(a) <b>Write-through, no buffer</b>. Each write is propagated through both caches to RAM. Average time?', '1(a) <b>Write-through, sin búfer</b>. Cada escritura se propaga por ambos niveles hasta la RAM. ¿Tiempo medio?'), a: 89.36, unit: 'ns', hint: '(1,5 + 6 + 80) + ' + T('miss term', 'término de fallo'), why: '87,5 + 1,86 = 89,36' },
        { type: 'num', q: T('1(b) <b>Write-back, no buffer</b>. A write hit touches only L1.', '1(b) <b>Write-back, sin búfer</b>. Un acierto de escritura solo toca L1.'), a: 3.36, unit: 'ns', why: '1,5 + 1,86 = 3,36' },
        { type: 'num', q: T('2(a) <b>Write-through with a write buffer</b> (1,5 ns, never full). The CPU writes L1 and the buffer in parallel.', '2(a) <b>Write-through con búfer de escritura</b> (1,5 ns, nunca se llena). La CPU escribe en L1 y en el búfer en paralelo.'), a: 3.36, unit: 'ns', why: T('Propagation goes through the buffer, not the CPU’s time: 1,5 + 1,86.', 'La propagación va por el búfer, no por el tiempo de la CPU: 1,5 + 1,86.') },
        mc(T('2(b) Write-back with buffer: what changes versus 1(b)?', '2(b) Write-back con búfer: ¿qué cambia respecto a 1(b)?'), [T('Nothing — no modified line is ever evicted, so the buffer is never used (3,36 ns)', 'Nada — nunca se expulsa una línea modificada, así que el búfer no se usa (3,36 ns)'), T('It halves', 'Se reduce a la mitad'), T('It becomes 89,36 ns', 'Pasa a 89,36 ns')], 0),
        { type: 'num', q: T('3(b) L1+L2 as one cache: mean time to resolve an access inside both levels?', '3(b) L1+L2 como una sola caché: ¿tiempo medio para resolver el acceso dentro de ambos niveles?'), a: 2.4, unit: 'ns', why: '1,5 + 0,15 · 6 = 2,40' },
        { type: 'num', q: T('3(a) Global hit rate of that combined cache?', '3(a) ¿Tasa de aciertos global de esa caché combinada?'), a: 0.988, rate: true, tol: 0.0006, why: '1 − 0,15 · 0,08 = 0,988' }
      ]
    },
    {
      id: 'exF', src: T('Exam 2022 · Ex. 1 (your notes)', 'Examen 2022 · Ej. 1 (tus apuntes)'), tr: 'e22', t: T('Four big arrays, two loops', 'Cuatro arrays grandes, dos bucles'),
      st: T('L1: 4 ways, 32 KB. L2: 4 ways, 256 KB. Line: 64 B. LRU. <code>max</code> and <code>i</code> live in registers; a, b, c, d are stored consecutively in memory.', 'L1: 4 vías, 32 KB. L2: 4 vías, 256 KB. Línea: 64 B. LRU. <code>max</code> e <code>i</code> están en registros; a, b, c, d se almacenan consecutivamente en memoria.') + code22 +
        `<p class="mute">${T('Reconstructed from your class notes; loop 2 is counted as 4 accesses per iteration (c, d, d, write d), which matches the “2/32” you wrote down.', 'Reconstruido de tus apuntes; el bucle 2 se cuenta como 4 accesos por iteración (c, d, d, escribir d), lo que cuadra con el «2/32» que anotaste.')}</p>`,
      steps: [
        { type: 'num', q: T('Each array occupies 2<sup>?</sup> bytes.', 'Cada array ocupa 2<sup>?</sup> bytes.'), a: 23, ph: T('exponent', 'exponente'), why: '2<sup>20</sup> · 2<sup>3</sup> = 2<sup>23</sup> (8 MB)' },
        { type: 'num', q: T('L1: sets = 2<sup>?</sup>', 'L1: conjuntos = 2<sup>?</sup>'), a: 7, ph: T('exponent', 'exponente'), hint: '2¹⁵ / (2² · 2⁶)', why: T('index 7 bits, offset 6 bits; tag not computable (no address width).', 'índice 7 bits, desplazamiento 6 bits; etiqueta no calculable (falta el ancho de dirección).') },
        { type: 'num', q: T('L2: index bits?', 'L2: ¿bits de índice?'), a: 10, why: '2<sup>18</sup> / 2<sup>8</sup> = 2<sup>10</sup>' },
        { type: 'num', q: T('Doubles per line?', '¿Doubles por línea?'), a: 8 },
        mc(T('a[i], b[i], c[i]: same L1 set?', 'a[i], b[i], c[i]: ¿mismo conjunto de L1?'), [T('Yes: 2²³ is a multiple of 2¹³ → same index, different tag', 'Sí: 2²³ es múltiplo de 2¹³ → mismo índice, distinta etiqueta'), no], 0),
        mc(T('Do they evict each other in L1?', '¿Se expulsan entre sí en L1?'), [T('Yes, constantly', 'Sí, constantemente'), T('No: 3 lines ≤ 4 ways', 'No: 3 líneas ≤ 4 vías')], 1),
        { type: 'num', q: T('Loop 1: accesses per iteration?', 'Bucle 1: ¿accesos por iteración?'), a: 4, why: T('a, b, c (read), c (write).', 'a, b, c (lectura), c (escritura).') },
        { type: 'num', q: T('Loop 1: L1 miss rate (fraction)?', 'Bucle 1: ¿tasa de fallos de L1 (fracción)?'), a: 3 / 32, rate: true, show: '3/32', why: T('Per 8 iterations: 32 accesses, 3 new lines.', 'Cada 8 iteraciones: 32 accesos, 3 líneas nuevas.') },
        mc(T('Loop 2 starts with c[0]. Is it still in L1? In L2?', 'El bucle 2 empieza con c[0]. ¿Sigue en L1? ¿Y en L2?'), [T('In both', 'En ambas'), T('Only in L2', 'Solo en L2'), T('In neither: 8 MB of c went through a 32 KB / 256 KB cache', 'En ninguna: pasaron 8 MB de c por cachés de 32 KB / 256 KB')], 2),
        { type: 'num', q: T('Loop 2: L1 miss rate?', 'Bucle 2: ¿tasa de fallos de L1?'), a: 2 / 32, rate: true, show: '2/32 = 1/16', why: T('Only c and d bring new lines.', 'Solo c y d traen líneas nuevas.') },
        { type: 'num', q: T('Whole function: L1 miss rate?', 'Función completa: ¿tasa de fallos de L1?'), a: 5 / 64, rate: true, show: '5/64 ≈ 7,8 %', why: '(3 + 2) / (32 + 32)' },
        { type: 'num', q: T('L2 local miss rate?', '¿Tasa de fallos local de L2?'), a: 1, rate: true, show: '1 (100 %)', why: T('Every L1 miss is a line L2 does not have.', 'Cada fallo de L1 es una línea que L2 no tiene.') },
        { type: 'num', q: T('Global miss rate?', '¿Tasa de fallos global?'), a: 5 / 64, rate: true, show: '5/64', why: '5/64 · 1' }
      ]
    },
    {
      id: 'exG', src: T('E4_3 · Ex. 2 (from your notes)', 'E4_3 · Ej. 2 (de tus apuntes)'), tr: 'e22w2', t: T('Same code, L1 with only 2 ways', 'El mismo código, L1 con solo 2 vías'),
      st: T('“Ahora vamos a reducir las vías.” Same program and L2 as the 2022 exam, but <b>L1 is 2-way</b> (still 32 KB, 64 B lines, LRU). Focus on loop 1.', '«Ahora vamos a reducir las vías.» Mismo programa y L2 que el examen 2022, pero <b>L1 es de 2 vías</b> (sigue siendo 32 KB, líneas de 64 B, LRU). Céntrate en el bucle 1.') + code22 +
        `<p class="mute">${T('The E4_3 sheet is not in the folder; this is rebuilt from your notes and verified with the simulator.', 'El boletín E4_3 no está en la carpeta; esto se ha reconstruido de tus apuntes y verificado con el simulador.')}</p>`,
      steps: [
        { type: 'num', q: T('L1 index bits now?', '¿Bits de índice de L1 ahora?'), a: 8, why: '2<sup>15</sup> / (2 · 2<sup>6</sup>) = 2<sup>8</sup> — ' + T('one more than with 4 ways.', 'uno más que con 4 vías.') },
        mc(T('i = 0: a[0] F, b[0] F. Now c[0] arrives. What happens?', 'i = 0: a[0] F, b[0] F. Ahora llega c[0]. ¿Qué ocurre?'), [T('Hit', 'Acierto'), T('Miss; evicts a (the LRU)', 'Fallo; expulsa a (la LRU)'), T('Miss; evicts b', 'Fallo; expulsa b')], 1),
        mc(T('Then the write to c[0]?', '¿Y la escritura en c[0]?'), [T('Hit', 'Acierto'), T('Miss', 'Fallo')], 0),
        mc(T('i = 1: a[1] is in the same line as a[0]. Result in L1?', 'i = 1: a[1] está en la misma línea que a[0]. ¿Resultado en L1?'), [T('Hit — same line', 'Acierto — misma línea'), T('Miss — that line was evicted by c; it now evicts b', 'Fallo — esa línea fue expulsada por c; ahora expulsa a b')], 1, T('And in L2 it is a hit: L2 has 4 ways and kept the line.', 'Y en L2 es acierto: L2 tiene 4 vías y conservó la línea.')),
        { type: 'num', q: T('Loop 1: L1 miss rate?', 'Bucle 1: ¿tasa de fallos de L1?'), a: 0.75, rate: true, show: '3/4', why: T('F F F A every iteration.', 'F F F A en cada iteración.') },
        { type: 'num', q: T('Per 8 iterations L1 misses 24 times. How many of those also miss in L2?', 'Cada 8 iteraciones L1 falla 24 veces. ¿Cuántos de esos fallan también en L2?'), a: 3, why: T('Only the first touch of each of the 3 lines.', 'Solo el primer acceso a cada una de las 3 líneas.') },
        { type: 'num', q: T('Loop 1: L2 local miss rate?', 'Bucle 1: ¿tasa de fallos local de L2?'), a: 0.125, rate: true, show: '3/24 = 1/8' },
        { type: 'num', q: T('Loop 1: global miss rate?', 'Bucle 1: ¿tasa de fallos global?'), a: 3 / 32, rate: true, show: '3/32', why: T('Identical to the 4-way case: the same 3 lines come from memory. L1 just works harder.', 'Idéntica al caso de 4 vías: vienen de memoria las mismas 3 líneas. L1 simplemente trabaja más.') },
        mc(T('Loop 2 uses only c and d. With 2 ways?', 'El bucle 2 usa solo c y d. ¿Con 2 vías?'), [T('Thrash again', 'Otra vez expulsión continua'), T('2 lines ≤ 2 ways: clean, 2/32', '2 líneas ≤ 2 vías: limpio, 2/32')], 1, T('“Esto ocurre cuando tenemos menos vías que vectores.”', '«Esto ocurre cuando tenemos menos vías que vectores.»'))
      ]
    },
    {
      id: 'exH', src: T('E4_4 · Ex. 1 (exam Jan 2026)', 'E4_4 · Ej. 1 (examen ene 2026)'), tr: 'j26', t: T('Array of structs, two loops', 'Array de estructuras, dos bucles'),
      st: T('L1D: 8-way, 64 sets (512 lines). L2: 16-way, 1024 sets (16384 lines). Line 64 bytes. LRU. <code>s</code> and <code>i</code> are in registers; the array starts at 0x10000000. Find the L1, L2 and global miss rates.',
        'L1D: 8 vías, 64 conjuntos (512 líneas). L2: 16 vías, 1024 conjuntos (16384 líneas). Línea de 64 bytes. LRU. <code>s</code> e <code>i</code> están en registros; el array empieza en 0x10000000. Determina las tasas de fallos de L1, L2 y global.') + code26,
      steps: [
        { type: 'num', q: T('L1 size in KiB?', '¿Tamaño de L1 en KiB?'), a: 32, unit: 'KiB', why: '2<sup>9</sup> · 2<sup>6</sup> = 2<sup>15</sup>' },
        { type: 'num', q: T('L2 size in KiB?', '¿Tamaño de L2 en KiB?'), a: 1024, unit: 'KiB', why: '2<sup>14</sup> · 2<sup>6</sup> = 2<sup>20</sup> = 1 MiB' },
        { type: 'num', q: T('Bytes per <code>point</code>? (answer the bytes)','¿Bytes por <code>point</code>? (responde los bytes)'), a: 32, unit: 'B', why: T('4 doubles → 32 B → 2 structs per 64 B line.', '4 doubles → 32 B → 2 structs por línea de 64 B.') },
        { type: 'num', q: T('Array size in KiB?', '¿Tamaño del array en KiB?'), a: 64, unit: 'KiB', why: '2048 · 32 = 2<sup>16</sup>. ' + T('Bigger than L1, smaller than L2 — this decides everything.', 'Mayor que L1, menor que L2 — esto lo decide todo.') },
        { type: 'num', q: T('Loop 1 (2048 accesses to .r): L1 misses?', 'Bucle 1 (2048 accesos a .r): ¿fallos de L1?'), a: 1024, why: T('One per line; 2 structs per line.', 'Uno por línea; 2 structs por línea.') },
        mc(T('After loop 1, what does L1 hold?', 'Tras el bucle 1, ¿qué contiene L1?'), [T('The whole array', 'El array completo'), T('Entries 0–1023', 'Las entradas 0–1023'), T('Entries 1024–2047 (the last 32 KiB)', 'Las entradas 1024–2047 (los últimos 32 KiB)')], 2),
        { type: 'num', q: T('Loop 2: total accesses?', 'Bucle 2: ¿accesos totales?'), a: 6144, why: '3 · 2048' },
        { type: 'num', q: T('Loop 2: L1 misses?', 'Bucle 2: ¿fallos de L1?'), a: 1024, hint: T('First half was evicted; loading it evicts the second half.', 'La primera mitad fue expulsada; al cargarla se expulsa la segunda.'), why: '512 + 512' },
        { type: 'num', q: T('m(L1) for the whole function?', '¿m(L1) de toda la función?'), a: 0.25, rate: true, show: '1/4', why: '2048 / 8192' },
        { type: 'num', q: T('L2 receives 2048 accesses. How many miss?', 'L2 recibe 2048 accesos. ¿Cuántos fallan?'), a: 1024, why: T('Loop 1: all 1024 (cold). Loop 2: none — 64 KiB fits in 1 MiB.', 'Bucle 1: los 1024 (caché vacía). Bucle 2: ninguno — 64 KiB caben en 1 MiB.') },
        { type: 'num', q: 'm(L2)?', a: 0.5, rate: true, show: '1/2' },
        { type: 'num', q: T('Global miss rate?', '¿Tasa de fallos global?'), a: 0.125, rate: true, show: '1/8', why: '1/4 · 1/2' }
      ]
    },
    {
      id: 'exI', src: T('E4_4 · Ex. 2 (exam Jan 2026)', 'E4_4 · Ej. 2 (examen ene 2026)'), tr: 'j26f', t: T('Transform the code to cut L1 misses', 'Transforma el código para reducir fallos de L1'),
      st: T('For the previous code: transform it to reduce the L1 miss rate. What is the new global miss rate?', 'Para el código anterior: transfórmalo para reducir la tasa de fallos de L1. ¿Cómo será la nueva tasa de fallos global?') + code26,
      steps: [
        mc(T('Both loops share the iteration space and touch the same structs. Which transformation?', 'Ambos bucles comparten espacio de iteración y tocan las mismas estructuras. ¿Qué transformación?'), [T('Loop interchange', 'Intercambio de bucles'), T('Loop fusion: one loop reading r, x, y, z', 'Fusión de bucles: un bucle que lee r, x, y, z'), T('Array merging', 'Fusión de arrays')], 1),
        { type: 'num', q: T('Fused loop: total accesses?', 'Bucle fusionado: ¿accesos totales?'), a: 8192, why: '4 · 2048' },
        { type: 'num', q: T('L1 misses?', '¿Fallos de L1?'), a: 1024, why: T('One per line, and each line is used completely before it leaves.', 'Uno por línea, y cada línea se aprovecha entera antes de salir.') },
        { type: 'num', q: 'm(L1)?', a: 0.125, rate: true, show: '1/8' },
        { type: 'num', q: T('m(L2) local?', '¿m(L2) local?'), a: 1, rate: true, show: '1 (100 %)', why: T('All L1 misses are first touches, so they miss in L2 too.', 'Todos los fallos de L1 son primeros accesos, así que también fallan en L2.') },
        { type: 'num', q: T('Global miss rate?', '¿Tasa de fallos global?'), a: 0.125, rate: true, show: '1/8', why: T('Unchanged. Fewer L1 misses, same trips to memory.', 'No cambia. Menos fallos de L1, los mismos viajes a memoria.') }
      ]
    }
  ];
}

View('exercises', {
  icon: '✍', title: () => T('Exercises', 'Ejercicios'), mins: 60, done: () => ['exA', 'exB', 'exC', 'exD', 'exE', 'exF', 'exG', 'exH', 'exI'],
  desc: () => T('Every solved exercise from E4_1, E4_2, E4_4 and your notes, broken into steps you must answer.', 'Todos los ejercicios resueltos de E4_1, E4_2, E4_4 y tus apuntes, troceados en pasos que debes responder.'),
  render(m, arg) {
    const E = exData(), ex = E.find(x => x.id === arg);
    if (!ex) {
      m.innerHTML = head(T('Practice', 'Práctica'), T('Guided exercises', 'Ejercicios guiados'),
        T('Solve on paper first. Then type each step: a wrong step stops you exactly where your method breaks.', 'Resuelve primero en papel. Luego escribe cada paso: un paso erróneo te detiene justo donde falla tu método.')) +
        `<section class="cards one">${E.map(x => `<a class="card link ${S.done[x.id] ? 'isdone' : ''}" href="#/exercises/${x.id}"><div><small>${x.src}</small><h3>${x.t} ${S.done[x.id] ? '<span class="ck">✓</span>' : ''}</h3><p>${x.steps.length} ${T('steps', 'pasos')}</p></div></a>`).join('')}</section>${nextLink('drill')}`;
      return;
    }
    const k = E.indexOf(ex), nx = E[k + 1];
    m.innerHTML = `<a class="back" href="#/exercises">← ${T('All exercises', 'Todos los ejercicios')}</a>` + head(ex.src, ex.t) +
      `<div class="card st">${ex.st}</div>
      ${ex.tr ? `<p><a class="btn ghost" href="#/loops" id="otr">🔬 ${T('Open this program in the tracer', 'Abrir este programa en el trazador')}</a></p>` : ''}
      <div id="q"></div>
      ${nx ? `<a class="next" href="#/exercises/${nx.id}"><span>${T('Next exercise', 'Siguiente ejercicio')}</span><b>${nx.t} →</b></a>` : nextLink('drill')}`;
    if (ex.tr) $('#otr', m).onclick = () => { TR.pid = ex.tr; trReset(); };
    Quiz($('#q', m), ex.id, ex.steps, { focus: true });
  }
});

/* ============ Mock drill: endless generated questions ============ */
const DR = { cat: null, ps: null, n: 0 };
function drGen(cat) {
  const one = c => {
    if (c === 'bits') {
      if (Math.random() < 0.4) { const s = pick([10, 11, 12]), w = pick([0, 1, 2]); return { g: 'dec', s, l: 4, w, addr: rnd(65536), ask: pick(['set', 'tag']) }; }
      const s = pick([13, 14, 15, 16, 18, 20]), l = pick([5, 6]), w = pick([0, 1, 2, 3, 99]); return { g: 'bits', s, l, w, ask: pick(['idx', 'tag', 'sets', 'off']) };
    }
    if (c === 'trace') { const x = rnd(8), y = (x + 1 + rnd(7)) % 8, pool = [x, x + 8, x + 16, y, y + 8]; return { g: 'trace', seq: Array.from({ length: 8 }, () => pick(pool)), w: pick([1, 2, 2, 4]), pol: Math.random() < 0.75 ? 'LRU' : 'FIFO' }; }
    if (c === 'loop') return { g: 'loop', tpl: rnd(5), w: pick([2, 4, 8]), ty: pick(['int', 'double']) };
    return { g: 'th', src: pick(['t', 't', 's', 'l']), k: rnd(100) };
  };
  if (cat === 'mix') return ['bits', 'bits', 'trace', 'loop', 'th', 'bits', 'loop', 'trace', 'th', 'loop'].map(one);
  return Array.from({ length: 6 }, () => one(cat));
}
const LT = [
  { code: 'b[i] = a[i];', acc: ['a', 'b'] }, { code: 'a[i] += b[i];', acc: ['b', 'a', 'a'] },
  { code: 'c[i] = a[i] + b[i];', acc: ['a', 'b', 'c'] }, { code: 'c[i] += a[i] * b[i];', acc: ['a', 'b', 'c', 'c'] },
  { code: 'd[i] = a[i] + b[i] + c[i];', acc: ['a', 'b', 'c', 'd'] }
];
function drBuild(p) {
  if (p.g === 'bits') {
    const lines = p.s - p.l, w = p.w === 99 ? lines : p.w, ix = lines - w, tg = 32 - ix - p.l;
    const desc = T(`Cache ${fmtB(2 ** p.s)}, ${2 ** p.l} B lines, ${p.w === 99 ? 'fully associative' : p.w === 0 ? 'direct mapped' : 2 ** p.w + '-way set associative'}, 32-bit addresses.`,
      `Caché de ${fmtB(2 ** p.s)}, líneas de ${2 ** p.l} B, ${p.w === 99 ? 'totalmente asociativa' : p.w === 0 ? 'correspondencia directa' : 'asociativa por conjuntos de ' + 2 ** p.w + ' vías'}, direcciones de 32 bits.`);
    const A = { idx: [T('Index bits?', '¿Bits de índice?'), ix], tag: [T('Tag bits?', '¿Bits de etiqueta?'), tg], off: [T('Offset bits?', '¿Bits de desplazamiento?'), p.l], sets: [T('Number of sets?', '¿Número de conjuntos?'), 2 ** ix] }[p.ask];
    return { type: 'num', q: `${desc}<br><b>${A[0]}</b>`, a: A[1], tol: 0, why: `${T('sets', 'conjuntos')} = 2<sup>${p.s}</sup> / (2<sup>${w}</sup>·2<sup>${p.l}</sup>) = 2<sup>${ix}</sup> → <span class="c-tag">${tg}</span> | <span class="c-idx">${ix}</span> | <span class="c-off">${p.l}</span>` };
  }
  if (p.g === 'dec') {
    const lines = p.s - p.l, ix = lines - p.w, tg = 16 - ix - p.l, set = (p.addr >> p.l) & (2 ** ix - 1), tag = p.addr >> (p.l + ix), b = bin(p.addr, 16);
    return { type: 'num', q: T(`16-bit address <b>${hex(p.addr, 4)}</b>. Cache ${fmtB(2 ** p.s)}, 16 B lines, ${p.w === 0 ? 'direct mapped' : 2 ** p.w + '-way'}. <b>${p.ask === 'set' ? 'Set number' : 'Tag'} (decimal)?</b>`, `Dirección de 16 bits <b>${hex(p.addr, 4)}</b>. Caché de ${fmtB(2 ** p.s)}, líneas de 16 B, ${p.w === 0 ? 'correspondencia directa' : 2 ** p.w + ' vías'}. <b>¿${p.ask === 'set' ? 'Número de conjunto' : 'Etiqueta'} (decimal)?</b>`),
      a: p.ask === 'set' ? set : tag, tol: 0, why: `<span class="mono"><span class="c-tag">${b.slice(0, tg)}</span> | <span class="c-idx">${b.slice(tg, tg + ix)}</span> | <span class="c-off">${b.slice(tg + ix)}</span></span> → ${T('tag', 'etiqueta')} ${tag}, ${T('set', 'conjunto')} ${set}` };
  }
  if (p.g === 'trace') {
    const r = runSeq(p.seq, 8, p.w, p.pol);
    return { type: 'num', q: T(`8-line cache, ${p.w === 1 ? 'direct mapped' : p.w + '-way'}${p.w > 1 ? ', ' + p.pol : ''}, initially empty. Block sequence: <b class="mono">${p.seq.join(' ')}</b>.<br><b>How many misses?</b>`, `Caché de 8 líneas, ${p.w === 1 ? 'correspondencia directa' : p.w + ' vías'}${p.w > 1 ? ', ' + p.pol : ''}, inicialmente vacía. Secuencia de bloques: <b class="mono">${p.seq.join(' ')}</b>.<br><b>¿Cuántos fallos?</b>`),
      a: r.filter(x => !x).length, tol: 0, hint: T(`set = block mod ${8 / p.w}`, `conjunto = bloque mod ${8 / p.w}`), why: `<span class="mono">${p.seq.map((b, i) => `${b}:<b class="${r[i] ? 'c-hit' : 'c-miss'}">${r[i] ? 'A' : 'F'}</b>`).join(' ')}</span>` };
  }
  if (p.g === 'loop') {
    const t = LT[p.tpl], names = [...new Set(t.acc)].sort(), el = p.ty === 'int' ? 4 : 8, n = 65536;
    const prog = { line: 64, base: 0x10000000, L1: { sets: 32768 / (64 * p.w), ways: p.w }, L2: { sets: 1024, ways: 8 }, arrays: names.map(x => [x, el, n]), loops: [{ n, acc: t.acc.map(x => [x, 0, 'R']) }] };
    const fs = fullStats(prog)[0], k = names.length, epl = 64 / el;
    return { type: 'num', rate: true, show: frac(fs.m1, fs.acc), a: fs.m1 / fs.acc, tol: 0.004,
      q: T(`L1: 32 KiB, ${p.w}-way, 64 B lines, LRU. Arrays of 65536 <code>${p.ty}</code>, stored consecutively (so equal indices collide in one set).<pre class="code">for (i = 0; i &lt; 65536; i++) ${t.code}</pre><b>L1 miss rate?</b> (fraction or decimal)`,
        `L1: 32 KiB, ${p.w} vías, líneas de 64 B, LRU. Arrays de 65536 <code>${p.ty}</code>, almacenados consecutivamente (los mismos índices colisionan en un conjunto).<pre class="code">for (i = 0; i &lt; 65536; i++) ${t.code}</pre><b>¿Tasa de fallos de L1?</b> (fracción o decimal)`),
      hint: T(`${k} arrays vs ${p.w} ways; ${epl} elements per line; ${t.acc.length} accesses per iteration.`, `${k} arrays frente a ${p.w} vías; ${epl} elementos por línea; ${t.acc.length} accesos por iteración.`),
      why: k <= p.w ? T(`${k} arrays ≤ ${p.w} ways → ${k} misses per line; a line lasts ${epl} iterations × ${t.acc.length} accesses = ${epl * t.acc.length}.`, `${k} arrays ≤ ${p.w} vías → ${k} fallos por línea; una línea dura ${epl} iteraciones × ${t.acc.length} accesos = ${epl * t.acc.length}.`)
        : T(`${k} arrays &gt; ${p.w} ways → they evict each other every iteration; only an immediately repeated access hits.`, `${k} arrays &gt; ${p.w} vías → se expulsan en cada iteración; solo acierta un acceso repetido inmediatamente.`) };
  }
  const bank = p.src === 's' ? sortQs() : p.src === 'l' ? labQs().filter(q => q.type === 'mc') : theoryQs();
  return bank[p.k % bank.length];
}
View('drill', {
  icon: '🎯', title: () => T('Mock drill', 'Simulacro'), mins: 20, done: () => ['drill'],
  desc: () => T('Fresh random questions every time: bit splits, hit/miss traces, loop miss rates, theory. Finish a mixed set of 10.', 'Preguntas aleatorias nuevas cada vez: campos de bits, trazas de acierto/fallo, tasas en bucles, teoría. Completa un set mixto de 10.'),
  render(m) {
    const cats = [['mix', T('Mixed × 10 (exam-like)', 'Mixto × 10 (tipo examen)')], ['bits', T('Tag / index / offset', 'Etiqueta / índice / despl.')], ['trace', T('Hit / miss traces', 'Trazas acierto / fallo')], ['loop', T('Loop miss rates', 'Tasas en bucles')], ['th', T('Theory', 'Teoría')]];
    m.innerHTML = head(T('Practice', 'Práctica'), T('Mock drill', 'Simulacro'), T('No hints until you have tried twice. Switch to Spanish mode for the real exam wording.', 'Sin pistas hasta el segundo intento. Usa el modo español para el vocabulario real del examen.')) +
      `<div class="presets big">${cats.map(([k, l]) => `<button class="chipb ${DR.cat === k ? 'on' : ''}" data-c="${k}">${l}</button>`).join('')}</div><div id="q"></div>`;
    const start = k => { DR.cat = k; DR.ps = drGen(k); DR.n++; route(true); };
    $$('[data-c]', m).forEach(b => (b.onclick = () => { sfx.tick(); start(b.dataset.c); }));
    if (DR.ps) Quiz($('#q', m), 'dr' + DR.n, DR.ps.map(drBuild), { noMark: DR.cat !== 'mix', markId: 'drill', again: T('New set', 'Set nuevo'), onAgain: () => start(DR.cat), focus: true });
    else $('#q', m).innerHTML = `<p class="mute">${T('Pick a category to start.', 'Elige una categoría para empezar.')}</p>`;
    if (DR.ps && DR.cat === 'mix' && QZ['dr' + DR.n] && QZ['dr' + DR.n].i >= DR.ps.length) markDone('drill');
  }
});
