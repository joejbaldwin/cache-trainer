'use strict';
/* Lesson 5: formulas and timing (slides L4_1 · 13–17, L4_2 · 8; worked examples from sheet E4_2).
   One colour per role, kept in every formula, sentence and worked number:
   green = always paid, amber = how often, red = the extra, blue = how many. */

const FM = { t1: 1.5, m1: 15, t2: 6, m2: 8, tm: 80 };

function formulaQs() {
  return [
    { type: 'num', q: T('A table gives the hit rate h(L1) = 0,85. What miss rate do you put into the formula?', 'Una tabla da la tasa de aciertos h(L1) = 0,85. ¿Qué tasa de fallos pones en la fórmula?'), a: 0.15, rate: true, why: 'm = 1 − h = 0,15' },
    { type: 'num', q: T('t<sub>A</sub> = 2 ns, hit rate h = 0,95, miss penalty t<sub>F</sub> = 40 ns. Average access time t<sub>M</sub>?', 't<sub>A</sub> = 2 ns, tasa de aciertos h = 0,95, penalización t<sub>F</sub> = 40 ns. ¿Tiempo medio t<sub>M</sub>?'), a: 4, unit: 'ns', hint: 't<sub>M</sub> = t<sub>A</sub> + (1 − h)·t<sub>F</sub>', why: '2 + 0,05 · 40 = 4' },
    { type: 'mc', q: T('The <b>local</b> miss rate of L2 is measured against…', 'La tasa de fallos <b>local</b> de L2 se calcula respecto a…'), opts: [T('all memory accesses of the CPU', 'todos los accesos a memoria de la CPU'), T('the accesses that reach L2 (those that missed in L1)', 'los accesos que llegan a L2 (los que fallaron en L1)'), T('the number of L2 lines', 'el número de líneas de L2')], a: 1 },
    { type: 'num', q: T('m<sub>L</sub>(L1) = 0,10 and m<sub>L</sub>(L2) = 0,50. Global miss rate of L2?', 'm<sub>L</sub>(L1) = 0,10 y m<sub>L</sub>(L2) = 0,50. ¿Tasa de fallos global de L2?'), a: 0.05, rate: true, why: '0,10 × 0,50 = 0,05' },
    { type: 'num', q: T('L1: 1 ns, m₁ = 0,1. L2: 5 ns, m₂ = 0,2 (local). Memory: 100 ns. t<sub>M</sub>?', 'L1: 1 ns, m₁ = 0,1. L2: 5 ns, m₂ = 0,2 (local). Memoria: 100 ns. ¿t<sub>M</sub>?'), a: 3.5, unit: 'ns', hint: 't₁ + m₁·(t₂ + m₂·t<sub>mem</sub>)', why: '1 + 0,1·(5 + 0,2·100) = 1 + 0,1·25 = 3,5' },
    { type: 'num', q: T('8000 accesses. L1 misses 1000 of them; L2 misses 250. L2 local miss rate?', '8000 accesos. L1 falla 1000; L2 falla 250. ¿Tasa local de L2?'), a: 0.25, rate: true, why: '250 / 1000' },
    { type: 'num', q: T('…and the global miss rate?', '…¿y la tasa de fallos global?'), a: 250 / 8000, rate: true, show: '1/32 = 0,03125', why: '250 / 8000 = (1000/8000) · (250/1000)' },
    { type: 'mc', q: T('The miss penalty t<sub>F</sub> is made of…', 'La penalización de fallo t<sub>F</sub> se compone de…'), opts: [T('access to the lower level + transfer of the block', 'acceso al nivel inferior + transferencia del bloque'), T('index decode + tag compare', 'decodificar el índice + comparar la etiqueta'), T('hit time × miss rate', 'tiempo de acierto × tasa de fallos')], a: 0, why: T('Access depends on latency; transfer on block size and bandwidth.', 'El acceso depende de la latencia; la transferencia, del tamaño de bloque y del ancho de banda.') },
    { type: 'num', q: T('30 % of instructions access memory, miss rate 4 %, penalty 40 cycles. Stall cycles per instruction?', '30 % de las instrucciones acceden a memoria, tasa de fallos 4 %, penalización 40 ciclos. ¿Ciclos de detención por instrucción?'), a: 0.48, hint: 'R<sub>mem</sub> · m · t<sub>F</sub>', why: '0,30 · 0,04 · 40 = 0,48' },
    { type: 'num', q: T('Ideal CPI is 1,5. With those stalls, how much faster would a miss-free machine be?', 'El CPI ideal es 1,5. Con esas detenciones, ¿cuánto más rápida sería una máquina sin fallos?'), a: 1.32, tol: 0.006, why: '(1,5 + 0,48) / 1,5 = 1,32' },
    { type: 'num', q: T('Per instruction: reads 0,25 with m = 4 % and penalty 50 cycles; writes 0,10 with m = 2 % and penalty 20 cycles. Stall cycles per instruction?', 'Por instrucción: lecturas 0,25 con m = 4 % y penalización 50 ciclos; escrituras 0,10 con m = 2 % y penalización 20 ciclos. ¿Ciclos de detención por instrucción?'), a: 0.54, tol: 0.004, hint: T('two separate terms, then add', 'dos términos separados y se suman'), why: '0,25·0,04·50 + 0,10·0,02·20 = 0,50 + 0,04 = 0,54' },
    { type: 'mc', q: T('“Exposed latency” <i>(latencia expuesta)</i> is…', 'La «latencia expuesta» es…'), opts: [T('the whole miss penalty', 'toda la penalización de fallo'), T('the part of the penalty not hidden by parallelism, which really becomes stall cycles', 'la fracción no ocultada por el paralelismo, que realmente se convierte en ciclos de detención'), T('the hit time of L1', 'el tiempo de acierto de L1')], a: 1 },
    { type: 'num', q: T('h(L1) = 0,85 and h(L2) = 0,92. Global <b>hit</b> rate of L1+L2 seen as one cache?', 'h(L1) = 0,85 y h(L2) = 0,92. ¿Tasa de <b>aciertos</b> global de L1+L2 vistas como una caché?'), a: 0.988, rate: true, tol: 0.0006, why: '1 − 0,15 · 0,08 = 0,988' }
  ];
}

View('formulas', {
  icon: '⑤', title: () => T('Formulas & timing', 'Fórmulas y tiempos'), mins: 30, done: () => ['formulas'],
  desc: () => T('Every formula taken apart term by term in colour, the E4_2 exercises worked one line at a time, and a live two-level calculator.', 'Cada fórmula desmontada término a término en color, los ejercicios del E4_2 resueltos línea a línea y una calculadora de dos niveles en vivo.'),
  render(m) {
    const sec = [['s1', T('Rates', 'Tasas')], ['s2', T('Access time', 'Tiempo de acceso')], ['s3', T('Two levels', 'Dos niveles')], ['s4', T('CPU time', 'Tiempo de CPU')], ['s5', T('Worked examples', 'Ejemplos resueltos')], ['s6', T('Calculator', 'Calculadora')], ['s7', T('Checkpoint', 'Control')]];
    const role = `<span class="va rk">${T('always paid', 'se paga siempre')}</span><span class="vm rk">${T('how often', 'con qué frecuencia')}</span><span class="vf rk">${T('the extra', 'el extra')}</span><span class="vr rk">${T('how many', 'cuántos')}</span>`;
    m.innerHTML = `<div class="lesson">` + head(T('Lesson 5', 'Lección 5'), T('Formulas & timing', 'Fórmulas y tiempos'),
      T('There is one idea here, used four times: you always pay the hit time, and a fraction of the time you also pay a penalty. The colours keep each role fixed so you can read any of the formulas the same way.', 'Aquí hay una sola idea, usada cuatro veces: siempre pagas el tiempo de acierto y, una fracción de las veces, además una penalización. Los colores fijan cada papel para que leas todas las fórmulas igual.')) +
      learnBar(`<span class="lsep"></span>${role}`) + `
    <nav class="toc">${sec.map(([i, t], n) => `<button class="chipb" data-go="${i}">${n + 1} · ${t}</button>`).join('')}</nav>

    <div id="s1">${cb(T('Rates: hits and misses', 'Tasas: aciertos y fallos'), 'L4_1 · 13', `
      <div class="grid2 tight"><div>${fx([['', 'h', T('hit rate', 'tasa de aciertos')], '=', ['', T('hits', 'aciertos'), ''], '/', ['vr', T('accesses', 'accesos'), '']], 'sm')}
        <p>${T(`${hk('Hit')} <i>(acierto)</i>: the block is already in the cache.`, `${hk('Acierto')}: el bloque ya está en la memoria caché.`)}</p></div>
      <div>${fx([['vm', 'm', T('miss rate', 'tasa de fallos')], '=', ['', T('misses', 'fallos'), ''], '/', ['vr', T('accesses', 'accesos'), ''], '=', ['vm', '1 − h', '']], 'sm')}
        <p>${T(`${hk('Miss')} <i>(fallo)</i>: the block is fetched from the level below, loaded into the cache, and only then delivered to the processor. That extra wait is the ${hk('miss penalty')} <i>(penalización de fallo)</i>.`, `${hk('Fallo')}: el bloque se recupera del nivel inferior, se carga en caché y después se entrega al procesador. Esa espera adicional es la ${hk('penalización de fallo')}.`)}</p></div></div>
      ${trap(T('Exercise tables usually give <b>hit</b> rates (E4_2: 0,85 and 0,92). The formulas want <b>miss</b> rates. Convert first: 0,85 → <b class="vm">0,15</b>, 0,92 → <b class="vm">0,08</b>.', 'Las tablas de los ejercicios suelen dar tasas de <b>aciertos</b> (E4_2: 0,85 y 0,92). Las fórmulas piden tasas de <b>fallos</b>. Convierte primero: 0,85 → <b class="vm">0,15</b>, 0,92 → <b class="vm">0,08</b>.'))}`)}</div>

    <div id="s2">${cb(T('Average memory access time', 'Tiempo medio de acceso a memoria'), 'L4_1 · 14', `
      ${fx([['', 't<sub>M</sub>', T('average time', 'tiempo medio')], '=', ['va', 't<sub>A</sub>', T('hit time: every access pays it', 'tiempo de acierto: lo paga todo acceso')], '+', ['vm', '(1 − h)', T('fraction that misses', 'fracción que falla')], '·', ['vf', 't<sub>F</sub>', T('penalty: only on a miss', 'penalización: solo si falla')]])}
      <p class="say">${T(`Read it aloud: “every access costs ${vA('the hit time')}; ${vM('one in so many')} also costs ${vF('the penalty')}.”`, `Léela en voz alta: «todo acceso cuesta ${vA('el tiempo de acierto')}; ${vM('uno de cada tantos')} cuesta además ${vF('la penalización')}».`)}</p>
      <div class="exbox"><b>${T('Tiny example', 'Ejemplo mínimo')}</b> t<sub>A</sub> = ${vA('1 ns')}, h = 0,9, t<sub>F</sub> = ${vF('20 ns')} → ${vA('1')} + ${vM('0,1')} · ${vF('20')} = <b>3 ns</b></div>
      <div class="lg2"><div><b>${T('What is inside the penalty', 'Qué hay dentro de la penalización')}</b>${T(`${hk('Access to the lower level')}: depends on its <u>latency</u>.`, `${hk('Acceso al nivel inferior')}: depende de la <u>latencia</u>.`)}<br>${T(`${hk('Transfer of the block')} to the upper level: depends on <u>block size and bandwidth</u>.`, `${hk('Transferencia del bloque')} al nivel superior: depende del <u>tamaño de bloque y del ancho de banda</u>.`)}</div>
        <div><b>${T('Why optimising is a balance', 'Por qué optimizar es un equilibrio')}</b>${T(`Three knobs: ${vA('hit time')}, ${vM('misses')}, ${vF('penalty')}. ${hc('Improving one can worsen another')} (a bigger cache misses less but answers more slowly).`, `Tres mandos: ${vA('tiempo de acierto')}, ${vM('fallos')}, ${vF('penalización')}. ${hc('Mejorar una variable puede perjudicar otra')} (una caché mayor falla menos pero responde más despacio).`)}</div></div>`)}</div>

    <div id="s3">${cb(T('Two levels: the penalty is itself an access', 'Dos niveles: la penalización es a su vez un acceso'), 'L4_2 · 8', `
      <p>${T(`When L1 misses, the “penalty” is simply ${hk('one access to L2')}, which has its own hit time, miss rate and penalty. So the same formula goes inside itself:`, `Cuando L1 falla, la «penalización» es simplemente ${hk('un acceso a L2')}, que tiene su propio tiempo de acierto, tasa de fallos y penalización. Así que la misma fórmula se mete dentro de sí misma:`)}</p>
      ${fx([['', 't<sub>M</sub>', ''], '=', ['va', 't<sub>A1</sub>', 'L1'], '+', ['vm', 'm<sub>1</sub>', T('L1 misses', 'falla L1')], '·', ['vf', 't<sub>F1</sub>', T('= an access to L2', '= un acceso a L2')]])}
      <div class="nest"><span>t<sub>F1</sub> =</span>${fx([['va', 't<sub>A2</sub>', 'L2'], '+', ['vm', 'm<sub>2</sub>', T('L2 misses (local)', 'falla L2 (local)')], '·', ['vf', 't<sub>F2</sub>', T('memory', 'memoria')]], 'sm')}</div>
      ${fx([['', 't<sub>M</sub>', ''], '=', ['va', 't<sub>A1</sub>', ''], '+', ['vm', 'm<sub>1</sub>', ''], '· (', ['va', 't<sub>A2</sub>', ''], '+', ['vm', 'm<sub>2</sub>', ''], '·', ['vf', 't<sub>F2</sub>', ''], ')'], 'full')}
      <h4>${T('Local and global miss rates', 'Tasas de fallo local y global')}</h4>
      <div class="fnl"><div class="fnr"><i style="width:100%" class="f0"></i><span><b>1000</b> ${T('accesses from the CPU', 'accesos de la CPU')}</span></div>
        <div class="fnr"><i style="width:34%" class="f1"></i><span><b>150</b> ${T('miss in L1 and reach L2', 'fallan en L1 y llegan a L2')} <em>m<sub>L</sub>(L1) = 150/1000 = 15 %</em></span></div>
        <div class="fnr"><i style="width:9%" class="f2"></i><span><b>12</b> ${T('also miss in L2 and reach memory', 'fallan también en L2 y llegan a memoria')}</span></div></div>
      <div class="lg2"><div><b>${hk(T('Local', 'Local'))} m<sub>L</sub>(L2)</b>${T('of the accesses that <u>reached L2</u>:', 'de los accesos que <u>llegaron a L2</u>:')}<code>12 / 150 = ${hn('8 %')}</code></div>
        <div><b>${hk(T('Global', 'Global'))} m<sub>G</sub>(L2)</b>${T('of <u>all</u> the accesses of the processor:', 'de <u>todos</u> los accesos del procesador:')}<code>12 / 1000 = ${hn('1,2 %')}</code></div></div>
      ${fx([['', 'm<sub>G</sub>(L2)', T('global', 'global')], '=', ['vm', 'm<sub>L</sub>(L1)', T('local', 'local')], '·', ['vm', 'm<sub>L</sub>(L2)', T('local', 'local')]], 'sm')}
      <p class="mute">${T('For L1 local and global are the same thing: m<sub>G</sub>(L1) = m<sub>L</sub>(L1). The numbers are those of E4_2 (0,85 and 0,92).', 'Para L1 local y global coinciden: m<sub>G</sub>(L1) = m<sub>L</sub>(L1). Los números son los del E4_2 (0,85 y 0,92).')}</p>
      ${trap(T('A rate given for a level with no adjective is its <b>local</b> rate, and the recursive formula needs local rates. A local rate can look awful while the global one is fine: in the 2022 exam L2 misses 100 % locally and only 5/64 globally.', 'Una tasa dada para un nivel sin adjetivo es su tasa <b>local</b>, y la fórmula recursiva usa tasas locales. Una tasa local puede parecer pésima con una global aceptable: en el examen de 2022 L2 falla el 100 % local y solo 5/64 global.'))}`)}</div>

    <div id="s4">${cb(T('What misses do to execution time', 'Impacto sobre el tiempo de ejecución'), 'L4_1 · 15–17', `
      ${fx([['', 't<sub>CPU</sub>', ''], '= (', ['va', T('cycles<sub>CPU</sub>', 'ciclos<sub>CPU</sub>'), T('useful cycles', 'ciclos útiles')], '+', ['vf', T('cycles<sub>stall</sub>', 'ciclos<sub>detención</sub>'), T('waiting for memory', 'esperando a memoria')], ') ·', ['', 'T<sub>clk</sub>', T('cycle time', 'duración del ciclo')]])}
      <div class="grid2 tight"><div>${fx([['va', T('cycles<sub>CPU</sub>', 'ciclos<sub>CPU</sub>'), ''], '=', ['vr', 'IC', T('instructions', 'instrucciones')], '·', ['va', 'CPI', T('ideal, no memory waits', 'ideal, sin esperas')]], 'sm')}</div>
      <div>${fx([['vf', T('cycles<sub>stall</sub>', 'ciclos<sub>detención</sub>'), ''], '=', ['vr', 'IC', ''], '·', ['vr', 'R<sub>mem</sub>', T('accesses per instr.', 'accesos por instr.')], '·', ['vm', '(1 − h)', ''], '·', ['vf', 't<sub>F</sub>', T('in cycles', 'en ciclos')]], 'sm')}</div></div>
      <p class="say">${T(`In words: ${vR('how many instructions')} × ${vR('how many of them touch memory')} × ${vM('how often that misses')} × ${vF('what each miss costs')}.`, `En palabras: ${vR('cuántas instrucciones')} × ${vR('cuántas tocan memoria')} × ${vM('con qué frecuencia fallan')} × ${vF('cuánto cuesta cada fallo')}.`)}</p>
      <p>${T(`A ${hk('small reduction in the miss rate')} can give a notable improvement when the penalty is high.`, `Una ${hk('reducción pequeña de la tasa de fallos')} puede producir una mejora notable cuando la penalización es elevada.`)}</p>
      <h4>${T('Reads and writes are counted separately', 'Lecturas y escrituras se cuentan por separado')} ${sref('L4_1 · 16')}</h4>
      <p>${T(`They follow different usage patterns, so their hit rates differ, and so do their penalties: a read usually ${hc('blocks the instruction that depends on it')}, while a write can ${hp('wait in the write buffer and finish in the background')}.`, `Siguen patrones de uso diferentes, así que sus tasas de acierto son distintas, y también sus penalizaciones: una lectura suele ${hc('bloquear la instrucción dependiente')}, mientras que una escritura puede ${hp('almacenarse en el búfer de escritura y completarse en segundo plano')}.`)}</p>
      ${fx([['vf', T('cycles<sub>stall</sub>', 'ciclos<sub>detención</sub>'), ''], '=', ['vr', 'IC · R<sub>memR</sub>', T('reads', 'lecturas')], '·', ['vm', '(1 − h<sub>R</sub>)', ''], '·', ['vf', 't<sub>FR</sub>', ''], '+', ['vr', 'IC · R<sub>memW</sub>', T('writes', 'escrituras')], '·', ['vm', '(1 − h<sub>W</sub>)', ''], '·', ['vf', 't<sub>FW</sub>', '']], 'sm')}
      <h4>${T('Exposed latency', 'Latencia expuesta')} ${sref('L4_1 · 17')}</h4>
      <p>${T(`The total penalty covers everything needed to resolve the miss: ${hk('search in the lower level, possible write of the replaced block, transfer, and writing the new block')}. Not all of it has to stop the processor: part overlaps with other instructions, independent accesses or transfers already under way. The ${hk('exposed latency')} <i>(latencia expuesta)</i> is the fraction that parallelism does <u>not</u> hide, and it is what really goes into the stall cycles.`, `La penalización total comprende todo lo necesario para resolver el fallo: ${hk('búsqueda en el nivel inferior, posible escritura del bloque reemplazado, transferencia y escritura del nuevo bloque')}. No toda esa latencia detiene al procesador: parte se solapa con otras instrucciones, accesos independientes o transferencias ya iniciadas. La ${hk('latencia expuesta')} es la fracción <u>no</u> ocultada por el paralelismo, y es lo que realmente entra en los ciclos de detención.`)}</p>
      ${trap(T('Watch the units. In t<sub>M</sub> everything is in <b>ns</b>; in stall cycles the penalty is in <b>cycles</b>. And the “ideal CPI” already excludes memory waits: add the stalls to it, do not multiply.', 'Cuidado con las unidades. En t<sub>M</sub> todo va en <b>ns</b>; en los ciclos de detención la penalización va en <b>ciclos</b>. Y el «CPI ideal» ya excluye las esperas de memoria: las detenciones se le suman, no se multiplican.'))}`)}</div>

    <div id="s5">${cb(T('Worked example 1 — speed-up without misses', 'Ejemplo resuelto 1 — aceleración sin fallos'), 'E4_2 · ej. 1', `
      <p class="given">${T(`Ideal CPI = ${vA('1,5')}. ${vR('30 %')} of instructions access memory. Miss rate ${vM('4 %')}. Penalty ${vF('40 cycles')}. How much faster would the machine be with no misses at all?`, `CPI ideal = ${vA('1,5')}. El ${vR('30 %')} de las instrucciones accede a memoria. Tasa de fallos ${vM('4 %')}. Penalización ${vF('40 ciclos')}. ¿Cuánto más rápida sería la máquina sin ningún fallo?`)}</p>
      <p class="mute">${T('Answer each line in your head (or on paper) before you reveal it.', 'Responde cada línea mentalmente (o en papel) antes de mostrarla.')}</p><div id="w1"></div>`)}
    ${cb(T('Worked example 2 — two levels, all writes', 'Ejemplo resuelto 2 — dos niveles, todo escrituras'), 'E4_2 · ej. 2', `
      <table class="tbl given2"><tr><th></th><th>${T('Access time', 'Tiempo de acceso')}</th><th>${T('Hit rate', 'Tasa de aciertos')}</th></tr>
      <tr><th>L1</th><td>${vA('1,5 ns')}</td><td>0,85</td></tr><tr><th>L2</th><td>${vA('6 ns')}</td><td>0,92</td></tr><tr><th>RAM</th><td>${vF('80 ns')}</td><td>1</td></tr></table>
      <p class="mute">${T('Every access is a write. The program is entirely in RAM. On a write miss the block is first brought into L1.', 'Todos los accesos son escrituras. El programa está entero en RAM. En un fallo de escritura primero se trae el bloque a L1.')}</p><div id="w2"></div>
      <table class="tbl vs wide sum"><tr><th></th><th>${T('No write buffer', 'Sin búfer de escritura')}</th><th>${T('With write buffer', 'Con búfer de escritura')}</th></tr>
      <tr><th>Write-through</th><td>${hc('89,36 ns')}<small>${T('every write crosses <b>all</b> levels', 'cada escritura atraviesa <b>todos</b> los niveles')}</small></td><td>${hp('3,36 ns')}<small>${T('L1 and buffer written in parallel', 'L1 y búfer se escriben en paralelo')}</small></td></tr>
      <tr><th>Write-back</th><td>${hp('3,36 ns')}<small>${T('the write stays in L1', 'la escritura se queda en L1')}</small></td><td>${hp('3,36 ns')}<small>${T('buffer unused: no modified line is ever evicted', 'búfer sin usar: nunca se expulsa una línea modificada')}</small></td></tr></table>`)}</div>

    <div id="s6" class="card">
      <h3>${T('Feel it: two-level calculator', 'Siéntelo: calculadora de dos niveles')}</h3>
      <p class="mute">${T('Defaults are sheet E4_2 exercise 2. Before you move a slider, say which coloured segment will grow.', 'Los valores por defecto son el ejercicio 2 del boletín E4_2. Antes de mover un deslizador, di qué segmento de color crecerá.')}</p>
      <div class="sliders">
        ${[['t1', 't<sub>A1</sub> (ns)', 0.5, 5, 0.5], ['m1', 'm<sub>1</sub> (%)', 0, 40, 1], ['t2', 't<sub>A2</sub> (ns)', 2, 20, 1], ['m2', 'm<sub>2</sub> local (%)', 0, 60, 1], ['tm', 't<sub>mem</sub> (ns)', 20, 200, 10]].map(([k, l, a, b, s]) => `<label><span>${l}</span><input type="range" data-k="${k}" min="${a}" max="${b}" step="${s}" value="${FM[k]}"><b id="v_${k}"></b></label>`).join('')}
      </div>
      <div class="tmbar" id="tmbar"></div><div id="tmout" class="work"></div><div class="fnl" id="fmfun"></div>
    </div>

    <div id="s7"><h2>${T('Checkpoint', 'Punto de control')}</h2><div id="q"></div></div>${nextLink('loops')}</div>`;

    const root = m.firstElementChild;
    learnInit(root);
    $$('[data-go]', m).forEach(b => (b.onclick = () => { sfx.tick(); $('#' + b.dataset.go, m).scrollIntoView({ behavior: 'smooth', block: 'start' }); }));

    stepper($('#w1', m), [
      { q: T('Name every number with its symbol before computing anything.', 'Pon nombre y símbolo a cada número antes de calcular nada.'), a: `CPI = ${vA('1,5')} · R<sub>mem</sub> = ${vR('0,30')} · m = ${vM('0,04')} · t<sub>F</sub> = ${vF('40')}` },
      { q: T('Stall cycles <b>per instruction</b>?', '¿Ciclos de detención <b>por instrucción</b>?'), a: `${vR('0,30')} · ${vM('0,04')} · ${vF('40')} = <b>0,48</b> ${T('(IC is a common factor, leave it out)', '(IC es factor común, se deja fuera)')}` },
      { q: T('Real cycles per instruction?', '¿Ciclos reales por instrucción?'), a: `${vA('1,5')} + ${vF('0,48')} = <b>1,98</b>` },
      { q: T('Speed-up of the miss-free machine?', '¿Aceleración de la máquina sin fallos?'), a: `S = t<sub>real</sub> / t<sub>ideal</sub> = 1,98 / 1,5 = <b>1,32</b> ${T('— IC and T<sub>clk</sub> cancel.', '— IC y T<sub>clk</sub> se cancelan.')}` }
    ]);
    stepper($('#w2', m), [
      { q: T('First move, always: turn the hit rates into miss rates.', 'Primer paso, siempre: convierte las tasas de aciertos en tasas de fallos.'), a: `m<sub>1</sub> = 1 − 0,85 = ${vM('0,15')} · m<sub>2</sub> = 1 − 0,92 = ${vM('0,08')}` },
      { q: T('The “miss term”: the average time spent bringing the block into L1 when the write misses.', 'El «término de fallo»: el tiempo medio de traer el bloque a L1 cuando la escritura falla.'), a: `${vM('0,15')} · (${vA('6')} + ${vM('0,08')} · ${vF('80')}) = 0,15 · 12,4 = <b>1,86 ns</b>` },
      { q: T('1(a) Write-through, no buffer. What does every single write have to do?', '1(a) Write-through, sin búfer. ¿Qué tiene que hacer cada escritura?'), a: T(`Propagate through both levels down to main memory: (${vA('1,5')} + ${vA('6')} + ${vF('80')}) + 1,86 = 87,5 + 1,86 = <b>89,36 ns</b>`, `Propagarse por los dos niveles hasta memoria principal: (${vA('1,5')} + ${vA('6')} + ${vF('80')}) + 1,86 = 87,5 + 1,86 = <b>89,36 ns</b>`) },
      { q: T('1(b) Write-back, no buffer (assume a written block is never replaced).', '1(b) Write-back, sin búfer (se asume que nunca se reemplaza un bloque escrito).'), a: T(`A write hit stays in L1; the next level is only consulted on a miss: ${vA('1,5')} + 1,86 = <b>3,36 ns</b>`, `Un acierto de escritura se queda en L1; solo se consulta el siguiente nivel si hay fallo: ${vA('1,5')} + 1,86 = <b>3,36 ns</b>`) },
      { q: T('2(a) Write-through with a 1,5 ns buffer that never fills.', '2(a) Write-through con un búfer de 1,5 ns que nunca se llena.'), a: T(`The CPU writes L1 and the buffer in parallel; the buffer does the propagation, not the CPU: ${vA('1,5')} + 1,86 = <b>3,36 ns</b>`, `La CPU escribe en L1 y en el búfer en paralelo; la propagación la hace el búfer, no la CPU: ${vA('1,5')} + 1,86 = <b>3,36 ns</b>`) },
      { q: T('2(b) Write-back with the buffer.', '2(b) Write-back con el búfer.'), a: T('The buffer only acts when a dirty block is replaced, which never happens here. Same result as without it: <b>3,36 ns</b>', 'El búfer solo actúa al reemplazar un bloque sucio, lo que aquí nunca ocurre. Mismo resultado que sin búfer: <b>3,36 ns</b>') },
      { q: T('3(a) L1 + L2 seen as one cache: global hit rate?', '3(a) L1 + L2 vistas como una sola caché: ¿tasa de aciertos global?'), a: `1 − ${vM('0,15')} · ${vM('0,08')} = 1 − 0,012 = <b>0,988</b>` },
      { q: T('3(b) …and its average time to resolve an access inside the two levels?', '3(b) …¿y su tiempo medio para resolver un acceso dentro de los dos niveles?'), a: `${vA('1,5')} + ${vM('0,15')} · ${vA('6')} = <b>2,40 ns</b>` }
    ]);

    const upd = () => {
      const { t1, m1, t2, m2, tm } = FM, a = t1, b = m1 / 100 * t2, c = m1 / 100 * m2 / 100 * tm, tot = a + b + c;
      ['t1', 'm1', 't2', 'm2', 'tm'].forEach(k => ($('#v_' + k, m).textContent = FM[k]));
      $('#tmbar', m).innerHTML = [[a, 'L1', 'idx'], [b, 'L2', 'off'], [c, 'mem', 'tag']].map(([v, l, cl]) => `<div class="tb ${cl}" style="flex:${Math.max(v, 0.0001)}"><span>${l} ${v.toFixed(2)}</span></div>`).join('');
      $('#tmout', m).innerHTML = `<div>t<sub>M</sub> = ${t1} + ${(m1 / 100).toFixed(2)}·(${t2} + ${(m2 / 100).toFixed(2)}·${tm}) = <b>${tot.toFixed(2)} ns</b></div><div>${T('global miss rate', 'tasa de fallos global')} = ${(m1 / 100).toFixed(2)} · ${(m2 / 100).toFixed(2)} = <b>${(m1 * m2 / 100).toFixed(2)} %</b></div>`;
      const r2 = m1 * 10, r3 = m1 * m2 / 10, w = v => Math.max(1.5, Math.sqrt(v / 1000) * 100).toFixed(1);
      $('#fmfun', m).innerHTML = `<div class="fnr"><i style="width:100%" class="f0"></i><span><b>1000</b> ${T('accesses', 'accesos')}</span></div>
        <div class="fnr"><i style="width:${w(r2)}%" class="f1"></i><span><b>${+r2.toFixed(1)}</b> ${T('reach L2', 'llegan a L2')}</span></div>
        <div class="fnr"><i style="width:${w(r3)}%" class="f2"></i><span><b>${+r3.toFixed(1)}</b> ${T('reach memory', 'llegan a memoria')} <em>${T('local', 'local')} ${m2} % · ${T('global', 'global')} ${(m1 * m2 / 100).toFixed(2)} %</em></span></div>`;
    };
    $$('input[type=range]', m).forEach(r => (r.oninput = () => { FM[r.dataset.k] = +r.value; upd(); }));
    upd();
    Quiz($('#q', m), 'formulas', formulaQs());
  }
});
