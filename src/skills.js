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

export const EXTRA_SKILLS = {
  add:{ name:'Adição', desc:s => ADD_DESC[s - 1], quiz(step) { const [a, b] = addPair(step); return make('add', a, b, '+', a + b, addHint(a, b), 'mais'); } },
  sub:{ name:'Subtração', desc:s => SUB_DESC[s - 1], quiz(step) { const [a, b] = subPair(step); return make('sub', a, b, '−', a - b, subHint(a, b), 'menos'); } },
  mul:{ name:'Multiplicação', desc:s => MUL_DESC[s - 1], quiz(step) { const [a, b] = mulPair(step); return make('mul', a, b, '×', a * b, mulHint(a, b), 'vezes'); } }
};
