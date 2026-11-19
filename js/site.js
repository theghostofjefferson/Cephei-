'use strict';

// ---------------------------------------------------------------
// Set this to the group's real email address. Until it is filled in,
// the contact form tells people the address is not ready yet instead of
// sending their message to a made-up address.
// ---------------------------------------------------------------
const CONTACT_EMAIL = '';

// Menu
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('open')) {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }
});

// Show the email address wherever the page asks for it
document.querySelectorAll('[data-contact-email]').forEach((el) => {
  if (CONTACT_EMAIL) {
    const link = document.createElement('a');
    link.href = 'mailto:' + CONTACT_EMAIL;
    link.textContent = CONTACT_EMAIL;
    el.replaceChildren(link);
  } else {
    el.textContent = 'Contact email coming soon';
  }
});

// Contact form: opens the visitor's email app with the message filled in
const form = document.getElementById('contact-form');
if (form) {
  const msg = document.getElementById('form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();

    msg.hidden = false;
    if (!name || !email || !message) {
      msg.textContent = 'Please fill in your name, your email and a short message.';
      return;
    }
    if (!CONTACT_EMAIL) {
      msg.textContent = 'Thanks. Our contact address is not set up yet, so this message was not sent. Please check back soon.';
      return;
    }
    const subject = encodeURIComponent('CEPHEI enquiry from ' + name + ' (' + data.get('who') + ')');
    const body = encodeURIComponent(message + '\n\n' + name + '\n' + email);
    msg.textContent = 'Your email app should open with the message ready to send.';
    window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
  });
}
