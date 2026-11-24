// Motor del entrenador: plantillas, generación de sesiones, calibración y progresión.
//
// Principios (ver Guía en la app):
// - Cuerpo completo 2-3 días/semana (o torso/pierna 4 días): cada músculo se entrena ~2 veces por semana.
// - Básicos en 6-12 repeticiones, accesorios en 10-15/20, quedándose a 1-3 repeticiones del fallo (RIR).
// - Doble progresión: primero sube repeticiones dentro del rango; cuando todas las series llegan al tope, sube peso.
// - Bloques de 4 semanas de progresión + 1 semana de descarga.
// - La rotación avanza solo cuando entrenas: si faltas un día, no te saltas ninguna sesión.

import { EX_BY_ID, EXERCISES, PATTERNS } from './exercises.js';

const S = (key, pattern, def, sets, min, max, role = 'acc') => ({ key, pattern, def, sets, min, max, role });

export const PROGRAMS = {
  fb2: {
    name: 'Cuerpo completo · 2 días',
    days: 2,
    templates: [
      { key: 'A', name: 'Cuerpo completo A', slots: [
        S('fb2A_squat', 'squat', 'Leg_Press', 3, 8, 12, 'main'),
        S('fb2A_hpush', 'hpush', 'Machine_Bench_Press', 3, 6, 10, 'main'),
        S('fb2A_vpull', 'vpull', 'Wide-Grip_Lat_Pulldown', 3, 8, 12, 'main'),
        S('fb2A_legcurl', 'legcurl', 'Lying_Leg_Curls', 2, 10, 15),
        S('fb2A_lateral', 'lateral', 'Side_Lateral_Raise', 3, 12, 20),
        S('fb2A_triceps', 'triceps', 'Triceps_Pushdown_-_Rope_Attachment', 2, 10, 15),
        S('fb2A_core', 'core', 'Cable_Crunch', 2, 10, 15),
      ]},
      { key: 'B', name: 'Cuerpo completo B', slots: [
        S('fb2B_hinge', 'hinge', 'Romanian_Deadlift', 3, 8, 10, 'main'),
        S('fb2B_ipush', 'ipush', 'Incline_Dumbbell_Press', 3, 8, 12, 'main'),
        S('fb2B_hpull', 'hpull', 'Seated_Cable_Rows', 3, 8, 12, 'main'),
        S('fb2B_vpush', 'vpush', 'Machine_Shoulder_Military_Press', 2, 8, 12),
        S('fb2B_legext', 'legext', 'Leg_Extensions', 2, 10, 15),
        S('fb2B_biceps', 'biceps', 'Dumbbell_Bicep_Curl', 2, 10, 15),
        S('fb2B_calves', 'calves', 'Standing_Calf_Raises', 2, 10, 15),
      ]},
    ],
  },
  fb3: {
    name: 'Cuerpo completo · 3 días',
    days: 3,
    templates: [
      { key: 'A', name: 'Cuerpo completo A', slots: [
        S('fb3A_squat', 'squat', 'Leg_Press', 3, 8, 12, 'main'),
        S('fb3A_hpush', 'hpush', 'Machine_Bench_Press', 3, 6, 10, 'main'),
        S('fb3A_vpull', 'vpull', 'Wide-Grip_Lat_Pulldown', 3, 8, 12, 'main'),
        S('fb3A_legcurl', 'legcurl', 'Lying_Leg_Curls', 2, 10, 15),
        S('fb3A_lateral', 'lateral', 'Side_Lateral_Raise', 2, 12, 20),
        S('fb3A_core', 'core', 'Plank', 2, 30, 60),
      ]},
      { key: 'B', name: 'Cuerpo completo B', slots: [
        S('fb3B_hinge', 'hinge', 'Romanian_Deadlift', 3, 8, 10, 'main'),
        S('fb3B_vpush', 'vpush', 'Machine_Shoulder_Military_Press', 3, 8, 12, 'main'),
        S('fb3B_hpull', 'hpull', 'Seated_Cable_Rows', 3, 8, 12, 'main'),
        S('fb3B_legext', 'legext', 'Leg_Extensions', 2, 10, 15),
        S('fb3B_biceps', 'biceps', 'Dumbbell_Bicep_Curl', 2, 10, 15),
        S('fb3B_triceps', 'triceps', 'Triceps_Pushdown_-_Rope_Attachment', 2, 10, 15),
      ]},
      { key: 'C', name: 'Cuerpo completo C', slots: [
        S('fb3C_glute', 'glute', 'Barbell_Hip_Thrust', 3, 8, 12, 'main'),
        S('fb3C_ipush', 'ipush', 'Incline_Dumbbell_Press', 3, 8, 12, 'main'),
        S('fb3C_hpull', 'hpull', 'Leverage_Iso_Row', 3, 8, 12, 'main'),
        S('fb3C_lunge', 'lunge', 'Split_Squat_with_Dumbbells', 2, 8, 12),
        S('fb3C_reardelt', 'reardelt', 'Face_Pull', 2, 12, 15),
        S('fb3C_calves', 'calves', 'Standing_Calf_Raises', 2, 10, 15),
        S('fb3C_core', 'core', 'Cable_Crunch', 2, 10, 15),
      ]},
    ],
  },
  ul4: {
    name: 'Torso / Pierna · 4 días',
    days: 4,
    templates: [
      { key: 'T1', name: 'Torso 1', slots: [
        S('ul_T1_hpush', 'hpush', 'Machine_Bench_Press', 3, 6, 10, 'main'),
        S('ul_T1_hpull', 'hpull', 'Seated_Cable_Rows', 3, 8, 12, 'main'),
        S('ul_T1_vpush', 'vpush', 'Machine_Shoulder_Military_Press', 3, 8, 12, 'main'),
        S('ul_T1_vpull', 'vpull', 'Wide-Grip_Lat_Pulldown', 3, 8, 12),
        S('ul_T1_lateral', 'lateral', 'Side_Lateral_Raise', 2, 12, 20),
        S('ul_T1_triceps', 'triceps', 'Triceps_Pushdown_-_Rope_Attachment', 2, 10, 15),
      ]},
      { key: 'P1', name: 'Pierna 1', slots: [
        S('ul_P1_squat', 'squat', 'Leg_Press', 3, 8, 12, 'main'),
        S('ul_P1_hinge', 'hinge', 'Romanian_Deadlift', 3, 8, 10, 'main'),
        S('ul_P1_legcurl', 'legcurl', 'Lying_Leg_Curls', 2, 10, 15),
        S('ul_P1_calves', 'calves', 'Standing_Calf_Raises', 3, 10, 15),
        S('ul_P1_core', 'core', 'Plank', 2, 30, 60),
      ]},
      { key: 'T2', name: 'Torso 2', slots: [
        S('ul_T2_ipush', 'ipush', 'Incline_Dumbbell_Press', 3, 8, 12, 'main'),
        S('ul_T2_vpull', 'vpull', 'Close-Grip_Front_Lat_Pulldown', 3, 8, 12, 'main'),
        S('ul_T2_hpull', 'hpull', 'Leverage_Iso_Row', 3, 8, 12),
        S('ul_T2_fly', 'fly', 'Butterfly', 2, 10, 15),
        S('ul_T2_reardelt', 'reardelt', 'Face_Pull', 2, 12, 15),
        S('ul_T2_biceps', 'biceps', 'Dumbbell_Bicep_Curl', 2, 10, 15),
      ]},
      { key: 'P2', name: 'Pierna 2', slots: [
        S('ul_P2_glute', 'glute', 'Barbell_Hip_Thrust', 3, 8, 12, 'main'),
        S('ul_P2_lunge', 'lunge', 'Split_Squat_with_Dumbbells', 3, 8, 12, 'main'),
        S('ul_P2_legext', 'legext', 'Leg_Extensions', 2, 10, 15),
        S('ul_P2_legcurl', 'legcurl', 'Seated_Leg_Curl', 2, 10, 15),
        S('ul_P2_core', 'core', 'Cable_Crunch', 2, 10, 15),
      ]},
    ],
  },
};

export function programForDays(days) {
  if (days <= 2) return 'fb2';
  if (days === 3) return 'fb3';
  return 'ul4';
}

// ---------- utilidades de fechas ----------
export const DAY_MS = 86400000;
export function todayStr(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
export function parseDay(s) { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); }
export function daysBetween(a, b) { return Math.round((parseDay(b) - parseDay(a)) / DAY_MS); }
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - wd);
  return todayStr(x);
}

// ---------- cálculo de fuerza ----------
const RIR_BY_DIFF = { facil: 4, bien: 2, limite: 0.5 };
export function e1rm(w, reps, rir = 2) {
  if (!w || !reps) return 0;
  return w * (1 + (reps + rir) / 30); // Epley ajustado por repeticiones en reserva
}
export function weightFor(e1, reps, rir = 2) {
  return e1 / (1 + (reps + rir) / 30);
}
export function roundTo(w, inc) {
  if (!inc) return Math.round(w * 2) / 2;
  const step = inc >= 2 ? inc / 2 : inc; // permite medios saltos en el redondeo
  return Math.max(0, Math.round(w / step) * step);
}

// ---------- historial ----------
export function sortedSessions(state) {
  const del = new Set(state.deleted || []);
  return (state.sessions || []).filter(s => !del.has(s.id)).sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')));
}

// Recorre el historial y calcula el estado de cada ejercicio (peso de trabajo, fallos, última vez...).
// Se calcula siempre a partir de las sesiones, así al fusionar datos de varios dispositivos todo cuadra.
export function computeExerciseStates(state) {
  const st = {};
  for (const s of sortedSessions(state)) {
    for (const ent of s.exercises || []) {
      const ex = EX_BY_ID[ent.exId];
      if (!ex) continue;
      const done = (ent.sets || []).filter(x => x.done && (x.r > 0));
      if (!done.length) continue;
      const cur = st[ent.exId] || (st[ent.exId] = { w: null, e1: 0, fails: 0, last: null, lastReps: [], history: [], best: 0 });
      const rir = RIR_BY_DIFF[ent.diff] ?? 2;
      let bestE1 = 0, topW = 0;
      for (const x of done) {
        const val = ex.mode === 'weight' ? e1rm(x.w, x.r, rir) : x.r;
        if (val > bestE1) bestE1 = val;
        if ((x.w || 0) > topW) topW = x.w || 0;
      }
      cur.history.push({ date: s.date, e1: bestE1, topW, sets: done.length, reps: done.map(x => x.r), w: done.map(x => x.w || 0) });
      cur.best = Math.max(cur.best, bestE1);
      cur.last = s.date;
      cur.lastReps = done.map(x => x.r);
      cur.lastW = topW;
      cur.e1 = bestE1;

      if (s.type === 'test') { cur.w = null; cur.calibrated = true; cur.fails = 0; continue; }
      if (s.deload) { continue; }

      const min = ent.min || 8, max = ent.max || 12;
      if (ex.mode !== 'weight') { cur.w = null; continue; }
      // peso usado = el más repetido entre las series efectivas
      const counts = {};
      done.forEach(x => { counts[x.w] = (counts[x.w] || 0) + 1; });
      const wUsed = Number(Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]);
      const allTop = done.length >= (ent.targetSets || 1) && done.every(x => x.r >= max);
      const anyLow = done.some(x => x.r < min);
      cur.calibrated = true;
      if (allTop) {
        const jump = ent.diff === 'facil' ? ex.inc * 2 : ex.inc;
        cur.w = roundTo(wUsed + (jump || 1), ex.inc);
        cur.fails = 0;
        cur.lastEvent = 'up';
      } else if (anyLow && (ent.diff === 'limite' || done.every(x => x.r < min))) {
        cur.fails += 1;
        if (cur.fails >= 2) { cur.w = roundTo(wUsed * 0.9, ex.inc); cur.fails = 0; cur.lastEvent = 'down'; }
        else { cur.w = wUsed; cur.lastEvent = 'hold'; }
      } else {
        cur.w = wUsed; cur.fails = 0; cur.lastEvent = 'reps';
      }
    }
  }
  return st;
}

// ---------- rotación y bloques ----------
export function programState(state) {
  const days = state.settings?.days || 3;
  const progKey = programForDays(days);
  const prog = PROGRAMS[progKey];
  const sessions = sortedSessions(state).filter(s => s.type !== 'test');
  // posición en la rotación: sesiones de este programa
  let pos = 0;
  for (const s of sessions) if (s.program === progKey) pos += s.advance || 1;
  // bloque: 4 semanas de progresión + 1 de descarga, contado en sesiones
  const blockLen = prog.days * 5;
  const total = sessions.reduce((n, s) => n + (s.advance || 1), 0);
  const inBlock = total % blockLen;
  const blockWeek = Math.floor(inBlock / prog.days); // 0..4
  const deload = blockWeek === 4;
  const last = sessions[sessions.length - 1];
  const gapDays = last ? daysBetween(last.date, todayStr()) : null;
  return { progKey, prog, pos, nextIndex: pos % prog.templates.length, blockWeek, deload, total, gapDays, lastSession: last };
}

export function weekInfo(state) {
  const ws = weekStart();
  const days = state.settings?.days || 3;
  const done = sortedSessions(state).filter(s => s.type !== 'test' && s.date >= ws);
  const doneUnits = done.reduce((n, s) => n + (s.advance || 1), 0);
  const today = new Date();
  const wd = (today.getDay() + 6) % 7;
  const daysLeft = 7 - wd; // incluido hoy
  const trainedToday = done.some(s => s.date === todayStr());
  const remaining = Math.max(0, days - doneUnits);
  const availableDays = daysLeft - (trainedToday ? 1 : 0);
  return { ws, done, doneUnits, target: days, remaining, daysLeft, availableDays, trainedToday };
}

// Elige el ejercicio para un hueco: elección guardada > por defecto > primera alternativa disponible.
export function exerciseForSlot(state, slot) {
  const unavailable = state.unavailable || {};
  const chosen = state.choices?.[slot.key];
  if (chosen && EX_BY_ID[chosen] && !unavailable[chosen]) return chosen;
  if (!unavailable[slot.def]) return slot.def;
  const alt = EXERCISES.find(e => e.pattern === slot.pattern && !unavailable[e.id]);
  return alt ? alt.id : slot.def;
}

function prescribe(state, slot, exId, exStates, opts) {
  const ex = EX_BY_ID[exId];
  const es = exStates[exId];
  let sets = slot.sets;
  let note = '';
  if (opts.blockWeek >= 2 && opts.blockWeek <= 3 && slot.role === 'main') sets += 1; // más volumen en las semanas 3-4
  if (opts.deload) sets = Math.max(1, Math.ceil(sets / 2));
  if (opts.setsOverride) sets = opts.setsOverride;
  let w = null;
  let firstTime = false;
  if (ex.mode === 'weight') {
    if (es?.w != null) w = es.w;
    else if (es?.e1) w = roundTo(weightFor(es.e1, slot.min + 2, 2), ex.inc); // viene de la sesión de prueba
    else firstTime = true;
    if (w != null && opts.deload) { w = roundTo(w * 0.9, ex.inc); note = 'Descarga: peso -10%'; }
    if (w != null && opts.comeback) { w = roundTo(w * 0.9, ex.inc); note = 'Vuelta tras un parón: peso -10%'; }
  }
  // objetivo de repeticiones: superar lo de la última vez dentro del rango
  let targetReps = slot.min;
  if (es?.lastReps?.length && es.w === es.lastW) {
    const lastMin = Math.min(...es.lastReps);
    targetReps = Math.min(slot.max, Math.max(slot.min, lastMin + 1));
  }
  if (ex.mode !== 'weight' && es?.lastReps?.length) {
    targetReps = Math.max(slot.min, Math.min(...es.lastReps) + (ex.mode === 'time' ? 5 : 1));
  }
  return {
    slotKey: slot.key, pattern: slot.pattern, exId, min: slot.min, max: slot.max, role: slot.role,
    targetSets: sets, targetReps, w, firstTime, note,
    sets: Array.from({ length: sets }, () => ({ w: w ?? '', r: '', done: false })),
  };
}

// Recalcula la prescripción de un ejercicio de una sesión en curso al cambiarlo por otro.
export function prescribeSwap(state, session, ent, newExId) {
  const slot = { key: ent.slotKey, pattern: ent.pattern, sets: ent.targetSets, min: ent.min, max: ent.max, role: ent.role };
  const p = prescribe(state, slot, newExId, computeExerciseStates(state), {
    blockWeek: 0, deload: session.deload, comeback: session.comeback, setsOverride: ent.targetSets,
  });
  if (session.type === 'test') { p.role = 'test'; p.w = null; p.firstTime = true; p.sets = p.sets.map(() => ({ w: '', r: '', done: false })); }
  return p;
}

export function buildSession(state, opts = {}) {
  const ps = programState(state);
  const exStates = computeExerciseStates(state);
  const comeback = ps.gapDays != null && ps.gapDays >= 14;
  const o = { blockWeek: ps.blockWeek, deload: ps.deload, comeback, ...opts };
  let tpl, slots, advance = 1, name;
  if (opts.combine && opts.combine > 1) {
    // Sesión combinada: los ejercicios principales de las próximas N sesiones.
    const n = Math.min(opts.combine, ps.prog.templates.length);
    const tpls = Array.from({ length: n }, (_, i) => ps.prog.templates[(ps.nextIndex + i) % ps.prog.templates.length]);
    // Cubrir todos los grupos grandes: rodilla, cadera, empuje, tirón (x2) y hombro.
    const pool = tpls.flatMap(t => t.slots.filter(s => s.role === 'main'));
    const groups = [['squat', 'lunge'], ['hinge', 'glute'], ['hpush', 'ipush'], ['vpull', 'hpull'], ['hpull', 'vpull'], ['vpush', 'ipush', 'hpush']];
    const used = new Set();
    slots = [];
    for (const g of groups) {
      const s = pool.find(x => g.includes(x.pattern) && !used.has(x.key) && !slots.some(y => y.pattern === x.pattern));
      if (s) { used.add(s.key); slots.push(s); }
    }
    for (const s of pool) if (slots.length < 6 && !used.has(s.key) && !slots.some(y => y.pattern === s.pattern)) { used.add(s.key); slots.push(s); }
    advance = n;
    name = 'Sesión combinada (' + tpls.map(t => t.key).join('+') + ')';
    tpl = { key: tpls.map(t => t.key).join('+') };
  } else {
    const idx = opts.templateIndex ?? ps.nextIndex;
    tpl = ps.prog.templates[idx];
    slots = tpl.slots;
    name = tpl.name;
  }
  const exercises = slots.map(slot => prescribe(state, slot, exerciseForSlot(state, slot), exStates, o));
  return {
    id: 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: 'normal', program: ps.progKey, template: tpl.key, name, advance,
    deload: o.deload, comeback, blockWeek: ps.blockWeek,
    date: todayStr(), start: new Date().toISOString(), exercises,
  };
}

// Sesión de prueba: los ejercicios principales de todo el plan, 2 series cada uno.
export function buildTestSession(state) {
  const ps = programState(state);
  const seen = new Set();
  const exercises = [];
  for (const t of ps.prog.templates) {
    for (const slot of t.slots.filter(s => s.role === 'main')) {
      const exId = exerciseForSlot(state, slot);
      if (seen.has(exId)) continue;
      seen.add(exId);
      const ex = EX_BY_ID[exId];
      exercises.push({
        slotKey: slot.key, pattern: slot.pattern, exId, min: slot.min, max: slot.max, role: 'test',
        targetSets: 2, targetReps: 10, w: null, firstTime: true, note: '',
        sets: [{ w: '', r: '', done: false }, { w: '', r: '', done: false }],
        mode: ex.mode,
      });
    }
  }
  return {
    id: 't_' + Date.now().toString(36), type: 'test', program: ps.progKey, template: 'TEST',
    name: 'Sesión de prueba (calibración)', advance: 0, date: todayStr(), start: new Date().toISOString(), exercises,
  };
}

// Qué pasará la próxima vez con cada ejercicio (para el resumen al terminar).
export function progressionPreview(stateBefore, session) {
  const fake = { ...stateBefore, sessions: [...(stateBefore.sessions || []), session] };
  const after = computeExerciseStates(fake);
  return session.exercises.map(ent => {
    const ex = EX_BY_ID[ent.exId];
    const a = after[ent.exId];
    let msg = '';
    if (!a) msg = 'Sin series completadas.';
    else if (session.type === 'test') msg = ex.mode === 'weight' ? `Fuerza estimada (1RM): ${a.e1.toFixed(1)} kg` : `Registrado: ${Math.max(...a.lastReps)}${ex.mode === 'time' ? ' s' : ' reps'}`;
    else if (session.deload) msg = 'Semana de descarga: sin cambios.';
    else if (ex.mode !== 'weight') msg = `Próxima vez: intenta ${Math.max(ent.min, Math.min(...a.lastReps) + (ex.mode === 'time' ? 5 : 1))}${ex.mode === 'time' ? ' s' : ' reps'}.`;
    else if (a.lastEvent === 'up') msg = `¡Subes peso! Próxima vez: ${a.w} kg`;
    else if (a.lastEvent === 'down') msg = `Bajamos a ${a.w} kg para recuperar buena técnica.`;
    else if (a.lastEvent === 'hold') msg = `Mantén ${a.w} kg y busca llegar a ${ent.min} reps.`;
    else msg = `Mantén ${a.w} kg e intenta 1 repetición más por serie (hasta ${ent.max}).`;
    return { exId: ent.exId, name: ex.name, msg, event: a?.lastEvent };
  });
}

// Series semanales efectivas por músculo (último periodo de 7 días).
export function weeklyVolume(state, fromDay, toDay) {
  const vol = {};
  for (const s of sortedSessions(state)) {
    if (s.date < fromDay || s.date > toDay) continue;
    for (const ent of s.exercises || []) {
      const ex = EX_BY_ID[ent.exId];
      if (!ex) continue;
      const n = (ent.sets || []).filter(x => x.done).length;
      const m = PATTERNS[ex.pattern].muscles;
      for (const k in m) vol[k] = (vol[k] || 0) + n * m[k];
    }
  }
  return vol;
}

// Nutrición para recomposición (perder grasa ganando fuerza).
export function nutrition(profile, days) {
  const { sex, age, height, weight } = profile || {};
  if (!age || !height || !weight) return null;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'mujer' ? -161 : 5);
  const factor = days >= 4 ? 1.55 : 1.4;
  const tdee = bmr * factor;
  const kcal = Math.round((tdee * 0.8) / 10) * 10;
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), kcal,
    protein: [Math.round(weight * 1.6), Math.round(weight * 2.2)],
    fat: Math.round(weight * 0.8),
  };
}
