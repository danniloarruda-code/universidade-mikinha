// Skills of the addition, subtraction and multiplication faculties.
// Each skill has 10 levels (BNCC, 3rd and 4th grade) and produces questions in the
// common "quiz" shape every quiz-style game mode understands:
// { skill, left, op, right, a, ask, key, hint, reveal, say, done }

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const digitsOf = n => String(n).split('').reverse().map(Number); // units first
const nDigitNumber = d => d === 1 ? rand(1, 9) : rand(10 ** (d - 1), 10 ** d - 1);

/** columns that "vão um" when adding a + b */
function carries(a, b) {
  const x = digitsOf(a), y = digitsOf(b); let carry = 0, n = 0, units = false;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const s = (x[i] || 0) + (y[i] || 0) + carry; carry = s >= 10 ? 1 : 0;
    if (carry) { n++; if (i === 0) units = true; }
  }
  return { n, units };
}
/** columns that need "empréstimo" when computing a − b */
function borrows(a, b) {
  const x = digitsOf(a), y = digitsOf(b); let borrow = 0, n = 0;
  for (let i = 0; i < x.length; i++) {
    const d = x[i] - borrow - (y[i] || 0); borrow = d < 0 ? 1 : 0; if (borrow) n++;
  }
  return n;
}

// [digits of a, digits of b, carries wanted: 0 | 1 | 2 (= two or more)]
const ADD = [null, null, null, [2, 1, 0], [2, 2, 0], [2, 1, 1], [2, 2, 1], [3, 2, 0], [3, 3, 1], [3, 3, 2], [4, 3, 2]];
const ADD_DESC = ['Somas até 10', 'Somas até 18', 'Dezena + unidade, sem "vai um"', 'Dezena + dezena, sem "vai um"', 'Dezena + unidade, com "vai um"',
  'Dezena + dezena, com "vai um"', 'Centena + dezena, sem "vai um"', 'Centenas, com um "vai um"', 'Centenas, com vários "vai um"', 'Milhares (4º ano)'];

function addPair(step) {
  if (step === 1) { const a = rand(1, 7); return [a, rand(1, 10 - a)]; }
  if (step === 2) { const a = rand(3, 9); return [a, rand(Math.max(2, 11 - a), 9)]; }
  const [da, db, want] = ADD[step];
  for (let i = 0; i < 500; i++) {
    const a = nDigitNumber(da), b = nDigitNumber(db), c = carries(a, b), total = a + b;
    if (String(total).length > Math.max(da, db) && step < 10) continue;
    if (want === 0 && c.n === 0) return [a, b];
    if (want === 1 && c.n === 1 && c.units) return [a, b];
    if (want === 2 && c.n >= 2) return [a, b];
  }
  return [25, 37];
}

const SUB = [null, null, null, [2, 1, 0], [2, 2, 0], [2, 1, 1], [2, 2, 1], [3, 2, 0], [3, 3, 1], [3, 3, 2], [4, 3, 2]];
const SUB_DESC = ['Subtrações até 10', 'Subtrações até 18', 'Dezena − unidade, sem "empréstimo"', 'Dezena − dezena, sem "empréstimo"', 'Dezena − unidade, com "empréstimo"',
  'Dezena − dezena, com "empréstimo"', 'Centena − dezena, sem "empréstimo"', 'Centenas, com um "empréstimo"', 'Centenas, com vários "empréstimos" (como 400 − 128)', 'Milhares (4º ano)'];

function subPair(step) {
  if (step === 1) { const a = rand(3, 10); return [a, rand(1, a - 1)]; }
  if (step === 2) { const a = rand(11, 18); return [a, rand(a - 9, 9)]; }
  const [da, db, want] = SUB[step];
  for (let i = 0; i < 500; i++) {
    const a = nDigitNumber(da), b = nDigitNumber(db);
    if (b >= a) continue;
    const n = borrows(a, b);
    if ((want === 0 && n === 0) || (want === 1 && n === 1) || (want === 2 && n >= 2)) return [a, b];
  }
  return [52, 27];
}

const MUL_DESC = ['Tabuadas do 2 e do 10', 'Tabuadas do 2, 3, 5 e 10', 'Tabuada do 4', 'Tabuadas do 2 ao 5 misturadas', 'Tabuadas do 6 e do 7',
  'Tabuadas do 8 e do 9', 'Todas as tabuadas', 'Dezena × unidade, sem "vai um" (como 23 × 3)', 'Dezena × unidade, com "vai um" (como 27 × 4)', 'Centena × unidade (4º ano)'];
const TABLES = [null, [2, 10], [2, 3, 5, 10], [4], [2, 3, 4, 5], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9]];

function mulPair(step) {
  if (step <= 7) { const t = pick(TABLES[step]), m = rand(2, 10); return Math.random() < .5 ? [t, m] : [m, t]; }
  for (let i = 0; i < 500; i++) {
    const m = rand(2, step === 8 ? 4 : 9), a = step === 10 ? rand(100, 333) : rand(11, 99), u = a % 10, tn = Math.floor(a / 10) % 10;
    if (step === 8 && u * m < 10 && tn * m < 10) return [a, m];
    if (step === 9 && u * m >= 10 && a * m < 1000) return [a, m];
    if (step === 10 && a * m < 4000) return [a, m];
  }
  return [23, 3];
}

function addHint(a, b) {
  if (a < 10 && b < 10) return `Comece no ${Math.max(a, b)} e conte mais ${Math.min(a, b)} nos dedos.`;
  const ua = a % 10, ub = b % 10, s = ua + ub;
  return `Some primeiro as unidades: ${ua} + ${ub} = ${s}.${s >= 10 ? ` Fica ${s % 10} e vai 1 para as dezenas.` : ''} Depois some as dezenas.`;
}
function subHint(a, b) {
  if (a <= 18 && b < 10) return `Comece no ${b} e conte até chegar no ${a}. Quantos dedos você levantou?`;
  const ua = a % 10, ub = b % 10;
  return ua >= ub ? `Comece pelas unidades: ${ua} − ${ub} = ${ua - ub}. Depois faça as dezenas.`
    : `Comece pelas unidades: ${ua} − ${ub} não dá! Pegue 1 dezena emprestada: ${ua + 10} − ${ub} = ${ua + 10 - ub}. A dezena de cima fica com 1 a menos.`;
}
function mulHint(a, b) {
  const big = Math.max(a, b), small = Math.min(a, b);
  if (big >= 11) { const tens = big - big % 10, u = big % 10; return `Separe o ${big} em ${tens} + ${u}. ${tens} × ${small} = ${tens * small} e ${u} × ${small} = ${u * small}. Agora some os dois.`; }
  if (small <= 5) return `${big} × ${small} é somar o ${big}, ${small} vezes: ${Array(small).fill(big).join(' + ')}.`;
  return `Use uma conta que você já sabe: ${big} × ${small - 1} = ${big * (small - 1)}. Agora some mais ${big}.`;
}

const make = (skill, a, b, op, ans, hint, verb) => ({
  skill, left:a, op, right:b, a:ans, ask:'value', key:`${a}${op}${b}`, hint,
  reveal:`${a} ${op} ${b} = ${ans}.`, say:`Quanto é ${a} ${verb} ${b}?`, done:`${a} ${op} ${b} = ${ans}.`
});

/* ---------- Money (values in centavos) ---------- */
export const fmtMoney = c => `R$ ${Math.floor(c / 100)}${c % 100 ? ',' + String(c % 100).padStart(2, '0') : ''}`;
const DIN_DESC = ['Pagar até R$ 10 (moedas de 1 real e notas de 2 e 5)', 'Pagar até R$ 20 (com a nota de 10)', 'Pagar até R$ 50 (com a nota de 20)', 'Pagar até R$ 100 (com a nota de 50)',
  'Dar troco de R$ 10 (valores inteiros)', 'Dar troco de R$ 20 e R$ 50', 'Pagar com 50 centavos (como R$ 3,50)', 'Pagar com moedas de 10, 25 e 50 centavos',
  'Dar troco com centavos', 'Duas compras somadas, com centavos e troco'];
const WALLET = [null, [100, 200, 500], [100, 200, 500, 1000], [100, 200, 500, 1000, 2000], [100, 200, 500, 1000, 2000, 5000],
  [100, 200, 500], [100, 200, 500, 1000, 2000], [50, 100, 200, 500], [10, 25, 50, 100, 200, 500], [10, 25, 50, 100, 200, 500, 1000], [5, 10, 25, 50, 100, 200, 500, 1000, 2000]];
const GOODS = [['🍎', 'uma maçã'], ['🧃', 'um suco'], ['🍫', 'um chocolate'], ['🥖', 'um pão'], ['🧁', 'um bolinho'], ['🍦', 'um sorvete'], ['📒', 'um caderno'], ['✏️', 'um lápis'], ['🧸', 'um ursinho'], ['⚽', 'uma bola']];
const CENTS8 = [10, 20, 25, 30, 35, 40, 50, 60, 70, 75, 80, 90];
/** a shop task: pay exactly (price) or give change (paid − price) */
export function moneyTask(step) {
  const g = () => pick(GOODS), wallet = WALLET[step];
  if (step <= 4) { const [lo, hi] = [[2, 10], [5, 20], [10, 50], [20, 100]][step - 1]; return { kind:'pay', items:[g()], prices:[rand(lo, hi) * 100], wallet, showTotal:step <= 3 }; }
  if (step === 5) return { kind:'change', items:[g()], prices:[rand(1, 9) * 100], paid:1000, wallet, showTotal:true };
  if (step === 6) { const paid = pick([2000, 5000]); return { kind:'change', items:[g()], prices:[rand(5, paid / 100 - 2) * 100], paid, wallet, showTotal:true }; }
  if (step === 7) return { kind:'pay', items:[g()], prices:[rand(2, 9) * 100 + 50], wallet, showTotal:true };
  if (step === 8) return { kind:'pay', items:[g()], prices:[rand(1, 12) * 100 + pick(CENTS8)], wallet, showTotal:false };
  if (step === 9) { const price = rand(1, 8) * 100 + pick([25, 50, 75]); return { kind:'change', items:[g()], prices:[price], paid:1000, wallet, showTotal:false }; }
  const a = rand(1, 9) * 100 + pick([0, 25, 50, 75]), b = rand(1, 9) * 100 + pick([0, 25, 50, 75]), paid = [1000, 2000, 5000].find(v => v > a + b);
  let i1 = g(), i2 = g(); while (i2 === i1) i2 = g();
  return { kind:'change', items:[i1, i2], prices:[a, b], paid, wallet, showTotal:false };
}
function moneyOpts(ans) {
  const set = new Set([ans]);
  for (const d of [100, -100, 50, -50, 200, 10, -10, 500]) { if (set.size >= 4) break; if (ans + d > 0) set.add(ans + d); }
  return [...set].sort(() => Math.random() - .5);
}

/* ---------- Time (minutes since midnight) ---------- */
export const fmtTime = (t, h24 = false) => { t = ((t % 1440) + 1440) % 1440; const h = Math.floor(t / 60), m = t % 60; return `${h24 ? h : ((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`; };
export const fmtDur = d => { const h = Math.floor(d / 60), m = d % 60; return h && m ? `${h}h${String(m).padStart(2, '0')}` : h ? `${h} ${h === 1 ? 'hora' : 'horas'}` : `${m} min`; };
const HORA_DESC = ['Horas cheias (3:00)', 'Horas e meia (3:30)', 'Quinze e quarenta e cinco (3:15, 3:45)', 'Minutos de 5 em 5', 'Qualquer horário de 5 em 5 minutos, acertando os ponteiros',
  'Quanto tempo durou (horas cheias)', 'Quanto tempo durou (com meia hora)', 'Que horas serão daqui a alguns minutos', 'Relógio de 24 horas (14:00 = 2 da tarde)', 'Quanto tempo durou (horas e minutos)'];
/** a time on the clock face for this level, in minutes (morning or afternoon) */
export function clockTime(step) {
  const h = rand(1, 12), minutes = step === 1 ? [0] : step === 2 ? [0, 30] : step === 3 ? [0, 15, 30, 45] : [...Array(12)].map((_, i) => i * 5);
  return (h % 12) * 60 + pick(minutes) + (step >= 9 && Math.random() < .6 ? 720 : 0);
}
/** wrong answers that look like the typical clock mistakes: swapped hands, one hour off, minutes off */
export function timeOpts(t, step, n = 4) {
  const h = Math.floor(t / 60) % 12, m = t % 60, set = new Set([fmtTime(t, step >= 9)]);
  const swapped = (m / 5 % 12) * 60 + (h === 0 ? 0 : h * 5); // reading the hour hand as minutes and vice versa
  const cands = [t + 60, t - 60, swapped, t + (step <= 2 ? 30 : step <= 3 ? 15 : 5), t - (step <= 3 ? 15 : 10), t + 120];
  for (const c of cands) { if (set.size >= n) break; set.add(fmtTime(c, step >= 9)); }
  return [...set].sort(() => Math.random() - .5);
}
export function durOpts(d) { const set = new Set([fmtDur(d)]); for (const x of [d + 60, d - 60, d + 30, d - 30, d + 15, d + 120]) { if (set.size >= 4) break; if (x > 0) set.add(fmtDur(x)); } return [...set].sort(() => Math.random() - .5); }
/** text-only time questions (used by the Castle and the clock game) */
export function timeQuestion(step) {
  if (step <= 5) { const t = clockTime(Math.max(step, 2)), add = 60 * rand(1, 3); const a = fmtTime(t + add);
    return { text:`São ${fmtTime(t)}. Que horas serão daqui a ${add / 60} ${add === 60 ? 'hora' : 'horas'}?`, a, opts:timeOpts(t + add, step), hint:`Ande ${add / 60} ${add === 60 ? 'hora' : 'horas'} no ponteiro pequeno. Os minutos continuam iguais.` }; }
  if (step <= 7 || step === 10) {
    const start = clockTime(step === 10 ? 4 : step === 7 ? 2 : 1), dur = step === 6 ? 60 * rand(1, 4) : step === 7 ? 30 * rand(1, 7) : 5 * rand(7, 40);
    return { text:`Começou às ${fmtTime(start)} e terminou às ${fmtTime(start + dur)}. Quanto tempo durou?`, a:fmtDur(dur), opts:durOpts(dur), hint:`Conte as horas inteiras de ${fmtTime(start)} até chegar perto de ${fmtTime(start + dur)}, e depois os minutos que faltam.` };
  }
  if (step === 8) { const t = clockTime(4), add = pick([10, 15, 20, 30, 40, 45]);
    return { text:`São ${fmtTime(t)}. Que horas serão daqui a ${add} minutos?`, a:fmtTime(t + add), opts:timeOpts(t + add, 4), hint:`Some ${add} aos minutos. Se passar de 60, vira mais 1 hora.` }; }
  const t = rand(13, 22) * 60 + pick([0, 30]);
  return { text:`${fmtTime(t, true)} é que horas no relógio de ponteiros?`, a:fmtTime(t), opts:[fmtTime(t), fmtTime(t + 60), fmtTime(t - 120), fmtTime(t + 30)].filter((v, i, s) => s.indexOf(v) === i), hint:`Tire 12 das horas: ${Math.floor(t / 60)} − 12 = ${Math.floor(t / 60) - 12}.` };
}

export const EXTRA_SKILLS = {
  add:{ name:'Adição', desc:s => ADD_DESC[s - 1], quiz(step) { const [a, b] = addPair(step); return make('add', a, b, '+', a + b, addHint(a, b), 'mais'); } },
  sub:{ name:'Subtração', desc:s => SUB_DESC[s - 1], quiz(step) { const [a, b] = subPair(step); return make('sub', a, b, '−', a - b, subHint(a, b), 'menos'); } },
  mul:{ name:'Multiplicação', desc:s => MUL_DESC[s - 1], quiz(step) { const [a, b] = mulPair(step); return make('mul', a, b, '×', a * b, mulHint(a, b), 'vezes'); } },
  // text questions (no "a op b" form): only the Castle and the dedicated games use them
  din:{ name:'Dinheiro', desc:s => DIN_DESC[s - 1], text:true, quiz(step) {
    const T = moneyTask(step), total = T.prices.reduce((a, b) => a + b, 0), names = T.items.map(i => i[1]);
    const cap = s => s[0].toUpperCase() + s.slice(1);
    if (T.kind === 'pay' && step <= 4) {
      const b = rand(1, 9) * 100, a = total + b, other = pick(GOODS.filter(g => g[1] !== names[0]))[1];
      return { skill:'din', text:`${cap(names[0])} custa ${fmtMoney(total)} e ${other} custa ${fmtMoney(b)}. Quanto custa tudo?`, a, opts:moneyOpts(a), fmt:fmtMoney, key:`${total}+${b}`, hint:`Some os dois preços: ${fmtMoney(total)} + ${fmtMoney(b)}.` };
    }
    if (T.kind === 'pay') { const left = pick([50, 100, 150, 200, 250, 300, 500]);
      return { skill:'din', text:`Você tem ${fmtMoney(total + left)} e compra ${names[0]} por ${fmtMoney(total)}. Quanto sobra?`, a:left, opts:moneyOpts(left), fmt:fmtMoney, key:`sobra${total}`, hint:`Tire o preço do dinheiro que você tem, ou conte de ${fmtMoney(total)} até ${fmtMoney(total + left)}.` }; }
    const ch = T.paid - total, what = names.length > 1 ? `Comprou ${names[0]} por ${fmtMoney(T.prices[0])} e ${names[1]} por ${fmtMoney(T.prices[1])}` : `${cap(names[0])} custa ${fmtMoney(total)}`;
    return { skill:'din', text:`${what} e pagou com ${fmtMoney(T.paid)}. Qual é o troco?`, a:ch, opts:moneyOpts(ch), fmt:fmtMoney, key:`troco${total}/${T.paid}`, hint:`${names.length > 1 ? `Primeiro some as compras: ${fmtMoney(total)}. ` : ''}Depois conte para cima, de ${fmtMoney(total)} até ${fmtMoney(T.paid)}.` };
  } },
  hora:{ name:'Horas e relógio', desc:s => HORA_DESC[s - 1], text:true, quiz(step) {
    const Q = timeQuestion(step); return { skill:'hora', ...Q, key:Q.text.slice(0, 30) };
  } }
};
