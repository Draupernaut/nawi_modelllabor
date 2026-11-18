(() => {
  'use strict';

  /* ---------- Konstanten (SI) ---------- */
  const GM = 3.986004418e14;      // m³/s²  (G · M_Erde)
  const R = 6.371e6;              // m      mittlerer Erdradius
  const KARMAN = 1e5;             // m      100 km
  const WARP_MIN = [2, 5, 10, 20, 40, 80];   // Simulationsminuten pro echter Sekunde
  const COLORS = ['#76d9ff', '#75e1a8', '#ffb45f', '#c28cff', '#ff8998', '#f5e27a', '#9fb7ff'];
  const MAX_KEPT = 7;

  const $ = s => document.querySelector(s);
  const canvas = $('#scene'), ctx = canvas.getContext('2d');
  const wrap = $('#sceneWrap');
  const ui = {
    vRange: $('#vRange'), vOut: $('#vOut'), hRange: $('#hRange'), hOut: $('#hOut'),
    wRange: $('#wRange'), wOut: $('#wOut'), vec: $('#vecToggle'), keep: $('#keepToggle'),
    fire: $('#fireBtn'), pause: $('#pauseBtn'), clear: $('#clearBtn'), present: $('#presentBtn'),
    roV: $('#roV'), roH: $('#roH'), roD: $('#roD'), roT: $('#roT'), pill: $('#statePill'),
    exTitle: $('#explainTitle'), exText: $('#explainText'),
    kV1: $('#kV1'), kV2: $('#kV2'), kT: $('#kT'), kG: $('#kG'), keyCard: $('#keyCard'),
    ticks: $('#vTicks'), tickV1: $('#tickV1'), tickV2: $('#tickV2'), toast: $('#toast')
  };

  /* ---------- Hilfsfunktionen ---------- */
  const nf = (x, d = 0) => x.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const vCirc = h => Math.sqrt(GM / (R + h));
  const vEsc = h => Math.SQRT2 * vCirc(h);
  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')} h`;
  }
  function fmtDuration(s) {
    if (s < 3600) return `${nf(s / 60, 0)} min`;
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  let toastTimer = 0;
  function toast(msg) {
    ui.toast.textContent = msg; ui.toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2600);
  }

  /* ---------- Zustand ---------- */
  const st = {
    v: 7000, h: 200e3, warp: 600, paused: false,
    shots: [], cur: null, colorIdx: 0, flash: 0
  };
  const view = { cx: 0, cy: 0, scale: 1e-4, init: false };
  let W = 0, H = 0, DPR = 1;

  /* ---------- Physik: Bahn vorab numerisch berechnen ----------
     Geschwindigkeits-Verlet mit adaptivem Zeitschritt (dt ∝ lokale Umlaufzeit).
     Abbruch bei Einschlag, vollendetem Umlauf oder Flucht. */
  function acc(x, y) {
    const r2 = x * x + y * y, r = Math.sqrt(r2), k = -GM / (r2 * r);
    return [k * x, k * y];
  }
  function simulate(v0, h0) {
    const r0 = R + h0;
    const energy = v0 * v0 / 2 - GM / r0;
    let x = 0, y = r0, vx = v0, vy = 0, t = 0, ang = 0;
    const T = [0], X = [x], Y = [y], VX = [vx], VY = [vy], A = [0];
    let a = acc(x, y), kind = 'escape', rmin = r0, rmax = r0;
    for (let i = 0; i < 400000; i++) {
      const r = Math.hypot(x, y);
      const dt = 0.002 * r * Math.sqrt(r / GM);
      const px = x, py = y, pvx = vx, pvy = vy, pt = t, pang = ang;
      vx += a[0] * dt / 2; vy += a[1] * dt / 2;
      x += vx * dt; y += vy * dt;
      a = acc(x, y);
      vx += a[0] * dt / 2; vy += a[1] * dt / 2;
      t += dt;
      let d = Math.atan2(y, x) - Math.atan2(py, px);
      if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
      ang -= d;                                   // Uhrzeigersinn positiv
      const rn = Math.hypot(x, y);
      const lerp = f => { x = px + (x - px) * f; y = py + (y - py) * f; vx = pvx + (vx - pvx) * f; vy = pvy + (vy - pvy) * f; t = pt + (t - pt) * f; ang = pang + (ang - pang) * f; };
      if (rn < R - 50) {                          // Einschlag (50 m Toleranz für Kreisbahn in Bodenhöhe)
        lerp((r - R) / (r - rn));
        T.push(t); X.push(x); Y.push(y); VX.push(vx); VY.push(vy); A.push(ang);
        kind = 'impact'; rmin = R; break;
      }
      if (ang >= 2 * Math.PI) {                   // ein voller Umlauf
        lerp((2 * Math.PI - pang) / (ang - pang));
        T.push(t); X.push(x); Y.push(y); VX.push(vx); VY.push(vy); A.push(ang);
        kind = 'orbit'; break;
      }
      rmin = Math.min(rmin, rn); rmax = Math.max(rmax, rn);
      T.push(t); X.push(x); Y.push(y); VX.push(vx); VY.push(vy); A.push(ang);
      if (energy >= 0 && rn > 6 * R) { kind = 'escape'; break; }
    }
    if (kind === 'orbit' && (rmax - rmin) / r0 < 0.01) kind = 'circle';
    // ausgedünnte Indizes zum Zeichnen
    const draw = [0];
    for (let i = 1, last = 0; i < T.length; i++) {
      const r = Math.hypot(X[i], Y[i]);
      if (Math.hypot(X[i] - X[last], Y[i] - Y[last]) > 0.003 * r || i === T.length - 1) { draw.push(i); last = i; }
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const i of draw) { minX = Math.min(minX, X[i]); maxX = Math.max(maxX, X[i]); minY = Math.min(minY, Y[i]); maxY = Math.max(maxY, Y[i]); }
    return { v0, h0, kind, energy, T, X, Y, VX, VY, A, draw, tEnd: t, rmin, rmax, box: [minX, maxX, minY, maxY] };
  }

  /* Position zur (Flug-)Zeit t; Umlaufbahnen laufen periodisch weiter */
  function stateAt(s, t) {
    const T = s.T, n = T.length - 1;
    const periodic = s.kind === 'orbit' || s.kind === 'circle';
    let laps = 0, tt = t;
    if (periodic) { laps = Math.floor(t / s.tEnd); tt = t - laps * s.tEnd; }
    else if (tt >= s.tEnd) tt = s.tEnd;
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= tt) lo = m; else hi = m; }
    const f = T[hi] > T[lo] ? (tt - T[lo]) / (T[hi] - T[lo]) : 0;
    const L = (arr) => arr[lo] + (arr[hi] - arr[lo]) * f;
    return { i: lo, x: L(s.X), y: L(s.Y), vx: L(s.VX), vy: L(s.VY), ang: L(s.A) + laps * 2 * Math.PI, laps };
  }

  /* ---------- Schuss ---------- */
  function fire() {
    if (st.cur) {
      if (ui.keep.checked) st.shots.push(st.cur);
    }
    if (!ui.keep.checked) st.shots = [];
    while (st.shots.length > MAX_KEPT - 1) st.shots.shift();
    const s = simulate(st.v, st.h);
    s.color = COLORS[st.colorIdx++ % COLORS.length];
    s.t = 0; s.ended = false;
    st.cur = s; st.flash = 1; st.paused = false; ui.pause.textContent = '⏸ Pause';
    setPill('flying', 'im Flug');
    ui.exTitle.textContent = 'Die Kugel fliegt …';
    ui.exText.textContent = `Abschuss mit ${nf(st.v / 1000, 2)} km/s aus ${nf(st.h / 1000)} km Höhe. Beobachte, wie sich Richtung und Betrag der Geschwindigkeit ändern.`;
  }

  function onShotEnd(s) {
    s.ended = true;
    const h0 = s.h0, v1 = vCirc(h0), v2 = vEsc(h0);
    const km = x => nf(x / 1000);
    if (s.kind === 'impact') {
      const dist = s.A[s.A.length - 1] * R;
      setPill('impact', 'Einschlag');
      toast(`Einschlag nach ${km(dist)} km`);
      const share = s.v0 / v1;
      ui.exTitle.textContent = share < 0.55 ? 'Kurzer Flug – fast wie ein Wurf' : 'Die Erde krümmt sich weg';
      ui.exText.textContent = share < 0.55
        ? `Die Kugel landet nach ${km(dist)} km und ${fmtDuration(s.tEnd)}. Auf so kurzer Strecke wirkt die Erde fast flach – die Bahn ähnelt einer Wurfparabel. Je schneller die Kugel, desto weiter fliegt sie.`
        : `Die Kugel fliegt ${km(dist)} km weit (${fmtDuration(s.tEnd)}). Weil sie so weit kommt, krümmt sich die Erdoberfläche unter ihr merklich weg: Sie fällt zwar ständig, trifft den Boden aber erst viel später. Es fehlen noch ${nf((v1 - s.v0) / 1000, 2)} km/s bis zur Kreisbahn.`;
    } else if (s.kind === 'circle') {
      setPill('orbit', 'Kreisbahn');
      toast('Einmal um die Erde – Kreisbahn!');
      ui.exTitle.textContent = 'Kreisbahn: ein Satellit';
      ui.exText.textContent = `Bei ${nf(s.v0 / 1000, 2)} km/s fällt die Kugel in jedem Moment genau so viel, wie sich die Erdoberfläche unter ihr wegkrümmt. Ihr Abstand zur Erde bleibt gleich, die Gewichtskraft steht immer senkrecht zur Bewegung und ändert nur die Richtung. Ein Umlauf dauert ${fmtDuration(s.tEnd)}.`;
    } else if (s.kind === 'orbit') {
      const low = s.v0 < v1;
      setPill('orbit', 'Umlaufbahn');
      toast('Die Kugel kehrt zurück – Ellipsenbahn');
      ui.exTitle.textContent = 'Ellipsenbahn';
      ui.exText.textContent = low
        ? `Etwas zu langsam für eine Kreisbahn, aber schnell genug, um die Erde knapp zu verfehlen. Die Kugel sinkt bis auf ${km(s.rmin - R)} km Höhe und wird dabei schneller. Umlaufzeit: ${fmtDuration(s.tEnd)}.`
        : `Schneller als nötig für die Kreisbahn: Die Kugel entfernt sich von der Erde, wird dabei von der Gravitation abgebremst und kehrt zurück. Höchster Punkt: ${km(s.rmax - R)} km über dem Boden – dort ist sie am langsamsten. Umlaufzeit: ${fmtDuration(s.tEnd)}.`;
    } else {
      setPill('escape', 'Fluchtbahn');
      toast('Die Kugel kehrt nie zurück');
      ui.exTitle.textContent = 'Fluchtbahn';
      ui.exText.textContent = `Ab der Fluchtgeschwindigkeit v₂ ≈ ${nf(v2 / 1000, 2)} km/s reicht die Gravitation nicht mehr aus, um die Kugel zurückzuholen. Sie wird zwar immer langsamer, entfernt sich aber für immer von der Erde.`;
    }
  }

  function setPill(cls, text) {
    ui.pill.className = 'state-pill ' + cls; ui.pill.textContent = text;
  }

  /* ---------- Bedienung ---------- */
  function syncV() {
    st.v = Number(ui.vRange.value) * 1000;
    ui.vOut.textContent = `${nf(st.v / 1000, 2)} km/s`;
  }
  function syncH() {
    st.h = Number(ui.hRange.value) * 1000;
    ui.hOut.textContent = `${nf(st.h / 1000)} km`;
    const v1 = vCirc(st.h), v2 = vEsc(st.h), r = R + st.h;
    ui.kV1.textContent = `${nf(v1 / 1000, 2)} km/s`;
    ui.kV2.textContent = `${nf(v2 / 1000, 2)} km/s`;
    ui.kT.textContent = fmtDuration(2 * Math.PI * r / v1);
    ui.kG.textContent = `${nf(GM / (r * r), 2)} m/s²`;
    const min = Number(ui.vRange.min), max = Number(ui.vRange.max);
    const place = (el, v) => {
      const p = Math.min(1, Math.max(0, (v / 1000 - min) / (max - min)));
      el.style.left = `calc(${p * 100}% + ${(0.5 - p) * 16}px)`;
    };
    place(ui.tickV1, v1); place(ui.tickV2, v2);
  }
  function syncW() {
    const m = WARP_MIN[Number(ui.wRange.value)];
    st.warp = m * 60;
    ui.wOut.textContent = `1 s ≙ ${m} min`;
  }
  function clearPresets() { document.querySelectorAll('[data-v]').forEach(b => b.classList.remove('active')); }

  ui.vRange.addEventListener('input', () => { syncV(); clearPresets(); });
  ui.hRange.addEventListener('input', () => { syncH(); clearPresets(); });
  ui.wRange.addEventListener('input', syncW);
  ui.keyCard.addEventListener('toggle', () => { ui.ticks.hidden = !ui.keyCard.open; });
  ui.fire.addEventListener('click', fire);
  ui.pause.addEventListener('click', () => {
    st.paused = !st.paused;
    ui.pause.textContent = st.paused ? '▶ Weiter' : '⏸ Pause';
  });
  ui.clear.addEventListener('click', () => {
    st.shots = []; st.cur = null; st.colorIdx = 0;
    setPill('', 'bereit');
    ui.exTitle.textContent = 'Bereit zum Abfeuern';
    ui.exText.textContent = 'Stelle eine Geschwindigkeit ein und feuere ab. Beginne langsam und steigere die Geschwindigkeit schrittweise. Was verändert sich an der Flugbahn?';
  });
  document.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {
    let v = b.dataset.v;
    if (v === 'circ') v = Math.round(vCirc(st.h) / 10) / 100;
    else if (v === 'esc') v = Math.ceil(vEsc(st.h) / 10) / 100 + 0.15;
    else v = Number(v);
    ui.vRange.value = String(v); syncV();
    clearPresets(); b.classList.add('active');
    fire();
  }));
  ui.present.addEventListener('click', () => {
    const on = !document.body.classList.contains('presentation');
    document.body.classList.toggle('presentation', on);
    ui.present.textContent = on ? '✕ Präsentation' : '▣ Präsentation';
    requestAnimationFrame(resize);
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('presentation')) ui.present.click();
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.code === 'Space' && !/INPUT|BUTTON|SUMMARY|SELECT|TEXTAREA/.test(tag)) { e.preventDefault(); fire(); }
  });

  /* ---------- Ansicht (Kamera) ---------- */
  function targetView() {
    const r0 = R + st.h;
    let box;
    const all = st.cur ? [...st.shots, st.cur] : st.shots;
    if (!all.length) {
      box = [-1.12 * r0, 1.12 * r0, -1.12 * r0, 1.12 * r0];
    } else {
      // Bereich um die Kanone, damit kurze Würfe nicht winzig erscheinen
      box = [-350e3, 350e3, r0 - 420e3, r0 + 120e3];
      const add = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.max(box[1], x); box[2] = Math.min(box[2], y); box[3] = Math.max(box[3], y); };
      for (const s of st.shots) { add(s.box[0], s.box[2]); add(s.box[1], s.box[3]); }
      if (st.cur) {
        // nur den bereits geflogenen Teil berücksichtigen → Kamera „folgt“
        const s = st.cur, now = stateAt(s, s.t);
        const periodic = s.kind === 'orbit' || s.kind === 'circle';
        if (periodic && s.t >= s.tEnd) { add(s.box[0], s.box[2]); add(s.box[1], s.box[3]); }
        else for (let k = 0; k < s.draw.length && s.draw[k] <= now.i; k++) add(s.X[s.draw[k]], s.Y[s.draw[k]]);
        add(now.x, now.y);
      }
    }
    const w = (box[1] - box[0]) * 1.14, h = (box[3] - box[2]) * 1.14;
    const pad = 34; // Pixel für Beschriftungen
    return { cx: (box[0] + box[1]) / 2, cy: (box[2] + box[3]) / 2, scale: Math.min((W - pad) / w, (H - pad) / h) };
  }
  function updateView(dt) {
    const t = targetView();
    if (!view.init) { Object.assign(view, t, { init: true }); return; }
    const k = 1 - Math.exp(-dt * 2.6);
    view.cx += (t.cx - view.cx) * k;
    view.cy += (t.cy - view.cy) * k;
    view.scale = Math.exp(Math.log(view.scale) + (Math.log(t.scale) - Math.log(view.scale)) * k);
  }
  const sx = x => W / 2 + (x - view.cx) * view.scale;
  const sy = y => H / 2 - (y - view.cy) * view.scale;

  /* ---------- Zeichnen ---------- */
  const stars = Array.from({ length: 170 }, (_, i) => {
    const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12345.678, c = Math.sin(i * 3.7) * 9999.1;
    return [a - Math.floor(a), b - Math.floor(b), 0.3 + (c - Math.floor(c)) * 0.9];
  });

  function resize() {
    const r = wrap.getBoundingClientRect();
    DPR = Math.min(2.5, window.devicePixelRatio || 1);
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  }
  new ResizeObserver(resize).observe(wrap);

  function drawEarth() {
    const ex = sx(0), ey = sy(0), er = R * view.scale;
    // Atmosphärenschimmer
    const glow = ctx.createRadialGradient(ex, ey, er * 0.98, ex, ey, er * 1.035);
    glow.addColorStop(0, 'rgba(118,200,255,.32)'); glow.addColorStop(1, 'rgba(118,200,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(ex, ey, er * 1.035, 0, 2 * Math.PI); ctx.fill();
    const g = ctx.createRadialGradient(ex - er * 0.35, ey - er * 0.45, er * 0.1, ex, ey, er);
    g.addColorStop(0, '#3f8fd0'); g.addColorStop(0.55, '#1c5c98'); g.addColorStop(1, '#0d2f57');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 2 * Math.PI); ctx.fill();
    // schematische Landmassen
    ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er, 0, 2 * Math.PI); ctx.clip();
    ctx.fillStyle = 'rgba(96,170,110,.55)';
    for (const [ax, ay, rr] of [[-0.35, 0.55, 0.32], [0.25, 0.62, 0.22], [0.48, 0.1, 0.26], [-0.55, -0.2, 0.28], [0.05, -0.55, 0.3], [-0.05, 0.25, 0.15]]) {
      ctx.beginPath(); ctx.ellipse(ex + ax * er, ey - ay * er, rr * er, rr * er * 0.62, ax * 2, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(190,225,255,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, 2 * Math.PI); ctx.stroke();
    // 100-km-Linie
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(118,217,255,.45)';
    ctx.beginPath(); ctx.arc(ex, ey, (R + KARMAN) * view.scale, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawMountain() {
    const h = st.h, r0 = R + h;
    const halfBase = Math.max(h * 0.45, 9 / view.scale, 5e3);
    const d = halfBase / R;
    const pts = [];
    pts.push([R * Math.cos(Math.PI / 2 + d), R * Math.sin(Math.PI / 2 + d)]);
    pts.push([0, r0]);
    pts.push([R * Math.cos(Math.PI / 2 - d), R * Math.sin(Math.PI / 2 - d)]);
    ctx.beginPath();
    ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    ctx.lineTo(sx(pts[1][0]), sy(pts[1][1]));
    ctx.lineTo(sx(pts[2][0]), sy(pts[2][1]));
    // Bogen entlang der Oberfläche zurück
    ctx.arc(sx(0), sy(0), R * view.scale, -(Math.PI / 2 - d), -(Math.PI / 2 + d), true);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, sy(r0), 0, sy(R));
    g.addColorStop(0, '#d8dee6'); g.addColorStop(0.12, '#9a8f84'); g.addColorStop(1, '#5d5047');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawCannon() {
    const x = sx(0), y = sy(R + st.h);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#2b3a4d'; ctx.strokeStyle = '#c9d6e4'; ctx.lineWidth = 1.2;
    // Die Mündung liegt genau am Abschusspunkt (0, R + h); das Rohr zeigt waagerecht.
    ctx.beginPath(); ctx.moveTo(-21, 7); ctx.lineTo(-17, 1); ctx.lineTo(-6, 1); ctx.lineTo(-2, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4b5e75';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-24, -3.5, 24, 7, 3); else ctx.rect(-24, -3.5, 24, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-13, 5, 4, 0, 2 * Math.PI); ctx.fillStyle = '#7b5a3c'; ctx.fill(); ctx.stroke();
    if (st.flash > 0) {
      ctx.globalAlpha = st.flash;
      const fg = ctx.createRadialGradient(4, 0, 0, 4, 0, 16);
      fg.addColorStop(0, '#fff6c8'); fg.addColorStop(0.4, '#ffb45f'); fg.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(4, 0, 16, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.restore();
  }

  function pathOf(s, upto) {
    ctx.beginPath();
    let started = false;
    for (const i of s.draw) {
      if (upto !== undefined && i > upto.i) break;
      const X = sx(s.X[i]), Y = sy(s.Y[i]);
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    if (upto) ctx.lineTo(sx(upto.x), sy(upto.y));
  }

  function labelShot(s) {
    let i;
    if (s.kind === 'impact') i = s.T.length - 1;
    else if (s.kind === 'escape') i = Math.floor((s.T.length - 1) * 0.55);
    else { // Punkt mit größtem Abstand bzw. „unten“
      i = 0; let best = -Infinity;
      for (const k of s.draw) { const v = -s.Y[k]; if (v > best) { best = v; i = k; } }
    }
    const X = sx(s.X[i]), Y = sy(s.Y[i]);
    // Beschriftung weglassen, wenn sie direkt an der Kanone kleben würde (stark herausgezoomt)
    if (Math.hypot(X - sx(0), Y - sy(R + s.h0)) < 55) return;
    ctx.font = '700 11px Inter,system-ui,sans-serif'; ctx.fillStyle = s.color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`${nf(s.v0 / 1000, 2)} km/s`, X + 6, Y + (s.kind === 'impact' ? -9 : 12));
    if (s.kind === 'impact') {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X - 4, Y - 4); ctx.lineTo(X + 4, Y + 4); ctx.moveTo(X + 4, Y - 4); ctx.lineTo(X - 4, Y + 4); ctx.stroke();
    }
  }

  function arrow(x, y, dx, dy, color, label) {
    const len = Math.hypot(dx, dy); if (len < 2) return;
    const ux = dx / len, uy = dy / len, hx = x + dx, hy = y + dy;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx - ux * 6, hy - uy * 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - ux * 10 - uy * 5, hy - uy * 10 + ux * 5); ctx.lineTo(hx - ux * 10 + uy * 5, hy - uy * 10 - ux * 5); ctx.closePath(); ctx.fill();
    ctx.font = '800 12px Inter,system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lx = hx + ux * 12, ly = hy + uy * 12;
    const [main, sub] = label.split('_');
    ctx.fillText(main, lx - (sub ? 3 : 0), ly);
    if (sub) { ctx.font = '800 9px Inter,system-ui,sans-serif'; ctx.fillText(sub, lx + 5, ly + 4); }
  }

  function drawScaleBar() {
    const targetPx = 110, m = targetPx / view.scale;
    const p = Math.pow(10, Math.floor(Math.log10(m)));
    const nice = [1, 2, 5, 10].map(k => k * p).reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a);
    const px = nice * view.scale, x = 14, y = H - 16;
    ctx.strokeStyle = '#c4d2e2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 5); ctx.stroke();
    ctx.fillStyle = '#c4d2e2'; ctx.font = '700 11px Inter,system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${nf(nice / 1000)} km`, x + 4, y - 6);
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#040a13'; ctx.fillRect(0, 0, W, H);
    for (const [fx, fy, a] of stars) { ctx.fillStyle = `rgba(220,235,255,${a * 0.55})`; ctx.fillRect(fx * W, fy * H, 1.3, 1.3); }
    drawEarth();
    drawMountain();

    // alte Bahnen
    ctx.lineJoin = 'round';
    for (const s of st.shots) {
      ctx.globalAlpha = 0.5; ctx.strokeStyle = s.color; ctx.lineWidth = 2;
      pathOf(s); if (s.kind === 'orbit' || s.kind === 'circle') ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 0.85; labelShot(s);
    }
    ctx.globalAlpha = 1;

    drawCannon();

    // aktuelle Bahn
    const s = st.cur;
    if (s) {
      const now = stateAt(s, s.t);
      const periodic = s.kind === 'orbit' || s.kind === 'circle';
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.6;
      if (periodic && s.t >= s.tEnd) { pathOf(s); ctx.closePath(); } else pathOf(s, now);
      ctx.stroke();
      if (s.ended) labelShot(s);
      const X = sx(now.x), Y = sy(now.y);
      if (ui.vec.checked) {
        const v = Math.hypot(now.vx, now.vy), r = Math.hypot(now.x, now.y), g = GM / (r * r);
        const vl = v / 8000 * 72, gl = Math.max(5, g / 9.81 * 52);
        if (!(s.kind === 'impact' && s.ended)) {
          arrow(X, Y, now.vx / v * vl, -now.vy / v * vl, '#75e1a8', 'v');
          arrow(X, Y, -now.x / r * gl, now.y / r * gl, '#ffb45f', 'F_G');
        }
      }
      const bg = ctx.createRadialGradient(X, Y, 0, X, Y, 10);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.35, s.color); bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(X, Y, 10, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#1a1f26'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(X, Y, 3.6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

      // Messwerte
      const v = Math.hypot(now.vx, now.vy), r = Math.hypot(now.x, now.y);
      ui.roV.textContent = nf(v / 1000, 2);
      ui.roH.textContent = nf(Math.max(0, r - R) / 1000);
      ui.roD.textContent = nf(now.ang * R / 1000);
      ui.roT.textContent = fmtTime(Math.min(s.t, periodic ? Infinity : s.tEnd));
      if (periodic && now.laps >= 1) setPill('orbit', `${s.kind === 'circle' ? 'Kreisbahn' : 'Umlaufbahn'} · ${now.laps} ${now.laps === 1 ? 'Umlauf' : 'Umläufe'}`);
    } else {
      // Kugel im Rohr
      ui.roV.textContent = nf(0, 2); ui.roH.textContent = nf(st.h / 1000); ui.roD.textContent = '0'; ui.roT.textContent = fmtTime(0);
    }
    drawScaleBar();
  }

  /* ---------- Schleife ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const s = st.cur;
    if (s && !st.paused) {
      const periodic = s.kind === 'orbit' || s.kind === 'circle';
      // Startphase etwas langsamer, damit der Abschuss sichtbar ist
      const ease = Math.min(1, 0.25 + s.t / 240);
      s.t += dt * st.warp * ease;
      if (!periodic && s.t >= s.tEnd) s.t = s.tEnd;
      if (!s.ended && s.t >= s.tEnd) onShotEnd(s);
    }
    st.flash = Math.max(0, st.flash - dt * 2.5);
    if (W && H) { updateView(dt); render(); }
    requestAnimationFrame(frame);
  }

  syncV(); syncH(); syncW(); resize();
  requestAnimationFrame(frame);
})();
