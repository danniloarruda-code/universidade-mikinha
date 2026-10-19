// Cloud sync: the parent signs in with Google once per device, and the progress is
// kept in Firestore at familias/{uid}/perfis/mikinha. The newest copy always wins.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { firebaseConfig } from './firebase-config.js';
import { loadLocal, onSave, replaceProgress } from './storage.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null, state = 'loading', lastSync = 0, error = '', timer = null, queued = null;
const ref = () => doc(db, 'familias', user.uid, 'perfis', 'mikinha');
const hhmm = t => new Date(t).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

async function push(data) {
  if (!user) return;
  state = 'saving'; render();
  try {
    // stored as text so any shape of progress object is accepted by Firestore
    await setDoc(ref(), { progresso:JSON.stringify(data), atualizadoEm:data.updatedAt || Date.now(), salvoEm:serverTimestamp() });
    lastSync = Date.now(); state = 'on'; error = '';
  } catch (e) { state = 'error'; error = e.code || e.message; }
  render();
}

async function pull() {
  state = 'saving'; render();
  try {
    const snap = await getDoc(ref());
    const local = loadLocal();
    const remote = snap.exists() ? JSON.parse(snap.data().progresso) : null;
    if (remote && (!local || (remote.updatedAt || 0) > (local.updatedAt || 0))) { replaceProgress(remote); lastSync = Date.now(); state = 'on'; render(); }
    else if (local) await push(local);
    else { state = 'on'; render(); }
  } catch (e) { state = 'error'; error = e.code || e.message; render(); }
}

function schedule(data) {
  if (!user) return;
  queued = data; clearTimeout(timer);
  timer = setTimeout(() => { const d = queued; queued = null; push(d); }, 4000);
}
function flush() { if (queued && user) { clearTimeout(timer); const d = queued; queued = null; push(d); } }

onSave(schedule);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

onAuthStateChanged(auth, u => {
  user = u;
  if (u) pull(); else { state = 'off'; render(); }
});

async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt:'select_account' });
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, provider);
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') { state = 'error'; error = e.code || e.message; render(); }
  }
}

/* ---------- UI: a panel in the teacher screen and a status pill on the map ---------- */
const panel = document.createElement('div');
panel.className = 'panel';
panel.innerHTML = `<h3>☁️ Salvar na nuvem</h3><p class="muted" id="cloudMsg" style="margin:6px 0 10px"></p>
  <div class="row"><button class="btn small" id="cloudIn">Entrar com Google</button><button class="btn alt small" id="cloudSync">Sincronizar agora</button><button class="btn alt small" id="cloudOut">Sair desta conta</button></div>`;
document.querySelector('#sTeacher .stage .bar').after(panel);
const pill = document.createElement('span');
pill.className = 'pill'; pill.id = 'cloudPill';
document.querySelector('#mTro').before(pill);

panel.querySelector('#cloudIn').onclick = signIn;
panel.querySelector('#cloudOut').onclick = () => { flush(); signOut(auth); };
panel.querySelector('#cloudSync').onclick = () => pull();

function render() {
  const msg = panel.querySelector('#cloudMsg'), on = !!user;
  panel.querySelector('#cloudIn').hidden = on;
  panel.querySelector('#cloudOut').hidden = !on;
  panel.querySelector('#cloudSync').hidden = !on;
  if (state === 'loading') msg.textContent = 'Verificando conexão...';
  else if (!on) msg.textContent = 'Não conectado. O progresso fica só neste aparelho. Entre com a sua conta Google para guardar na nuvem e ver o relatório em outros aparelhos, como o seu celular.';
  else if (state === 'saving') msg.textContent = `Conectado como ${user.email}. Salvando...`;
  else if (state === 'error') msg.textContent = `Conectado como ${user.email}, mas houve um erro ao salvar (${error}). O progresso continua guardado neste aparelho e será enviado depois.`;
  else msg.textContent = `Conectado como ${user.email}. Tudo salvo na nuvem${lastSync ? ` às ${hhmm(lastSync)}` : ''}.`;
  pill.textContent = !on ? '☁️ Só neste aparelho' : state === 'error' ? '☁️ Erro ao salvar' : state === 'saving' ? '☁️ Salvando...' : '☁️ Salvo';
  pill.title = 'Salvamento na nuvem (veja no Modo professor)';
}
render();
