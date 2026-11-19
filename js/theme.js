'use strict';
// Toast, dark mode toggle and mobile menu

let toastTimeout = null;
function showToast(message) {
  const pill = document.getElementById('toast-pill');
  const text = document.getElementById('toast-text');
  if (!pill || !text) return;
  text.textContent = message;
  pill.classList.remove('hidden');
  pill.classList.add('animate-pop');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    pill.classList.add('hidden');
  }, 3400);
}

let isStargaze = false;
const stargazeBtn = document.getElementById('stargaze-toggle');
const themeTrack = document.getElementById('theme-track');
const themeThumb = document.getElementById('theme-thumb');

function getCanvasColors() {
  if (isStargaze) {
    return {
      bg: '#0B101D',
      ink: '#F4ECD8',
      muted: '#B4BDD1',
      gold: '#D4B46A',
      coral: '#E68550',
      line: 'rgba(244, 236, 216, 0.35)',
      grid: 'rgba(244, 236, 216, 0.08)'
    };
  }
  return {
    bg: '#EFE5CE',
    ink: '#131A2C',
    muted: '#3E4A63',
    gold: '#9A7D3A',
    coral: '#D97742',
    line: 'rgba(19, 26, 44, 0.32)',
    grid: 'rgba(19, 26, 44, 0.08)'
  };
}

stargazeBtn.addEventListener('click', () => {
  isStargaze = !isStargaze;
  stargazeBtn.setAttribute('aria-checked', String(isStargaze));
  if (isStargaze) {
    document.documentElement.setAttribute('data-theme', 'stargaze');
    themeTrack.style.backgroundColor = 'rgba(212, 180, 106, 0.35)';
    themeThumb.style.backgroundColor = '#D4B46A';
    themeThumb.style.transform = 'translateX(17px)';
    showToast('Dark mode on');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeTrack.style.backgroundColor = 'rgba(19, 26, 44, 0.15)';
    themeThumb.style.backgroundColor = '#131A2C';
    themeThumb.style.transform = 'translateX(2px)';
    showToast('Light mode on');
  }
  drawAllVisible();
});

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
document.querySelectorAll('.mobile-nav-link').forEach((link) => {
  link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
});
