'use strict';
// Volunteer sign-up form

const roleCards = document.querySelectorAll('.crew-role-card');
const roleSelect = document.getElementById('crew-role-select');

function selectCrewRole(roleName) {
  roleSelect.value = roleName;
  roleCards.forEach((card) => {
    const isMatch = card.getAttribute('data-role') === roleName;
    const badge = card.querySelector('.role-check-badge');
    if (isMatch) {
      card.classList.remove('border', 'border-hairline');
      card.classList.add('border-2', 'border-[var(--accent-coral)]');
      if (badge) badge.classList.remove('hidden');
    } else {
      card.classList.remove('border-2', 'border-[var(--accent-coral)]');
      card.classList.add('border', 'border-hairline');
      if (badge) badge.classList.add('hidden');
    }
  });
}

roleCards.forEach((card) => {
  card.addEventListener('click', () => selectCrewRole(card.getAttribute('data-role')));
});
roleSelect.addEventListener('change', (e) => selectCrewRole(e.target.value));

const crewForm = document.getElementById('crew-form');
const crewError = document.getElementById('crew-form-error');
const crewPassCard = document.getElementById('crew-pass-card');
crewForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('crew-name').value.trim();
  const contact = document.getElementById('crew-contact').value.trim();
  const role = roleSelect.value;
  const curiosity = document.getElementById('crew-curiosity').value.trim();

  if (!name || !contact || !curiosity) {
    crewError.classList.remove('hidden');
    return;
  }
  crewError.classList.add('hidden');

  const subject = encodeURIComponent('Volunteer: ' + role);
  const body = encodeURIComponent('Name: ' + name + '\nContact: ' + contact + '\nRole: ' + role + '\n\nWhy I am interested:\n' + curiosity);

  document.getElementById('pass-holder-name').textContent = name;
  crewForm.classList.add('hidden');
  crewPassCard.classList.remove('hidden');
  window.location.href = 'mailto:hello@cephei.org?subject=' + subject + '&body=' + body;
});

document.getElementById('reset-pass-btn').addEventListener('click', () => {
  crewPassCard.classList.add('hidden');
  crewForm.classList.remove('hidden');
});
