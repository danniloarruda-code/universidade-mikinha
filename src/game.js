import { loadLocal, saveLocal, toBackupCode, fromBackupCode } from './storage.js';

const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const wait = ms => new Promise(r => setTimeout(r, ms));
const today = (off = 0) => { const d = new Date(Date.now() - off * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const EMOJI = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
const DEBUG = location.hash === '#debug';
if (DEBUG) { window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16); window.cancelAnimationFrame = id => clearTimeout(id); }

/* ================= DATA ================= */
const SKILLS = { share:'Repartir', rem:'Sobras (resto)', group:'Fazer grupos', fact:'Tabuada', chave:'Conta na chave' };
const FRIENDS = [['🐸','Sapinho'],['🐰','Coelhinha'],['🦊','Raposinha'],['🐢','Tartaruga'],['🐒','Macaquinho'],['🦄','Unicórnio'],['🐱','Gatinha'],['🐧','Pinguim'],['🐨','Coalinha']];
const ISLANDS = [
  { id:'praia', name:'Praia das Conchas', icon:'🏝️', genre:'Aventura', skill:'Repartir', game:'praia', ctrl:['⬅⬆⬇➡ ou WASD: andar','Clique no chão: andar até lá','Espaço ou clique na casinha: entregar'],
    intro:'Pegue todas as conchinhas da praia e entregue o mesmo tanto para cada casinha. Cuidado com os caranguejos!' },
  { id:'caverna', name:'Caverna das Sobras', icon:'🕯️', genre:'Parkour', skill:'Sobras', game:'caverna', ctrl:['⬅ ➡: correr','⬆ ou Espaço: pular'],
    intro:'Corra e pule pela caverna! Para abrir cada portão, pule embaixo do bloco com a resposta certa.' },
  { id:'torre', name:'Torre da Chave', icon:'🗝️', genre:'Enigma', skill:'Conta na chave', game:'torre', ctrl:['Clique nos números ou use o teclado'],
    intro:'O Mago da Torre só abre a porta para quem sabe montar a conta na chave. Cada conta certa acende um andar!' },
  { id:'arena', name:'Arena das Gemas', icon:'⚔️', genre:'Batalha', skill:'Tudo misturado', game:'arena', ctrl:['⬅⬆⬇➡ ou WASD: andar','Clique no robô: atirar','Espaço: atirar no robô mais perto'],
    intro:'Acerte o robô que tem a conta certa e pegue as gemas. Junte 10 gemas antes do tempo acabar!' },
  { id:'vila', name:'Lanchonete da Vila', icon:'🍕', genre:'Tycoon', skill:'Repartir e embalar', game:'vila', ctrl:['Clique no amigo para servir','Clique no doce do prato para devolver'],
    intro:'Você é a dona da lanchonete! Sirva pratos iguais para os amigos e embale as encomendas antes que eles percam a paciência. Com as moedas, melhore a lanchonete!' },
  { id:'floresta', name:'Templo da Floresta', icon:'🌳', genre:'Enigma', skill:'Fazer grupos', game:'floresta', ctrl:['Arraste o cristal até o altar','Ou clique no cristal e depois no altar','Clique no altar para tirar um cristal'],
    intro:'O templo antigo só se abre quando os altares brilham. Cada altar precisa do número certo de cristais. Nas salas das portas, escolha a porta com a resposta certa!' },
  { id:'castelo', name:'Castelo do Dragão', icon:'🏰', genre:'Chefão', skill:'Desafio final', game:'castelo', ctrl:['⬅⬆⬇➡ ou WASD: andar','Clique no chão: andar até lá','Encoste na bola com a resposta certa'],
    intro:'A batalha final! Desvie do fogo do Dragão Guloso. Quando ele cansar, encoste na bola com a resposta certa para acertá-lo. Acerte 6 vezes para ele virar seu amigo!' }
];
const ITEMS = {
  outfit: { rosa:{n:'Vestido rosa',dress:'#ff7eb6',trim:'#ffd1e6',head:'crown'}, tunica:{n:'Túnica de aventureira',dress:'#3a9d4a',trim:'#a7e08a',head:'cap',sword:true},
            ninja:{n:'Roupa de ninja',dress:'#2f2b45',trim:'#e0384a',head:'band'}, armadura:{n:'Armadura brilhante',dress:'#aeb9cc',trim:'#f4bd2a',head:'helm',sword:true},
            estrelado:{n:'Vestido estrelado',dress:'#283a8c',trim:'#f4bd2a',head:'crown',stars:true}, mar:{n:'Vestido do mar',dress:'#22b3b0',trim:'#bff3ef',head:'shell',secret:true},
            dragona:{n:'Fantasia de dragão',dress:'#3fae5a',trim:'#f4bd2a',head:'horns',tail:true,special:true} },
  hat: { nenhum:{n:'Sem chapéu'}, bone:{n:'Boné'}, pirata:{n:'Chapéu de pirata'}, mago:{n:'Chapéu de mago'}, coroa:{n:'Coroinha dourada',secret:true} },
  trail: { semrastro:{n:'Sem rastro'}, brilho:{n:'Rastro de brilho'}, coracoes:{n:'Rastro de corações'}, arcoiris:{n:'Rastro arco-íris'} },
  emote: { pulinho:{n:'Pulinho'}, giro:{n:'Giro'}, estrela:{n:'Chuva de estrelas'}, danca:{n:'Dancinha'} }
};
const CATS = [['outfit','👗 Roupas da princesa'],['hat','🎩 Chapéus do Bluu'],['trail','✨ Rastros'],['emote','💃 Dancinhas']];
const catOf = id => Object.keys(ITEMS).find(c => ITEMS[c][id]);
const SHOP = { ninja:60, estrelado:120, bone:30, pirata:45, coracoes:50, giro:40, danca:70 };
const ROAD = [{t:10,coins:30},{t:25,item:'tunica'},{t:40,coins:50},{t:55,item:'mago'},{t:70,item:'brilho'},{t:90,coins:80},{t:110,item:'armadura'},{t:130,item:'estrela'},{t:155,coins:120},{t:185,item:'arcoiris'},{t:220,coins:200}];
const SECRETS = ['mar','coroa'];

/* ================= SAVE ================= */
const fresh = () => ({ v:2, unlocked:1, trophies:0, coins:0, owned:['rosa','nenhum','semrastro','pulinho'],
  equip:{ outfit:'rosa', hat:'nenhum', trail:'semrastro', emote:'pulinho' }, road:[], plays:{},
  math:Object.fromEntries(Object.keys(SKILLS).map(k => [k, { step:1, win:[] }])), game:{ step:1, win:[] },
  stats:{ days:{}, skill:{}, miss:{} }, vila:{ cash:0, up:[] }, sound:true, voice:false, teacher:false });
let save = fresh();
function adopt(s) {
  if (!s || s.v !== 2) return false;
  save = Object.assign(fresh(), s); for (const k in SKILLS) if (!save.math[k]) save.math[k] = { step:1, win:[] };
  return true;
}
adopt(loadLocal());
const persist = () => saveLocal(save);
/* a newer copy arrived (cloud sync or backup restore): swap it in and refresh what is on screen */
window.addEventListener('mikinha:replace', e => {
  if (!adopt(e.detail)) return;
  if (!$('#sMap').hidden) renderMap(); else if (!$('#sTeacher').hidden) renderTeacher(); else if (!$('#sShop').hidden) renderShop();
});

/* ================= SOUND + VOICE ================= */
let actx = null;
function tone(f, dur, type = 'triangle', when = 0, vol = .13) {
  if (!save.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + when;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + .02);
  } catch (e) {}
}
const sfx = {
  pop: () => tone(rand(620, 760), .09), back: () => tone(380, .1, 'sine'), jump: () => tone(520, .12, 'square', 0, .05),
  ding: () => { tone(880, .12); tone(1320, .2, 'triangle', .08); }, hmm: () => { tone(330, .16, 'sine'); tone(262, .26, 'sine', .14); },
  hit: () => { tone(160, .18, 'square', 0, .07); }, shoot: () => tone(980, .07, 'square', 0, .04),
  yay: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', i * .09)),
  level: () => [392, 523, 659, 784, 659, 1047].forEach((f, i) => tone(f, .2, 'triangle', i * .1)),
  secret: () => [587, 740, 880, 1175, 988, 1397].forEach((f, i) => tone(f, .18, 'sine', i * .11, .12))
};
let lastSay = '';
function speak(t) {
  try {
    const u = new SpeechSynthesisUtterance(t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/÷/g, ' dividido por ').replace(/×/g, ' vezes ').replace(/−/g, ' menos '));
    u.lang = 'pt-BR'; u.rate = .98; u.pitch = 1.15; speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
function say(t) {
  lastSay = t; const el = $('#say'); if (el) el.textContent = t;
  const b = $('#bluuIc'); if (b) { b.classList.remove('happy'); void b.offsetWidth; b.classList.add('happy'); }
  if (save.voice && !$('#sGame').hidden) speak(t);
}

/* ================= UI HELPERS ================= */
function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; $('#toasts').append(el); setTimeout(() => el.remove(), 3000); }
const CF = ['var(--gold)', 'var(--coral)', 'var(--bluu)', 'var(--leaf)', 'var(--white)'];
function confetti(n = 60) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'cf'; s.style.left = Math.random() * 100 + '%'; s.style.background = CF[i % CF.length];
    s.style.animationDelay = Math.random() * .6 + 's'; s.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
    $('#confetti').append(s); setTimeout(() => s.remove(), 3300);
  }
}
let ovStop = null;
function overlay(html) { $('#ovCard').innerHTML = html; $('#overlay').hidden = false; const b = $('#ovCard button'); if (b) b.focus(); }
function closeOverlay() { $('#overlay').hidden = true; if (ovStop) { ovStop(); ovStop = null; } }

/* ================= ADAPTIVE ENGINE ================= */
function record(skill, ok, { fast = false, hint = false, key = '' } = {}) {
  const st = save.stats, d = today();
  st.days[d] = st.days[d] || { a:0, c:0, s:0 }; st.days[d].a++; if (ok) st.days[d].c++;
  st.skill[skill] = st.skill[skill] || { a:0, c:0 }; st.skill[skill].a++; if (ok) st.skill[skill].c++;
  if (!ok && key) st.miss[key] = (st.miss[key] || 0) + 1;
  if (ok && RUN) RUN.first++;
  if (RUN) RUN.total++;
  const S = save.math[skill];
  S.win.push(!ok ? 0 : hint ? .5 : fast ? 1.2 : 1); if (S.win.length > 5) S.win.shift();
  if (S.win.length === 5) {
    const sum = S.win.reduce((a, b) => a + b, 0);
    if (sum >= 4 && S.step < 10) { S.step++; S.win = []; setTimeout(() => { toast('🔥 Desafio subiu!'); sfx.secret(); }, 400); }
    else if (sum <= 2 && S.step > 1) { S.step--; S.win = []; }
  }
  persist();
}
function gameEvent(ok) {
  const G = save.game; G.win.push(ok ? 1 : 0); if (G.win.length > 5) G.win.shift();
  if (G.win.length === 5) {
    const sum = G.win.reduce((a, b) => a + b, 0);
    if (sum >= 4 && G.step < 10) { G.step++; G.win = []; } else if (sum <= 2 && G.step > 1) { G.step--; G.win = []; }
  }
  persist();
}
const mstep = s => save.math[s].step, gstep = () => save.game.step;

/* problem generators: P = divisor (friends / group size), k = quotient, r = remainder, T = dividend */
const TAB = [null, [[2,2],[2,3]], [[2,3],[2,3]], [[2,3],[2,4]], [[3,4],[2,4]], [[3,4],[2,5]], [[3,5],[3,5]], [[4,5],[3,6]], [[4,6],[3,7]], [[5,7],[3,8]], [[6,9],[4,9]]];
function gen(skill, step, { maxT = 99, maxP = 9 } = {}) {
  for (let s = step; s >= 1; s--) {
    for (let i = 0; i < 40; i++) {
      let P = rand(...TAB[s][0]), k = rand(...TAB[s][1]);
      if (skill === 'fact') { const top = Math.min(9, 2 + s); P = rand(2, top); k = rand(2, top); }
      if (skill === 'rem' && s <= 2) P = rand(2, 3);
      const r = skill === 'rem' ? rand(1, P - 1) : 0, T = P * k + r;
      if (T <= maxT && P <= maxP) return { P, k, r, T, skill };
    }
  }
  return skill === 'rem' ? { P:2, k:2, r:1, T:5, skill } : { P:2, k:2, r:0, T:4, skill };
}
function makeChoices(ans, step) {
  const n = step >= 3 ? 4 : 3, set = new Set([ans]);
  for (const v of shuffle([ans - 1, ans + 1, ans + 2, ans - 2, ans + 3, ans + 4].filter(v => v >= 0))) { if (set.size >= n) break; set.add(v); }
  return shuffle([...set]);
}

/* ================= LONG DIVISION (método da chave) ================= */
function longDiv(N, d) {
  const dg = String(N).split('').map(Number); let i = 0, part = dg[0];
  while (part < d && i < dg.length - 1) { i++; part = part * 10 + dg[i]; }
  const steps = []; let q = '';
  for (;;) {
    const qd = Math.floor(part / d), prod = qd * d, rem = part - prod;
    steps.push({ part, qd, prod, rem, endIdx:i }); q += qd;
    if (i === dg.length - 1) break;
    i++; part = rem * 10 + dg[i];
  }
  return { q:+q, r:steps[steps.length - 1].rem, steps };
}
function chaveModel(N, d) {
  const L = longDiv(N, d), dg = String(N).split(''), nd = dg.length, cells = [];
  dg.forEach((v, j) => cells.push({ r:0, c:j + 1, v, k:'dvd', g:'dvd' }));
  L.steps.forEach((s, i) => {
    const end = s.endIdx + 1, last = i === L.steps.length - 1, ps = String(s.prod), rs = String(s.rem);
    cells.push({ r:1 + 2 * i, c:end - ps.length, v:'−', k:'minus ul', g:'p' + i });
    [...ps].forEach((ch, j) => cells.push({ r:1 + 2 * i, c:end - ps.length + 1 + j, v:ch, k:'prod ul', g:'p' + i }));
    [...rs].forEach((ch, j) => cells.push({ r:2 + 2 * i, c:end - rs.length + 1 + j, v:ch, k:last ? 'res' : 'rem', g:'r' + i }));
    if (!last) cells.push({ r:2 + 2 * i, c:end + 1, v:dg[s.endIdx + 1], k:'down', g:'d' + i });
  });
  return { N, d, L, cells, nd };
}
/* filled: Set of visible groups (null = all); active: group being asked; hl: part to flash (dvd|dvs|quo|res) */
function chaveHTML(m, { filled = null, active = null, hl = null, size = '', anim = false } = {}) {
  const vis = g => !filled || filled.has(g);
  let h = `<div class="chave ${size} ${anim ? 'anim' : ''}" style="grid-template-columns:repeat(${m.nd + 1},auto) .5em auto" role="img" aria-label="Conta na chave: ${m.N} dividido por ${m.d}">`, n = 0;
  for (const c of m.cells) {
    const on = vis(c.g), act = active === c.g, isHl = (hl === 'dvd' && c.k === 'dvd') || (hl === 'res' && c.k === 'res');
    h += `<span class="cc ${c.k} ${act ? 'act' : on ? '' : 'hid'} ${isHl ? 'hl' : ''}" style="grid-row:${c.r + 1};grid-column:${c.c + 1};animation-delay:${anim ? (n++) * .08 : 0}s">${on ? c.v : act ? (c.k.startsWith('minus') ? '−' : '?') : '0'}</span>`;
  }
  h += `<span class="cc dvs bracket ${hl === 'dvs' ? 'hl' : ''}" style="grid-row:1;grid-column:${m.nd + 3}">${m.d}</span>`;
  let qt = ''; m.L.steps.forEach((s, i) => { qt += vis('q' + i) ? s.qd : active === 'q' + i ? '?' : '<i class="ph">_</i>'; });
  const qAct = active && active[0] === 'q';
  h += `<span class="cc quo ${qAct ? 'act' : ''} ${hl === 'quo' ? 'hl' : ''}" style="grid-row:2;grid-column:${m.nd + 3}">${qt}</span></div>`;
  return h;
}
const legendHTML = m => `<div class="legend"><span class="dvd">dividendo ${m.N}</span><span class="dvs">divisor ${m.d}</span><span class="quo">quociente ${m.L.q}</span><span class="res">resto ${m.L.r}</span></div>`;
const PARTS = { dvd:['Dividendo','é o total, o que vai ser dividido'], dvs:['Divisor','é em quantas partes a gente divide'], quo:['Quociente','é quanto cada um ganha'], res:['Resto','é o que sobra'] };

/* ================= ASK PANEL ================= */
let activeAsk = null;
function ask({ q, a, skill, key = '', hint = '', reveal = '', choices = null }) {
  return new Promise(res => {
    const box = $('#askBox'), step = mstep(skill), useChoices = choices ?? step <= 3;
    const opts = useChoices ? makeChoices(a, step) : null, tried = new Set(), t0 = performance.now();
    let tries = 0, usedHint = false, val = '';
    function draw() {
      box.hidden = false;
      box.innerHTML = `<div class="askq">${q}</div>` + (useChoices
        ? `<div class="choices">${opts.map(v => `<button class="choice ${tried.has(v) ? 'no' : ''} ${tries >= 2 && v === a ? 'glow' : ''}" data-v="${v}">${v}</button>`).join('')}</div>`
        : `<div class="pad"><div class="padv" aria-live="polite">${val || (tries >= 2 ? `<span class="ghost">${a}</span>` : '&nbsp;')}</div><div class="keys">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-n="${n}">${n}</button>`).join('')}<button data-n="del" aria-label="Apagar">⌫</button><button data-n="0">0</button><button data-n="ok" class="ok">OK</button></div></div>`)
        + (hint ? `<button class="btn alt small" data-h="1">💡 Dica do Bluu</button>` : '');
    }
    function submit(v) {
      if (v === a) { if (tries === 0) record(skill, true, { fast:performance.now() - t0 < 7000, hint:usedHint, key }); sfx.ding(); close(); res({ first:tries === 0 }); return; }
      if (tries === 0) record(skill, false, { key });
      tries++; tried.add(v); val = ''; sfx.hmm(); say(tries >= 2 ? reveal : `Quase! ${hint}`); draw();
    }
    function onClick(e) {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.h) { usedHint = true; say(hint); return; }
      if (b.dataset.v !== undefined) return submit(+b.dataset.v);
      const n = b.dataset.n; if (n === undefined) return;
      if (n === 'del') val = val.slice(0, -1); else if (n === 'ok') { if (val !== '') return submit(+val); } else if (val.length < 3) val += n;
      draw();
    }
    function close() { box.removeEventListener('click', onClick); box.hidden = true; box.innerHTML = ''; activeAsk = null; }
    box.addEventListener('click', onClick);
    activeAsk = { key(e) {
      if (useChoices) { const i = '1234'.indexOf(e.key); if (i >= 0 && opts[i] !== undefined && !tried.has(opts[i])) { submit(opts[i]); return true; } return false; }
      if (/^[0-9]$/.test(e.key)) { if (val.length < 3) val += e.key; draw(); return true; }
      if (e.key === 'Backspace') { val = val.slice(0, -1); draw(); return true; }
      if (e.key === 'Enter' && val !== '') { e.preventDefault(); submit(+val); return true; }
      return false;
    }, hint() { usedHint = true; say(hint); } };
    say(q); draw();
  });
}
/* asks the name of a flashing part of the bracket; renders chips into container */
function askLabel(container, part, key) {
  return new Promise(res => {
    let tries = 0; const tried = new Set();
    function draw() {
      container.innerHTML = `<div class="askq">Como se chama a parte que está piscando?</div><div class="chips">${['dvd','dvs','quo','res'].map(p => `<button class="chip ${p} ${tried.has(p) ? 'no' : ''} ${tries >= 2 && p === part ? 'glow' : ''}" data-p="${p}">${PARTS[p][0]}</button>`).join('')}</div>`;
    }
    function onClick(e) {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const p = b.dataset.p;
      if (p === part) { if (tries === 0) record('chave', true, { key }); sfx.ding(); say(`Isso! O ${PARTS[p][0].toLowerCase()} ${PARTS[p][1]}.`); container.removeEventListener('click', onClick); container.innerHTML = ''; activeAsk = prevAsk; res(tries === 0); return; }
      if (tries === 0) record('chave', false, { key });
      tries++; tried.add(p); sfx.hmm();
      say(tries >= 2 ? `É o ${PARTS[part][0].toLowerCase()}! Ele ${PARTS[part][1]}.` : `Não é o ${PARTS[p][0].toLowerCase()}. Dica: a parte que pisca ${PARTS[part][1]}.`);
      draw();
    }
    const prevAsk = activeAsk;
    activeAsk = activeAsk || { key:() => false, hint() { say(`Dica: a parte que pisca ${PARTS[part][1]}.`); } };
    container.addEventListener('click', onClick); draw();
    say('Como se chama a parte que está piscando?');
  });
}
/* shows the finished bracket for a round, sometimes with a quick naming question */
async function chaveCard(N, d, sentence) {
  const m = chaveModel(N, d), box = $('#askBox');
  activeAsk = { key:() => false, hint() {} };
  const bonus = Math.random() < .35, part = pick(['dvd','dvs','quo','res']);
  box.hidden = false;
  box.innerHTML = `<div class="askq">Olha como fica na chave:</div><div id="ccv">${chaveHTML(m, { size:'big', anim:true, hl:bonus ? part : null })}</div><div id="ccq"></div><div id="ccl"></div><div class="sentence">${sentence}</div><button class="btn gold" id="ccGo" ${bonus ? 'hidden' : ''}>Continuar ➜</button>`;
  say(`Na chave: ${N} dividido por ${d} dá ${m.L.q}${m.L.r ? ` e sobra ${m.L.r}` : ''}.`);
  if (bonus) {
    await wait(1600);
    await askLabel($('#ccq'), part, `nome:${PARTS[part][0]}`);
    $('#ccv').innerHTML = chaveHTML(m, { size:'big' });
  }
  $('#ccl').innerHTML = legendHTML(m);
  const go = $('#ccGo'); go.hidden = false; go.focus();
  await new Promise(r => { go.onclick = r; activeAsk = { key:e => { if (e.key === 'Enter') { r(); return true; } return false; }, hint() {} }; });
  box.hidden = true; box.innerHTML = ''; activeAsk = null;
}
function askButton(label) {
  return new Promise(res => {
    const box = $('#askBox'); box.hidden = false;
    box.innerHTML = `<button class="btn gold" id="abtn">${label}</button>`;
    const b = $('#abtn'); b.focus();
    const done = () => { box.hidden = true; box.innerHTML = ''; activeAsk = null; res(); };
    b.onclick = done; activeAsk = { key:e => { if (e.key === 'Enter') { done(); return true; } return false; }, hint() {} };
  });
}

/* ================= DRAWING: HERO, BLUU, PARTICLES ================= */
function drawHero(c, x, y, s, look, t, moving, face = 1) {
  const O = ITEMS.outfit[look.outfit] || ITEMS.outfit.rosa;
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 0, 14 * s, 5 * s, 0, 0, 7); c.fill();
  c.translate(0, moving ? -Math.abs(Math.sin(t * 12)) * 3 * s : 0); c.scale(s * face, s);
  c.fillStyle = '#3b2a20'; c.fillRect(-7, -9, 5, 9); c.fillRect(2, -9, 5, 9);
  c.fillStyle = O.dress; c.beginPath(); c.moveTo(-15, -7); c.lineTo(15, -7); c.lineTo(8, -31); c.lineTo(-8, -31); c.closePath(); c.fill();
  c.fillStyle = O.trim; c.fillRect(-15, -10, 30, 3); c.fillRect(-8, -31, 16, 3);
  if (O.stars) { c.fillStyle = '#f4bd2a'; [[-6,-18],[5,-22],[0,-13],[8,-14]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1.6, 0, 7); c.fill(); }); }
  c.fillStyle = '#d99a6c'; c.fillRect(-13, -29, 4, 12); c.fillRect(9, -29, 4, 12);
  if (O.sword) { c.strokeStyle = '#e8eef6'; c.lineWidth = 3; c.beginPath(); c.moveTo(13, -19); c.lineTo(23, -37); c.stroke(); c.fillStyle = '#8a5a2b'; c.fillRect(9, -21, 8, 3); }
  c.fillStyle = '#3b2416'; c.beginPath(); c.arc(0, -41, 11.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(-11, -36, 5, 9, .4, 0, 7); c.fill();
  c.fillStyle = '#d99a6c'; c.beginPath(); c.arc(1, -40, 9.5, 0, 7); c.fill();
  c.fillStyle = '#3b2416'; c.beginPath(); c.arc(1, -44, 9.5, Math.PI, 0); c.fill();
  c.fillStyle = '#1b1730'; c.fillRect(-2, -41, 2.6, 3.6); c.fillRect(4, -41, 2.6, 3.6);
  c.fillStyle = '#f08aa8'; c.fillRect(-4, -36.5, 3, 1.6); c.fillRect(6, -36.5, 3, 1.6);
  if (O.head === 'crown' || O.head === 'shell') {
    c.fillStyle = O.head === 'shell' ? '#bff3ef' : '#f4bd2a';
    c.beginPath(); c.moveTo(-7, -51); c.lineTo(-7, -58); c.lineTo(-3, -54); c.lineTo(1, -60); c.lineTo(5, -54); c.lineTo(9, -58); c.lineTo(9, -51); c.closePath(); c.fill();
  } else if (O.head === 'cap') {
    c.fillStyle = '#3a9d4a'; c.beginPath(); c.moveTo(-10, -48); c.lineTo(11, -48); c.lineTo(-18, -38); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-10, -48); c.lineTo(11, -48); c.lineTo(1, -58); c.closePath(); c.fill();
  } else if (O.head === 'band') {
    c.fillStyle = '#e0384a'; c.fillRect(-9, -47, 20, 4); c.fillRect(-15, -46, 7, 2.5); c.fillRect(-16, -43, 6, 2.5);
  } else if (O.head === 'helm') {
    c.fillStyle = '#d6dde8'; c.beginPath(); c.arc(1, -45, 10.5, Math.PI, 0); c.fill(); c.fillStyle = '#e0384a'; c.fillRect(-1, -60, 4, 8);
  } else if (O.head === 'horns') {
    c.fillStyle = '#3fae5a'; c.beginPath(); c.arc(1, -46, 10, Math.PI, 0); c.fill();
    c.fillStyle = '#f4bd2a'; c.beginPath(); c.moveTo(-7, -52); c.lineTo(-4, -62); c.lineTo(-1, -52); c.closePath(); c.moveTo(3, -52); c.lineTo(6, -62); c.lineTo(9, -52); c.closePath(); c.fill();
  }
  if (O.tail) { c.fillStyle = '#3fae5a'; c.beginPath(); c.moveTo(-12, -14); c.quadraticCurveTo(-30, -10, -26, -2); c.lineTo(-12, -8); c.closePath(); c.fill(); }
  c.restore();
}
function drawBluu(c, x, y, s, hat, t) {
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, 0, 11 * s, 4 * s, 0, 0, 7); c.fill();
  c.translate(0, Math.sin(t * 6) * 2 * s); c.scale(s, s);
  [[-1],[1]].forEach(([sd]) => {
    c.fillStyle = '#4a86f0'; c.beginPath(); c.ellipse(13 * sd, -24, 6, 11, .5 * sd, 0, 7); c.fill();
    c.fillStyle = '#f7a6c4'; c.beginPath(); c.ellipse(13 * sd, -24, 3, 7, .5 * sd, 0, 7); c.fill();
  });
  c.fillStyle = '#4a86f0'; c.beginPath(); c.arc(0, -15, 13, 0, 7); c.fill();
  c.fillStyle = '#9cc3ff'; c.beginPath(); c.ellipse(0, -10, 8, 6, 0, 0, 7); c.fill();
  c.fillStyle = '#1b1730'; c.beginPath(); c.ellipse(-5, -18, 3.2, 4, 0, 0, 7); c.ellipse(5, -18, 3.2, 4, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.fillRect(-4.6, -20.5, 1.6, 1.6); c.fillRect(5.4, -20.5, 1.6, 1.6);
  c.fillStyle = '#24306a'; c.beginPath(); c.ellipse(0, -13, 2.4, 1.6, 0, 0, 7); c.fill();
  if (hat === 'nenhum' || !hat) { c.strokeStyle = '#2f5fc4'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -28); c.lineTo(0, -34); c.stroke(); c.fillStyle = '#f4bd2a'; c.beginPath(); c.arc(0, -35, 2.4, 0, 7); c.fill(); }
  else if (hat === 'bone') { c.fillStyle = '#e0384a'; c.beginPath(); c.arc(0, -26, 9, Math.PI, 0); c.fill(); c.fillRect(0, -27, 14, 3); }
  else if (hat === 'pirata') { c.fillStyle = '#1b1730'; c.beginPath(); c.moveTo(-14, -25); c.quadraticCurveTo(0, -42, 14, -25); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -30, 2, 0, 7); c.fill(); }
  else if (hat === 'mago') { c.fillStyle = '#6a3fc1'; c.beginPath(); c.moveTo(-11, -25); c.lineTo(11, -25); c.lineTo(2, -48); c.closePath(); c.fill(); c.fillStyle = '#f4bd2a'; c.beginPath(); c.arc(1, -35, 2.4, 0, 7); c.fill(); }
  else if (hat === 'coroa') { c.fillStyle = '#f4bd2a'; c.beginPath(); c.moveTo(-8, -26); c.lineTo(-8, -33); c.lineTo(-4, -29); c.lineTo(0, -35); c.lineTo(4, -29); c.lineTo(8, -33); c.lineTo(8, -26); c.closePath(); c.fill(); }
  c.restore();
}
function trailEmit(parts, x, y, kind, t) {
  if (kind === 'semrastro' || !kind || Math.random() < .4) return;
  parts.push({ x:x + rand(-6, 6), y:y - rand(0, 8), vx:rand(-20, 20), vy:-rand(10, 40), life:.8, kind, hue:(t * 200) % 360 });
}
function partsDraw(c, parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
    c.globalAlpha = clamp(p.life / .8, 0, 1);
    if (p.kind === 'brilho') { c.fillStyle = '#f4bd2a'; c.fillRect(p.x - 2, p.y - 2, 4, 4); }
    else if (p.kind === 'coracoes') { c.fillStyle = '#ff6b9a'; c.font = '12px sans-serif'; c.fillText('♥', p.x, p.y); }
    else if (p.kind === 'arcoiris') { c.fillStyle = `hsl(${p.hue},90%,60%)`; c.beginPath(); c.arc(p.x, p.y, 3.5, 0, 7); c.fill(); }
    else if (p.kind === 'burst') { c.fillStyle = p.color || '#f4bd2a'; c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
}
function burst(parts, x, y, color, n = 12) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = rand(60, 160); parts.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:.6, kind:'burst', color }); } }
function emoji(c, e, x, y, size) { c.font = `${size}px ${EMOJI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, x, y); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }

/* animated hero scene used on title, shop and victory */
function heroScene(cv, { emote = null } = {}) {
  const c = cv.getContext('2d'); let id, t0 = performance.now(); const parts = [];
  const frame = now => {
    const t = (now - t0) / 1000, W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    const em = emote || null; let hx = W * .42, hy = H * .86, sc = H / 95, face = 1, extra = 0;
    if (em === 'pulinho') hy -= Math.abs(Math.sin(t * 5)) * 22;
    if (em === 'giro') face = Math.cos(t * 7) >= 0 ? 1 : -1;
    if (em === 'danca') { extra = Math.sin(t * 8) * .25; }
    if (em === 'estrela' && Math.random() < .5) parts.push({ x:hx + rand(-40, 40), y:hy - rand(40, 90), vx:0, vy:30, life:.8, kind:'brilho' });
    c.save(); c.translate(hx, hy); c.rotate(extra); drawHero(c, 0, 0, sc, save.equip, t, em === 'danca', face); c.restore();
    drawBluu(c, W * .75, H * .86, sc * .9, save.equip.hat, t);
    if (!em) trailEmit(parts, hx - 10, hy - 4, save.equip.trail, t);
    partsDraw(c, parts, 1 / 60);
    id = requestAnimationFrame(frame);
  };
  id = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(id);
}
function bluuIcon() { const cv = $('#bluuIc'), c = cv.getContext('2d'); c.clearRect(0, 0, 56, 56); drawBluu(c, 28, 54, 1.25, save.equip.hat, 0); }

/* ================= PROGRESS: trophies, coins, items ================= */
function grant(id, why) {
  if (save.owned.includes(id)) return false;
  save.owned.push(id); persist(); setTimeout(() => { toast(`🎁 ${why}: ${ITEMS[catOf(id)][id].n}!`); sfx.secret(); }, 600); return true;
}
function addTrophies(n) {
  save.trophies += n;
  for (const m of ROAD) if (save.trophies >= m.t && !save.road.includes(m.t)) {
    save.road.push(m.t);
    if (m.coins) { save.coins += m.coins; setTimeout(() => toast(`🏆 Prêmio da trilha: 🪙 ${m.coins}`), 900); }
    if (m.item) grant(m.item, 'Prêmio da trilha');
  }
  persist();
}
function openChest() {
  const left = SECRETS.filter(s => !save.owned.includes(s));
  sfx.secret(); confetti(30);
  if (left.length) grant(pick(left), 'Baú secreto');
  else { save.coins += 30; toast('🧰 Baú secreto: 🪙 30!'); persist(); }
  if (RUN) RUN.secret = true;
}
const secretAvailable = () => Math.random() < .35;

/* ================= INPUT ================= */
const K = { left:0, right:0, up:0, down:0, act:0 }; let edgeAct = false, edgeJump = false;
const KEYMAP = { ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right', ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down', ' ':'act' };
addEventListener('keydown', e => {
  if (!$('#overlay').hidden) return;
  if (activeAsk && activeAsk.key(e)) return;
  const k = KEYMAP[e.key]; if (!k || $('#sGame').hidden) return;
  e.preventDefault();
  if (!K[k]) { if (k === 'act') edgeAct = true; if (k === 'act' || k === 'up') edgeJump = true; }
  K[k] = 1;
});
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) K[k] = 0; });
addEventListener('blur', () => { for (const k in K) K[k] = 0; });
function consumeEdges() { const r = { act:edgeAct, jump:edgeJump }; edgeAct = edgeJump = false; return r; }
function setTouch(kind) {
  const el = $('#touch');
  const b = (k, l, cls = '') => `<button class="tbtn ${cls}" data-k="${k}" tabindex="-1" aria-label="${l}">${l}</button>`;
  if (kind === 'pad') el.innerHTML = `<div class="dpad"><span></span>${b('up','⬆')}<span></span>${b('left','⬅')}${b('down','⬇')}${b('right','➡')}</div><div class="grp">${b('act','✋','big')}</div>`;
  else if (kind === 'side') el.innerHTML = `<div class="grp">${b('left','⬅')}${b('right','➡')}</div><div class="grp">${b('up','⤒','big')}</div>`;
  else el.innerHTML = '';
  el.querySelectorAll('[data-k]').forEach(btn => {
    const k = btn.dataset.k;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); if (!K[k]) { if (k === 'act') edgeAct = true; if (k === 'act' || k === 'up') edgeJump = true; } K[k] = 1; btn.setPointerCapture?.(e.pointerId); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev => btn.addEventListener(ev, () => { K[k] = 0; }));
  });
}
function makeCanvas(W, H) { const box = $('#stageBox'); box.innerHTML = ''; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'cv'; box.append(cv); return { cv, c:cv.getContext('2d') }; }
function canvasPoint(cv, e) { const r = cv.getBoundingClientRect(); return { x:(e.clientX - r.left) * cv.width / r.width, y:(e.clientY - r.top) * cv.height / r.height }; }
function loop(fn) { let last = performance.now(), id; const step = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; fn(dt, now / 1000); id = requestAnimationFrame(step); }; id = requestAnimationFrame(step); return () => cancelAnimationFrame(id); }
const blocked = () => !$('#overlay').hidden || !!activeAsk;

/* ================= SCREENS ================= */
let RUN = null, CUR = null, titleStop = null, shopStop = null;
function show(id) {
  ['sTitle','sMap','sShop','sRoad','sTeacher','sGame'].forEach(s => $('#' + s).hidden = s !== id);
  if (shopStop && id !== 'sShop') { shopStop(); shopStop = null; }
  if (titleStop && id !== 'sTitle') { titleStop(); titleStop = null; }
  try { if (id !== 'sGame') speechSynthesis.cancel(); } catch (e) {}
  scrollTo(0, 0);
}
function renderMap() {
  show('sMap');
  $('#mTro').textContent = `🏆 ${save.trophies}`; $('#mCoin').textContent = `🪙 ${save.coins}`;
  const nextM = ROAD.find(m => !save.road.includes(m.t)), prevT = [...ROAD].reverse().find(m => save.road.includes(m.t))?.t || 0;
  $('#roadMini').innerHTML = nextM
    ? `<div style="flex:1;min-width:200px"><div class="muted">Próximo prêmio da trilha em ${nextM.t} 🏆: ${nextM.coins ? '🪙 ' + nextM.coins : ITEMS[catOf(nextM.item)][nextM.item].n}</div><div class="roadbar"><i style="width:${clamp((save.trophies - prevT) / (nextM.t - prevT) * 100, 0, 100)}%"></i></div></div>`
    : `<div class="muted">Você completou a Trilha de Troféus! 👑</div>`;
  const box = $('#islands'); box.innerHTML = '';
  ISLANDS.forEach((I, i) => {
    const open = !I.soon && (i < save.unlocked || save.teacher), plays = save.plays[I.id] || 0;
    const b = document.createElement('button');
    b.className = 'island' + (I.soon ? ' soon' : '') + (open && i === save.unlocked - 1 && !plays ? ' next' : '');
    b.disabled = !open; if (open) b.dataset.island = i;
    b.innerHTML = `<span class="num">${I.soon ? 'Em breve' : 'Ilha ' + (i + 1)}</span><span class="ic">${I.soon ? '🚧' : open ? I.icon : '🔒'}</span><span class="nm">${I.name}</span><span class="gn">${I.genre}</span><span class="sk">${I.soon ? 'Em construção' : I.skill}</span>${plays ? `<span class="muted">Jogou ${plays}×</span>` : ''}`;
    box.append(b);
  });
}
function renderShop(cat = 'outfit') {
  show('sShop'); $('#sCoin').textContent = `🪙 ${save.coins}`;
  $('#cats').innerHTML = CATS.map(([k, n]) => `<button class="btn alt small ${k === cat ? 'on' : ''}" data-cat="${k}">${n}</button>`).join('');
  const box = $('#shopItems'); box.innerHTML = '';
  for (const id in ITEMS[cat]) {
    const it = ITEMS[cat][id], own = save.owned.includes(id), eq = save.equip[cat] === id, road = ROAD.find(m => m.item === id);
    let action;
    if (eq) action = `<span class="pill">✔ Usando</span>`;
    else if (own) action = `<button class="btn small" data-equip="${id}">Usar</button>`;
    else if (SHOP[id]) action = `<button class="btn gold small" data-buy="${id}" ${save.coins < SHOP[id] ? 'disabled' : ''}>🪙 ${SHOP[id]}</button>`;
    else if (road) action = `<span class="why">Na Trilha: ${road.t} 🏆</span>`;
    else if (it.special) action = `<span class="why">🐉 Prêmio por vencer o Dragão</span>`;
    else action = `<span class="why">❔ Segredo: ache um baú escondido</span>`;
    const d = document.createElement('div'); d.className = 'item' + (eq ? ' eq' : '');
    d.innerHTML = `<canvas width="96" height="96" aria-hidden="true"></canvas><b>${own || !it.secret ? it.n : '???'}</b>${action}`;
    box.append(d);
    const c = d.querySelector('canvas').getContext('2d'), look = Object.assign({}, save.equip, { [cat]:id });
    if (!own && it.secret) { c.fillStyle = '#f5dc9a'; c.fillRect(0, 0, 96, 96); emoji(c, '❔', 48, 50, 44); }
    else if (cat === 'outfit') drawHero(c, 48, 90, 1.25, look, 0, false);
    else if (cat === 'hat') drawBluu(c, 48, 88, 1.8, id, 0);
    else if (cat === 'trail') { const ps = []; for (let i = 0; i < 40; i++) trailEmit(ps, 18 + i * 1.6, 70 - Math.sin(i / 5) * 10, id, i / 20); ps.forEach(p => { p.life = .8; p.vx = p.vy = 0; }); partsDraw(c, ps, 0); drawHero(c, 70, 90, .9, save.equip, 0, false); }
    else emoji(c, { pulinho:'🦘', giro:'🌀', estrela:'🌟', danca:'💃' }[id], 48, 50, 48);
  }
  box.dataset.cat = cat;
  if (shopStop) shopStop();
  shopStop = heroScene($('#shopCv'));
}
function renderRoad() {
  show('sRoad'); $('#rTro').textContent = `🏆 ${save.trophies}`;
  const nextT = ROAD.find(m => !save.road.includes(m.t))?.t;
  $('#roadList').innerHTML = ROAD.map(m => {
    const got = save.road.includes(m.t), rw = m.coins ? `🪙 ${m.coins} moedas` : `🎁 ${ITEMS[catOf(m.item)][m.item].n}`;
    return `<div class="node ${got ? 'got' : ''} ${m.t === nextT ? 'next' : ''}"><span class="t">${m.t} 🏆</span><span>${rw}</span><span>${got ? '✔' : m.t === nextT ? `faltam ${m.t - save.trophies}` : '🔒'}</span></div>`;
  }).join('');
}
const STEP_DESC = {
  chave: ['Arrastar os nomes (dividendo, divisor, quociente, resto)','Completa o quociente, com doces para contar, sem resto','Completa quociente e resto, com doces','Escreve também a subtração, com doces','Sem doces, com a tabuada de apoio','Sem apoio, divisor até 9','Dividendo de 2 algarismos e quociente de 2 algarismos, sem resto, com tabuada','Igual ao 7, com resto','Com "sobra" nas dezenas (ex.: 52 ÷ 4), com tabuada escondida','Igual ao 9, divisores até 6'],
};
function stepRange(skill, s) {
  if (skill === 'chave') return STEP_DESC.chave[s - 1];
  if (skill === 'fact') return `Tabuadas de 2 até ${Math.min(9, 2 + s)}`;
  const [P, k] = TAB[s], tot = `${P[0] * k[0]}–${P[1] * k[1] + (skill === 'rem' ? P[1] - 1 : 0)}`;
  return `Divisor ${P[0]}–${P[1]}, quociente ${k[0]}–${k[1]}${skill === 'rem' ? ', com resto' : ''} (total ${tot})${s <= 3 ? '. Respostas com 3–4 opções' : '. Ela digita a resposta'}`;
}
function renderTeacher() {
  show('sTeacher');
  const st = save.stats;
  $('#repSkills').innerHTML = Object.entries(SKILLS).map(([k, n]) => {
    const s = st.skill[k] || { a:0, c:0 }, pct = s.a ? Math.round(s.c / s.a * 100) : 0;
    return `<span>${n} · degrau ${save.math[k].step}</span><span>${s.a ? `${pct}% de ${s.a}` : 'ainda não jogou'}</span><div class="meter"><i style="width:${pct}%"></i></div>`;
  }).join('') + `<span>Habilidade no jogo (pular, desviar)</span><span>degrau ${save.game.step}</span>`;
  const days = [...Array(7)].map((_, i) => today(6 - i)), mx = Math.max(1, ...days.map(d => st.days[d]?.a || 0));
  $('#repDays').innerHTML = days.map(d => { const x = st.days[d] || { a:0, c:0 }; return `<div class="b"><span>${x.a ? Math.round(x.c / x.a * 100) + '%' : ''}</span><div style="display:flex;gap:2px;align-items:flex-end;height:100px;width:100%;justify-content:center"><i style="height:${x.a / mx * 100}%"></i><i class="ok" style="height:${x.c / mx * 100}%"></i></div><span>${d.slice(8)}/${d.slice(5, 7)}</span></div>`; }).join('');
  const secs = Object.values(st.days).reduce((a, d) => a + (d.s || 0), 0), tsec = st.days[today()]?.s || 0;
  $('#repTime').textContent = `Tempo jogando: hoje ${Math.round(tsec / 60)} min · total ${Math.round(secs / 60)} min`;
  const miss = Object.entries(st.miss).sort((a, b) => b[1] - a[1]).slice(0, 8);
  $('#repMiss').innerHTML = miss.length ? miss.map(([k, n]) => `<div><b>${k.replace('nome:', 'Nome da parte: ')}</b> · errou ${n}×</div>`).join('') : '<span class="muted">Nenhum erro registrado ainda.</span>';
  $('#selects').innerHTML = Object.entries(SKILLS).map(([k, n]) => `<label class="sel" for="st-${k}">${n}<select id="st-${k}" data-step="${k}">${[...Array(10)].map((_, i) => `<option value="${i + 1}" ${save.math[k].step === i + 1 ? 'selected' : ''}>Degrau ${i + 1}</option>`).join('')}</select></label>`).join('')
    + `<label class="sel" for="st-game">Habilidade no jogo<select id="st-game" data-step="game">${[...Array(10)].map((_, i) => `<option value="${i + 1}" ${save.game.step === i + 1 ? 'selected' : ''}>Degrau ${i + 1}</option>`).join('')}</select></label>`;
  $('#unlockBtn').textContent = `Liberar todas as ilhas: ${save.teacher ? 'sim' : 'não'}`;
  let h = `<tr><th>Degrau</th>${Object.values(SKILLS).map(n => `<th>${n}</th>`).join('')}</tr>`;
  for (let s = 1; s <= 10; s++) h += `<tr><td><b>${s}</b></td>${Object.keys(SKILLS).map(k => `<td>${stepRange(k, s)}</td>`).join('')}</tr>`;
  $('#stepTable').innerHTML = h;
}

/* ================= GAME RUNNER ================= */
function enterIsland(i) {
  const I = ISLANDS[i];
  show('sGame'); bluuIcon(); refreshToggles();
  $('#gName').textContent = `${I.icon} ${I.name}`; $('#gInfo').textContent = ''; $('#stageBox').innerHTML = ''; $('#askBox').hidden = true; $('#touch').innerHTML = '';
  $('#say').textContent = '';
  overlay(`<div class="big">${I.icon}</div><h2>${I.name}</h2><p>${I.intro}</p><div class="ctrls">${I.ctrl.map(c => `<span>${c}</span>`).join('')}</div><button class="btn gold" data-act="begin" data-i="${i}">Jogar ▶</button>`);
  if (save.voice) speak(I.intro);
}
function beginIsland(i) {
  closeOverlay();
  const I = ISLANDS[i];
  RUN = { island:I, idx:i, first:0, total:0, secret:false, gameOk:0 };
  CUR = GAMES[I.game]();
}
function stopGame() { if (CUR) { CUR.stop(); CUR = null; } activeAsk = null; $('#askBox').hidden = true; for (const k in K) K[k] = 0; }
function finishPhase(extraText = '') {
  const R = RUN, I = R.island; stopGame();
  const tro = 6 + Math.min(8, R.first) + (R.secret ? 3 : 0), coins = 10 + R.first * 2;
  save.plays[I.id] = (save.plays[I.id] || 0) + 1;
  save.unlocked = Math.max(save.unlocked, R.idx + 2);
  save.coins += coins; addTrophies(tro); persist();
  sfx.level(); confetti(90);
  const nextI = ISLANDS[R.idx + 1], newly = nextI && !nextI.soon && save.plays[I.id] === 1;
  overlay(`<canvas id="emoteCv" width="260" height="170" style="width:260px;max-width:100%;height:auto" aria-hidden="true"></canvas>
    <h2>Fase completa!</h2><p>${extraText}</p>
    <div class="row" style="justify-content:center"><span class="pill">🏆 +${tro}</span><span class="pill">🪙 +${coins}</span>${R.secret ? '<span class="pill">🧰 Baú secreto!</span>' : ''}</div>
    <p class="muted">Acertou de primeira ${R.first} de ${R.total}.</p>
    ${newly ? `<p>Nova ilha aberta: <b>${nextI.icon} ${nextI.name}</b></p>` : ''}
    <div class="row" style="justify-content:center"><button class="btn gold" data-act="again" data-i="${R.idx}">Jogar de novo</button><button class="btn alt" data-act="map">Mapa 🗺️</button></div>`);
  ovStop = heroScene($('#emoteCv'), { emote:save.equip.emote });
  RUN = null;
}
function refreshToggles() { $('#tSound').textContent = save.sound ? '🎵' : '🔇'; $('#tVoice').textContent = save.voice ? '🗣️' : '🤐'; $('#tSound').setAttribute('aria-label', save.sound ? 'Som ligado' : 'Som desligado'); $('#tVoice').setAttribute('aria-label', save.voice ? 'Voz ligada' : 'Voz desligada'); }
setInterval(() => {
  if ($('#sGame').hidden || document.visibilityState !== 'visible') return;
  const d = today(); save.stats.days[d] = save.stats.days[d] || { a:0, c:0, s:0 }; save.stats.days[d].s = (save.stats.days[d].s || 0) + 1;
  if (save.stats.days[d].s % 15 === 0) persist();
}, 1000);

const GAMES = {};

/* ================= PRAIA: top-down adventure, sharing ================= */
GAMES.praia = function () {
  const W = 960, H = 560, { cv, c } = makeCanvas(W, H); setTouch('pad');
  const HOUSES = [[820,150],[820,320],[650,480],[430,480],[210,480],[640,150]];
  const TREES = [[300,170],[470,300],[140,360],[600,300],[350,400]];
  let round = 0; const ROUNDS = 3;
  const p = { x:100, y:200, face:1, moving:false, inv:0, invT:0, tx:null, ty:null };
  const bl = { x:70, y:200 };
  let shells = [], houses = [], crabs = [], bushes = [], chest = null, parts = [], R, state = 'play', since = 0, alive = true, tt = 0;
  const free = (x, y) => TREES.every(([a, b]) => Math.hypot(a - x, b - y) > 44) && houses.every(h => Math.abs(h.x - x) > 70 || Math.abs(h.y - y) > 60) && Math.hypot(p.x - x, p.y - y) > 70;
  function setup() {
    R = gen('share', mstep('share'), { maxT:24, maxP:6 });
    const fr = shuffle(FRIENDS.slice());
    houses = HOUSES.slice(0, R.P).map(([x, y], i) => ({ x, y, f:fr[i], n:0, inside:false }));
    p.x = 100; p.y = 200; p.inv = 0; p.tx = null;
    shells = []; let guard = 0;
    while (shells.length < R.T && guard++ < 2000) { const x = rand(50, 700), y = rand(90, 420); if (free(x, y) && shells.every(s => Math.hypot(s.x - x, s.y - y) > 34)) shells.push({ x, y }); }
    const g = gstep(), nc = g <= 2 ? 0 : g <= 5 ? 1 : g <= 8 ? 2 : 3;
    crabs = [...Array(nc)].map(() => ({ x:rand(400, 700), y:rand(150, 420), tx:rand(80, 700), ty:rand(100, 440), sp:40 + g * 9 }));
    bushes = [[390,120],[250,300],[540,400]].map(([x, y]) => ({ x, y, secret:false, shake:0 }));
    if (secretAvailable() && round === rand(0, ROUNDS - 1)) pick(bushes).secret = true;
    chest = null; state = 'play';
    $('#gInfo').textContent = `Rodada ${round + 1} de ${ROUNDS}`;
    say(`${R.T} conchinhas para ${R.P} amigos. Pegue todas e entregue o mesmo tanto para cada casinha!`);
  }
  function blockedAt(x, y) {
    if (x < 24 || x > W - 24 || y < 76 || y > H - 14) return true;
    if (TREES.some(([a, b]) => Math.hypot(a - x, b - y) < 22)) return true;
    return houses.some(h => x > h.x - 56 && x < h.x + 56 && y > h.y - 44 && y < h.y + 24);
  }
  function deliver(h) {
    if (p.inv <= 0) return;
    p.inv--; h.n++; sfx.pop(); burst(parts, h.x, h.y - 20, '#ef7d16', 8);
    if (++since >= 4) { gameEvent(true); since = 0; }
  }
  async function check() {
    state = 'ask';
    const ns = houses.map(h => h.n), mx = Math.max(...ns), mn = Math.min(...ns);
    if (mx !== mn) {
      record('share', false, { key:`${R.T}÷${R.P}` });
      const hi = houses[ns.indexOf(mx)], lo = houses[ns.indexOf(mn)];
      say(`Hmm... ${hi.f[1]} ficou com ${mx} e ${lo.f[1]} ficou com ${mn}. Não ficou justo! As conchinhas voltaram para a areia. Tente dar uma para cada, em ordem.`);
      sfx.hmm();
      houses.forEach(h => { for (let i = 0; i < h.n; i++) { let x, y, g = 0; do { x = h.x + rand(-140, 140); y = h.y - rand(70, 200); } while ((!free(x, y) || blockedAt(x, y)) && g++ < 50); shells.push({ x:clamp(x, 50, 900), y:clamp(y, 90, 440) }); } h.n = 0; });
      state = 'play'; return;
    }
    record('share', true, { key:`${R.T}÷${R.P}` });
    sfx.yay(); confetti(30);
    await ask({ q:`Quantas conchinhas cada amigo ganhou?`, a:R.k, skill:'share', key:`${R.T}÷${R.P}`, hint:'Olhe uma casinha só e conte as conchinhas dela.', reveal:`Olha a casinha do ${houses[0].f[1]}: tem ${R.k}. Cada amigo ganhou ${R.k}!` });
    if (!alive) return;
    await chaveCard(R.T, R.P, `${R.T} conchinhas repartidas entre ${R.P} amigos: cada um ganhou ${R.k}.`);
    if (!alive) return;
    round++;
    if (round < ROUNDS) setup(); else finishPhase('Todas as casinhas da praia ganharam conchinhas iguais! 🐚');
  }
  cv.addEventListener('pointerdown', e => {
    if (blocked() || state !== 'play') return;
    const q = canvasPoint(cv, e);
    const h = houses.find(h => Math.abs(q.x - h.x) < 60 && Math.abs(q.y - h.y) < 60);
    if (h && Math.hypot(p.x - h.x, p.y - (h.y + 46)) < 120) { deliver(h); return; }
    p.tx = q.x; p.ty = q.y;
  });
  const stopLoop = loop((dt, t) => {
    tt = t; const ed = consumeEdges();
    if (!blocked() && state === 'play') {
      let dx = K.right - K.left, dy = K.down - K.up;
      if (dx || dy) p.tx = null; else if (p.tx !== null) { const vx = p.tx - p.x, vy = p.ty - p.y, l = Math.hypot(vx, vy); if (l < 6) p.tx = null; else { dx = vx / l; dy = vy / l; } }
      const l = Math.hypot(dx, dy) || 1, sp = 230; p.moving = !!(dx || dy);
      if (p.moving) {
        const nx = p.x + dx / l * sp * dt, ny = p.y + dy / l * sp * dt;
        if (!blockedAt(nx, p.y)) p.x = nx; else if (p.tx !== null && blockedAt(p.x, ny)) p.tx = null;
        if (!blockedAt(p.x, ny)) p.y = ny;
        if (dx) p.face = dx > 0 ? 1 : -1;
        trailEmit(parts, p.x, p.y, save.equip.trail, t);
      }
      bl.x += (p.x - 40 * p.face - bl.x) * dt * 4; bl.y += (p.y - 6 - bl.y) * dt * 4;
      for (let i = shells.length - 1; i >= 0; i--) if (Math.hypot(shells[i].x - p.x, shells[i].y - p.y) < 26) { shells.splice(i, 1); p.inv++; sfx.pop(); }
      for (const h of houses) {
        const inZ = Math.hypot(p.x - h.x, p.y - (h.y + 46)) < 42;
        if (inZ && !h.inside) deliver(h);
        if (inZ && ed.act) deliver(h);
        h.inside = inZ;
      }
      p.invT -= dt;
      for (const cr of crabs) {
        const vx = cr.tx - cr.x, vy = cr.ty - cr.y, l2 = Math.hypot(vx, vy);
        if (l2 < 8) { cr.tx = rand(80, 720); cr.ty = rand(100, 440); } else { cr.x += vx / l2 * cr.sp * dt; cr.y += vy / l2 * cr.sp * dt; }
        if (Math.hypot(cr.x - p.x, cr.y - p.y) < 28 && p.invT <= 0) {
          p.invT = 1.5; sfx.hit(); gameEvent(false); since = 0;
          const ax = p.x - cr.x, ay = p.y - cr.y, al = Math.hypot(ax, ay) || 1;
          for (let k = 0; k < 8; k++) { const nx = p.x + ax / al * 10, ny = p.y + ay / al * 10; if (!blockedAt(nx, ny)) { p.x = nx; p.y = ny; } }
          if (p.inv > 0) { p.inv--; shells.push({ x:clamp(p.x + rand(-80, 80), 50, 700), y:clamp(p.y + rand(-80, 80), 90, 440) }); say('Ai! O caranguejo derrubou uma conchinha!'); }
        }
      }
      for (const b of bushes) { if (Math.hypot(b.x - p.x, b.y - p.y) < 34) { if (b.shake <= 0) b.shake = .4; if (b.secret) { b.secret = false; chest = { x:b.x + 40, y:b.y + 10 }; sfx.secret(); say('Uau! Um baú escondido no arbusto! Vá até ele!'); } } b.shake -= dt; }
      if (chest && Math.hypot(chest.x - p.x, chest.y - p.y) < 30) { chest = null; openChest(); }
      if (!shells.length && p.inv === 0 && houses.some(h => h.n)) check();
    }
    // draw
    c.fillStyle = '#f3dca0'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e9cf8c'; for (let i = 0; i < 40; i++) { c.fillRect((i * 173) % W, 80 + (i * 97) % 460, 4, 3); }
    c.fillStyle = '#1aa3b0'; c.fillRect(0, 0, W, 62);
    c.strokeStyle = '#bff3ef'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= W; x += 10) c.lineTo(x, 62 + Math.sin(x / 30 + t * 2) * 4); c.stroke();
    for (const b of bushes) { const sx = b.shake > 0 ? Math.sin(t * 60) * 3 : 0; c.fillStyle = '#4caf50'; c.beginPath(); c.arc(b.x - 12 + sx, b.y, 16, 0, 7); c.arc(b.x + 12 + sx, b.y, 16, 0, 7); c.arc(b.x + sx, b.y - 12, 18, 0, 7); c.fill(); }
    if (chest) emoji(c, '🧰', chest.x, chest.y + Math.sin(t * 6) * 3, 34);
    for (const h of houses) {
      c.fillStyle = '#fff6e5'; rrect(c, h.x - 50, h.y - 34, 100, 58, 8); c.fill();
      c.fillStyle = '#2f6fdc'; c.beginPath(); c.moveTo(h.x - 62, h.y - 30); c.lineTo(h.x, h.y - 74); c.lineTo(h.x + 62, h.y - 30); c.closePath(); c.fill();
      c.fillStyle = '#8a5a2b'; rrect(c, h.x - 13, h.y - 6, 26, 30, 4); c.fill();
      emoji(c, h.f[0], h.x, h.y - 46, 30);
      const near = Math.hypot(p.x - h.x, p.y - (h.y + 46)) < 120;
      c.strokeStyle = near ? '#2f9e55' : 'rgba(0,0,0,.15)'; c.setLineDash([6, 5]); c.lineWidth = 3; c.beginPath(); c.arc(h.x, h.y + 46, 30, 0, 7); c.stroke(); c.setLineDash([]);
      for (let i = 0; i < h.n; i++) emoji(c, '🐚', h.x - 42 + (i % 6) * 17, h.y - 22 + Math.floor(i / 6) * 15, 14);
      if (mstep('share') <= 3) { c.fillStyle = '#2f6fdc'; rrect(c, h.x + 34, h.y - 30, 30, 26, 8); c.fill(); c.fillStyle = '#fff'; c.font = "22px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(h.n, h.x + 49, h.y - 16); }
    }
    for (const [x, y] of TREES) { c.fillStyle = '#9b6b3c'; c.fillRect(x - 5, y - 40, 10, 44); c.fillStyle = '#2e9c56'; for (let a = 0; a < 5; a++) { c.beginPath(); c.ellipse(x + Math.cos(a * 1.25) * 18, y - 44 + Math.sin(a * 1.25) * 8, 22, 8, a * 1.25, 0, 7); c.fill(); } }
    for (const s of shells) emoji(c, '🐚', s.x, s.y + Math.sin(t * 3 + s.x) * 2, 26);
    for (const cr of crabs) emoji(c, '🦀', cr.x, cr.y, 34);
    drawBluu(c, bl.x, bl.y, 1, save.equip.hat, t);
    if (p.invT <= 0 || Math.floor(t * 10) % 2) drawHero(c, p.x, p.y, 1, save.equip, t, p.moving, p.face);
    partsDraw(c, parts, 1 / 60);
    c.fillStyle = 'rgba(255,255,255,.9)'; rrect(c, 12, 10, 150, 42, 12); c.fill();
    emoji(c, '🐚', 38, 31, 24); c.fillStyle = '#ef7d16'; c.font = "26px 'Lilita One',sans-serif"; c.textAlign = 'left'; c.fillText(`× ${p.inv}`, 58, 33);
    c.fillStyle = 'rgba(255,255,255,.9)'; rrect(c, W - 260, 10, 248, 42, 12); c.fill();
    c.fillStyle = '#2a2140'; c.font = "20px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.fillText(`Na areia: ${shells.length} 🐚`, W - 136, 32);
  });
  setup();
  if (DEBUG) window.__g = { p, get shells() { return shells; }, get houses() { return houses; }, get R() { return R; }, get state() { return state; } };
  return { stop() { alive = false; stopLoop(); }, hint() { say(state === 'play' ? 'Pegue as conchinhas e depois vá passando em cada casinha: uma para cada, em ordem, como quando a gente distribui cartas!' : lastSay); } };
};

/* ================= CAVERNA: platformer obby, remainders ================= */
GAMES.caverna = function () {
  const W = 960, H = 540, GY = 450, { cv, c } = makeCanvas(W, H); setTouch('side');
  const g = gstep();
  const solids = [], spikes = [], blocks = [], gates = [], cps = [], movers = [];
  let x = 0, chest = null, alive = true;
  const seg = (sx, w, y = GY) => solids.push({ x:sx, y, w, h:H - y + 60, kind:'rock' });
  seg(0, 520); cps.push(80); x = 520;
  for (let gi = 0; gi < 4; gi++) {
    const nObs = 1 + (g >= 4) + (g >= 7);
    for (let o = 0; o < nObs; o++) {
      const type = g >= 5 && o === nObs - 1 ? 'mover' : g >= 3 && Math.random() < .5 ? 'spike' : 'gap';
      if (type === 'gap') { x += 70 + g * 7; seg(x, 240); cps.push(x + 40); x += 240; }
      else if (type === 'spike') { seg(x, 340); spikes.push({ x:x + 150, y:GY - 18, w:46 + g * 3, h:18 }); x += 340; }
      else { const gw = 270 + g * 8; const m = { x:x + 40, y:GY - 6, w:110, h:18, x0:x + 40, amp:(gw - 160) / 2, ph:Math.random() * 6, sp:1.1 + g * .08, kind:'mover', dx:0 }; movers.push(m); solids.push(m); x += gw; seg(x, 240); cps.push(x + 40); x += 240; }
    }
    if (gi === 1 && secretAvailable()) { solids.push({ x:x - 200, y:GY - 110, w:80, h:16, kind:'plat' }); solids.push({ x:x - 110, y:GY - 220, w:100, h:16, kind:'plat' }); chest = { x:x - 60, y:GY - 245 }; }
    let R = gen('rem', mstep('rem'));
    for (let k = 0; k < 8 && gates.some(q => q.R.T === R.T && q.R.P === R.P); k++) R = gen('rem', mstep('rem'));
    const type = gi % 2 ? 'q' : 'r', ans = type === 'r' ? R.r : R.k;
    seg(x, 820); cps.push(x + 40);
    const opts = makeChoices(ans, mstep('rem'));
    const gate = { x:x + 760, wall:{ x:x + 760, y:GY - 220, w:34, h:220, kind:'gate' }, sign:x + 90, R, type, ans, open:false, tries:0, t0:0, seen:false, blocks:[] };
    opts.forEach((v, j) => { const b = { x:x + 300 + j * 110, y:GY - 158, w:62, h:56, kind:'block', val:v, dead:false, ok:false, gate, bump:0 }; blocks.push(b); solids.push(b); gate.blocks.push(b); });
    solids.push(gate.wall); gates.push(gate); x += 820;
  }
  seg(x, 520); const flagX = x + 300, LW = x + 520;
  const p = { x:80, y:GY - 46, w:28, h:46, vx:0, vy:0, on:false, face:1, coy:0, buf:0, dead:0 };
  let cam = 0, parts = [], cp = 80, curGate = null, since = 0, mini = null, tt = 0;
  $('#gInfo').textContent = 'Portões: 0 de 4';
  say('Corra para a direita e pule! Para abrir cada portão, pule embaixo do bloco com a resposta certa.');
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const isSolid = s => !(s.kind === 'gate' && gates.find(gg => gg.wall === s)?.open) && !(s.kind === 'block' && s.dead);
  function respawn() { p.x = cp; p.y = GY - 120; p.vx = p.vy = 0; p.dead = 1; sfx.hit(); gameEvent(false); since = 0; say(pick(['Opa! Tente de novo.', 'Quase! Vamos de novo.', 'Sem problema, volta aqui!'])); }
  function hitBlock(b) {
    const G = b.gate; if (G.open || b.dead || b.ok) return; b.bump = .15;
    if (b.val === G.ans) {
      b.ok = true; G.open = true; if (G.tries === 0) record('rem', true, { fast:performance.now() - G.t0 < 8000, key:`${G.R.T}÷${G.R.P}` });
      sfx.yay(); burst(parts, b.x + 31, b.y, '#239a4c', 18);
      const done = gates.filter(q => q.open).length; $('#gInfo').textContent = `Portões: ${done} de 4`;
      say(`Isso! ${G.R.T} ÷ ${G.R.P} = ${G.R.k} e sobra ${G.R.r}. O portão abriu!`);
      showMini(G.R);
    } else {
      if (G.tries === 0) record('rem', false, { key:`${G.R.T}÷${G.R.P}` });
      G.tries++; b.dead = true; sfx.hmm(); burst(parts, b.x + 31, b.y + 28, '#7a6a99', 14);
      say(G.tries >= 2 ? `A resposta é ${G.ans}! O bloco certo está brilhando.` : hintFor(G));
    }
  }
  function hintFor(G) { const { T, P, k, r } = G.R; return G.type === 'r' ? `Quase! Faça grupos de ${P} com os ${T} pontinhos da placa. O que não forma grupo é o que sobra.` : `Quase! Quantos grupos completos de ${P} cabem no ${T}? ${P} × ${k} = ${P * k}.`; }
  function showMini(R) {
    if (mini) mini.remove();
    mini = document.createElement('div'); mini.className = 'miniChave';
    mini.innerHTML = chaveHTML(chaveModel(R.T, R.P), { size:'small', anim:true }); $('#stageBox').append(mini);
    const el = mini; setTimeout(() => el.remove(), 4500);
  }
  const stopLoop = loop((dt, t) => {
    tt = t; const ed = consumeEdges();
    for (const m of movers) { const nx = m.x0 + m.amp + Math.sin(t * m.sp + m.ph) * m.amp; m.dx = nx - m.x; m.x = nx; }
    if (!blocked()) {
      p.dead = Math.max(0, p.dead - dt);
      const dir = K.right - K.left; p.vx = dir * 270; if (dir) p.face = dir;
      if (ed.jump) p.buf = .14; p.buf -= dt; p.coy -= dt;
      if (p.buf > 0 && p.coy > 0) { p.vy = -720; p.buf = 0; p.coy = 0; sfx.jump(); }
      p.vy = Math.min(p.vy + 1900 * dt, 1100);
      if (p.on && p.on.kind === 'mover') p.x += p.on.dx;
      p.x += p.vx * dt; p.x = clamp(p.x, 0, LW - p.w);
      for (const s of solids) if (isSolid(s) && overlaps(p, s)) { if (p.vx > 0 || (p.on && p.on.dx > 0)) p.x = s.x - p.w; else p.x = s.x + s.w; }
      p.y += p.vy * dt; p.on = null;
      for (const s of solids) if (isSolid(s) && overlaps(p, s)) {
        if (p.vy > 0) { p.y = s.y - p.h; p.vy = 0; p.on = s; p.coy = .1; }
        else if (p.vy < 0) { p.y = s.y + s.h; p.vy = 0; if (s.kind === 'block') hitBlock(s); }
      }
      if (p.y > H + 60) respawn();
      if (spikes.some(s => overlaps(p, { x:s.x + 6, y:s.y + 6, w:s.w - 12, h:s.h }))) respawn();
      for (const cx of cps) if (p.x > cx && cx > cp && p.on) { cp = cx; if (++since >= 1) { gameEvent(true); since = 0; } }
      curGate = gates.find(G => !G.open && p.x > G.sign - 40 && p.x < G.x + 40) || null;
      if (curGate && !curGate.seen) { curGate.seen = true; curGate.t0 = performance.now(); say(qText(curGate)); }
      if (chest && Math.hypot(p.x + 14 - chest.x, p.y + 20 - chest.y) < 40) { chest = null; openChest(); }
      if (p.x > flagX) { alive = false; stopLoop(); finishPhase('Você atravessou a Caverna das Sobras! 🕯️'); return; }
      if (p.vx && p.on) trailEmit(parts, p.x + 14, p.y + p.h, save.equip.trail, t);
    }
    cam += (clamp(p.x - 320, 0, LW - W) - cam) * Math.min(1, dt * 8);
    // draw
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#231a36'); gr.addColorStop(1, '#3b2a55'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.save(); c.translate(-cam * .4, 0); c.fillStyle = '#2e2346'; for (let i = 0; i < LW / 70; i++) { const sx = i * 140; c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx + 30, 40 + (i % 3) * 25); c.lineTo(sx + 60, 0); c.fill(); } c.restore();
    c.fillStyle = '#ff7a1a'; c.fillRect(0, H - 30, W, 30); c.fillStyle = '#ffb347'; for (let i = 0; i < 20; i++) { c.beginPath(); c.arc((i * 61 + t * 30) % W, H - 30 + Math.sin(t * 3 + i) * 3, 9, Math.PI, 0); c.fill(); }
    c.save(); c.translate(-Math.round(cam), 0);
    for (const s of solids) {
      if (!isSolid(s) && s.kind !== 'block') continue;
      if (s.kind === 'rock') { c.fillStyle = '#5b4a7a'; c.fillRect(s.x, s.y, s.w, s.h); c.fillStyle = '#8f7bb3'; c.fillRect(s.x, s.y, s.w, 10); }
      else if (s.kind === 'plat' || s.kind === 'mover') { c.fillStyle = s.kind === 'mover' ? '#7bc8d6' : '#8f7bb3'; rrect(c, s.x, s.y, s.w, s.h, 6); c.fill(); }
      else if (s.kind === 'gate') { c.fillStyle = '#7a4b23'; c.fillRect(s.x, s.y, s.w, s.h); c.fillStyle = '#c8920f'; for (let yy = s.y + 20; yy < s.y + s.h; yy += 40) c.fillRect(s.x - 4, yy, s.w + 8, 6); }
      else if (s.kind === 'block') {
        const G = s.gate; if (s.dead) continue;
        const by = s.y - (s.bump > 0 ? 8 : 0); s.bump -= 1 / 60;
        const glow = G.tries >= 2 && s.val === G.ans && !G.open;
        c.fillStyle = s.ok ? '#239a4c' : glow ? '#ffe27a' : '#f4bd2a'; rrect(c, s.x, by, s.w, s.h, 8); c.fill();
        c.strokeStyle = '#c8920f'; c.lineWidth = 3; c.stroke();
        c.fillStyle = s.ok ? '#fff' : '#2a2140'; c.font = "34px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s.val, s.x + s.w / 2, by + s.h / 2 + 2);
      }
    }
    for (const s of spikes) { c.fillStyle = '#d6dde8'; for (let sx = s.x; sx < s.x + s.w; sx += 12) { c.beginPath(); c.moveTo(sx, s.y + s.h); c.lineTo(sx + 6, s.y); c.lineTo(sx + 12, s.y + s.h); c.fill(); } }
    for (const G of gates) drawSign(G, t);
    if (chest) emoji(c, '🧰', chest.x, chest.y + Math.sin(t * 5) * 3, 34);
    c.fillStyle = '#d6dde8'; c.fillRect(flagX, GY - 150, 6, 150); c.fillStyle = '#ff6b5b'; c.beginPath(); c.moveTo(flagX + 6, GY - 150); c.lineTo(flagX + 60, GY - 130); c.lineTo(flagX + 6, GY - 110); c.fill();
    drawBluu(c, p.x - 26 * p.face + 14, p.y + p.h, .9, save.equip.hat, t);
    if (!p.dead || Math.floor(t * 12) % 2) drawHero(c, p.x + 14, p.y + p.h, 1, save.equip, t, !!p.vx && !!p.on, p.face);
    partsDraw(c, parts, 1 / 60);
    c.restore();
    if (curGate) {
      const { T, P } = curGate.R, txt = curGate.type === 'r' ? 'quanto SOBRA?' : 'quanto cada um ganha?';
      c.fillStyle = 'rgba(253,240,200,.95)'; rrect(c, W / 2 - 250, 12, 500, 56, 14); c.fill();
      c.font = "30px 'Lilita One',sans-serif"; c.textBaseline = 'middle'; c.textAlign = 'left';
      const parts2 = [[`${T}`, '#ef7d16'], [' ÷ ', '#2a2140'], [`${P}`, '#2f6fdc'], ['  →  ' + txt, curGate.type === 'r' ? '#e0384a' : '#239a4c']];
      let tw = parts2.reduce((a, [s]) => a + c.measureText(s).width, 0), xx = W / 2 - tw / 2;
      for (const [s, col] of parts2) { c.fillStyle = col; c.fillText(s, xx, 41); xx += c.measureText(s).width; }
    }
  });
  function qText(G) { const { T, P } = G.R; return G.type === 'r' ? `${T} dividido por ${P}. Quanto sobra? Pule embaixo do bloco certo!` : `${T} dividido por ${P}. Quanto cada um ganha? Pule embaixo do bloco certo!`; }
  function drawSign(G, t) {
    const { T, P } = G.R, sx = G.sign, sy = GY - 210, w = 170, rows = Math.ceil(T / P), showDots = mstep('rem') <= 5;
    c.fillStyle = '#7a4b23'; c.fillRect(sx + 20, sy + 120, 8, 90); c.fillRect(sx + w - 28, sy + 120, 8, 90);
    c.fillStyle = '#fdf0c8'; rrect(c, sx, sy, w, 130, 12); c.fill(); c.strokeStyle = '#cf8d3c'; c.lineWidth = 4; c.stroke();
    c.font = "28px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ef7d16'; c.fillText(T, sx + w / 2 - 34, sy + 24); c.fillStyle = '#2a2140'; c.fillText('÷', sx + w / 2, sy + 24); c.fillStyle = '#2f6fdc'; c.fillText(P, sx + w / 2 + 34, sy + 24);
    if (showDots) {
      const ds = Math.min(12, 90 / rows);
      for (let i = 0; i < T; i++) { const rr = Math.floor(i / P), cc = i % P, left = rr === rows - 1 && T % P !== 0; c.fillStyle = left ? '#e0384a' : '#ef7d16'; c.beginPath(); c.arc(sx + w / 2 - (P - 1) * 8 + cc * 16, sy + 50 + rr * ds, Math.min(5, ds / 2.4), 0, 7); c.fill(); }
    } else { c.font = "18px 'Nunito',sans-serif"; c.fillStyle = '#5d5070'; c.fillText(G.type === 'r' ? 'Quanto sobra?' : 'Quanto cada um?', sx + w / 2, sy + 80); }
  }
  if (DEBUG) window.__g = { p, gates, blocks, solids, get cp() { return cp; }, flagX };
  return { stop() { alive = false; stopLoop(); }, hint() { if (curGate) say(hintFor(curGate)); else say('Use as setas para correr e o Espaço para pular. Pule embaixo dos blocos para bater neles!'); } };
};

/* ================= TORRE: building the division bracket ================= */
function genChave(step) {
  for (let i = 0; i < 300; i++) {
    let d, q, r;
    if (step <= 6) {
      d = step <= 3 ? rand(2, 4) : step <= 5 ? rand(2, 6) : rand(3, 9);
      q = step <= 3 ? rand(2, 5) : step <= 5 ? rand(2, 7) : rand(3, 9);
      r = step === 2 ? 0 : step === 1 ? rand(0, d - 1) : Math.random() < .8 ? rand(1, d - 1) : 0;
      return chaveModel(d * q + r, d);
    }
    d = step <= 8 ? rand(2, 4) : rand(2, 6); q = rand(11, 49); r = step === 7 ? 0 : rand(0, d - 1);
    const N = d * q + r; if (N > 99) continue;
    const tens = Math.floor(N / 10); if (tens < d) continue;
    const L = longDiv(N, d); if (String(L.q).includes('0') || L.steps.length !== 2) continue;
    const regroup = tens % d !== 0;
    if (step <= 8 && regroup) continue; if (step >= 9 && !regroup) continue;
    return chaveModel(N, d);
  }
  return chaveModel(13, 4);
}
GAMES.torre = function () {
  setTouch(null);
  const box = $('#stageBox'); box.innerHTML = `<div class="torre"><div class="floors" id="tFloors"></div><div class="tcenter"><div id="tChave"></div><div id="tLabel"></div><div id="tLegend"></div></div><div class="scaf" id="tScaf"></div></div>`;
  let alive = true, n = 0, m = null, filled = null, step = 1;
  const TOTAL = mstep('chave') >= 7 ? 3 : 4;
  function floors() { $('#tFloors').innerHTML = [...Array(TOTAL)].map((_, i) => `<div class="floor ${i < n ? 'lit' : i === n ? 'cur' : ''}">${i < n ? '✨' : i === n ? '🧙' : ''}</div>`).join('') + '<div style="font-size:2rem">🗝️</div>'; $('#gInfo').textContent = `Andar ${Math.min(n + 1, TOTAL)} de ${TOTAL}`; }
  function render(active = null, hl = null) { $('#tChave').innerHTML = chaveHTML(m, { filled, active, hl, size:'big' }); }
  function scaffold() {
    const sc = $('#tScaf'), d = m.d;
    let h = '';
    if (step >= 2 && step <= 4) {
      const rows = Math.ceil(m.N / d);
      h += `<b>${m.N} docinhos em rodadas de ${d}</b><div class="candy">${[...Array(rows)].map((_, r) => { const k = Math.min(d, m.N - r * d); return `<div class="${k < d ? 'left' : ''}">${'🍬'.repeat(k)}</div>`; }).join('')}</div><span class="muted">Cada fileira é "um para cada". A fileira vermelha não completa: é o resto.</span>`;
    }
    if (step === 5 || step === 7 || step === 8) h += `<b>Tabuada do ${d}</b><div class="tab">${[...Array(9)].map((_, i) => `<span>${i + 1} × ${d} = ${(i + 1) * d}</span>`).join('')}</div>`;
    sc.innerHTML = h;
  }
  function tasks() {
    if (step === 1) return shuffle(['dvd','dvs','quo','res']).map(p => ({ type:'label', part:p }));
    const out = [], S = m.L.steps, d = m.d;
    S.forEach((s, i) => {
      const last = i === S.length - 1, mult = [...Array(9)].map((_, j) => (j + 1) * d), upto = mult.filter(v => v <= s.part + d).slice(0, 9);
      out.push({ type:'num', g:'q' + i, a:s.qd, q:`Quantas vezes o ${d} cabe no ${s.part}?`, hint:`Tabuada do ${d}: ${upto.join(', ')}... Qual é o maior que não passa do ${s.part}?`, reveal:`${s.qd} × ${d} = ${s.prod}. O ${d} cabe ${s.qd} vezes no ${s.part}!` });
      if (step >= 4) out.push({ type:'num', g:'p' + i, a:s.prod, q:`Quanto é ${s.qd} × ${d}? Esse número vai embaixo do ${s.part}.`, hint:s.qd <= 6 ? `Some o ${d}, ${s.qd} vezes: ${Array(s.qd).fill(d).join(' + ')}.` : `Olhe a tabuada do ${d}.`, reveal:`${s.qd} × ${d} = ${s.prod}.` });
      else out.push({ type:'auto', gs:['p' + i], say:`${s.qd} × ${d} = ${s.prod}. Escrevemos o ${s.prod} embaixo do ${s.part}.` });
      if (step >= 3) out.push({ type:'num', g:'r' + i, a:s.rem, q:`Quanto é ${s.part} − ${s.prod}?${last ? ' Esse vai ser o resto!' : ''}`, hint:`Comece no ${s.prod} e conte nos dedos até chegar no ${s.part}.`, reveal:`${s.part} − ${s.prod} = ${s.rem}.` });
      else out.push({ type:'auto', gs:['r' + i], say:`${s.part} − ${s.prod} = ${s.rem}. ${last ? 'Esse é o resto!' : ''}` });
      if (!last) out.push({ type:'down', g:'d' + i, digit:m.cells.find(cc => cc.g === 'd' + i).v });
    });
    return out;
  }
  async function conta() {
    step = mstep('chave'); m = genChave(step);
    filled = new Set(['dvd']); if (step === 1) filled = null;
    floors(); scaffold(); render(); $('#tLegend').innerHTML = ''; $('#tLabel').innerHTML = '';
    const key = `${m.N}÷${m.d}`;
    say(step === 1 ? 'Essa é uma conta na chave! Vamos aprender o nome de cada parte.' : `Vamos montar ${m.N} dividido por ${m.d} na chave!`);
    if (step > 1) await wait(1400);
    for (const T of tasks()) {
      if (!alive) return;
      if (T.type === 'label') { render(null, T.part); await askLabel($('#tLabel'), T.part, `nome:${PARTS[T.part][0]}`); }
      else if (T.type === 'num') { render(T.g); await ask({ q:T.q, a:T.a, skill:'chave', key, hint:T.hint, reveal:T.reveal, choices:step <= 2 }); filled.add(T.g); sfx.pop(); }
      else if (T.type === 'auto') { T.gs.forEach(gg => filled.add(gg)); render(); say(T.say); await wait(2200); }
      else if (T.type === 'down') { render(T.g); say(`Agora a gente baixa o ${T.digit}!`); await askButton(`⬇ Baixar o ${T.digit}`); filled.add(T.g); sfx.pop(); }
    }
    if (!alive) return;
    filled = null; render(); $('#tLabel').innerHTML = ''; $('#tLegend').innerHTML = legendHTML(m);
    n++; floors(); sfx.yay(); confetti(25);
    say(`Andar aceso! ${m.N} dividido por ${m.d} dá ${m.L.q}${m.L.r ? ` e sobra ${m.L.r}` : ', e não sobra nada'}.`);
    await askButton(n < TOTAL ? 'Subir para o próximo andar ⬆' : 'Abrir o baú da torre 🗝️');
    if (!alive) return;
    if (n < TOTAL) conta(); else finishPhase('Todos os andares da Torre da Chave estão acesos! 🗝️');
  }
  conta();
  return { stop() { alive = false; }, hint() { if (activeAsk && activeAsk.hint) activeAsk.hint(); else say('Na chave: o dividendo fica à esquerda, o divisor dentro da chave, o quociente embaixo do divisor e o resto embaixo de tudo.'); } };
};

/* ================= ARENA: gem-grab battle, everything mixed ================= */
GAMES.arena = function () {
  const W = 960, H = 560, { cv, c } = makeCanvas(W, H); setTouch('pad');
  const COVERS = [{ x:200, y:190, w:90, h:40 }, { x:670, y:190, w:90, h:40 }, { x:430, y:310, w:100, h:40 }, { x:170, y:390, w:60, h:60 }, { x:730, y:390, w:60, h:60 }];
  const g = gstep(), GOAL = 10;
  const p = { x:480, y:500, face:1, moving:false, invT:0, tx:null, ty:null, cd:0 };
  const bl = { x:440, y:500 };
  let robots = [], shots = [], orbs = [], drops = [], parts = [], gems = 0, time = 120, target = null, alive = true, state = 'play', calm = 0;
  const inCover = (x, y, r = 14) => COVERS.some(o => x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r);
  const bad = (x, y) => x < 24 || x > W - 24 || y < 76 || y > H - 16 || inCover(x, y);
  function newTarget() {
    const skill = pick(['share','share','group','rem','fact']), st = mstep(skill), R = gen(skill, st, { maxT:60 }), val = skill === 'rem' ? R.r : R.k;
    const list = [{ T:R.T, P:R.P, val, ok:true }], labels = new Set([`${R.T}÷${R.P}`]);
    const nd = st <= 3 ? 2 : 3;
    for (let i = 0; i < 80 && list.length < nd + 1; i++) { const D = gen(skill, st, { maxT:60 }), v = skill === 'rem' ? D.r : D.k, lb = `${D.T}÷${D.P}`; if (v !== val && !labels.has(lb)) { labels.add(lb); list.push({ T:D.T, P:D.P, val:v, ok:false }); } }
    const cols = ['#e0384a','#6a3fc1','#2f6fdc','#239a4c'];
    robots = shuffle(list).map((L, i) => { let x, y, k = 0; do { x = rand(80, 880); y = rand(100, 330); } while ((bad(x, y) || Math.hypot(x - p.x, y - p.y) < 160) && k++ < 60); const a = Math.random() * 7; return { ...L, x, y, vx:Math.cos(a) * (28 + g * 5), vy:Math.sin(a) * (28 + g * 5), col:cols[i % 4], shootT:rand(2, 5), reveal:0, gone:false }; });
    target = { skill, val, tries:0, t0:performance.now(), R };
    say(skill === 'rem' ? `Acerte o robô cuja conta SOBRA ${val}!` : `Acerte o robô cuja conta dá ${val}!`);
  }
  function shoot(tx, ty) {
    if (p.cd > 0) return; p.cd = .35;
    const a = Math.atan2(ty - p.y + 24, tx - p.x); shots.push({ x:p.x, y:p.y - 24, vx:Math.cos(a) * 560, vy:Math.sin(a) * 560, life:1.2 }); sfx.shoot();
  }
  function nearest() { let b = null, bd = 1e9; for (const r of robots) if (!r.gone && !r.reveal) { const d = Math.hypot(r.x - p.x, r.y - p.y); if (d < bd) { bd = d; b = r; } } return b; }
  function hitRobot(r) {
    const key = `${r.T}÷${r.P}`;
    if (r.ok) {
      if (target.tries === 0) record(target.skill, true, { fast:performance.now() - target.t0 < 8000, key });
      sfx.yay(); burst(parts, r.x, r.y, '#ef7d16', 20);
      for (let i = 0; i < 3; i++) drops.push({ x:clamp(r.x + rand(-40, 40), 40, 920), y:clamp(r.y + rand(-30, 40), 90, 520), t:0 });
      robots.forEach(o => o.gone = true);
      say(`Isso! ${r.T} ÷ ${r.P} ${target.skill === 'rem' ? `sobra ${r.val}` : `= ${r.val}`}! Pegue as gemas!`);
      setTimeout(() => { if (alive && state === 'play') newTarget(); }, 1300);
    } else {
      if (target.tries === 0) record(target.skill, false, { key });
      target.tries++; r.reveal = 2.2; sfx.hmm();
      say(target.skill === 'rem' ? `Esse robô sobra ${r.val}, não ${target.val}. Procure outro!` : `Esse robô dá ${r.val}, não ${target.val}. Procure outro!`);
    }
  }
  cv.addEventListener('pointerdown', e => {
    if (blocked() || state !== 'play') return;
    const q = canvasPoint(cv, e);
    const r = robots.find(o => !o.gone && !o.reveal && Math.hypot(o.x - q.x, o.y - 20 - q.y) < 46);
    if (r) shoot(r.x, r.y - 10); else { p.tx = q.x; p.ty = q.y; }
  });
  async function end() {
    state = 'end'; stopLoop();
    if (gems >= 3) {
      const k = Math.floor(gems / 3), r = gems % 3, skill = r ? 'rem' : 'share';
      say(`Fim da partida! Você pegou ${gems} gemas. Agora divida com o seu time de 3 brawlers!`);
      await ask({ q:`${gems} gemas para 3 amigos do time. Quantas cada um ganha?`, a:k, skill, key:`${gems}÷3`, hint:`Faça rodadas de 3: uma gema para cada amigo, até não dar mais.`, reveal:`3 × ${k} = ${k * 3}. Cada um ganha ${k}!` });
      if (!alive) return;
      if (r) { await ask({ q:`E quantas gemas sobram?`, a:r, skill:'rem', key:`${gems}÷3`, hint:`${gems} − ${k * 3} = ?`, reveal:`${gems} − ${k * 3} = ${r}. Sobram ${r}!` }); if (!alive) return; }
      await chaveCard(gems, 3, `${gems} gemas divididas entre 3 amigos: cada um ganha ${k}${r ? ` e sobra ${r}` : ''}.`);
      if (!alive) return;
    }
    finishPhase(gems >= GOAL ? `Vitória! Você juntou ${gems} gemas! 💎` : `Boa partida! Você juntou ${gems} gemas.`);
  }
  const stopLoop = loop((dt, t) => {
    const ed = consumeEdges();
    if (!blocked() && state === 'play') {
      time -= dt; calm += dt; if (calm > 18) { calm = 0; gameEvent(true); }
      let dx = K.right - K.left, dy = K.down - K.up;
      if (dx || dy) p.tx = null; else if (p.tx !== null) { const vx = p.tx - p.x, vy = p.ty - p.y, l = Math.hypot(vx, vy); if (l < 6) p.tx = null; else { dx = vx / l; dy = vy / l; } }
      const l = Math.hypot(dx, dy) || 1; p.moving = !!(dx || dy);
      if (p.moving) { const nx = p.x + dx / l * 240 * dt, ny = p.y + dy / l * 240 * dt; if (!bad(nx, p.y)) p.x = nx; else if (p.tx !== null) p.tx = null; if (!bad(p.x, ny)) p.y = ny; if (dx) p.face = dx > 0 ? 1 : -1; trailEmit(parts, p.x, p.y, save.equip.trail, t); }
      bl.x += (p.x - 40 * p.face - bl.x) * dt * 4; bl.y += (p.y - bl.y) * dt * 4;
      p.cd -= dt; p.invT -= dt;
      if (ed.act) { const r = nearest(); if (r) shoot(r.x, r.y - 10); }
      for (const r of robots) {
        if (r.gone) continue;
        if (r.reveal) { r.reveal -= dt; if (r.reveal <= 0) { r.reveal = 0; r.gone = true; burst(parts, r.x, r.y, '#7a6a99', 10); } continue; }
        const nx = r.x + r.vx * dt, ny = r.y + r.vy * dt;
        if (bad(nx, r.y) || nx < 60 || nx > 900) r.vx *= -1; else r.x = nx;
        if (bad(r.x, ny) || ny < 100 || ny > 400) r.vy *= -1; else r.y = ny;
        if (g >= 3) { r.shootT -= dt; if (r.shootT <= 0) { r.shootT = Math.max(1.6, 5 - g * .3) + Math.random() * 2; const a = Math.atan2(p.y - 20 - r.y, p.x - r.x), sp = 120 + g * 12; orbs.push({ x:r.x, y:r.y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp, life:4 }); } }
      }
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        if (s.life <= 0 || inCover(s.x, s.y, 0) || s.x < 0 || s.x > W || s.y < 60 || s.y > H) { shots.splice(i, 1); continue; }
        const r = robots.find(o => !o.gone && !o.reveal && Math.hypot(o.x - s.x, o.y - s.y) < 30);
        if (r) { shots.splice(i, 1); hitRobot(r); }
      }
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i]; o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt;
        if (o.life <= 0 || inCover(o.x, o.y, 0)) { orbs.splice(i, 1); continue; }
        if (Math.hypot(o.x - p.x, o.y - (p.y - 20)) < 22 && p.invT <= 0) {
          orbs.splice(i, 1); p.invT = 1.5; sfx.hit(); gameEvent(false); calm = 0;
          const lose = Math.min(2, gems); gems -= lose;
          for (let k = 0; k < lose; k++) drops.push({ x:clamp(p.x + rand(-70, 70), 40, 920), y:clamp(p.y + rand(-70, 20), 90, 520), t:0 });
          if (lose) say('Ai! Você derrubou gemas. Pegue de volta!');
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) { drops[i].t += dt; if (drops[i].t > .4 && Math.hypot(drops[i].x - p.x, drops[i].y - p.y + 10) < 30) { drops.splice(i, 1); gems++; sfx.pop(); } }
      $('#gInfo').textContent = `⏱ ${Math.max(0, Math.ceil(time))}s`;
      if (gems >= GOAL || time <= 0) { end(); return; }
    }
    // draw
    c.fillStyle = '#5bb07a'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#53a571'; for (let yy = 0; yy < H; yy += 40) for (let xx = (yy / 40) % 2 * 40; xx < W; xx += 80) c.fillRect(xx, yy, 40, 40);
    c.fillStyle = '#3d7f55'; c.fillRect(0, 0, W, 64);
    for (const o of COVERS) { c.fillStyle = '#2e8b4a'; rrect(c, o.x, o.y, o.w, o.h, 10); c.fill(); c.fillStyle = '#3fae5a'; for (let xx = o.x + 10; xx < o.x + o.w; xx += 20) { c.beginPath(); c.arc(xx, o.y + 6, 10, 0, 7); c.fill(); } }
    for (const d of drops) { c.save(); c.translate(d.x, d.y + Math.sin(t * 5 + d.x) * 3); c.fillStyle = '#ef7d16'; c.beginPath(); c.moveTo(0, -12); c.lineTo(10, 0); c.lineTo(0, 12); c.lineTo(-10, 0); c.fill(); c.fillStyle = '#ffd08a'; c.fillRect(-3, -5, 4, 4); c.restore(); }
    for (const r of robots) {
      if (r.gone) continue;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(r.x, r.y + 26, 22, 7, 0, 0, 7); c.fill();
      c.fillStyle = r.reveal ? '#9a95a8' : r.col; rrect(c, r.x - 22, r.y - 22, 44, 44, 12); c.fill();
      c.fillStyle = '#fff'; c.fillRect(r.x - 13, r.y - 10, 9, 9); c.fillRect(r.x + 4, r.y - 10, 9, 9);
      c.fillStyle = '#1b1730'; c.fillRect(r.x - 10, r.y - 7, 4, 4); c.fillRect(r.x + 7, r.y - 7, 4, 4);
      c.strokeStyle = '#1b1730'; c.lineWidth = 2; c.beginPath(); c.moveTo(r.x, r.y - 22); c.lineTo(r.x, r.y - 32); c.stroke();
      const lbl = r.reveal ? (target && target.skill === 'rem' ? `sobra ${r.val}` : `= ${r.val}`) : `${r.T} ÷ ${r.P}`;
      c.font = "24px 'Lilita One',sans-serif"; const tw = c.measureText(lbl).width + 20;
      c.fillStyle = '#fff'; rrect(c, r.x - tw / 2, r.y - 72, tw, 34, 10); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (r.reveal) { c.fillStyle = '#5d5070'; c.fillText(lbl, r.x, r.y - 54); }
      else { const a = `${r.T}`, b = ' ÷ ', d2 = `${r.P}`, wa = c.measureText(a).width, wb = c.measureText(b).width, wd = c.measureText(d2).width; let xx = r.x - (wa + wb + wd) / 2; c.textAlign = 'left'; c.fillStyle = '#ef7d16'; c.fillText(a, xx, r.y - 54); xx += wa; c.fillStyle = '#2a2140'; c.fillText(b, xx, r.y - 54); xx += wb; c.fillStyle = '#2f6fdc'; c.fillText(d2, xx, r.y - 54); }
    }
    for (const s of shots) { c.fillStyle = '#f4bd2a'; c.beginPath(); c.arc(s.x, s.y, 7, 0, 7); c.fill(); }
    for (const o of orbs) { c.fillStyle = '#9b5de5'; c.beginPath(); c.arc(o.x, o.y, 9, 0, 7); c.fill(); c.fillStyle = '#d7b8ff'; c.beginPath(); c.arc(o.x - 2, o.y - 2, 3, 0, 7); c.fill(); }
    drawBluu(c, bl.x, bl.y, 1, save.equip.hat, t);
    if (p.invT <= 0 || Math.floor(t * 10) % 2) drawHero(c, p.x, p.y, 1.1, save.equip, t, p.moving, p.face);
    partsDraw(c, parts, 1 / 60);
    if (target) {
      const txt = target.skill === 'rem' ? `Acerte a conta que SOBRA ${target.val}` : `Acerte a conta que dá ${target.val}`;
      c.font = "28px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(253,240,200,.95)'; rrect(c, W / 2 - 230, 10, 460, 46, 14); c.fill();
      c.fillStyle = target.skill === 'rem' ? '#e0384a' : '#239a4c'; c.fillText(txt, W / 2, 34);
    }
    c.fillStyle = 'rgba(255,255,255,.92)'; rrect(c, 12, 10, 150, 46, 12); c.fill();
    c.fillStyle = '#ef7d16'; c.font = "26px 'Lilita One',sans-serif"; c.textAlign = 'left'; c.fillText(`💎 ${gems}/${GOAL}`, 24, 34);
  });
  newTarget();
  if (DEBUG) window.__g = { p, get robots() { return robots; }, get gems() { return gems; }, set gems(v) { gems = v; }, get drops() { return drops; }, get target() { return target; }, set time(v) { time = v; } };
  return { stop() { alive = false; stopLoop(); }, hint() { if (!target) return; const R = target.R; say(target.skill === 'rem' ? `Para achar o que sobra: faça grupos com o dividendo e veja o que não forma grupo. Por exemplo, ${R.T} ÷ ${R.P}: ${R.P} × ${R.k} = ${R.P * R.k}, e sobra ${R.r}.` : `Use a tabuada! ${R.P} × ${R.k} = ${R.T}, então ${R.T} ÷ ${R.P} = ${R.k}.`); } };
};

/* ================= VILA: snack-bar tycoon, sharing + packing ================= */
const UPG = [{ id:'flores', e:'🌼', n:'Vasinhos de flor', c:20 }, { id:'jukebox', e:'🎵', n:'Jukebox', c:40 }, { id:'neon', e:'💡', n:'Letreiro brilhante', c:60 },
  { id:'mesas', e:'🪑', n:'Mesas novas', c:80 }, { id:'sorvete', e:'🍦', n:'Máquina de sorvete (doce novo!)', c:100 }, { id:'robo', e:'🤖', n:'Garçom robô', c:150 }];
GAMES.vila = function () {
  setTouch(null);
  const V = save.vila, box = $('#stageBox'), subs = [];
  const on = (t, f) => { box.addEventListener(t, f); subs.push([t, f]); };
  const off = (t, f) => box.removeEventListener(t, f);
  const FOODS = [['🍕','fatias de pizza'],['🍩','rosquinhas'],['🧁','cupcakes'],['🍪','biscoitos'],['🍓','morangos']];
  if (V.up.includes('sorvete')) FOODS.push(['🍦','sorvetes']);
  const TABLES = 5, PAT = clamp(50 - gstep() * 3, 20, 50);
  let alive = true, dayCash = 0, pat = 1, patOn = false;
  const iv = setInterval(() => {
    if (!alive || !patOn || !$('#overlay').hidden) return;
    pat = Math.max(0, pat - .1 / PAT);
    const el = $('#vPat'); if (el) { el.style.width = pat * 100 + '%'; el.style.background = pat > .5 ? 'var(--leaf)' : pat > .2 ? 'var(--gold)' : 'var(--coral)'; }
    const f = $('#vMood'); if (f) f.textContent = pat > .5 ? '😊' : pat > .2 ? '😐' : '😤';
  }, 100);
  const foods = (e, n, ret) => Array.from({ length:n }, () => `<span class="food ${ret !== undefined ? 'ret' : ''}" ${ret !== undefined ? `data-ret="${ret}" title="Devolver"` : ''}>${e}</span>`).join('');
  function shell(inner) {
    box.innerHTML = `<div class="vila ${V.up.includes('mesas') ? 'chic' : ''}">
      <div class="vtop"><span class="sign ${V.up.includes('neon') ? 'neon' : ''}">🍕 Lanchonete da Mikinha</span><span class="decor" aria-hidden="true">${UPG.filter(u => V.up.includes(u.id)).map(u => u.e).join(' ')}</span><span class="pill">🪙 Caixa do dia: ${dayCash}</span></div>
      <div class="row" style="flex-wrap:nowrap"><span id="vMood" style="font-size:1.6rem" aria-hidden="true">${pat > .5 ? '😊' : pat > .2 ? '😐' : '😤'}</span><div class="patience" style="flex:1" aria-label="Paciência dos clientes"><i id="vPat" style="width:${pat * 100}%"></i></div></div>
      ${inner}</div>`;
  }
  const mesa = (fr, plates, e, click) => `<div class="mesa">${fr.map(([f, nm], i) => `<div class="seat ${click ? 'click' : ''}" data-seat="${i}" ${click ? `role="button" tabindex="0" aria-label="Servir ${nm}"` : ''}><span class="who" aria-hidden="true">${f}</span><span class="nm">${nm}</span><div class="plate">${foods(e, plates[i], click ? i : undefined)}</div>${mstep('share') <= 2 ? `<span class="vcnt">${plates[i]}</span>` : ''}</div>`).join('')}</div>`;
  const balcao = (e, k, click) => `<div class="balcao ${click ? 'click' : ''}" ${click ? 'role="button" tabindex="0" aria-label="Pegar do balcão"' : ''}><span class="tag">Balcão${click ? ' · clique para embalar' : ''}</span><div class="fitems">${k ? foods(e, k) : '<span class="empty">Tudo servido ✨</span>'}</div></div>`;
  const robo = () => V.up.includes('robo') ? '<p class="muted" style="margin:0;text-align:center">🤖 O garçom robô diz: "um para cada, em ordem!"</p>' : '';

  function manualShare(R, fr, e, w) {
    return new Promise(res => {
      const plates = Array(R.P).fill(0); let pile = R.T, tries = 0;
      const draw = () => shell(`<p class="vq">${R.T} ${w} para ${R.P} amigos. Clique num amigo para dar um ${e}!</p>${mesa(fr, plates, e, true)}${balcao(e, pile, false)}${robo()}<div class="controls"><button class="btn" id="vServe">Servir! 🛎️</button></div>`);
      draw();
      const act = target => {
        if (blocked()) return;
        const r = target.closest('[data-ret]'), s = target.closest('[data-seat]');
        if (target.closest('#vServe')) {
          if (pile > 0) { say(`Ainda tem ${e} no balcão!`); sfx.hmm(); return; }
          const mx = Math.max(...plates), mn = Math.min(...plates);
          if (mx !== mn) { if (tries++ === 0) record('share', false, { key:`${R.T}÷${R.P}` }); sfx.hmm(); say(`Hmm... ${fr[plates.indexOf(mx)][1]} tem ${mx} e ${fr[plates.indexOf(mn)][1]} tem ${mn}. Não ficou justo! Clique num ${e} do prato para devolver.`); return; }
          if (tries === 0) record('share', true, { key:`${R.T}÷${R.P}` });
          off('click', onClick); off('keydown', onKey); res(); return;
        }
        if (r) { plates[+r.dataset.ret]--; pile++; sfx.back(); draw(); return; }
        if (s) { if (pile <= 0) { say('O balcão está vazio! Clique em Servir.'); return; } plates[+s.dataset.seat]++; pile--; sfx.pop(); draw(); if (!pile) say('Tudo nos pratos! Agora clique em Servir.'); }
      };
      const onClick = ev => act(ev.target);
      const onKey = ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[data-seat]')) { ev.preventDefault(); const i = ev.target.dataset.seat; act(ev.target); const again = box.querySelector(`[data-seat="${i}"]`); if (again) again.focus(); } };
      on('click', onClick); on('keydown', onKey);
      say(`${R.T} ${w} para ${R.P} amigos. Dê um para cada, em ordem!`);
    });
  }
  async function typedShare(R, fr, e, w) {
    const plates = Array(R.P).fill(0);
    shell(`<p class="vq">${R.T} ${w} para ${R.P} amigos.</p>${mesa(fr, plates, e, false)}${balcao(e, R.T, false)}${robo()}`);
    await ask({ q:`${R.T} ${w} para ${R.P} amigos. Quantos vão em cada prato?`, a:R.k, skill:'share', key:`${R.T}÷${R.P}`, hint:`Pense: ${R.P} vezes quanto dá ${R.T}?`, reveal:`${R.P} × ${R.k} = ${R.T}. Cada prato leva ${R.k}!` });
    for (let i = 0; i < R.T && alive; i++) { plates[i % R.P]++; shell(`<p class="vq">Servindo...</p>${mesa(fr, plates, e, false)}${balcao(e, R.T - i - 1, false)}`); sfx.pop(); await wait(R.T > 16 ? 70 : 120); }
  }
  async function packOrder(R, e, w) {
    const G = R.P, boxes = []; let pile = R.T, open = 0;
    const intro = `Encomenda para viagem: ${R.T} ${w} em caixinhas de ${G}.`;
    const draw = (msg, click) => shell(`<p class="vq">${msg}</p><div class="caixas">${boxes.map(n => `<div class="caixa"><span aria-hidden="true">🎀</span><div class="fitems">${foods(e, n)}</div></div>`).join('')}${click || open ? `<div class="caixa open"><span class="tag">Caixinha aberta</span><div class="fitems">${foods(e, open)}</div>${mstep('group') <= 2 ? `<span class="vcnt">${open} de ${G}</span>` : ''}</div>` : ''}</div>${balcao(e, pile, click)}${robo()}`);
    if (mstep('group') <= 3) {
      draw(`${intro} Clique no balcão para encher a caixinha!`, true);
      say(`${intro} Clique no balcão para encher!`);
      await new Promise(res => {
        const onClick = ev => {
          if (blocked() || !ev.target.closest('.balcao') || pile <= 0) return;
          pile--; open++; sfx.pop();
          if (open === G) { boxes.push(open); open = 0; sfx.ding(); }
          draw(pile ? `${intro} Continue!` : 'Todas as caixinhas prontas! 🎀', pile > 0);
          if (!pile) { off('click', onClick); off('keydown', onKey); res(); }
        };
        const onKey = ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.balcao')) { ev.preventDefault(); onClick(ev); const b = box.querySelector('.balcao.click'); if (b) b.focus(); } };
        on('click', onClick); on('keydown', onKey);
      });
      if (!alive) return;
      await ask({ q:'Quantas caixinhas você fez?', a:R.k, skill:'group', key:`${R.T}÷${G}`, hint:'Conte as caixinhas com laço 🎀.', reveal:`São ${R.k} caixinhas!` });
    } else {
      draw(intro, false);
      await ask({ q:`${R.T} ${w} em caixinhas de ${G}. Quantas caixinhas?`, a:R.k, skill:'group', key:`${R.T}÷${G}`, hint:`Quantas vezes o ${G} cabe no ${R.T}? Use a tabuada do ${G}.`, reveal:`${G} × ${R.k} = ${R.T}. São ${R.k} caixinhas!` });
      for (let b = 0; b < R.k && alive; b++) { for (let i = 0; i < G && alive; i++) { pile--; open++; draw('Embalando...', false); await wait(60); } boxes.push(open); open = 0; sfx.ding(); }
    }
  }
  function endDay() {
    V.cash += dayCash; persist(); $('#gInfo').textContent = 'Fim do dia';
    const draw = () => { box.innerHTML = `<div class="vila"><h3>Fim do dia! 🌙</h3><p style="margin:0">Hoje você ganhou 🪙 ${dayCash}. Caixa da lanchonete: <b>🪙 ${V.cash}</b></p><p class="muted" style="margin:0">Compre melhorias para a lanchonete. Elas ficam para sempre!</p><div class="upg">${UPG.map(u => { const own = V.up.includes(u.id); return `<div class="item"><span style="font-size:2.2rem" aria-hidden="true">${u.e}</span><b>${u.n}</b>${own ? '<span class="pill">✔ Comprado</span>' : `<button class="btn gold small" data-upg="${u.id}" ${V.cash < u.c ? 'disabled' : ''}>🪙 ${u.c}</button>`}</div>`; }).join('')}</div><div class="controls"><button class="btn" id="vClose">Fechar a lanchonete ➜</button></div></div>`; };
    draw(); say('Fim do dia! Quer comprar uma melhoria para a lanchonete?');
    const onClick = ev => {
      const u = ev.target.closest('[data-upg]');
      if (u) { const it = UPG.find(x => x.id === u.dataset.upg); if (V.cash >= it.c) { V.cash -= it.c; V.up.push(it.id); persist(); sfx.secret(); confetti(30); toast(`Melhoria nova: ${it.e} ${it.n}!`); draw(); } return; }
      if (ev.target.closest('#vClose')) { off('click', onClick); finishPhase(`A lanchonete atendeu ${TABLES} clientes hoje! 🍕`); }
    };
    on('click', onClick);
  }
  (async () => {
    if (V.up.includes('jukebox')) sfx.yay();
    for (let n = 0; n < TABLES; n++) {
      if (!alive) return;
      $('#gInfo').textContent = `Cliente ${n + 1} de ${TABLES}`;
      const [e, w] = pick(FOODS); pat = 1; patOn = true;
      let R;
      if (n % 2 === 1) { R = gen('group', mstep('group'), { maxT:30 }); await packOrder(R, e, w); }
      else { R = gen('share', mstep('share'), { maxT:30, maxP:5 }); const fr = shuffle(FRIENDS.slice()).slice(0, R.P); if (mstep('share') <= 3) await manualShare(R, fr, e, w); else await typedShare(R, fr, e, w); }
      if (!alive) return;
      patOn = false;
      const tip = Math.round(pat * 10), earned = 5 + tip; dayCash += earned; gameEvent(pat > .35);
      sfx.yay(); confetti(20);
      say(pat > .5 ? `Clientes felizes! +${earned} moedas, com gorjeta de ${tip}!` : pat > 0 ? `Pedido entregue! +${earned} moedas.` : `Eles esperaram bastante, mas comeram felizes. +${earned} moedas.`);
      shell(`<div class="vdone">${chaveHTML(chaveModel(R.T, R.P), { anim:true })}<p class="sentence" style="margin:0">${n % 2 === 1 ? `${R.T} em caixinhas de ${R.P}: ${R.k} caixinhas.` : `${R.T} para ${R.P} amigos: ${R.k} para cada.`}</p></div>`);
      await wait(2600);
    }
    if (alive) endDay();
  })();
  return { stop() { alive = false; clearInterval(iv); subs.forEach(([t, f]) => off(t, f)); }, hint() { if (activeAsk && activeAsk.hint) activeAsk.hint(); else say('Dê um para cada amigo, em ordem, até o balcão ficar vazio. Nas caixinhas, encha uma de cada vez!'); } };
};

/* ================= FLORESTA: temple puzzles, grouping ================= */
GAMES.floresta = function () {
  const W = 960, H = 540, { cv, c } = makeCanvas(W, H); setTouch(null);
  const ROOMS = ['altar','door','altar','door'];
  let ri = 0, alive = true, parts = [], room = null, drag = null, sel = null, fade = 0, walker = null;
  function newRoom() {
    const type = ROOMS[ri], R = gen('group', mstep('group'), { maxT:30 });
    $('#gInfo').textContent = `Sala ${ri + 1} de ${ROOMS.length}`;
    if (type === 'altar') {
      const na = R.k + rand(1, 2), crystals = [];
      for (let i = 0; i < R.T; i++) { let x, y, k = 0; do { x = rand(80, 390); y = rand(170, 480); } while (crystals.some(q => Math.hypot(q.hx - x, q.hy - y) < 36) && k++ < 80); crystals.push({ x, y, hx:x, hy:y }); }
      const cols = na <= 4 ? 2 : 3, cw = 420 / cols, altars = [];
      for (let i = 0; i < na; i++) altars.push({ x:500 + (i % cols) * cw + cw / 2, y:175 + Math.floor(i / cols) * 120, n:0 });
      room = { type, R, crystals, altars, state:'play', predicted:false, missRec:false };
      if (mstep('group') >= 4) {
        room.state = 'ask';
        ask({ q:`${R.T} cristais em grupos de ${R.P}. Quantos altares vão acender?`, a:R.k, skill:'group', key:`${R.T}÷${R.P}`, hint:`Quantas vezes o ${R.P} cabe no ${R.T}?`, reveal:`${R.P} × ${R.k} = ${R.T}. Vão acender ${R.k} altares!` })
          .then(() => { if (!alive) return; room.state = 'play'; room.predicted = true; say(`Agora arraste os cristais para conferir! Cada altar leva ${R.P}.`); });
      } else say(`Arraste os cristais até os altares. Cada altar precisa de ${R.P} cristais para brilhar!`);
    } else {
      const opts = makeChoices(R.k, mstep('group'));
      room = { type, R, doors:opts.map((v, i) => ({ v, x:W / 2 + (i - (opts.length - 1) / 2) * 210, y:120, state:'closed', shake:0 })), tries:0, grouped:mstep('group') <= 2, state:'play', t0:performance.now() };
      say(`${R.T} cristais em grupos de ${R.P}. Quantos grupos? Clique na porta certa!`);
    }
  }
  function placeIn(cr, al) {
    const G = room.R.P;
    if (al.n >= G) { say(`Esse altar já está cheio, com ${G}! Use outro.`); sfx.hmm(); cr.x = cr.hx; cr.y = cr.hy; return; }
    al.n++; room.crystals.splice(room.crystals.indexOf(cr), 1); sfx.pop(); burst(parts, al.x, al.y, '#7fe3ff', 8);
    if (al.n === G) { sfx.ding(); burst(parts, al.x, al.y, '#f4bd2a', 16); gameEvent(true); }
    if (!room.crystals.length) checkAltars();
  }
  async function checkAltars() {
    const G = room.R.P, partial = room.altars.filter(a => a.n > 0 && a.n < G);
    if (partial.length) {
      if (!room.predicted && !room.missRec) { room.missRec = true; record('group', false, { key:`${room.R.T}÷${G}` }); }
      say(`Tem altar com menos de ${G} cristais, e ele não brilha! Clique no altar para tirar um cristal e complete os outros.`); sfx.hmm(); return;
    }
    room.state = 'done';
    const R = room.R;
    sfx.yay(); confetti(25);
    if (!room.predicted) {
      if (!room.missRec) record('group', true, { key:`${R.T}÷${G}` });
      await ask({ q:'Quantos altares estão brilhando?', a:R.k, skill:'group', key:`${R.T}÷${G}`, hint:'Conte os altares dourados.', reveal:`São ${R.k} altares brilhando!` });
      if (!alive) return;
    }
    await chaveCard(R.T, G, `${R.T} cristais em grupos de ${G}: ${R.k} grupos.`);
    if (alive) nextRoom();
  }
  function nextRoom() { ri++; if (ri >= ROOMS.length) { alive = false; stopLoop(); finishPhase('Todas as salas do Templo da Floresta estão abertas! 🌳'); return; } fade = 1; newRoom(); }
  function pickDoor(d) {
    const r = room;
    if (r.state !== 'play' || d.state !== 'closed') return;
    if (d.v === r.R.k) {
      if (r.tries === 0) record('group', true, { fast:performance.now() - r.t0 < 8000, key:`${r.R.T}÷${r.R.P}` });
      d.state = 'open'; r.state = 'walk'; sfx.yay(); walker = { x:W / 2, y:470, tx:d.x, ty:d.y + 90, t:0 };
      say(`Isso! ${r.R.T} em grupos de ${r.R.P} dá ${r.R.k} grupos. A porta abriu!`);
      const mini = document.createElement('div'); mini.className = 'miniChave'; mini.innerHTML = chaveHTML(chaveModel(r.R.T, r.R.P), { size:'small', anim:true }); $('#stageBox').append(mini); setTimeout(() => mini.remove(), 3500);
      setTimeout(() => { if (alive) { walker = null; nextRoom(); } }, 2600);
    } else {
      if (r.tries === 0) record('group', false, { key:`${r.R.T}÷${r.R.P}` });
      r.tries++; d.state = 'stuck'; d.shake = .5; r.grouped = true; sfx.hit();
      say(r.tries >= 2 ? `É a porta do ${r.R.k}! Ela está brilhando.` : `Essa porta está trancada! Olhe o mural: separei os cristais em grupos de ${r.R.P}. Conte os grupos.`);
    }
  }
  cv.addEventListener('pointerdown', e => {
    if (blocked() || !room || room.state !== 'play') return;
    const q = canvasPoint(cv, e);
    if (room.type === 'door') { const d = room.doors.find(d => Math.abs(q.x - d.x) < 75 && q.y > d.y - 10 && q.y < d.y + 190); if (d) pickDoor(d); return; }
    const cr = [...room.crystals].reverse().find(k => Math.hypot(k.x - q.x, k.y - q.y) < 28);
    if (cr) { drag = { cr, sx:q.x, sy:q.y, moved:false }; cv.setPointerCapture?.(e.pointerId); return; }
    const al = room.altars.find(a => Math.hypot(a.x - q.x, a.y - q.y) < 50);
    if (al && sel) { const s = sel; sel = null; placeIn(s, al); return; }
    if (al && al.n > 0 && al.n < room.R.P) { al.n--; let x, y, k = 0; do { x = rand(80, 390); y = rand(170, 480); } while (room.crystals.some(o => Math.hypot(o.hx - x, o.hy - y) < 36) && k++ < 60); room.crystals.push({ x:al.x, y:al.y, hx:x, hy:y, back:true }); sfx.back(); }
  });
  cv.addEventListener('pointermove', e => { if (!drag) return; const q = canvasPoint(cv, e); if (Math.hypot(q.x - drag.sx, q.y - drag.sy) > 8) drag.moved = true; drag.cr.x = q.x; drag.cr.y = q.y; });
  cv.addEventListener('pointerup', e => {
    if (!drag) return; const { cr, moved } = drag; drag = null;
    if (!moved) { cr.x = cr.hx; cr.y = cr.hy; sel = sel === cr ? null : cr; return; }
    const al = room.altars.find(a => Math.hypot(a.x - cr.x, a.y - cr.y) < 60);
    if (al) placeIn(cr, al); else { cr.x = cr.hx; cr.y = cr.hy; }
  });
  function crystal(x, y, s = 1, glow = false) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (glow) { c.fillStyle = 'rgba(244,189,42,.5)'; c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fill(); }
    c.fillStyle = '#7fe3ff'; c.beginPath(); c.moveTo(0, -16); c.lineTo(11, -4); c.lineTo(6, 14); c.lineTo(-6, 14); c.lineTo(-11, -4); c.closePath(); c.fill();
    c.fillStyle = '#c9f5ff'; c.beginPath(); c.moveTo(0, -16); c.lineTo(4, -4); c.lineTo(0, 14); c.lineTo(-4, -4); c.closePath(); c.fill();
    c.restore();
  }
  const stopLoop = loop((dt, t) => {
    c.fillStyle = '#1f3b2c'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#26473a'; for (let y = 0; y < H; y += 48) for (let x = (y / 48) % 2 * 48; x < W; x += 96) c.fillRect(x, y, 48, 48);
    c.strokeStyle = '#3fae5a'; c.lineWidth = 5; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(i * 180 + 30, 0); c.quadraticCurveTo(i * 180 + 60, 50, i * 180 + 20, 90); c.stroke(); }
    [[30, 60], [W - 30, 60]].forEach(([x, y]) => { c.fillStyle = '#7a4b23'; c.fillRect(x - 5, y, 10, 30); emoji(c, '🔥', x, y - 6 + Math.sin(t * 9 + x) * 2, 26); });
    if (room && room.type === 'altar') {
      const G = room.R.P;
      c.fillStyle = 'rgba(0,0,0,.18)'; rrect(c, 60, 140, 350, 370, 18); c.fill();
      c.fillStyle = '#c9f5ff'; c.font = "18px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.fillText('Cristais', 235, 160);
      for (const a of room.altars) {
        const lit = a.n === G;
        if (lit) { c.fillStyle = 'rgba(244,189,42,.35)'; c.beginPath(); c.arc(a.x, a.y, 58 + Math.sin(t * 4) * 3, 0, 7); c.fill(); }
        c.fillStyle = lit ? '#f4bd2a' : '#8d8a7c'; c.beginPath(); c.arc(a.x, a.y, 46, 0, 7); c.fill();
        c.fillStyle = lit ? '#ffe27a' : '#a9a595'; c.beginPath(); c.arc(a.x, a.y, 38, 0, 7); c.fill();
        for (let i = 0; i < G; i++) { const an = -Math.PI / 2 + i * 2 * Math.PI / G, sx = a.x + Math.cos(an) * (G > 1 ? 22 : 0), sy = a.y + Math.sin(an) * (G > 1 ? 22 : 0); if (i < a.n) crystal(sx, sy, .6); else { c.fillStyle = '#5d5a50'; c.beginPath(); c.arc(sx, sy, 6, 0, 7); c.fill(); } }
        if (sel && !lit) { c.strokeStyle = '#ffffff'; c.setLineDash([6, 5]); c.lineWidth = 2; c.beginPath(); c.arc(a.x, a.y, 52, 0, 7); c.stroke(); c.setLineDash([]); }
      }
      for (const k of room.crystals) { if (k.back) { k.x += (k.hx - k.x) * .2; k.y += (k.hy - k.y) * .2; if (Math.hypot(k.hx - k.x, k.hy - k.y) < 1) k.back = false; } if (k !== (drag && drag.cr)) crystal(k.x, k.y, 1, k === sel); }
      if (drag) crystal(drag.cr.x, drag.cr.y, 1.15, true);
      c.fillStyle = 'rgba(253,240,200,.95)'; rrect(c, W / 2 - 260, 12, 520, 50, 14); c.fill();
      c.font = "26px 'Lilita One',sans-serif"; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillStyle = '#2a2140';
      c.fillText(`Cada altar precisa de ${G} cristais`, W / 2, 38);
      drawHero(c, 440, 520, .9, save.equip, t, false, 1); drawBluu(c, 470, 522, .8, save.equip.hat, t);
    } else if (room && room.type === 'door') {
      const R = room.R;
      for (const d of room.doors) {
        const sx = d.shake > 0 ? Math.sin(t * 60) * 4 : 0; d.shake -= dt;
        const glow = room.tries >= 2 && d.v === R.k && d.state === 'closed';
        c.fillStyle = '#5b5446'; rrect(c, d.x - 80 + sx, d.y - 20, 160, 210, 20); c.fill();
        c.fillStyle = d.state === 'open' ? '#0f1a14' : d.state === 'stuck' ? '#4a4237' : glow ? '#c8920f' : '#7a4b23'; rrect(c, d.x - 62 + sx, d.y + 2, 124, 188, 14); c.fill();
        if (d.state === 'stuck') { c.fillStyle = '#8d8a7c'; [[-30, 150], [10, 160], [35, 140], [-5, 120]].forEach(([a, b]) => { c.beginPath(); c.arc(d.x + a, d.y + b, 18, 0, 7); c.fill(); }); }
        if (d.state !== 'open') { c.fillStyle = d.state === 'stuck' ? '#a9a595' : '#fdf0c8'; c.beginPath(); c.arc(d.x + sx, d.y + 60, 34, 0, 7); c.fill(); c.fillStyle = '#2a2140'; c.font = "38px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.v, d.x + sx, d.y + 62); }
      }
      const mx = W / 2, my = 380, rows = Math.ceil(R.T / R.P);
      c.fillStyle = 'rgba(253,240,200,.95)'; rrect(c, mx - 300, my - 30, 600, 150, 16); c.fill();
      c.font = "24px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#ef7d16'; c.fillText(`${R.T} cristais`, mx - 110, my - 8); c.fillStyle = '#2a2140'; c.fillText('em grupos de', mx + 20, my - 8); c.fillStyle = '#2f6fdc'; c.fillText(`${R.P}`, mx + 112, my - 8);
      if (room.grouped) {
        const gw = R.P * 22 + 14, perRow = Math.max(1, Math.floor(560 / (gw + 8))), sc = rows > perRow * 2 ? .7 : 1;
        for (let gI = 0; gI < rows; gI++) { const gx = mx - 280 + (gI % perRow) * (gw * sc + 8), gy = my + 22 + Math.floor(gI / perRow) * 44 * sc; c.strokeStyle = '#2f6fdc'; c.lineWidth = 2; rrect(c, gx, gy, gw * sc, 36 * sc, 8); c.stroke(); for (let j = 0; j < R.P; j++) crystal(gx + (14 + j * 22) * sc, gy + 18 * sc, .55 * sc); }
      } else for (let i = 0; i < R.T; i++) crystal(mx - 270 + (i % 24) * 23, my + 36 + Math.floor(i / 24) * 36, .6);
      if (walker) { walker.t += dt; walker.x += (walker.tx - walker.x) * dt * 2; walker.y += (walker.ty - walker.y) * dt * 2; drawHero(c, walker.x, walker.y, 1, save.equip, t, true, walker.tx > walker.x ? 1 : -1); }
      else { drawHero(c, W / 2, 520, 1, save.equip, t, false, 1); drawBluu(c, W / 2 + 40, 522, .9, save.equip.hat, t); }
    }
    partsDraw(c, parts, 1 / 60);
    if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); fade = Math.max(0, fade - dt * 1.5); }
  });
  newRoom();
  if (DEBUG) window.__g = { get room() { return room; }, placeIn:(cr, al) => placeIn(cr, al), pickDoor:d => pickDoor(d) };
  return { stop() { alive = false; stopLoop(); }, hint() { if (activeAsk && activeAsk.hint) return activeAsk.hint(); if (!room) return; const R = room.R; say(room.type === 'altar' ? `Coloque ${R.P} cristais em cada altar, um altar de cada vez. Os altares que sobrarem ficam vazios.` : `Faça grupos de ${R.P} com os ${R.T} cristais do mural e conte quantos grupos dá.`); } };
};

/* ================= CASTELO: boss battle in phases, everything mixed ================= */
GAMES.castelo = function () {
  const W = 960, H = 560, { cv, c } = makeCanvas(W, H); setTouch('pad');
  const g = gstep(), DX = W / 2, DY = 140;
  const p = { x:480, y:480, face:1, moving:false, invT:0, tx:null, ty:null };
  const bl = { x:440, y:490 };
  let hp = 6, state = 'attack', stT = 0, fire = [], orbs = [], parts = [], Q = null, alive = true, flash = 0, shot = null, noHit = true, mini = null, spawn = 0, won = false;
  const phase = () => hp > 4 ? 1 : hp > 2 ? 2 : 3;
  const bad = (x, y) => x < 30 || x > W - 30 || y < 290 || y > H - 14;
  function startAttack() {
    state = 'attack'; stT = 5 + phase() * 1.5; noHit = true; orbs = []; if (mini) { mini.remove(); mini = null; }
    $('#gInfo').textContent = `Fase ${phase()} de 3`;
    say(pick(['Cuidado com o fogo! Desvie!', 'O dragão vai atacar! Fique esperta!', 'Desvie das bolas de fogo!']));
  }
  function makeQ() {
    const skill = pick(['share','group','rem','fact','chave','chave']), st = mstep(skill);
    if (skill === 'chave') {
      const m = genChave(clamp(st, 2, 9)), askRes = m.L.r > 0 && Math.random() < .5, a = askRes ? m.L.r : m.L.q;
      return { skill, a, m, askRes, key:`${m.N}÷${m.d}`, text:`Na chave ${m.N} ÷ ${m.d}: qual é o ${askRes ? 'RESTO' : 'QUOCIENTE'}?`,
        hint:askRes ? `Quantas vezes o ${m.d} cabe no ${m.N}? O que sobra é o resto.` : `Quantas vezes o ${m.d} cabe no ${m.N}? Use a tabuada do ${m.d}.`, opts:makeChoices(a, st) };
    }
    const R = gen(skill, st, { maxT:60 }), a = skill === 'rem' ? R.r : R.k;
    return { skill, a, R, key:`${R.T}÷${R.P}`, text:skill === 'rem' ? `${R.T} ÷ ${R.P}: quanto SOBRA?` : skill === 'group' ? `${R.T} em grupos de ${R.P}: quantos grupos?` : `${R.T} ÷ ${R.P} = ?`,
      hint:skill === 'rem' ? `${R.P} × ${R.k} = ${R.P * R.k}. Quanto falta para ${R.T}?` : `Pense na tabuada do ${R.P}: ${R.P} × ? = ${R.T}`, opts:makeChoices(a, st) };
  }
  function startQuestion() {
    if (noHit) gameEvent(true);
    state = 'question'; fire = []; Q = makeQ(); Q.tries = 0; Q.t0 = performance.now(); Q.arm = 1.2;
    const n = Q.opts.length;
    orbs = Q.opts.map((v, i) => ({ v, x:140 + i * (680 / (n - 1)), y:330 + (i % 2) * 50, dead:false }));
    if (p.y < 470) p.y = 500;
    say(`O dragão cansou! ${Q.text} Encoste na bola certa!`);
    if (Q.skill === 'chave') {
      const m = Q.m, last = m.L.steps.length - 1;
      let filled, active;
      if (Q.askRes) { filled = new Set(m.cells.map(cc => cc.g)); m.L.steps.forEach((s, i) => filled.add('q' + i)); filled.delete('r' + last); active = 'r' + last; }
      else { filled = new Set(['dvd']); active = 'q0'; }
      mini = document.createElement('div'); mini.className = 'miniChave'; mini.style.left = '10px'; mini.style.right = 'auto';
      mini.innerHTML = chaveHTML(m, { filled, active, size:'small' }); $('#stageBox').append(mini);
    }
  }
  function touchOrb(o) {
    if (o.v === Q.a) {
      if (Q.tries === 0) record(Q.skill, true, { fast:performance.now() - Q.t0 < 8000, key:Q.key });
      orbs = []; sfx.shoot(); shot = { x:o.x, y:o.y, v:o.v }; state = 'shot';
      if (mini) { mini.remove(); mini = null; }
    } else {
      if (Q.tries === 0) record(Q.skill, false, { key:Q.key });
      Q.tries++; o.dead = true; sfx.hmm(); burst(parts, o.x, o.y, '#9a95a8', 10);
      say(Q.tries >= 2 ? `A resposta é ${Q.a}! A bola certa está brilhando.` : `O dragão riu! Não é ${o.v}. Dica: ${Q.hint}`);
    }
  }
  cv.addEventListener('pointerdown', e => { if (blocked() || won) return; const q = canvasPoint(cv, e); p.tx = clamp(q.x, 30, W - 30); p.ty = clamp(q.y, 300, H - 20); });
  const stopLoop = loop((dt, t) => {
    if (!blocked() && !won) {
      let dx = K.right - K.left, dy = K.down - K.up;
      if (dx || dy) p.tx = null; else if (p.tx !== null) { const vx = p.tx - p.x, vy = p.ty - p.y, l = Math.hypot(vx, vy); if (l < 6) p.tx = null; else { dx = vx / l; dy = vy / l; } }
      const l = Math.hypot(dx, dy) || 1; p.moving = !!(dx || dy);
      if (p.moving) { const nx = p.x + dx / l * 250 * dt, ny = p.y + dy / l * 250 * dt; if (!bad(nx, p.y)) p.x = nx; if (!bad(p.x, ny)) p.y = ny; if (dx) p.face = dx > 0 ? 1 : -1; trailEmit(parts, p.x, p.y, save.equip.trail, t); }
      bl.x += (p.x - 40 * p.face - bl.x) * dt * 4; bl.y += (p.y + 6 - bl.y) * dt * 4;
      p.invT -= dt; flash = Math.max(0, flash - dt);
      if (state === 'attack') {
        stT -= dt; spawn -= dt;
        if (spawn <= 0) {
          const ph = phase(), sp = 170 + g * 14 + ph * 20; spawn = Math.max(.35, 1.15 - g * .06 - ph * .12);
          const aim = Math.atan2(p.y - 20 - (DY + 50), p.x - DX);
          if (ph === 1) { const tx = rand(60, 900), a = Math.atan2(H - (DY + 50), tx - DX); fire.push({ x:DX, y:DY + 50, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp }); }
          else [-.3, 0, .3].forEach(o => { if (ph === 2 && o === 0) return; fire.push({ x:DX, y:DY + 50, vx:Math.cos(aim + o) * sp, vy:Math.sin(aim + o) * sp }); });
          if (ph === 3) { const tx = rand(60, 900); fire.push({ x:tx, y:-20, vx:0, vy:sp * .8 }); }
        }
        if (stT <= 0) startQuestion();
      }
      for (let i = fire.length - 1; i >= 0; i--) {
        const f = fire[i]; f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.y > H + 30 || f.x < -30 || f.x > W + 30) { fire.splice(i, 1); continue; }
        if (Math.hypot(f.x - p.x, f.y - (p.y - 22)) < 26 && p.invT <= 0) { fire.splice(i, 1); p.invT = 1.4; noHit = false; sfx.hit(); gameEvent(false); say(pick(['Ai! Essa foi quente!', 'Opa! Continue desviando!'])); }
      }
      if (state === 'question') { Q.arm -= dt; if (Q.arm <= 0) for (const o of orbs) if (!o.dead && Math.hypot(o.x - p.x, o.y - (p.y - 20)) < 40) { touchOrb(o); break; } }
      if (state === 'shot' && shot) {
        const vx = DX - shot.x, vy = DY - shot.y, d = Math.hypot(vx, vy);
        if (d < 30) {
          shot = null; hp--; flash = .5; sfx.hit(); burst(parts, DX, DY, '#f4bd2a', 26);
          if (hp <= 0) { won = true; state = 'win'; sfx.level(); confetti(140); say('Você conseguiu! O Dragão Guloso aprendeu a dividir e virou seu amigo! 💚'); setTimeout(() => { if (!alive) return; grant('dragona', 'Prêmio do Dragão'); finishPhase('O Dragão Guloso aprendeu a dividir! O reino está salvo! 👑'); }, 2800); }
          else { say(hp === 4 || hp === 2 ? 'Acertou! O dragão ficou bravo... ele vai atacar mais forte!' : 'Acertou em cheio! 🎯'); setTimeout(() => { if (alive && !won) startAttack(); }, 1200); state = 'pause'; }
        } else { shot.x += vx / d * 700 * dt; shot.y += vy / d * 700 * dt; }
      }
    }
    // draw
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a2350'); gr.addColorStop(1, '#5a3a3a'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = '#6b4a4a'; for (let y = 290; y < H; y += 40) for (let x = (y / 40) % 2 * 40; x < W; x += 80) c.fillRect(x, y, 40, 40);
    c.fillStyle = '#2a1a3a'; for (let x = 0; x < W; x += 120) { c.fillRect(x + 20, 0, 50, 40); }
    [[90, 200], [W - 90, 200]].forEach(([x, y]) => { c.fillStyle = '#7a4b23'; c.fillRect(x - 5, y, 10, 40); emoji(c, '🔥', x, y - 8 + Math.sin(t * 8 + x) * 2, 28); });
    const bob = Math.sin(t * 2) * 6;
    if (flash > 0) { c.fillStyle = `rgba(255,107,91,${flash})`; c.beginPath(); c.arc(DX, DY + bob, 100, 0, 7); c.fill(); }
    if (state === 'win' || won) { emoji(c, '🐲', DX, DY + bob, 150); emoji(c, '💚', DX + 80, DY - 60 + Math.sin(t * 4) * 6, 34); }
    else {
      c.save(); c.translate(DX, DY + bob); if (flash > 0) c.rotate(Math.sin(t * 50) * .08); c.scale(Math.sin(t * 1.2) > 0 ? 1 : -1, 1); emoji(c, '🐉', 0, 0, 150); c.restore();
      if (state === 'question') for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; emoji(c, '💫', DX + Math.cos(a) * 70, DY - 70 + Math.sin(a) * 14, 24); }
    }
    c.font = `24px ${EMOJI}`; c.textAlign = 'center'; c.fillText('❤️'.repeat(hp) + '🤍'.repeat(6 - hp), DX, 28);
    for (const f of fire) emoji(c, '🔥', f.x, f.y, 30);
    if (shot) { c.fillStyle = '#f4bd2a'; c.beginPath(); c.arc(shot.x, shot.y, 22, 0, 7); c.fill(); }
    if (state === 'question' && Q) {
      c.fillStyle = 'rgba(253,240,200,.95)'; rrect(c, W / 2 - 300, 236, 600, 44, 14); c.fill();
      c.fillStyle = '#2a2140'; c.font = "24px 'Lilita One',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(Q.text, W / 2, 259);
      for (const o of orbs) {
        if (o.dead) continue;
        const glow = Q.tries >= 2 && o.v === Q.a, yy = o.y + Math.sin(t * 3 + o.x) * 5;
        if (glow) { c.fillStyle = 'rgba(244,189,42,.45)'; c.beginPath(); c.arc(o.x, yy, 44, 0, 7); c.fill(); }
        c.fillStyle = '#fdf0c8'; c.beginPath(); c.arc(o.x, yy, 32, 0, 7); c.fill(); c.strokeStyle = '#cf8d3c'; c.lineWidth = 4; c.stroke();
        c.fillStyle = '#2a2140'; c.font = "32px 'Lilita One',sans-serif"; c.fillText(o.v, o.x, yy + 2);
      }
    }
    drawBluu(c, bl.x, bl.y, 1, save.equip.hat, t);
    if (p.invT <= 0 || Math.floor(t * 10) % 2) drawHero(c, p.x, p.y, 1.1, save.equip, t, p.moving, p.face);
    partsDraw(c, parts, 1 / 60);
  });
  startAttack();
  if (DEBUG) window.__g = { p, get state() { return state; }, get orbs() { return orbs; }, get Q() { return Q; }, get hp() { return hp; }, set stT(v) { stT = v; } };
  return { stop() { alive = false; stopLoop(); if (mini) mini.remove(); }, hint() { if (state === 'question' && Q) say(Q.hint); else say('Ande pelo chão do castelo e desvie das bolas de fogo. Quando o dragão cansar, vão aparecer bolas com números!'); } };
};

/* ================= EVENTS ================= */
let wipeArmed = false;
document.addEventListener('click', ev => {
  const t = ev.target;
  const isl = t.closest('[data-island]'); if (isl) return enterIsland(+isl.dataset.island);
  const cat = t.closest('[data-cat]'); if (cat) return renderShop(cat.dataset.cat);
  const buy = t.closest('[data-buy]');
  if (buy) { const id = buy.dataset.buy; if (save.coins >= SHOP[id]) { save.coins -= SHOP[id]; save.owned.push(id); save.equip[catOf(id)] = id; persist(); sfx.yay(); confetti(30); toast(`Comprou: ${ITEMS[catOf(id)][id].n}!`); renderShop(catOf(id)); } return; }
  const eq = t.closest('[data-equip]'); if (eq) { const id = eq.dataset.equip; save.equip[catOf(id)] = id; persist(); sfx.pop(); return renderShop(catOf(id)); }
  const a = t.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (act === 'map') { closeOverlay(); stopGame(); RUN = null; return renderMap(); }
  if (act === 'leave') { stopGame(); RUN = null; return renderMap(); }
  if (act === 'begin') return beginIsland(+a.dataset.i);
  if (act === 'again') { closeOverlay(); return enterIsland(+a.dataset.i); }
  if (act === 'shop') return renderShop();
  if (act === 'road') return renderRoad();
  if (act === 'teacher') return renderTeacher();
  if (act === 'emote') { if (shopStop) shopStop(); shopStop = heroScene($('#shopCv'), { emote:save.equip.emote }); setTimeout(() => { if (!$('#sShop').hidden) { shopStop(); shopStop = heroScene($('#shopCv')); } }, 2500); return; }
  if (act === 'hint') { if (CUR) CUR.hint(); return; }
  if (act === 'speak') return speak(lastSay);
  if (act === 'sound') { save.sound = !save.sound; persist(); return refreshToggles(); }
  if (act === 'voice') { save.voice = !save.voice; persist(); refreshToggles(); if (save.voice) speak('Oi! Eu sou o Bluu. Vou ler tudo para você.'); else try { speechSynthesis.cancel(); } catch (e) {} return; }
  if (act === 'backup') {
    const code = toBackupCode(save), ta = $('#backupTxt'); ta.value = code; ta.select();
    navigator.clipboard?.writeText(code).then(() => toast('Código copiado! Guarde num lugar seguro.'), () => toast('Selecionei o código: copie com Ctrl+C.'));
    return;
  }
  if (act === 'restore') {
    try { const data = fromBackupCode($('#backupTxt').value); adopt(data); persist(); toast('Progresso restaurado!'); renderTeacher(); }
    catch (e) { toast('Esse código não funcionou. Confira se copiou ele inteiro.'); }
    return;
  }
  if (act === 'unlockall') { save.teacher = !save.teacher; persist(); return renderTeacher(); }
  if (act === 'wipe') {
    if (!wipeArmed) { wipeArmed = true; a.textContent = 'Tem certeza? Clique de novo para apagar'; setTimeout(() => { wipeArmed = false; a.textContent = 'Apagar todo o progresso'; }, 4000); return; }
    wipeArmed = false; save = fresh(); persist(); toast('Progresso apagado.'); return renderTeacher();
  }
});
document.addEventListener('change', ev => {
  const k = ev.target.dataset && ev.target.dataset.step; if (!k) return;
  if (k === 'game') { save.game.step = +ev.target.value; save.game.win = []; } else { save.math[k].step = +ev.target.value; save.math[k].win = []; }
  persist(); toast('Degrau alterado.'); renderTeacher();
});

titleStop = heroScene($('#titleCv'));
if (save.trophies > 0) $('#playBtn').textContent = 'Continuar ▶';
