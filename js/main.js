'use strict';
// Resize handling, animation loop and startup

function drawAllVisible() {
  drawStarMap();
  if (currentToy === 'toy1') drawGravityToy();
  else if (currentToy === 'toy2') drawCosmicLighthouse();
  else if (currentToy === 'toy3') drawQuantumToy();
}

if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(() => drawAllVisible());
  ['star-map-box', 'grav-canvas-box', 'ceph-star-box', 'ceph-curve-box', 'q-canvas-box'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) ro.observe(el);
  });
} else {
  window.addEventListener('resize', drawAllVisible);
}

let lastFrameTime = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  // Hero Earth Wobble Auto-Drift
  if (wobbleAutoDrift) {
    wobbleYear += dt * 520;
    if (wobbleYear > 7500) wobbleYear = 2026;
    wobbleSlider.value = Math.round(wobbleYear);
    updateWobbleUI();
    drawStarMap();
  }

  // Active Playground Toy Loop
  if (currentToy === 'toy1') {
    stepGravityProbes(dt);
    drawGravityToy();
  } else if (currentToy === 'toy2') {
    const speed = 0.55 / Math.pow(cephDays / 5.4, 0.35);
    cephPhase = (cephPhase + dt * speed) % 2.0;
    drawCosmicLighthouse();
  } else if (currentToy === 'toy3') {
    stepQuantumWave(11);
    drawQuantumToy();
  }

  requestAnimationFrame(animate);
}

window.onload = function () {
  updateStarFactCard(mapStars[0]);
  updateWobbleUI();
  spawnDemoProbe();
  updateCepheidStats();
  resetQuantumWave();
  drawAllVisible();
  requestAnimationFrame(animate);
};
