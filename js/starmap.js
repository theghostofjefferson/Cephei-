'use strict';
// Hero Cepheus star map and Earth wobble

const mapStars = [
  {
    id: 'delta',
    name: 'Delta Cephei',
    tag: 'Namesake star',
    dist: '887 light-years away',
    nx: 0.34,
    ny: 0.72,
    r: 6.2,
    inHouse: true,
    fact: "Delta Cephei pulses every 5.4 days. That rhythm is tied to its true brightness, which is how astronomers use stars like it to measure distances to other galaxies."
  },
  {
    id: 'alderamin',
    name: 'Alderamin',
    tag: 'Future north star',
    dist: '49 light-years away',
    nx: 0.31,
    ny: 0.52,
    r: 7.0,
    inHouse: true,
    fact: "Alderamin (α Cephei) spins about once every 12 hours, which flattens it slightly. Earth's axis wobble will point at it around 7500 AD."
  },
  {
    id: 'alfirk',
    name: 'Alfirk',
    tag: 'Hot blue giant',
    dist: '690 light-years away',
    nx: 0.44,
    ny: 0.34,
    r: 6.0,
    inHouse: true,
    fact: "Alfirk (β Cephei) is a hot blue star, around 26,000°C at the surface, and it pulsates in a way astronomers read as sound waves moving through it."
  },
  {
    id: 'errai',
    name: 'Errai',
    tag: 'Has a planet',
    dist: '45 light-years away',
    nx: 0.62,
    ny: 0.37,
    r: 6.2,
    inHouse: true,
    fact: "Errai (γ Cephei) forms the peak of the Cepheus house shape and has a giant planet, Tadmor. Earth's axis will point near it around 4000 AD."
  },
  {
    id: 'zeta',
    name: 'Zeta Cephei',
    tag: 'Orange supergiant',
    dist: '840 light-years away',
    nx: 0.56,
    ny: 0.68,
    r: 6.0,
    inHouse: true,
    fact: "Zeta Cephei is an orange supergiant about 3,600 times brighter than the Sun. It sits at one lower corner of the Cepheus house."
  },
  {
    id: 'polaris',
    name: 'Polaris',
    tag: 'Current north star',
    dist: '433 light-years away',
    nx: 0.77,
    ny: 0.20,
    r: 6.6,
    inHouse: false,
    fact: "Polaris is the current north star. It is also a Cepheid variable, with a mild pulse of about 4 days."
  },
  {
    id: 'vega',
    name: 'Vega',
    tag: 'Summer star',
    dist: '25 light-years away',
    nx: 0.14,
    ny: 0.22,
    r: 6.8,
    inHouse: false,
    fact: "Vega is one of the brightest stars in the summer sky, 25 light-years away. It has long served as the zero point of the magnitude scale."
  }
];

// 5-star house / pentagon arrangement matching the CEPHEI logo
const houseLinks = [
  ['errai', 'alfirk'],
  ['errai', 'zeta'],
  ['alfirk', 'alderamin'],
  ['alderamin', 'delta'],
  ['delta', 'zeta']
];

let selectedStarId = 'delta';
let hoveredStarId = null;
let showConstellationLines = true;
let showOrbitRing = true;
let wobbleYear = 2026;
let wobbleAutoDrift = false;

const starMapCanvas = document.getElementById('star-map-canvas');
const starMapBox = document.getElementById('star-map-box');
const wobbleSlider = document.getElementById('wobble-slider');
const wobblePlayBtn = document.getElementById('wobble-play-btn');

// Compute North Celestial Pole position as Earth wobbles from 2026 AD (near Polaris) -> 4000 AD (near Errai) -> 7500 AD (near Alderamin)
function getNorthPolePos(year) {
  const t = Math.max(0, Math.min(1, (year - 2026) / (7500 - 2026)));
  // Smooth quadratic Bezier arc from Polaris (0.75, 0.21) through Errai (0.61, 0.35) to Alderamin (0.33, 0.49)
  const p0 = { x: 0.75, y: 0.21 };
  const p1 = { x: 0.62, y: 0.33 };
  const p2 = { x: 0.33, y: 0.49 };
  const inv = 1 - t;
  return {
    nx: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    ny: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
  };
}

function updateStarFactCard(star) {
  if (!star) return;
  document.getElementById('star-fact-badge').textContent = star.tag;
  document.getElementById('star-fact-dist').textContent = star.dist;
  document.getElementById('star-fact-text').textContent = star.fact;
}

function updateWobbleUI() {
  const yr = Math.round(wobbleYear);
  document.getElementById('wobble-year-badge').textContent = `${yr} AD`;

  let northStarName = 'Polaris';
  if (yr >= 3300 && yr < 5400) northStarName = 'Errai (in Cepheus)';
  else if (yr >= 5400) northStarName = 'Alderamin (in Cepheus)';

  document.getElementById('north-star-pill').innerHTML =
    `North Star in ${yr} AD: <strong class="ink-coral">${northStarName}</strong>`;
}

function drawStarMap() {
  if (!starMapCanvas || !starMapBox) return;
  const rect = starMapBox.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const dpr = window.devicePixelRatio || 1;
  starMapCanvas.width = Math.round(rect.width * dpr);
  starMapCanvas.height = Math.round(rect.height * dpr);
  const ctx = starMapCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  const c = getCanvasColors();

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle background field stars
  const bgDots = [
    [0.08, 0.44], [0.18, 0.78], [0.24, 0.36], [0.48, 0.16],
    [0.50, 0.85], [0.72, 0.62], [0.85, 0.45], [0.89, 0.76], [0.66, 0.14]
  ];
  ctx.fillStyle = c.muted;
  bgDots.forEach(([bx, by], idx) => {
    ctx.globalAlpha = idx % 2 === 0 ? 0.35 : 0.2;
    ctx.beginPath();
    ctx.arc(bx * w, by * h, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Tilted Orbital Ring (echoing the CEPHEI emblem!)
  if (showOrbitRing) {
    ctx.save();
    ctx.translate(w * 0.47, h * 0.53);
    ctx.rotate(-0.24);
    ctx.strokeStyle = c.gold;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.28, h * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Earth's Precession Wobble Path (2026 -> 7500 AD)
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = c.coral;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let step = 0; step <= 30; step++) {
    const yr = 2026 + (step / 30) * (7500 - 2026);
    const pos = getNorthPolePos(yr);
    if (step === 0) ctx.moveTo(pos.nx * w, pos.ny * h);
    else ctx.lineTo(pos.nx * w, pos.ny * h);
  }
  ctx.stroke();
  ctx.restore();

  // Constellation House Lines
  const byId = {};
  mapStars.forEach((s) => {
    byId[s.id] = { ...s, px: s.nx * w, py: s.ny * h };
  });

  if (showConstellationLines) {
    houseLinks.forEach(([aId, bId]) => {
      const a = byId[aId];
      const b = byId[bId];
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.strokeStyle = c.line;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Draw Moving North Celestial Pole Marker
  const pole = getNorthPolePos(wobbleYear);
  const poleX = pole.nx * w;
  const poleY = pole.ny * h;
  ctx.save();
  ctx.strokeStyle = c.coral;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(poleX, poleY, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(poleX - 12, poleY);
  ctx.lineTo(poleX + 12, poleY);
  ctx.moveTo(poleX, poleY - 12);
  ctx.lineTo(poleX, poleY + 12);
  ctx.stroke();
  ctx.font = '600 11px "Source Sans 3", sans-serif';
  ctx.fillStyle = c.coral;
  ctx.fillText('North Pole', poleX + 12, poleY + 4);
  ctx.restore();

  // Draw Interactive Stars
  Object.values(byId).forEach((s) => {
    const isSelected = s.id === selectedStarId;
    const isHovered = s.id === hoveredStarId;

    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(s.px, s.py, s.r + 7, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? 'rgba(217, 119, 66, 0.22)' : 'rgba(181, 154, 91, 0.20)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? c.coral : c.gold;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(s.px, s.py, s.r, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? c.coral : s.inHouse ? c.gold : c.ink;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.bg;
    ctx.stroke();

    ctx.font = isSelected
      ? '700 12px "Source Sans 3", sans-serif'
      : '600 11px "Source Sans 3", sans-serif';
    ctx.fillStyle = isSelected ? c.coral : c.ink;
    ctx.fillText(s.name, s.px + s.r + 7, s.py + 4);
  });
}

function hitTestStarMap(clientX, clientY) {
  const rect = starMapCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let closest = null;
  let minDist = 28;
  mapStars.forEach((s) => {
    const d = Math.hypot(x - s.nx * rect.width, y - s.ny * rect.height);
    if (d < minDist) {
      minDist = d;
      closest = s;
    }
  });
  return closest;
}

starMapCanvas.addEventListener('mousemove', (e) => {
  const hit = hitTestStarMap(e.clientX, e.clientY);
  const nextId = hit ? hit.id : null;
  if (nextId !== hoveredStarId) {
    hoveredStarId = nextId;
    drawStarMap();
  }
});

starMapCanvas.addEventListener('click', (e) => {
  const hit = hitTestStarMap(e.clientX, e.clientY);
  if (hit) {
    selectedStarId = hit.id;
    updateStarFactCard(hit);
    drawStarMap();
  }
});

starMapCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) {
    const hit = hitTestStarMap(e.touches[0].clientX, e.touches[0].clientY);
    if (hit) {
      selectedStarId = hit.id;
      updateStarFactCard(hit);
      drawStarMap();
    }
  }
}, { passive: true });

const toggleLinesBtn = document.getElementById('toggle-lines-btn');
toggleLinesBtn.addEventListener('click', () => {
  showConstellationLines = !showConstellationLines;
  toggleLinesBtn.classList.toggle('btn-primary', showConstellationLines);
  toggleLinesBtn.classList.toggle('btn-secondary', !showConstellationLines);
  drawStarMap();
});

const toggleOrbitBtn = document.getElementById('toggle-orbit-btn');
toggleOrbitBtn.addEventListener('click', () => {
  showOrbitRing = !showOrbitRing;
  toggleOrbitBtn.classList.toggle('btn-primary', showOrbitRing);
  toggleOrbitBtn.classList.toggle('btn-secondary', !showOrbitRing);
  drawStarMap();
});

wobbleSlider.addEventListener('input', (e) => {
  wobbleYear = parseFloat(e.target.value);
  updateWobbleUI();
  drawStarMap();
});

wobblePlayBtn.addEventListener('click', () => {
  wobbleAutoDrift = !wobbleAutoDrift;
  wobblePlayBtn.textContent = wobbleAutoDrift ? 'Pause' : 'Play';
});
