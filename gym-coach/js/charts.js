// Gráficas SVG ligeras, sin dependencias (funcionan sin conexión).

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = d => { const [, m, day] = d.split('-'); return `${Number(day)}/${Number(m)}`; };

function niceTicks(min, max, n = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= step0) || step0;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks };
}

// points: [{x: 'YYYY-MM-DD', y: number}]
export function lineChart(points, { unit = '', height = 200, empty = 'Aún no hay datos' } = {}) {
  if (!points.length) return `<div class="chart-empty">${esc(empty)}</div>`;
  const W = 340, H = height, pl = 40, pr = 12, pt = 14, pb = 26;
  const xs = points.map(p => new Date(p.x).getTime());
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 86400000 * 3; x1 += 86400000 * 3; }
  const ys = points.map(p => p.y);
  const { lo, hi, ticks } = niceTicks(Math.min(...ys), Math.max(...ys));
  const X = t => pl + ((t - x0) / (x1 - x0)) * (W - pl - pr);
  const Y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${X(xs[xs.length - 1]).toFixed(1)},${Y(lo)} L${X(xs[0]).toFixed(1)},${Y(lo)} Z`;
  const grid = ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${pl - 6}" y="${Y(t) + 4}" class="axis" text-anchor="end">${+t.toFixed(1)}</text>`).join('');
  const nLabels = Math.min(points.length, 4);
  const labelIdx = [...new Set(Array.from({ length: nLabels }, (_, i) => Math.round(i * (points.length - 1) / Math.max(1, nLabels - 1))))];
  const xl = labelIdx.map(i => `<text x="${X(xs[i])}" y="${H - 6}" class="axis" text-anchor="middle">${fmtDate(points[i].x)}</text>`).join('');
  const dots = points.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.y)}" r="3.5" class="dot"><title>${fmtDate(p.x)}: ${+p.y.toFixed(1)} ${esc(unit)}</title></circle>`).join('');
  const lastP = points[points.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Gráfica">
    ${grid}<path d="${area}" class="area"/><path d="${path}" class="line"/>${dots}${xl}
    <text x="${X(xs[xs.length - 1])}" y="${Y(lastP.y) - 9}" class="last" text-anchor="end">${+lastP.y.toFixed(1)} ${esc(unit)}</text>
  </svg>`;
}

// bars: [{label, value, target:[min,max]?}]  (horizontal)
export function barChart(bars, { unit = '', max } = {}) {
  if (!bars.length) return `<div class="chart-empty">Aún no hay datos</div>`;
  const W = 340, rowH = 26, pl = 86, pr = 36;
  const H = bars.length * rowH + 8;
  const m = max || Math.max(...bars.map(b => Math.max(b.value, b.target ? b.target[1] : 0)), 1);
  const X = v => pl + (v / m) * (W - pl - pr);
  const rows = bars.map((b, i) => {
    const y = 4 + i * rowH;
    const tgt = b.target ? `<rect x="${X(b.target[0])}" y="${y + 3}" width="${X(b.target[1]) - X(b.target[0])}" height="${rowH - 10}" class="target"/>` : '';
    const ok = b.target ? (b.value >= b.target[0] ? 'ok' : 'low') : 'ok';
    return `<text x="${pl - 8}" y="${y + rowH / 2 + 2}" class="axis" text-anchor="end">${esc(b.label)}</text>
      ${tgt}<rect x="${pl}" y="${y + 6}" width="${Math.max(2, X(b.value) - pl)}" height="${rowH - 16}" rx="3" class="bar ${ok}"/>
      <text x="${Math.max(X(b.value), b.target ? X(b.target[1]) : 0) + 5}" y="${y + rowH / 2 + 2}" class="axis">${+b.value.toFixed(1)}${esc(unit)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Gráfica de barras">${rows}</svg>`;
}

// columnas verticales: [{label, value}]
export function columnChart(cols, { target, height = 160 } = {}) {
  if (!cols.length) return `<div class="chart-empty">Aún no hay datos</div>`;
  const W = 340, H = height, pl = 24, pr = 8, pt = 10, pb = 22;
  const m = Math.max(...cols.map(c => c.value), target || 0, 1);
  const bw = (W - pl - pr) / cols.length;
  const Y = v => pt + (1 - v / m) * (H - pt - pb);
  const t = target ? `<line x1="${pl}" x2="${W - pr}" y1="${Y(target)}" y2="${Y(target)}" class="tline"/><text x="${pl - 4}" y="${Y(target) + 4}" class="axis" text-anchor="end">${target}</text>` : '';
  const bars = cols.map((c, i) => {
    const x = pl + i * bw + bw * 0.18, w = bw * 0.64;
    const ok = target ? (c.value >= target ? 'ok' : 'low') : 'ok';
    return `<rect x="${x}" y="${Y(c.value)}" width="${w}" height="${Math.max(0, H - pb - Y(c.value))}" rx="3" class="bar ${ok}"><title>${esc(c.label)}: ${c.value}</title></rect>
      <text x="${x + w / 2}" y="${H - 6}" class="axis" text-anchor="middle">${esc(c.label)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Sesiones por semana">${t}${bars}</svg>`;
}
