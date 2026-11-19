'use strict';
// Gravity, Cepheid and tunneling simulations

let currentToy = 'toy1';
const toyTabs = document.querySelectorAll('.toy-tab');
const toyPanels = document.querySelectorAll('.toy-panel');

toyTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    currentToy = tab.getAttribute('data-toy');
    toyTabs.forEach((t) => {
      t.classList.remove('border-2', 'border-[var(--accent-coral)]', 'surface-alt');
      t.classList.add('border', 'border-hairline', 'surface-card');
      t.querySelector('span:first-child').classList.remove('ink-coral');
      t.querySelector('span:first-child').classList.add('ink-muted');
    });
    tab.classList.remove('border', 'border-hairline', 'surface-card');
    tab.classList.add('border-2', 'border-[var(--accent-coral)]', 'surface-alt');
    tab.querySelector('span:first-child').classList.remove('ink-muted');
    tab.querySelector('span:first-child').classList.add('ink-coral');

    toyPanels.forEach((p) => p.classList.add('hidden'));
    document.getElementById(`${currentToy}-panel`).classList.remove('hidden');
    drawAllVisible();
  });
});

const gravCanvas = document.getElementById('grav-canvas');
const gravBox = document.getElementById('grav-canvas-box');
let isBlackHole = false;
let probes = [];
let dragAim = null; // { startX, startY, currX, currY }

function spawnDemoProbe() {
  const rect = gravBox.getBoundingClientRect();
  const w = rect.width || 700;
  const h = rect.height || 380;
  const cx = w / 2;
  const cy = h / 2;
  const r0 = Math.min(w, h) * 0.27;
  const gm = isBlackHole ? 8200 : 5400;
  const vCirc = Math.sqrt(gm / r0);
  probes = [
    {
      x: cx,
      y: cy - r0,
      vx: vCirc * 0.96,
      vy: 0,
      vInit: vCirc * 0.96,
      maxSpeedSeen: vCirc * 0.96,
      angleAccum: 0,
      prevAngle: -Math.PI / 2,
      trail: [],
      alive: true,
      status: 'Stable orbit'
    }
  ];
}

function stepGravityProbes(dt) {
  const rect = gravBox.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const gm = isBlackHole ? 8200 : 5400;
  const captureR = isBlackHole ? 22 : 24;

  probes.forEach((p) => {
    if (!p.alive) return;

    // 4 substeps for smooth orbital conservation
    const subDt = dt / 4;
    for (let s = 0; s < 4; s++) {
      const dx = cx - p.x;
      const dy = cy - p.y;
      const rSq = dx * dx + dy * dy;
      const r = Math.sqrt(rSq);

      if (r <= captureR) {
        p.alive = false;
        p.status = isBlackHole
          ? 'Crossed the event horizon!'
          : 'Splashed into the star’s corona!';
        break;
      }

      // Newtonian + subtle relativistic 1/r^3 term near Black Hole for cool precession
      const relBoost = isBlackHole ? 1 + 1150 / Math.max(400, rSq) : 1;
      const accel = (gm * relBoost) / Math.max(300, rSq);
      p.vx += (accel * dx) / r * subDt;
      p.vy += (accel * dy) / r * subDt;
      p.x += p.vx * subDt;
      p.y += p.vy * subDt;
    }

    const speed = Math.hypot(p.vx, p.vy);
    if (speed > p.maxSpeedSeen) p.maxSpeedSeen = speed;

    // Track orbital sweep angle
    const curAng = Math.atan2(p.y - cy, p.x - cx);
    let dAng = curAng - p.prevAngle;
    if (dAng > Math.PI) dAng -= Math.PI * 2;
    if (dAng < -Math.PI) dAng += Math.PI * 2;
    p.angleAccum += dAng;
    p.prevAngle = curAng;

    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 160) p.trail.shift();

    const distFromCenter = Math.hypot(p.x - cx, p.y - cy);
    const escapeLimit = Math.max(rect.width, rect.height) * 0.85;

    if (p.alive) {
      if (distFromCenter > escapeLimit) {
        p.alive = false;
        p.status =
          p.maxSpeedSeen > p.vInit * 1.32
            ? 'Gravity assist: speed boost'
            : 'Escaped';
      } else if (p.maxSpeedSeen > p.vInit * 1.35 && distFromCenter > 95) {
        p.status = 'Gravity assist: speed boost';
      } else if (Math.abs(p.angleAccum) > Math.PI * 1.65) {
        p.status = 'Stable orbit';
      } else {
        p.status = 'In flight';
      }
    }
  });

  // Update HUD for latest probe
  const latest = probes[probes.length - 1];
  if (latest) {
    document.getElementById('grav-status-pill').textContent = latest.status;
    const speedKmS = latest.alive ? (Math.hypot(latest.vx, latest.vy) * 0.24).toFixed(1) : '0.0';
    document.getElementById('grav-speed-out').textContent = `${speedKmS} km/s`;
  }
}

function drawGravityToy() {
  if (!gravCanvas || !gravBox) return;
  const rect = gravBox.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  gravCanvas.width = Math.round(rect.width * dpr);
  gravCanvas.height = Math.round(rect.height * dpr);
  const ctx = gravCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = '#0B101D';
  ctx.fillRect(0, 0, w, h);

  // Subtle polar range rings
  ctx.strokeStyle = 'rgba(244, 236, 216, 0.07)';
  ctx.lineWidth = 1;
  [70, 140, 210].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Central Body: Normal Star vs Black Hole
  if (isBlackHole) {
    // Accretion ring glow
    const bhGlow = ctx.createRadialGradient(cx, cy, 18, cx, cy, 56);
    bhGlow.addColorStop(0, 'rgba(217, 119, 66, 0.55)');
    bhGlow.addColorStop(0.5, 'rgba(212, 180, 106, 0.18)');
    bhGlow.addColorStop(1, 'rgba(11, 16, 29, 0)');
    ctx.fillStyle = bhGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = '#E68550';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const starGlow = ctx.createRadialGradient(cx, cy, 12, cx, cy, 54);
    starGlow.addColorStop(0, 'rgba(244, 210, 120, 0.65)');
    starGlow.addColorStop(1, 'rgba(11, 16, 29, 0)');
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#E8C56B';
    ctx.fill();
    ctx.strokeStyle = '#F4ECD8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw Probes & Glowing Trails
  probes.forEach((p, idx) => {
    const isLatest = idx === probes.length - 1;
    if (p.trail.length > 1) {
      for (let i = 1; i < p.trail.length; i++) {
        const alpha = (i / p.trail.length) * (isLatest ? 0.95 : 0.4);
        ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle = isLatest
          ? `rgba(230, 133, 80, ${alpha})`
          : `rgba(212, 180, 106, ${alpha})`;
        ctx.lineWidth = isLatest ? 2.5 : 1.6;
        ctx.stroke();
      }
    }

    if (p.alive) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, isLatest ? 5.2 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F4ECD8';
      ctx.fill();
      ctx.strokeStyle = '#E68550';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Draw Aiming Slingshot Vector & Dotted Preview Path while dragging
  if (dragAim) {
    const vx = (dragAim.startX - dragAim.currX) * 1.45;
    const vy = (dragAim.startY - dragAim.currY) * 1.45;

    // Slingshot band
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#D4B46A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(dragAim.currX, dragAim.currY);
    ctx.lineTo(dragAim.startX, dragAim.startY);
    ctx.stroke();

    // Predicted trajectory dots
    let simX = dragAim.startX;
    let simY = dragAim.startY;
    let simVx = vx;
    let simVy = vy;
    const gm = isBlackHole ? 8200 : 5400;

    ctx.fillStyle = 'rgba(230, 133, 80, 0.75)';
    for (let step = 0; step < 36; step++) {
      const dx = cx - simX;
      const dy = cy - simY;
      const rSq = Math.max(300, dx * dx + dy * dy);
      const r = Math.sqrt(rSq);
      const accel = gm / rSq;
      simVx += (accel * dx) / r * 0.04;
      simVy += (accel * dy) / r * 0.04;
      simX += simVx * 0.04;
      simY += simVy * 0.04;
      if (step % 2 === 0) {
        ctx.beginPath();
        ctx.arc(simX, simY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Launch origin marker
    ctx.beginPath();
    ctx.arc(dragAim.startX, dragAim.startY, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E68550';
    ctx.fill();
  }
}

function getCanvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function launchProbeFromAim() {
  if (!dragAim) return;
  const rect = gravBox.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  let vx = (dragAim.startX - dragAim.currX) * 1.45;
  let vy = (dragAim.startY - dragAim.currY) * 1.45;

  // If user just tapped without dragging, give a neat tangential orbital velocity!
  if (Math.hypot(vx, vy) < 12) {
    const dx = dragAim.startX - cx;
    const dy = dragAim.startY - cy;
    const r = Math.max(45, Math.hypot(dx, dy));
    const gm = isBlackHole ? 8200 : 5400;
    const vOrb = Math.sqrt(gm / r);
    vx = (-dy / r) * vOrb;
    vy = (dx / r) * vOrb;
  }

  const vInit = Math.hypot(vx, vy);
  const startAng = Math.atan2(dragAim.startY - cy, dragAim.startX - cx);
  probes.push({
    x: dragAim.startX,
    y: dragAim.startY,
    vx,
    vy,
    vInit,
    maxSpeedSeen: vInit,
    angleAccum: 0,
    prevAngle: startAng,
    trail: [{ x: dragAim.startX, y: dragAim.startY }],
    alive: true,
    status: 'Probe launched! Watch gravity bend its path'
  });
  if (probes.length > 5) probes.shift();
  dragAim = null;
}

gravCanvas.addEventListener('mousedown', (e) => {
  const pt = getCanvasPoint(gravCanvas, e.clientX, e.clientY);
  dragAim = { startX: pt.x, startY: pt.y, currX: pt.x, currY: pt.y };
});
window.addEventListener('mousemove', (e) => {
  if (!dragAim) return;
  const pt = getCanvasPoint(gravCanvas, e.clientX, e.clientY);
  dragAim.currX = pt.x;
  dragAim.currY = pt.y;
});
window.addEventListener('mouseup', () => {
  if (dragAim) launchProbeFromAim();
});

gravCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    const pt = getCanvasPoint(gravCanvas, e.touches[0].clientX, e.touches[0].clientY);
    dragAim = { startX: pt.x, startY: pt.y, currX: pt.x, currY: pt.y };
  }
}, { passive: true });
gravCanvas.addEventListener('touchmove', (e) => {
  if (dragAim && e.touches.length > 0) {
    const pt = getCanvasPoint(gravCanvas, e.touches[0].clientX, e.touches[0].clientY);
    dragAim.currX = pt.x;
    dragAim.currY = pt.y;
  }
}, { passive: true });
gravCanvas.addEventListener('touchend', () => {
  if (dragAim) launchProbeFromAim();
});

const gravStarBtn = document.getElementById('grav-star-btn');
const gravBhBtn = document.getElementById('grav-bh-btn');
gravStarBtn.addEventListener('click', () => {
  isBlackHole = false;
  gravStarBtn.classList.add('btn-primary');
  gravStarBtn.classList.remove('ink-muted');
  gravBhBtn.classList.remove('btn-primary');
  gravBhBtn.classList.add('ink-muted');
  document.getElementById('grav-mass-label').textContent = 'Center: Sun-like star (1 solar mass)';
  spawnDemoProbe();
});

gravBhBtn.addEventListener('click', () => {
  isBlackHole = true;
  gravBhBtn.classList.add('btn-primary');
  gravBhBtn.classList.remove('ink-muted');
  gravStarBtn.classList.remove('btn-primary');
  gravStarBtn.classList.add('ink-muted');
  document.getElementById('grav-mass-label').textContent = 'Center: black hole (10 solar masses)';
  spawnDemoProbe();
});

document.getElementById('grav-reset-btn').addEventListener('click', () => {
  spawnDemoProbe();
  showToast('Cleared');
});

let cephDays = 5.4;
let cephName = 'Delta Cephei';
let cephPhase = 0;

function cephBrightnessWave(phi) {
  const p = ((phi % 1) + 1) % 1;
  if (p < 0.22) {
    return Math.sin(((p / 0.22) * Math.PI) / 2); // Quick bright surge
  }
  return 1.0 - (p - 0.22) / 0.78; // Gradual fade
}

function updateCepheidStats() {
  document.getElementById('ceph-period-badge').textContent = `${cephDays.toFixed(1)} days`;
  document.getElementById('ceph-star-title').textContent = cephName;

  // rough period-luminosity scaling
  const lumMult = Math.round(320 * Math.pow(cephDays, 1.15));
  const sizeMult = Math.round(24 * Math.pow(cephDays, 0.42));
  const reachLy = Math.round(0.16 * Math.sqrt(lumMult) * 60000);

  document.getElementById('ceph-lum-out').textContent = `${lumMult.toLocaleString()}× brighter than Sun`;
  document.getElementById('ceph-size-out').textContent = `${sizeMult}× wider than Sun`;
  document.getElementById('ceph-reach-out').textContent =
    reachLy >= 1000000
      ? `${(reachLy / 1000000).toFixed(1)} million light-years`
      : `${reachLy.toLocaleString()} light-years`;
}

function drawCosmicLighthouse() {
  const sCanvas = document.getElementById('ceph-star-canvas');
  const sBox = document.getElementById('ceph-star-box');
  const cCanvas = document.getElementById('ceph-curve-canvas');
  const cBox = document.getElementById('ceph-curve-box');
  if (!sCanvas || !cCanvas) return;

  const dpr = window.devicePixelRatio || 1;
  const c = getCanvasColors();

  // Left: Breathing Pulsing Star
  const r1 = sBox.getBoundingClientRect();
  if (r1.width > 0 && r1.height > 0) {
    sCanvas.width = Math.round(r1.width * dpr);
    sCanvas.height = Math.round(r1.height * dpr);
    const ctx = sCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = r1.width;
    const h = r1.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#0B101D';
    ctx.fillRect(0, 0, w, h);

    // Base radius grows with period (2d -> 30d)
    const periodNorm = (cephDays - 2) / 28;
    const baseR = Math.min(w, h) * (0.17 + periodNorm * 0.14);
    const pulseWave = Math.sin(cephPhase * Math.PI * 2);
    const curR = baseR * (1 + 0.14 * pulseWave);
    const bright = cephBrightnessWave(cephPhase);

    document.getElementById('ceph-state-tag').textContent =
      pulseWave > 0 ? 'Expanding' : 'Contracting';

    // Equilibrium dashed ring
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(212, 180, 106, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Warm golden-white corona
    const glow = ctx.createRadialGradient(cx, cy, curR * 0.6, cx, cy, curR * 1.65);
    glow.addColorStop(0, `rgba(244, 215, 130, ${0.25 + bright * 0.35})`);
    glow.addColorStop(1, 'rgba(11, 16, 29, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, curR * 1.65, 0, Math.PI * 2);
    ctx.fill();

    // Star photosphere
    ctx.beginPath();
    ctx.arc(cx, cy, curR, 0, Math.PI * 2);
    ctx.fillStyle = bright > 0.6 ? '#F8E39C' : '#DFB55C';
    ctx.fill();
    ctx.strokeStyle = '#F4ECD8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Right: Live Brightness Curve
  const r2 = cBox.getBoundingClientRect();
  if (r2.width > 0 && r2.height > 0) {
    cCanvas.width = Math.round(r2.width * dpr);
    cCanvas.height = Math.round(r2.height * dpr);
    const ctx = cCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = r2.width;
    const h = r2.height;
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, w, h);

    const padL = 26;
    const padR = 20;
    const padT = 24;
    const padB = 28;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    // Subtle horizontal grid
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((f) => {
      const y = padT + f * ph;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    });

    // Draw 2 full heartbeat cycles
    const scaleAmp = 0.45 + ((cephDays - 2) / 28) * 0.48;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const cyc = (i / 160) * 2.0;
      const b = cephBrightnessWave(cyc) * scaleAmp;
      const x = padL + (cyc / 2.0) * pw;
      const y = padT + ph - b * (ph * 0.88) - 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = c.coral;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Live marker dot
    const curX = padL + (cephPhase / 2.0) * pw;
    const curB = cephBrightnessWave(cephPhase) * scaleAmp;
    const curY = padT + ph - curB * (ph * 0.88) - 8;

    ctx.beginPath();
    ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = c.ink;
    ctx.fill();
    ctx.strokeStyle = c.coral;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Axis labels
    ctx.font = '11px "Source Sans 3", sans-serif';
    ctx.fillStyle = c.muted;
    ctx.fillText('0 days', padL, h - 8);
    ctx.fillText(`${cephDays.toFixed(1)}d`, padL + pw * 0.5 - 12, h - 8);
    ctx.fillText(`${(cephDays * 2).toFixed(1)}d`, w - padR - 30, h - 8);
  }
}

const cephSlider = document.getElementById('ceph-period-slider');
cephSlider.addEventListener('input', (e) => {
  cephDays = parseFloat(e.target.value);
  cephName = 'Custom Cepheid Star';
  updateCepheidStats();
  drawCosmicLighthouse();
});

document.querySelectorAll('.ceph-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    cephDays = parseFloat(btn.getAttribute('data-days'));
    cephName = btn.getAttribute('data-name');
    cephSlider.value = cephDays;

    document.querySelectorAll('.ceph-preset').forEach((b) => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
    });
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');

    updateCepheidStats();
    drawCosmicLighthouse();
  });
});

const Q_POINTS = 260;
const Q_WALL_POS = 142;
const Q_BARRIER_V0 = 0.15;
const Q_STEP_DT = 0.34;

let qEnergyPct = 85;
let qWallWidth = 12;
let qTicks = 0;

const qRe = new Float64Array(Q_POINTS);
const qIm = new Float64Array(Q_POINTS);
const qWall = new Float64Array(Q_POINTS);

function resetQuantumWave() {
  qTicks = 0;
  qWall.fill(0);
  const half = Math.floor(qWallWidth / 2);
  for (let i = 0; i < Q_POINTS; i++) {
    if (Math.abs(i - Q_WALL_POS) <= half) {
      qWall[i] = Q_BARRIER_V0;
    }
  }

  const x0 = 64;
  const sigma = 14;
  const k0 = Math.sqrt(2 * (qEnergyPct / 100) * Q_BARRIER_V0);
  let sum = 0;
  for (let i = 1; i < Q_POINTS - 1; i++) {
    const env = Math.exp(-Math.pow(i - x0, 2) / (4 * sigma * sigma));
    qRe[i] = env * Math.cos(k0 * (i - x0));
    qIm[i] = env * Math.sin(k0 * (i - x0));
    sum += qRe[i] * qRe[i] + qIm[i] * qIm[i];
  }
  qRe[0] = qRe[Q_POINTS - 1] = 0;
  qIm[0] = qIm[Q_POINTS - 1] = 0;

  const inv = 1 / Math.sqrt(sum);
  for (let i = 1; i < Q_POINTS - 1; i++) {
    qRe[i] *= inv;
    qIm[i] *= inv;
  }
  for (let i = 1; i < Q_POINTS - 1; i++) {
    const lapRe = qRe[i + 1] - 2 * qRe[i] + qRe[i - 1];
    qIm[i] += 0.5 * Q_STEP_DT * (-0.5 * lapRe + qWall[i] * qRe[i]);
  }
}

function stepQuantumWave(steps) {
  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < Q_POINTS - 1; i++) {
      const lapIm = qIm[i + 1] - 2 * qIm[i] + qIm[i - 1];
      qRe[i] += Q_STEP_DT * (-0.5 * lapIm + qWall[i] * qIm[i]);
    }
    for (let i = 1; i < Q_POINTS - 1; i++) {
      const lapRe = qRe[i + 1] - 2 * qRe[i] + qRe[i - 1];
      qIm[i] -= Q_STEP_DT * (-0.5 * lapRe + qWall[i] * qRe[i]);
    }
  }
  qTicks += steps;
  if (qTicks > 720) {
    resetQuantumWave();
  }
}

function drawQuantumToy() {
  const qCanvas = document.getElementById('q-canvas');
  const qBox = document.getElementById('q-canvas-box');
  if (!qCanvas || !qBox) return;

  const rect = qBox.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  qCanvas.width = Math.round(rect.width * dpr);
  qCanvas.height = Math.round(rect.height * dpr);
  const ctx = qCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  ctx.fillStyle = '#0B101D';
  ctx.fillRect(0, 0, w, h);

  const padX = 20;
  const pw = w - padX * 2;
  const baseY = h * 0.78;

  // Draw Solid Energy Wall
  ctx.beginPath();
  ctx.moveTo(padX, baseY);
  for (let i = 0; i < Q_POINTS; i++) {
    const x = padX + (i / (Q_POINTS - 1)) * pw;
    const y = baseY - (qWall[i] / Q_BARRIER_V0) * (h * 0.48);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(padX + pw, baseY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(230, 133, 80, 0.24)';
  ctx.fill();
  ctx.strokeStyle = '#E68550';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Compute Left (Reflected) vs Right (Tunneled) Probability
  let leftProb = 0;
  let rightProb = 0;
  let peakD = 0.03;
  for (let i = 1; i < Q_POINTS - 1; i++) {
    const d = qRe[i] * qRe[i] + qIm[i] * qIm[i];
    if (i < Q_WALL_POS) leftProb += d;
    else rightProb += d;
    if (d > peakD) peakD = d;
  }

  // Glowing Probability Wave
  ctx.beginPath();
  ctx.moveTo(padX, baseY);
  for (let i = 0; i < Q_POINTS; i++) {
    const d = qRe[i] * qRe[i] + qIm[i] * qIm[i];
    const x = padX + (i / (Q_POINTS - 1)) * pw;
    const y = baseY - (d / (peakD * 1.15)) * (h * 0.56);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(padX + pw, baseY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(212, 180, 106, 0.34)';
  ctx.fill();
  ctx.strokeStyle = '#F4ECD8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Update Live Meters
  const tot = Math.max(0.0001, leftProb + rightProb);
  const refPct = Math.round((leftProb / tot) * 100);
  const tunPct = 100 - refPct;

  document.getElementById('q-reflected-pct').textContent = `${refPct}%`;
  document.getElementById('q-reflected-bar').style.width = `${refPct}%`;
  document.getElementById('q-tunneled-pct').textContent = `${tunPct}%`;
  document.getElementById('q-tunneled-bar').style.width = `${tunPct}%`;

  const pill = document.getElementById('q-callout-pill');
  if (qTicks < 160) {
    pill.textContent = 'Wave approaching the barrier';
  } else if (tunPct >= 5) {
    pill.textContent = `${tunPct}% of the wave tunneled through`;
  } else {
    pill.textContent = 'Almost all of the wave was reflected';
  }
}

document.getElementById('q-energy-slider').addEventListener('input', (e) => {
  qEnergyPct = parseInt(e.target.value, 10);
  document.getElementById('q-energy-badge').textContent = `${qEnergyPct}% of barrier height`;
  resetQuantumWave();
});

document.getElementById('q-width-slider').addEventListener('input', (e) => {
  qWallWidth = parseInt(e.target.value, 10);
  const label = qWallWidth <= 10 ? 'Thin Barrier' : qWallWidth <= 18 ? 'Medium Barrier' : 'Thick Barrier';
  document.getElementById('q-width-badge').textContent = label;
  resetQuantumWave();
});

document.getElementById('q-fire-btn').addEventListener('click', () => {
  resetQuantumWave();
});
