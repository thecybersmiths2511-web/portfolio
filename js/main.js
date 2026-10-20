/**
 * main.js — NeoKhush Portfolio
 * Navigation · Scroll Animations · Contact Form · Utilities
 */

/* ============================================================
   BOOT
============================================================ */
(function () {
  'use strict';

  function init() {
    setYear();
    initNav();
    initMobileMenu();
    initContactForm();
    initAnimations();   // GSAP last — relies on DOM being ready
  }

  // Safe init regardless of when script executes vs DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ==========================================================
     YEAR
  ========================================================== */
  function setYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ==========================================================
     NAVIGATION
     - Adds .scrolled class to navbar after 30px scroll
     - Highlights active section link
  ========================================================== */
  function initNav() {
    const navbar  = document.getElementById('navbar');
    const links   = document.querySelectorAll('.nav-link');
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    if (!navbar) return;

    let ticking = false;

    function update() {
      // Scrolled state
      navbar.classList.toggle('scrolled', window.scrollY > 30);

      // Active section
      let active = '';
      const offset = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h')) || 80;

      sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - offset - 40) {
          active = sec.id;
        }
      });

      links.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${active}`);
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update(); // run once on load
  }

  /* ==========================================================
     MOBILE MENU
  ========================================================== */
  function initMobileMenu() {
    const btn   = document.getElementById('hamburger');
    const menu  = document.getElementById('mobileMenu');
    const links = menu ? menu.querySelectorAll('.mobile-link') : [];
    if (!btn || !menu) return;

    function open() {
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close navigation menu');
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      links.forEach(l => l.removeAttribute('tabindex'));
      document.body.style.overflow = 'hidden';
    }

    function close() {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open navigation menu');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      links.forEach(l => l.setAttribute('tabindex', '-1'));
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', () =>
      btn.getAttribute('aria-expanded') === 'true' ? close() : open()
    );

    links.forEach(l => l.addEventListener('click', close));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        close();
        btn.focus();
      }
    });

    window.matchMedia('(min-width: 768px)')
      .addEventListener('change', e => { if (e.matches) close(); });
  }

  /* ==========================================================
     CONTACT FORM
  ========================================================== */
  function initContactForm() {
    const form    = document.getElementById('contactForm');
    if (!form) return;

    const fields = {
      name:    { input: form.querySelector('#name'),    error: form.querySelector('#nameErr')    },
      email:   { input: form.querySelector('#email'),   error: form.querySelector('#emailErr')   },
      message: { input: form.querySelector('#message'), error: form.querySelector('#messageErr') },
    };
    const submitBtn    = form.querySelector('#formSubmit');
    const submitLabel  = submitBtn?.querySelector('.submit-label');
    const submitSpinner= submitBtn?.querySelector('.submit-spinner');
    const successPanel = form.querySelector('#formSuccess');

    // Clear errors on input
    Object.values(fields).forEach(({ input, error }) => {
      if (!input) return;
      input.addEventListener('input', () => {
        input.classList.remove('is-error');
        if (error) error.textContent = '';
      });
    });

    function setError(key, msg) {
      const { input, error } = fields[key];
      if (input)  input.classList.add('is-error');
      if (error)  error.textContent = msg;
    }

    function clearError(key) {
      const { input, error } = fields[key];
      if (input)  input.classList.remove('is-error');
      if (error)  error.textContent = '';
    }

    function validate() {
      let ok = true;
      const name    = fields.name.input?.value.trim()    ?? '';
      const email   = fields.email.input?.value.trim()   ?? '';
      const message = fields.message.input?.value.trim() ?? '';

      if (!name) {
        setError('name', 'Please enter your name.');
        ok = false;
      } else { clearError('name'); }

      if (!email) {
        setError('email', 'Please enter your email.');
        ok = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('email', 'Please enter a valid email address.');
        ok = false;
      } else { clearError('email'); }

      if (!message) {
        setError('message', 'Please write a message.');
        ok = false;
      } else if (message.length < 10) {
        setError('message', 'Message is too short (minimum 10 characters).');
        ok = false;
      } else { clearError('message'); }

      return ok;
    }

    function setLoading(loading) {
      if (submitBtn)    submitBtn.disabled = loading;
      if (submitLabel)  submitLabel.hidden  = loading;
      if (submitSpinner) submitSpinner.hidden = !loading;
    }

    function showSuccess() {
      form.hidden = true;
      if (successPanel) successPanel.hidden = false;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate()) return;

      const action = form.getAttribute('action') || '';

      // Dev mode — Formspree endpoint not yet set
      if (action.includes('YOUR_FORM_ID') || !action) {
        showSuccess();
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          showSuccess();
        } else {
          setLoading(false);
          setError('message', 'Something went wrong. Please email me directly.');
        }
      } catch {
        setLoading(false);
        setError('message', 'Network error. Please try emailing me directly.');
      }
    });
  }

  /* ==========================================================
     ANIMATIONS — GSAP + ScrollTrigger
  ========================================================== */
  function initAnimations() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reveal all immediately if reduced motion or GSAP missing
    if (prefersReduced || typeof gsap === 'undefined') {
      return; // elements are visible by default — no CSS hides them
    }

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    animateHero();
    if (typeof ScrollTrigger !== 'undefined') {
      animateScrollSections();
    }
  }

  /* -- Hero: staggered fade-up on load ---------------------- */
  function animateHero() {
    const heroContent = document.querySelector('.hero-content');
    const heroVisual  = document.querySelector('.hero-visual');
    if (!heroContent) return;

    // Set initial state
    const items = heroContent.querySelectorAll('.hero-avail, .hero-name, .hero-role, .hero-sub, .hero-ctas, .hero-ids');
    gsap.set(items, { opacity: 0, y: 20 });
    if (heroVisual) gsap.set(heroVisual, { opacity: 0, scale: 0.96 });

    // Animate in
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(items, {
      opacity: 1, y: 0,
      duration: 0.65,
      ease: 'power2.out',
      stagger: 0.09,
    });

    if (heroVisual) {
      tl.to(heroVisual, {
        opacity: 1, scale: 1,
        duration: 0.75,
        ease: 'power2.out',
      }, 0.25);
    }
  }

  /* -- Sections: scroll-triggered fade-up ------------------- */
  function animateScrollSections() {
    // Target all [data-sr] elements outside the hero
    const triggers = document.querySelectorAll(
      'section:not(#hero) [data-sr], section:not(#hero) .section-header'
    );

    triggers.forEach(el => {
      const delay = parseFloat(el.dataset.srDelay || 0);

      gsap.set(el, { opacity: 0, y: 16 });

      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power1.out',
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });
  }

})();
