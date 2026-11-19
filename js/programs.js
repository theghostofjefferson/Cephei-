'use strict';
// Program detail modal

const programDetails = {
  camps: {
    tag: 'Weekend · Free',
    title: 'Dark-sky camps',
    intro: 'Bring a warm jacket and join 25–30 students under dark skies, away from city glare. No experience needed. We start from the basics.',
    activities: [
      'Look at Saturn’s rings, Jupiter’s moons and the Orion Nebula through 8-inch Dobsonian telescopes.',
      'Take deep-sky photos with your phone and our telescope adapters.',
      'Learn to read star charts and find your way using Cepheus, Cassiopeia and Polaris.',
      'Hot cocoa and a campfire, with time for any question, however basic.'
    ],
    bring: 'Nothing. We provide tents or cabins, telescopes, star maps, snacks, and pickup points for transport.'
  },
  workshops: {
    tag: 'Afternoon lab · Beginner friendly',
    title: 'Build-it workshops',
    intro: 'No slideshows. You build real instruments with your hands and take them home.',
    activities: [
      'Build a pocket spectroscope from an old CD and cardboard, and split light into its colors.',
      'Design and launch water rockets, and test how fin shape changes the flight.',
      'Write a 2D orbit simulator in Python or JavaScript.'
    ],
    bring: 'Nothing. We supply tools, parts and loaner laptops.'
  },
  street: {
    tag: 'Public pop-up · Free · Drop-in',
    title: 'Pop-up science',
    intro: 'We set up telescopes and physics tables in parks, plazas and school courtyards so anyone passing by can have a look.',
    activities: [
      'View sunspots and solar prominences safely through H-alpha solar telescopes.',
      'Try tabletop demos such as vacuum chambers, magnetic levitation and gyroscopes.',
      'Talk with student mentors about getting involved in local astronomy and science projects.'
    ],
    bring: 'Nothing. Walk up, and bring friends or family if you like.'
  }
};

const programModal = document.getElementById('program-modal');
document.querySelectorAll('.open-program-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-program');
    const data = programDetails[key];
    if (!data) return;

    document.getElementById('prog-modal-tag').textContent = data.tag;
    document.getElementById('prog-modal-title').textContent = data.title;
    document.getElementById('prog-modal-intro').textContent = data.intro;
    document.getElementById('prog-modal-bring').textContent = data.bring;
    document.getElementById('prog-modal-activities').innerHTML = data.activities
      .map(
        (act) => `
      <li class="flex items-start gap-2.5">
        <span class="ink-coral mt-0.5">•</span>
        <span>${act}</span>
      </li>
    `
      )
      .join('');

    programModal.classList.remove('hidden');
    programModal.classList.add('flex');
  });
});

function closeProgramModal() {
  programModal.classList.add('hidden');
  programModal.classList.remove('flex');
}
document.getElementById('prog-modal-close').addEventListener('click', closeProgramModal);
document.getElementById('prog-modal-cancel').addEventListener('click', closeProgramModal);
document.getElementById('prog-modal-rsvp').addEventListener('click', closeProgramModal);
programModal.addEventListener('click', (e) => {
  if (e.target === programModal) closeProgramModal();
});
