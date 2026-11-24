import { EXERCISES, EX_BY_ID, PATTERNS, MUSCLE_NAMES, EQ_NAMES, imgUrl, alternatives } from './exercises.js';
import {
  PROGRAMS, programState, weekInfo, buildSession, buildTestSession, prescribeSwap, progressionPreview,
  computeExerciseStates, sortedSessions, weeklyVolume, nutrition, todayStr, weekStart, parseDay, daysBetween, exerciseForSlot,
} from './program.js';
import {
  loadState, saveState, touchMeta, loadActive, saveActive, mergeStates, defaultState,
  loadGh, saveGh, ghConfigured, syncWithGithub, testGithub,
} from './storage.js';
import { lineChart, barChart, columnChart } from './charts.js';

// ---------------- estado global ----------------
let state = loadState();
let active = loadActive();          // entrenamiento en curso
let view = active ? 'workout' : 'hoy';
let modal = null;                   // { type, ... }
let progEx = null;                  // ejercicio seleccionado en Progreso
let exFilter = '';
let openHist = null;
let sync = { st: 'idle', msg: '' };
let timer = null;                   // { end, total }
let timerInt = null;
let audioCtx = null;

const $app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const fmtKg = w => (w == null || w === '') ? '' : (+(+w).toFixed(2)).toString();
const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmtDay = s => { const d = parseDay(s); return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`; };
const unitOf = ex => ex.mode === 'time' ? 's' : 'reps';

function persist() { saveState(state); scheduleSync(); }
function persistActive() { saveActive(active); }

// ---------------- sincronización ----------------
let syncTimer = null;
function scheduleSync(delay = 1200) {
  if (!ghConfigured()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(doSync, delay);
}
async function doSync(manual = false) {
  if (!ghConfigured()) { if (manual) toast('Configura GitHub en Ajustes primero.'); return; }
  if (!navigator.onLine) { sync = { st: 'off', msg: 'Sin conexión: se sincronizará luego' }; updateSyncBadge(); return; }
  sync = { st: 'busy', msg: 'Sincronizando…' }; updateSyncBadge();
  try {
    state = await syncWithGithub(state);
    saveState(state);
    sync = { st: 'ok', msg: 'Sincronizado ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) };
    if (manual) toast('Datos sincronizados con GitHub');
  } catch (e) {
    sync = { st: 'err', msg: e.message };
    if (manual) toast('Error: ' + e.message);
  }
  if (view !== 'workout' && !modal) render(); else updateSyncBadge();
}
function syncBadge() {
  if (!ghConfigured()) return `<button class="sync idle" data-act="go" data-view="ajustes" title="Sin sincronizar">☁︎ local</button>`;
  return `<button class="sync ${sync.st}" data-act="sync" title="${esc(sync.msg)}">${sync.st === 'busy' ? '⟳' : sync.st === 'err' ? '⚠︎' : '☁︎'} ${sync.st === 'err' ? 'error' : sync.st === 'busy' ? '…' : 'GitHub'}</button>`;
}
function updateSyncBadge() { document.querySelectorAll('.sync').forEach(el => { el.outerHTML = syncBadge(); }); }
window.addEventListener('online', () => scheduleSync(200));

// ---------------- utilidades UI ----------------
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}
function img(id, cls = 'thumb', n = 0) {
  return `<img class="${cls}" src="${imgUrl(id, n)}" alt="" loading="lazy" onerror="this.classList.add('noimg')">`;
}
function beep() {
  try {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, now + t); g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);
      o.start(now + t); o.stop(now + t + 0.2);
    });
  } catch { }
  navigator.vibrate?.([200, 100, 200]);
}
function unlockAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { }
}

// ---------------- render principal ----------------
function render() {
  if (!state.onboarded) { $app.innerHTML = viewOnboarding(); return; }
  let body = '';
  if (view === 'workout' && active) body = viewWorkout();
  else {
    if (view === 'workout') view = 'hoy';
    body = ({ hoy: viewHoy, progreso: viewProgreso, ejercicios: viewEjercicios, guia: viewGuia, ajustes: viewAjustes }[view] || viewHoy)();
  }
  const resume = active && view !== 'workout'
    ? `<button class="resume" data-act="go" data-view="workout">▶ Continuar entrenamiento: ${esc(active.name)}</button>` : '';
  const nav = view === 'workout' ? '' : `
    <nav class="tabs">
      ${tab('hoy', '🏋️', 'Hoy')}${tab('progreso', '📈', 'Progreso')}${tab('ejercicios', '🖼️', 'Máquinas')}${tab('guia', '📘', 'Guía')}${tab('ajustes', '⚙️', 'Ajustes')}
    </nav>`;
  $app.innerHTML = `<main class="view ${view}">${body}</main>${resume}${nav}${modal ? viewModal() : ''}${timerHtml()}`;
}
const tab = (v, icon, label) => `<button class="tab ${view === v ? 'on' : ''}" data-act="go" data-view="${v}"><span>${icon}</span>${label}</button>`;

// ---------------- onboarding ----------------
function viewOnboarding() {
  const p = state.profile;
  return `<main class="view onboarding">
    <h1>Tu entrenador personal</h1>
    <p class="lead">Te preparo un plan según tus días disponibles y lo voy ajustando con cada entreno: cuánto peso poner, cuándo subirlo y cuándo descansar.</p>
    <div class="card">
      <h3>Sobre ti</h3>
      <p class="muted small">Sirve para calcular calorías y proteína. Puedes dejarlo en blanco.</p>
      <div class="grid2">
        <label>Sexo<select id="ob-sex"><option value="hombre" ${p.sex !== 'mujer' ? 'selected' : ''}>Hombre</option><option value="mujer" ${p.sex === 'mujer' ? 'selected' : ''}>Mujer</option></select></label>
        <label>Edad<input id="ob-age" type="number" inputmode="numeric" value="${esc(p.age)}" placeholder="años"></label>
        <label>Altura<input id="ob-height" type="number" inputmode="numeric" value="${esc(p.height)}" placeholder="cm"></label>
        <label>Peso<input id="ob-weight" type="number" inputmode="decimal" value="${esc(p.weight)}" placeholder="kg"></label>
      </div>
    </div>
    <div class="card">
      <h3>¿Cuántos días a la semana quieres entrenar?</h3>
      <div class="seg" id="ob-days">
        ${[2, 3, 4].map(d => `<button class="${state.settings.days === d ? 'on' : ''}" data-act="ob-days" data-d="${d}">${d} días</button>`).join('')}
      </div>
      <p class="muted small">${esc(PROGRAMS[{ 2: 'fb2', 3: 'fb3', 4: 'ul4' }[state.settings.days]].name)}. Lo puedes cambiar cuando quieras; si un día no vas, el plan se reajusta solo.</p>
    </div>
    <div class="card">
      <h3>Objetivo</h3>
      <p>Perder grasa y ganar fuerza (recomposición): entrenamiento de fuerza progresivo, mucha proteína y un déficit calórico moderado.</p>
    </div>
    <button class="btn primary big" data-act="ob-finish">Crear mi plan</button>
  </main>`;
}

// ---------------- HOY ----------------
function viewHoy() {
  const ps = programState(state);
  const wk = weekInfo(state);
  const sessions = sortedSessions(state);
  const hasTest = sessions.some(s => s.type === 'test');
  const exStates = computeExerciseStates(state);
  const preview = buildSession(state);
  const banners = [];

  if (!sessions.length && !hasTest) {
    banners.push(`<div class="banner accent">
      <b>Empieza calibrando tu plan</b>
      <p>Haz una <b>sesión de prueba</b>: en cada ejercicio principal buscas un peso que puedas mover unas 10 veces con buena técnica y me dices peso, repeticiones y qué tal fue. Con eso calculo tus pesos de partida.</p>
      <div class="row"><button class="btn primary" data-act="start-test">Hacer sesión de prueba</button></div>
      <p class="muted small">Si prefieres empezar directamente, la primera vez que hagas cada ejercicio también sirve de calibración.</p>
    </div>`);
  }
  if (ps.gapDays != null && ps.gapDays >= 14) {
    banners.push(`<div class="banner warn"><b>Bienvenido de vuelta</b><p>Llevas ${ps.gapDays} días sin entrenar. Hoy bajo los pesos un 10% para que retomes sin lesionarte; en 1-2 sesiones vuelves a donde estabas.</p></div>`);
  }
  if (ps.deload) {
    banners.push(`<div class="banner info"><b>Semana de descarga</b><p>Tras 4 semanas apretando toca bajar: la mitad de series y -10% de peso. Así recuperas y sigues progresando el bloque siguiente.</p></div>`);
  } else if (ps.blockWeek >= 2) {
    banners.push(`<div class="banner info"><b>Semana ${ps.blockWeek + 1} del bloque</b><p>Subimos volumen: +1 serie en los ejercicios principales.</p></div>`);
  }
  // reajuste semanal si faltan días
  let combineN = 0;
  if (!wk.trainedToday && wk.remaining >= 2 && wk.availableDays < wk.remaining) {
    combineN = Math.min(wk.remaining - wk.availableDays + 1, ps.prog.templates.length);
  }
  if (wk.trainedToday) {
    banners.push(`<div class="banner ok"><b>¡Hoy ya has entrenado!</b><p>Descansa, come proteína y duerme bien: el músculo crece cuando recuperas. ${wk.remaining ? `Te quedan ${wk.remaining} sesión(es) esta semana.` : 'Semana completada 💪'}</p></div>`);
  } else if (combineN >= 2) {
    banners.push(`<div class="banner warn"><b>Reajuste de la semana</b>
      <p>Te quedan ${wk.availableDays} día(s) esta semana y ${wk.remaining} sesiones pendientes. Te propongo una <b>sesión combinada</b> con lo más importante de las próximas ${combineN} sesiones, para que ningún músculo se quede sin entrenar.</p>
      <div class="row"><button class="btn primary" data-act="start-combined" data-n="${combineN}">Hacer sesión combinada</button></div>
      <p class="muted small">O haz la sesión normal: la rotación sigue donde la dejaste, no te saltas nada.</p></div>`);
  }

  const dots = Array.from({ length: wk.target }, (_, i) => `<span class="dot ${i < wk.doneUnits ? 'on' : ''}"></span>`).join('');
  const recent = sessions.slice(-3).reverse().map(s => `<li><span>${esc(fmtDay(s.date))}</span><b>${esc(s.name)}</b><span class="muted">${countSets(s)} series</span></li>`).join('');

  return `
    <header class="top"><div><h1>Hoy</h1><p class="muted">${esc(fmtDay(todayStr()))}</p></div>${syncBadge()}</header>
    <div class="card week">
      <div><b>Esta semana</b><span class="muted"> · ${wk.doneUnits}/${wk.target} sesiones</span></div>
      <div class="dots">${dots}</div>
    </div>
    ${banners.join('')}
    <div class="card next">
      <div class="next-head">
        <div><p class="muted small">PRÓXIMA SESIÓN · ${esc(ps.prog.name)}</p><h2>${esc(preview.name)}</h2>
        <p class="muted small">Bloque: semana ${ps.blockWeek + 1} de 5${ps.deload ? ' (descarga)' : ''}</p></div>
      </div>
      <ul class="exlist">
        ${preview.exercises.map(e => {
          const ex = EX_BY_ID[e.exId];
          const es = exStates[e.exId];
          const load = ex.mode !== 'weight' ? '' : e.w != null ? ` · <b>${fmtKg(e.w)} kg</b>` : ' · <span class="tag">calibrar</span>';
          return `<li data-act="exinfo" data-id="${e.exId}">${img(e.exId)}<div><b>${esc(ex.name)}</b><span class="muted small">${e.targetSets} × ${e.min}–${e.max} ${unitOf(ex)}${load}${es?.lastEvent === 'up' ? ' <span class="tag up">▲ sube</span>' : ''}</span></div></li>`;
        }).join('')}
      </ul>
      <div class="row">
        <button class="btn primary big" data-act="start" ${active ? 'disabled' : ''}>Empezar entrenamiento</button>
      </div>
      <div class="row">
        <button class="btn ghost" data-act="pick-template">Elegir otra sesión</button>
        ${hasTest || sessions.length ? `<button class="btn ghost" data-act="start-test">Repetir prueba</button>` : ''}
      </div>
    </div>
    ${recent ? `<div class="card"><h3>Últimos entrenos</h3><ul class="recent">${recent}</ul></div>` : ''}
  `;
}
const countSets = s => (s.exercises || []).reduce((n, e) => n + (e.sets || []).filter(x => x.done).length, 0);

// ---------------- ENTRENAMIENTO ----------------
function viewWorkout() {
  const a = active;
  const exStates = computeExerciseStates(state);
  const mins = Math.max(0, Math.round((Date.now() - new Date(a.start).getTime()) / 60000));
  const intro = a.type === 'test' ? `<div class="banner accent"><b>Cómo hacer la prueba</b>
    <ol class="small">
      <li>Calienta con 1-2 series ligeras (no las apuntes).</li>
      <li>Sube el peso hasta uno que puedas mover <b>8-12 veces con buena técnica</b>, dejando 1-2 repeticiones en reserva. No vayas al fallo.</li>
      <li>Apunta esa serie (y una segunda si quieres) con su peso y repeticiones, y marca cómo te ha ido.</li>
      <li>Si una máquina no está o está ocupada, pulsa <b>Cambiar máquina</b>.</li>
    </ol></div>` : a.comeback ? `<div class="banner warn small">Vuelta tras un parón: pesos al 90%.</div>` : a.deload ? `<div class="banner info small">Descarga: pocas series y peso suave. Sin apretar.</div>` : '';

  const cards = a.exercises.map((e, i) => {
    const ex = EX_BY_ID[e.exId];
    const es = exStates[e.exId];
    const last = es?.history?.[es.history.length - 1];
    const lastTxt = last ? (ex.mode === 'weight'
      ? `Última vez (${esc(fmtDay(last.date))}): ${last.w.map((w, k) => `${fmtKg(w)}×${last.reps[k]}`).join(', ')}`
      : `Última vez: ${last.reps.join(', ')} ${unitOf(ex)}`) : '';
    const allDone = e.sets.length && e.sets.every(s => s.done);
    const hint = a.type === 'test'
      ? `Busca un peso para ~10 ${unitOf(ex)} con 1-2 en reserva.`
      : e.firstTime && ex.mode === 'weight'
        ? `Primera vez: empieza ligero y sube hasta un peso que te permita ${e.min}-${e.max} repeticiones dejando 2 en reserva.`
        : `Objetivo: ${e.targetSets} series de ${e.min}-${e.max} ${unitOf(ex)}${ex.mode === 'weight' ? ` con ${fmtKg(e.w)} kg` : ''}. Intenta llegar a ${e.targetReps}.`;
    return `<section class="card excard ${allDone ? 'done' : ''}" id="ex-${i}">
      <div class="exhead">
        <div class="imgbox" data-act="flipimg" data-i="${i}">${img(e.exId, 'photo', a.flip?.[i] ? 1 : 0)}<span class="flip">↻</span></div>
        <div class="exinfo">
          <p class="muted small">${i + 1}/${a.exercises.length} · ${esc(PATTERNS[ex.pattern].name)}</p>
          <h3>${esc(ex.name)}</h3>
          <span class="chip">${esc(EQ_NAMES[ex.eq])}</span>
          <button class="btn small ghost" data-act="swap" data-i="${i}">⇄ Cambiar máquina</button>
        </div>
      </div>
      <p class="hint">${hint}${e.note ? ` <span class="tag">${esc(e.note)}</span>` : ''}</p>
      ${lastTxt ? `<p class="muted small">${lastTxt}</p>` : ''}
      <details><summary>Cómo se hace</summary><p class="small">${esc(ex.tip)}</p></details>
      <table class="sets">
        <thead><tr><th>Serie</th>${ex.mode === 'weight' ? '<th>kg</th>' : ''}<th>${ex.mode === 'time' ? 'seg' : 'reps'}</th><th></th></tr></thead>
        <tbody>${e.sets.map((s, j) => `<tr class="${s.done ? 'ok' : ''}">
          <td>${j + 1}</td>
          ${ex.mode === 'weight' ? `<td><input type="number" inputmode="decimal" step="0.5" data-field="w" data-i="${i}" data-j="${j}" value="${esc(s.w)}" placeholder="${e.w != null ? fmtKg(e.w) : 'kg'}"></td>` : ''}
          <td><input type="number" inputmode="numeric" data-field="r" data-i="${i}" data-j="${j}" value="${esc(s.r)}" placeholder="${e.targetReps}"></td>
          <td><button class="check ${s.done ? 'on' : ''}" data-act="check" data-i="${i}" data-j="${j}">✓</button></td>
        </tr>`).join('')}</tbody>
      </table>
      <div class="row between">
        <div class="row tight"><button class="btn small ghost" data-act="addset" data-i="${i}">+ serie</button>${e.sets.length > 1 ? `<button class="btn small ghost" data-act="delset" data-i="${i}">− serie</button>` : ''}</div>
      </div>
      <div class="diff">
        <span class="muted small">¿Qué tal?</span>
        ${[['facil', 'Fácil'], ['bien', 'Bien'], ['limite', 'Al límite']].map(([k, l]) => `<button class="${e.diff === k ? 'on' : ''}" data-act="diff" data-i="${i}" data-k="${k}">${l}</button>`).join('')}
      </div>
    </section>`;
  }).join('');

  return `
    <header class="top sticky">
      <button class="btn ghost small" data-act="go" data-view="hoy">‹ Salir</button>
      <div class="center"><b>${esc(a.name)}</b><span class="muted small"> · ${mins} min</span></div>
      <button class="btn primary small" data-act="finish">Terminar</button>
    </header>
    ${intro}
    ${cards}
    <div class="row">
      <button class="btn danger ghost" data-act="discard">Descartar entrenamiento</button>
    </div>`;
}

function timerHtml() {
  if (!timer) return '';
  const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  const m = Math.floor(left / 60), s = String(left % 60).padStart(2, '0');
  return `<div class="timer ${left === 0 ? 'zero' : ''}" id="timer">
    <span>Descanso</span><b id="timer-t">${m}:${s}</b>
    <button data-act="timer-add">+30s</button><button data-act="timer-stop">✕</button>
  </div>`;
}
function startTimer(sec) {
  timer = { end: Date.now() + sec * 1000, total: sec, beeped: false };
  clearInterval(timerInt);
  timerInt = setInterval(tickTimer, 500);
  const old = document.getElementById('timer');
  if (old) old.outerHTML = timerHtml(); else $app.insertAdjacentHTML('beforeend', timerHtml());
}
function tickTimer() {
  if (!timer) { clearInterval(timerInt); return; }
  const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  const el = document.getElementById('timer-t');
  if (el) el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  if (left === 0 && !timer.beeped) {
    timer.beeped = true; beep();
    document.getElementById('timer')?.classList.add('zero');
    setTimeout(() => { if (timer && timer.beeped) stopTimer(); }, 8000);
  }
}
function stopTimer() { timer = null; clearInterval(timerInt); document.getElementById('timer')?.remove(); }

// ---------------- PROGRESO ----------------
function viewProgreso() {
  const exStates = computeExerciseStates(state);
  const done = Object.keys(exStates).filter(id => exStates[id].history.length);
  if (!progEx || !exStates[progEx]) progEx = done.sort((a, b) => exStates[b].history.length - exStates[a].history.length)[0] || null;
  const sessions = sortedSessions(state);

  let exBlock = `<p class="muted">Cuando completes tu primer entreno verás aquí tu evolución.</p>`;
  if (progEx) {
    const ex = EX_BY_ID[progEx], es = exStates[progEx];
    const byDay = {};
    for (const h of es.history) {
      const v = ex.mode === 'weight' ? h.e1 : Math.max(...h.reps);
      byDay[h.date] = Math.max(byDay[h.date] || 0, v);
    }
    const pts = Object.keys(byDay).sort().map(d => ({ x: d, y: byDay[d] }));
    const first = pts[0].y, lastv = pts[pts.length - 1].y;
    const pct = first ? ((lastv - first) / first) * 100 : 0;
    exBlock = `
      <select data-field="progEx">${done.map(id => `<option value="${id}" ${id === progEx ? 'selected' : ''}>${esc(EX_BY_ID[id].name)}</option>`).join('')}</select>
      <p class="muted small">${ex.mode === 'weight' ? 'Fuerza estimada (1RM): el peso máximo que podrías levantar una vez, calculado con tus series.' : 'Mejor serie de cada día.'}</p>
      ${lineChart(pts, { unit: ex.mode === 'weight' ? 'kg' : unitOf(ex) })}
      <div class="stats">
        <div><b>${+lastv.toFixed(1)}</b><span>actual</span></div>
        <div><b>${+es.best.toFixed(1)}</b><span>mejor</span></div>
        <div><b class="${pct >= 0 ? 'pos' : 'neg'}">${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%</b><span>desde el inicio</span></div>
        ${ex.mode === 'weight' && es.w != null ? `<div><b>${fmtKg(es.w)}</b><span>kg próxima</span></div>` : ''}
      </div>`;
  }

  // volumen semanal por músculo (últimos 7 días)
  const to = todayStr(), from = todayStr(new Date(Date.now() - 6 * 86400000));
  const vol = weeklyVolume(state, from, to);
  const muscles = ['pecho', 'espalda', 'hombro', 'cuadriceps', 'femoral', 'gluteo', 'biceps', 'triceps', 'gemelo', 'core'];
  const bars = muscles.map(m => ({ label: MUSCLE_NAMES[m], value: vol[m] || 0, target: ['gemelo', 'core', 'biceps', 'triceps'].includes(m) ? [3, 10] : [6, 14] }));

  // sesiones por semana (8 semanas)
  const cols = [];
  for (let k = 7; k >= 0; k--) {
    const ws = weekStart(new Date(Date.now() - k * 7 * 86400000));
    const we = todayStr(new Date(parseDay(ws).getTime() + 6 * 86400000));
    const n = sessions.filter(s => s.type !== 'test' && s.date >= ws && s.date <= we).reduce((a, s) => a + (s.advance || 1), 0);
    const d = parseDay(ws);
    cols.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, value: n });
  }

  const bw = [...(state.bodyweight || [])].sort((a, b) => a.date.localeCompare(b.date));
  const hist = [...sessions].reverse().map(s => `
    <li class="${openHist === s.id ? 'open' : ''}">
      <div class="hrow" data-act="hist" data-id="${s.id}"><span>${esc(fmtDay(s.date))}</span><b>${esc(s.name)}</b><span class="muted">${countSets(s)} series</span></div>
      ${openHist === s.id ? `<div class="hdet">${s.exercises.map(e => {
        const ex = EX_BY_ID[e.exId]; const d = e.sets.filter(x => x.done);
        return d.length ? `<p><b>${esc(ex?.name || e.exId)}</b>: ${d.map(x => ex?.mode === 'weight' ? `${fmtKg(x.w)}×${x.r}` : `${x.r}`).join(', ')}</p>` : '';
      }).join('')}<button class="btn small danger ghost" data-act="del-session" data-id="${s.id}">Borrar entreno</button></div>` : ''}
    </li>`).join('');

  return `
    <header class="top"><div><h1>Progreso</h1></div>${syncBadge()}</header>
    <div class="card"><h3>Fuerza por ejercicio</h3>${exBlock}</div>
    <div class="card"><h3>Series por músculo (últimos 7 días)</h3>
      <p class="muted small">La franja clara es el rango recomendado para tu nivel. Verde: dentro; naranja: por debajo.</p>
      ${barChart(bars, { max: 16 })}</div>
    <div class="card"><h3>Sesiones por semana</h3>${columnChart(cols, { target: state.settings.days })}</div>
    <div class="card"><h3>Peso corporal</h3>
      ${lineChart(bw.map(b => ({ x: b.date, y: b.kg })), { unit: 'kg', empty: 'Apunta tu peso para ver la tendencia' })}
      <div class="row"><input id="bw-in" type="number" inputmode="decimal" step="0.1" placeholder="kg hoy"><button class="btn primary" data-act="add-bw">Guardar</button></div>
      <p class="muted small">Pésate en ayunas, 2-3 veces por semana. Fíjate en la tendencia, no en un día suelto. Objetivo sano: perder 0,5-1% de tu peso por semana.</p>
    </div>
    <div class="card"><h3>Historial</h3>${hist ? `<ul class="history">${hist}</ul>` : '<p class="muted">Sin entrenos todavía.</p>'}</div>`;
}

// ---------------- EJERCICIOS / MÁQUINAS ----------------
function viewEjercicios() {
  const q = exFilter.toLowerCase();
  const groups = Object.entries(PATTERNS).map(([pk, p]) => {
    const list = EXERCISES.filter(e => e.pattern === pk && (!q || e.name.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)));
    if (!list.length) return '';
    return `<div class="card"><h3>${esc(p.name)}</h3>
      <p class="muted small">Todas estas máquinas trabajan lo mismo: si una no está o está ocupada, usa otra de la lista.</p>
      <ul class="exgrid">${list.map(e => `<li class="${state.unavailable[e.id] ? 'na' : ''}" data-act="exinfo" data-id="${e.id}">
        ${img(e.id, 'photo')}<b>${esc(e.name)}</b><span class="chip">${esc(EQ_NAMES[e.eq])}</span>${state.unavailable[e.id] ? '<span class="tag">no en mi gym</span>' : ''}
      </li>`).join('')}</ul></div>`;
  }).join('');
  return `
    <header class="top"><div><h1>Máquinas y ejercicios</h1><p class="muted small">Toca uno para ver cómo se hace y sus sustitutos.</p></div></header>
    <input class="search" type="search" data-field="exFilter" placeholder="Buscar (prensa, jalón, bíceps…)" value="${esc(exFilter)}">
    ${groups || '<p class="muted">Nada encontrado.</p>'}`;
}

// ---------------- GUÍA ----------------
function viewGuia() {
  const n = nutrition(state.profile, state.settings.days);
  return `
    <header class="top"><div><h1>Guía del entrenador</h1><p class="muted small">En qué se basa tu plan</p></div></header>
    ${n ? `<div class="card accent-card"><h3>Tu nutrición para perder grasa y ganar fuerza</h3>
      <div class="stats">
        <div><b>${n.kcal}</b><span>kcal/día</span></div>
        <div><b>${n.protein[0]}–${n.protein[1]} g</b><span>proteína/día</span></div>
        <div><b>~${n.fat} g</b><span>grasa mínima</span></div>
      </div>
      <p class="small">Gasto estimado ${n.tdee} kcal (fórmula Mifflin-St Jeor). Te propongo un déficit del 20%. Si en 2-3 semanas tu peso no baja, quita 150-200 kcal; si bajas más de un 1% por semana o pierdes fuerza, sube un poco.</p>
      <p class="small">Camina 7.000-10.000 pasos al día: ayuda mucho a perder grasa sin quitarte energía para entrenar.</p></div>`
      : `<div class="card"><p>Rellena edad, altura y peso en <a href="#" data-act="go" data-view="ajustes">Ajustes</a> para calcular tus calorías y proteína.</p></div>`}

    <div class="card guide">
      <h3>1. Frecuencia: cada músculo, 2 veces por semana</h3>
      <p>Repartir el trabajo de un músculo en 2 sesiones semanales da igual o más resultado que hacerlo todo un día. Con 2-3 días lo ideal es <b>cuerpo completo</b>; con 4, <b>torso/pierna</b>.</p>
      <h3>2. Volumen: cuántas series</h3>
      <p>Para alguien que empieza o retoma, <b>6-12 series efectivas por músculo a la semana</b> bastan para progresar. Con experiencia se sube hacia 10-20. Tu plan empieza abajo y añade series en las semanas 3-4 de cada bloque.</p>
      <h3>3. Repeticiones e intensidad</h3>
      <p>Se gana músculo en un rango amplio (5-30 reps) si llegas cerca del fallo. Uso <b>6-12 en ejercicios básicos</b> (más fuerza) y <b>10-20 en accesorios</b> (más seguros para series largas). Cada serie efectiva debe acabar a <b>1-3 repeticiones del fallo</b> (RIR): podrías hacer 1-3 más, pero no muchas más.</p>
      <h3>4. Progresión: doble progresión</h3>
      <p>Mantienes el peso y sumas repeticiones hasta llegar al tope del rango en todas las series. Entonces subo el peso (2,5-5 kg en máquinas y barras, 1-2 kg en mancuernas) y vuelves al mínimo del rango. Si marcas "Fácil", el salto es doble. Si fallas dos veces seguidas, bajo un 10% para consolidar técnica.</p>
      <h3>5. Descansos</h3>
      <p>2-3 minutos en básicos y 1-2 en accesorios. Descansar poco reduce las repeticiones y con ellas el estímulo.</p>
      <h3>6. Bloques y descarga</h3>
      <p>4 semanas progresando y 1 de descarga (mitad de series, -10% de peso) para disipar la fatiga.</p>
      <h3>7. Si un día no vas</h3>
      <p>La rotación avanza solo cuando entrenas: si faltas, la próxima vez haces la sesión que tocaba. Si al final de la semana te quedan menos días que sesiones, te propongo una sesión combinada con los ejercicios principales. Si estás más de 2 semanas sin entrenar, los pesos bajan un 10% al volver.</p>
      <h3>8. Perder grasa sin perder músculo</h3>
      <p>Lo que más protege el músculo en déficit es: seguir entrenando pesado, 1,6-2,2 g de proteína por kg al día, un déficit moderado (no extremo) y dormir 7-9 horas. Como empiezas, es muy probable ganar fuerza y músculo mientras pierdes grasa.</p>
      <h3>9. Por qué máquinas al principio</h3>
      <p>Son más fáciles de aprender, más seguras sin ayudante y te permiten llegar cerca del fallo con poco riesgo. Producen hipertrofia comparable a los pesos libres. Más adelante puedes cambiar a barra o mancuernas desde "Cambiar máquina".</p>
      <p class="muted small">Basado en: Schoenfeld et al. (2016, 2017, 2019) sobre frecuencia, volumen y rangos de repeticiones; Pelland et al. (2024) sobre volumen; Robinson et al. (2024) sobre proximidad al fallo; posición de la ISSN sobre proteína (Jäger et al., 2017); Helms et al. (2014) sobre recomposición y déficit. Esta app no sustituye el consejo médico.</p>
    </div>`;
}

// ---------------- AJUSTES ----------------
function viewAjustes() {
  const p = state.profile, gh = loadGh();
  return `
    <header class="top"><div><h1>Ajustes</h1></div>${syncBadge()}</header>
    <div class="card">
      <h3>Días de entreno por semana</h3>
      <div class="seg">${[2, 3, 4].map(d => `<button class="${state.settings.days === d ? 'on' : ''}" data-act="set-days" data-d="${d}">${d} días</button>`).join('')}</div>
      <p class="muted small">Plan actual: ${esc(PROGRAMS[programState(state).progKey].name)}. Tus pesos se conservan al cambiar de plan.</p>
    </div>
    <div class="card">
      <h3>Perfil</h3>
      <div class="grid2">
        <label>Sexo<select data-field="profile.sex"><option value="hombre" ${p.sex !== 'mujer' ? 'selected' : ''}>Hombre</option><option value="mujer" ${p.sex === 'mujer' ? 'selected' : ''}>Mujer</option></select></label>
        <label>Edad<input type="number" inputmode="numeric" data-field="profile.age" value="${esc(p.age)}"></label>
        <label>Altura (cm)<input type="number" inputmode="numeric" data-field="profile.height" value="${esc(p.height)}"></label>
        <label>Peso (kg)<input type="number" inputmode="decimal" data-field="profile.weight" value="${esc(p.weight)}"></label>
      </div>
    </div>
    <div class="card">
      <h3>Descansos</h3>
      <div class="grid2">
        <label>Básicos (seg)<input type="number" inputmode="numeric" data-field="settings.restMain" value="${state.settings.restMain}"></label>
        <label>Accesorios (seg)<input type="number" inputmode="numeric" data-field="settings.restAcc" value="${state.settings.restAcc}"></label>
      </div>
    </div>
    <div class="card">
      <h3>Sincronizar con GitHub</h3>
      <p class="small">Tus datos se guardan en un archivo de un <b>repositorio privado</b> tuyo, así los ves igual en el iPhone y en el ordenador. Instrucciones paso a paso en el README del proyecto.</p>
      <div class="grid2">
        <label>Usuario de GitHub<input id="gh-owner" autocapitalize="off" autocorrect="off" value="${esc(gh.owner)}" placeholder="tu-usuario"></label>
        <label>Repositorio de datos<input id="gh-repo" autocapitalize="off" autocorrect="off" value="${esc(gh.repo)}" placeholder="gym-datos"></label>
        <label>Rama<input id="gh-branch" autocapitalize="off" value="${esc(gh.branch)}"></label>
        <label>Archivo<input id="gh-path" autocapitalize="off" value="${esc(gh.path)}"></label>
      </div>
      <label>Token (fine-grained, solo ese repo, permiso Contents: lectura y escritura)<input id="gh-token" type="password" autocapitalize="off" autocorrect="off" value="${esc(gh.token)}" placeholder="github_pat_…"></label>
      <p class="muted small">El token solo se guarda en este dispositivo y solo se envía a api.github.com. Tienes que ponerlo en cada dispositivo una vez.</p>
      <div class="row"><button class="btn primary" data-act="gh-save">Guardar y probar</button><button class="btn ghost" data-act="sync">Sincronizar ahora</button></div>
      ${sync.msg ? `<p class="small ${sync.st === 'err' ? 'neg' : 'muted'}">${esc(sync.msg)}</p>` : ''}
    </div>
    <div class="card">
      <h3>Copia de seguridad</h3>
      <div class="row"><button class="btn ghost" data-act="export">Exportar datos</button><label class="btn ghost">Importar<input type="file" accept="application/json" id="import-file" hidden></label></div>
    </div>
    <div class="card">
      <h3>Máquinas</h3>
      <p class="small">${Object.keys(state.unavailable).filter(k => state.unavailable[k]).length} marcadas como "no en mi gym", ${Object.keys(state.choices).length} sustituciones guardadas.</p>
      <button class="btn ghost" data-act="reset-choices">Restablecer máquinas por defecto</button>
    </div>
    <div class="card">
      <button class="btn danger ghost" data-act="wipe">Borrar todos los datos de este dispositivo</button>
    </div>
    <p class="muted small center">GymCoach · fotos de ejercicios: free-exercise-db (dominio público)</p>`;
}

// ---------------- MODALES ----------------
function viewModal() {
  const m = modal;
  let inner = '';
  if (m.type === 'swap') {
    const ent = active.exercises[m.i];
    const cur = EX_BY_ID[ent.exId];
    const alts = alternatives(ent.exId);
    inner = `<h3>Cambiar ${esc(cur.name)}</h3>
      <p class="muted small">Estas trabajan los mismos músculos. "Solo hoy" si está ocupada; "Siempre" si tu gym no la tiene.</p>
      <ul class="altlist">${alts.map(e => `<li class="${state.unavailable[e.id] ? 'na' : ''}">
        ${img(e.id, 'photo')}
        <div><b>${esc(e.name)}</b><span class="chip">${esc(EQ_NAMES[e.eq])}</span>${state.unavailable[e.id] ? '<span class="tag">no en mi gym</span>' : ''}
        <div class="row tight"><button class="btn small" data-act="swap-do" data-id="${e.id}" data-always="0">Solo hoy</button><button class="btn small primary" data-act="swap-do" data-id="${e.id}" data-always="1">Siempre</button></div></div>
      </li>`).join('')}</ul>`;
  } else if (m.type === 'exinfo') {
    const ex = EX_BY_ID[m.id];
    const alts = alternatives(m.id);
    inner = `<h3>${esc(ex.name)}</h3>
      <div class="imgpair">${img(ex.id, 'photo', 0)}${img(ex.id, 'photo', 1)}</div>
      <p class="muted small">Posición inicial y final</p>
      <span class="chip">${esc(EQ_NAMES[ex.eq])}</span> <span class="chip">${esc(PATTERNS[ex.pattern].name)}</span>
      <p>${esc(ex.tip)}</p>
      <label class="check-row"><input type="checkbox" data-field="unavail" data-id="${ex.id}" ${state.unavailable[ex.id] ? 'checked' : ''}> No está en mi gym</label>
      <h4>Sustitutos</h4>
      <ul class="altlist compact">${alts.map(e => `<li data-act="exinfo" data-id="${e.id}">${img(e.id)}<div><b>${esc(e.name)}</b><span class="chip">${esc(EQ_NAMES[e.eq])}</span></div></li>`).join('')}</ul>`;
  } else if (m.type === 'pick') {
    const ps = programState(state);
    inner = `<h3>Elegir sesión</h3><p class="muted small">Normalmente toca la siguiente de la rotación, pero puedes hacer otra si te apetece o te viene mejor.</p>
      ${ps.prog.templates.map((t, i) => `<button class="btn block ${i === ps.nextIndex ? 'primary' : ''}" data-act="start" data-t="${i}">${esc(t.name)}<span class="small"> · ${t.slots.map(s => EX_BY_ID[exerciseForSlot(state, s)].name.split(' ')[0]).join(', ')}</span></button>`).join('')}`;
  } else if (m.type === 'summary') {
    inner = `<h3>${m.saved ? '¡Entreno guardado! 💪' : 'Resumen'}</h3>
      <p class="muted small">${m.sets} series completadas en ${m.mins} min.</p>
      <ul class="summary">${m.items.map(it => `<li class="${it.event || ''}"><b>${esc(it.name)}</b><span>${esc(it.msg)}</span></li>`).join('')}</ul>
      ${m.saved ? `<button class="btn primary block" data-act="close">Perfecto</button>` : `<button class="btn primary block" data-act="save-workout">Guardar entreno</button><button class="btn ghost block" data-act="close">Seguir entrenando</button>`}`;
  } else if (m.type === 'confirm') {
    inner = `<h3>${esc(m.title)}</h3><p>${esc(m.text)}</p>
      <div class="row"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn danger" data-act="confirm-yes">${esc(m.yes || 'Sí')}</button></div>`;
  }
  return `<div class="modal-bg" data-act="close-bg"><div class="modal" role="dialog">${inner}<button class="x" data-act="close">✕</button></div></div>`;
}
function confirmBox(title, text, yes, fn) { modal = { type: 'confirm', title, text, yes, fn }; render(); }

// ---------------- acciones ----------------
function startWorkout(sess) {
  active = sess; active.flip = {};
  persistActive(); view = 'workout'; modal = null; render(); window.scrollTo(0, 0);
}

function finishWorkout() {
  const sets = active.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  if (!sets) { confirmBox('No hay series marcadas', 'Marca con ✓ las series que hayas hecho. ¿Quieres descartar este entrenamiento?', 'Descartar', () => { active = null; persistActive(); view = 'hoy'; stopTimer(); }); return; }
  const items = progressionPreview(state, cleanSession(active));
  const mins = Math.max(1, Math.round((Date.now() - new Date(active.start).getTime()) / 60000));
  modal = { type: 'summary', items, sets, mins, saved: false };
  render();
}

function cleanSession(a) {
  const s = JSON.parse(JSON.stringify(a));
  delete s.flip;
  s.end = new Date().toISOString();
  s.updatedAt = Date.now();
  s.exercises = s.exercises.map(e => ({
    exId: e.exId, slotKey: e.slotKey, pattern: e.pattern, min: e.min, max: e.max, role: e.role,
    targetSets: e.targetSets, diff: e.diff || 'bien',
    sets: e.sets.map(x => ({ w: num(x.w) ?? 0, r: num(x.r) ?? 0, done: !!x.done })),
  }));
  return s;
}

function saveWorkout() {
  const s = cleanSession(active);
  state.sessions.push(s);
  active = null; persistActive(); stopTimer();
  persist();
  modal = { ...modal, saved: true };
  view = 'hoy';
  render();
}

const handlers = {
  go(el) { view = el.dataset.view; modal = null; render(); window.scrollTo(0, 0); },
  sync() { doSync(true); },
  'ob-days'(el) {
    const g = id => document.getElementById(id).value;
    state.profile = { sex: g('ob-sex'), age: g('ob-age'), height: g('ob-height'), weight: g('ob-weight') };
    state.settings.days = +el.dataset.d; render();
  },
  'ob-finish'() {
    const g = id => document.getElementById(id).value;
    state.profile = { sex: g('ob-sex'), age: num(g('ob-age')) ?? '', height: num(g('ob-height')) ?? '', weight: num(g('ob-weight')) ?? '' };
    if (state.profile.weight) state.bodyweight.push({ id: 'bw_' + todayStr(), date: todayStr(), kg: state.profile.weight, updatedAt: Date.now() });
    state.onboarded = true; touchMeta(state); persist(); view = 'hoy'; render();
  },
  start(el) {
    if (active) { view = 'workout'; render(); return; }
    const t = el.dataset.t != null ? +el.dataset.t : undefined;
    startWorkout(buildSession(state, t != null ? { templateIndex: t } : {}));
  },
  'start-test'() { if (active) { toast('Termina o descarta el entreno en curso primero.'); return; } startWorkout(buildTestSession(state)); },
  'start-combined'(el) { if (active) return; startWorkout(buildSession(state, { combine: +el.dataset.n })); },
  'pick-template'() { modal = { type: 'pick' }; render(); },
  exinfo(el) { modal = { type: 'exinfo', id: el.dataset.id }; render(); },
  flipimg(el) {
    const i = +el.dataset.i; active.flip = active.flip || {}; active.flip[i] = !active.flip[i];
    el.querySelector('img').src = imgUrl(active.exercises[i].exId, active.flip[i] ? 1 : 0);
  },
  check(el) {
    unlockAudio();
    const i = +el.dataset.i, j = +el.dataset.j, e = active.exercises[i], s = e.sets[j], ex = EX_BY_ID[e.exId];
    if (!s.done) {
      if (s.r === '' || s.r == null) s.r = e.targetReps;
      if (ex.mode === 'weight' && (s.w === '' || s.w == null)) {
        if (e.w != null) s.w = e.w; else { toast('Pon el peso que has usado'); document.querySelector(`input[data-field=w][data-i="${i}"][data-j="${j}"]`)?.focus(); return; }
      }
      s.done = true;
      if (e.sets[j + 1] && (e.sets[j + 1].w === '' || e.sets[j + 1].w == null)) e.sets[j + 1].w = s.w;
      const isMain = e.role === 'main' || e.role === 'test';
      startTimer(isMain ? state.settings.restMain : state.settings.restAcc);
    } else s.done = false;
    persistActive(); rerenderWorkoutCard(i);
  },
  addset(el) { const e = active.exercises[+el.dataset.i]; const l = e.sets[e.sets.length - 1]; e.sets.push({ w: l?.w ?? '', r: '', done: false }); persistActive(); rerenderWorkoutCard(+el.dataset.i); },
  delset(el) { const e = active.exercises[+el.dataset.i]; e.sets.pop(); persistActive(); rerenderWorkoutCard(+el.dataset.i); },
  diff(el) { const e = active.exercises[+el.dataset.i]; e.diff = el.dataset.k; persistActive(); rerenderWorkoutCard(+el.dataset.i); },
  swap(el) { modal = { type: 'swap', i: +el.dataset.i }; render(); },
  'swap-do'(el) {
    const i = modal.i, ent = active.exercises[i], newId = el.dataset.id;
    if (el.dataset.always === '1') {
      state.choices[ent.slotKey] = newId;
      state.unavailable[ent.exId] = true;
      delete state.unavailable[newId];
      touchMeta(state); persist();
    }
    const p = prescribeSwap(state, active, ent, newId);
    if (ent.diff) p.diff = ent.diff;
    active.exercises[i] = p; if (active.flip) active.flip[i] = false;
    persistActive(); modal = null; render();
    document.getElementById('ex-' + i)?.scrollIntoView({ block: 'start' });
  },
  finish() { finishWorkout(); },
  'save-workout'() { saveWorkout(); },
  discard() { confirmBox('Descartar entrenamiento', 'Se perderán las series de esta sesión.', 'Descartar', () => { active = null; persistActive(); view = 'hoy'; stopTimer(); }); },
  'timer-add'() { if (timer) { timer.end += 30000; timer.beeped = false; document.getElementById('timer')?.classList.remove('zero'); tickTimer(); } },
  'timer-stop'() { stopTimer(); },
  close() { modal = null; render(); },
  'close-bg'(el, ev) { if (ev.target === el) { modal = null; render(); } },
  'confirm-yes'() { const fn = modal.fn; modal = null; fn(); render(); },
  hist(el) { openHist = openHist === el.dataset.id ? null : el.dataset.id; render(); },
  'del-session'(el) {
    const id = el.dataset.id;
    confirmBox('Borrar entreno', 'Se borrará de todos tus dispositivos al sincronizar. Los pesos se recalcularán.', 'Borrar', () => {
      state.deleted.push(id); state.sessions = state.sessions.filter(s => s.id !== id); persist();
    });
  },
  'add-bw'() {
    const kg = num(document.getElementById('bw-in').value);
    if (!kg || kg < 25 || kg > 350) { toast('Peso no válido'); return; }
    const id = 'bw_' + todayStr();
    state.bodyweight = state.bodyweight.filter(b => b.id !== id);
    state.bodyweight.push({ id, date: todayStr(), kg, updatedAt: Date.now() });
    state.profile.weight = kg; touchMeta(state);
    persist(); render(); toast('Peso guardado');
  },
  'set-days'(el) { state.settings.days = +el.dataset.d; touchMeta(state); persist(); render(); toast('Plan actualizado: ' + PROGRAMS[programState(state).progKey].name); },
  async 'gh-save'() {
    const cfg = {
      owner: document.getElementById('gh-owner').value.trim(),
      repo: document.getElementById('gh-repo').value.trim(),
      branch: document.getElementById('gh-branch').value.trim() || 'main',
      path: document.getElementById('gh-path').value.trim() || 'datos.json',
      token: document.getElementById('gh-token').value.trim(),
    };
    saveGh(cfg);
    if (!ghConfigured(cfg)) { toast('Faltan datos'); return; }
    try { const msg = await testGithub(cfg); toast(msg); sync = { st: 'idle', msg }; await doSync(); }
    catch (e) { sync = { st: 'err', msg: e.message }; render(); }
  },
  export() {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `gymcoach-${todayStr()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  'reset-choices'() { confirmBox('Restablecer máquinas', 'Se quitarán tus sustituciones y las máquinas marcadas como no disponibles.', 'Restablecer', () => { state.choices = {}; state.unavailable = {}; touchMeta(state); persist(); }); },
  wipe() {
    confirmBox('Borrar datos', 'Se borran los datos de ESTE dispositivo (no de GitHub). Si tienes GitHub configurado, al volver a sincronizar se recuperan.', 'Borrar todo', () => {
      localStorage.clear(); state = defaultState(); active = null; view = 'hoy';
    });
  },
};

function rerenderWorkoutCard(i) {
  // re-render completo pero conservando el scroll (los inputs se rehacen)
  const y = window.scrollY;
  const t = timer;
  render();
  if (t) { timer = t; }
  window.scrollTo(0, y);
}

$app.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (!el || !$app.contains(el)) return;
  const fn = handlers[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'A') ev.preventDefault();
  fn(el, ev);
});

$app.addEventListener('input', ev => {
  const el = ev.target, f = el.dataset.field;
  if (!f) return;
  if (f === 'w' || f === 'r') {
    const s = active.exercises[+el.dataset.i].sets[+el.dataset.j];
    s[f] = el.value; persistActive();
  } else if (f === 'exFilter') {
    exFilter = el.value;
    const pos = el.selectionStart; render();
    const n = document.querySelector('.search'); n.focus(); n.setSelectionRange(pos, pos);
  }
});

$app.addEventListener('change', ev => {
  const el = ev.target, f = el.dataset.field;
  if (el.id === 'import-file' && el.files[0]) {
    el.files[0].text().then(t => {
      try { const data = JSON.parse(t); state = mergeStates(state, data); state.onboarded = true; persist(); render(); toast('Datos importados'); }
      catch { toast('Archivo no válido'); }
    });
    return;
  }
  if (!f) return;
  if (f === 'progEx') { progEx = el.value; render(); }
  else if (f === 'unavail') { state.unavailable[el.dataset.id] = el.checked; if (!el.checked) delete state.unavailable[el.dataset.id]; touchMeta(state); persist(); render(); }
  else if (f.startsWith('profile.') || f.startsWith('settings.')) {
    const [grp, key] = f.split('.');
    const v = el.tagName === 'SELECT' ? el.value : num(el.value);
    state[grp][key] = v ?? '';
    touchMeta(state); persist();
  }
});

// ---------------- arranque ----------------
render();
if (ghConfigured()) doSync();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ghConfigured() && !active) doSync(); });
if (timer) timerInt = setInterval(tickTimer, 500);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => { });
}
