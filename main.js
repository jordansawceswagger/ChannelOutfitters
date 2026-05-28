document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Nav ---
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const spans = toggle.querySelectorAll('span');
      if (links.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  // --- Scroll fade-in ---
  const faders = document.querySelectorAll('.fade-in');
  if (faders.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    faders.forEach(el => obs.observe(el));
  } else {
    faders.forEach(el => el.classList.add('visible'));
  }

  // --- Active nav link ---
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html') || (page === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // --- Lightbox Gallery ---
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbCounter = lightbox.querySelector('.lightbox-counter');
    const lbClose = lightbox.querySelector('.lightbox-close');
    const lbPrev = lightbox.querySelector('.lightbox-prev');
    const lbNext = lightbox.querySelector('.lightbox-next');
    let currentIdx = 0;
    let imgs = [];

    function showImage(idx) {
      currentIdx = (idx + imgs.length) % imgs.length;
      lbImg.src = imgs[currentIdx].src;
      lbImg.alt = imgs[currentIdx].alt;
      lbCounter.textContent = (currentIdx + 1) + ' / ' + imgs.length;
    }

    function openLightbox(idx) {
      showImage(idx);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    function initLightbox() {
      imgs = Array.from(document.querySelectorAll('.gallery-grid img'));
      imgs.forEach((img, i) => {
        img.style.cursor = 'pointer';
        img.onclick = () => openLightbox(i);
      });
    }

    // Init immediately for any static images
    initLightbox();

    // Expose for dynamic gallery loading
    window.initLightbox = initLightbox;

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => showImage(currentIdx - 1));
    if (lbNext) lbNext.addEventListener('click', () => showImage(currentIdx + 1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(currentIdx - 1);
      if (e.key === 'ArrowRight') showImage(currentIdx + 1);
    });
  }

  // --- Blog gate form (Klaviyo) ---
  const gateForm = document.getElementById('blog-gate-form');
  if (gateForm) {
    gateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = gateForm.querySelector('input[type="email"]').value;
      const phone = gateForm.querySelector('input[type="tel"]')?.value || '';
      if (window._learnq) {
        const profile = { '$email': email };
        if (phone) profile['$phone_number'] = phone;
        window._learnq.push(['identify', profile]);
        window._learnq.push(['track', 'Blog Gate Signup']);
      }
      gateForm.innerHTML = '<p style="color:var(--co-red);font-family:var(--font-display);font-size:1.1rem;letter-spacing:.05em;">You\'re in. Check your email for the latest reports.</p>';
    });
  }

  // --- Contact form (Formspree + Klaviyo) ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      // Klaviyo identify
      if (window._learnq) {
        const profile = { '$email': fd.get('email') };
        if (fd.get('firstName')) profile['$first_name'] = fd.get('firstName');
        if (fd.get('lastName')) profile['$last_name'] = fd.get('lastName');
        if (fd.get('phone')) profile['$phone_number'] = fd.get('phone');
        window._learnq.push(['identify', profile]);
        window._learnq.push(['track', 'Contact Form Submitted', {
          subject: fd.get('subject') || '',
          message: fd.get('message') || ''
        }]);
      }
      // Submit to Formspree
      fetch(contactForm.action, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' }
      }).then(r => {
        if (r.ok) {
          contactForm.innerHTML = '<p style="font-family:var(--font-display);font-size:1.2rem;color:var(--co-green-dark);text-align:center;padding:24px;">Got it! We\'ll get right back to you.</p>';
        } else {
          contactForm.innerHTML = '<p style="font-family:var(--font-display);font-size:1.2rem;color:var(--co-red);text-align:center;padding:24px;">Something went wrong. Please email us at channeloutfitters1@gmail.com.</p>';
        }
      }).catch(() => {
        contactForm.innerHTML = '<p style="font-family:var(--font-display);font-size:1.2rem;color:var(--co-red);text-align:center;padding:24px;">Something went wrong. Please email us at channeloutfitters1@gmail.com.</p>';
      });
    });
  }

  // --- Signup band (Klaviyo subscribe + optional Formspree inquiry) ---
  // Injected after every .contact-strip so it lives under every CTA without
  // having to maintain the markup in eight HTML files.
  const KLAVIYO_COMPANY_ID = 'Tcs7vy';
  const KLAVIYO_LIST_ID = 'Vb6jsz';
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xbdpdgqa';

  function getSourcePage() {
    const last = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    return last || 'index';
  }

  function buildSignupBand() {
    const strips = document.querySelectorAll('.contact-strip');
    if (!strips.length) return;
    const source = getSourcePage();
    strips.forEach(strip => {
      if (strip.nextElementSibling && strip.nextElementSibling.classList.contains('signup-strip')) return;
      const band = document.createElement('section');
      band.className = 'signup-strip';
      band.innerHTML = '' +
        '<div class="signup-inner">' +
          '<div class="signup-copy">' +
            '<h3>Reports + Last-Minute Openings</h3>' +
            '<p>Get Lindsey\'s fishing reports and a heads-up on cancellations and prime dates on the Mo\'.</p>' +
          '</div>' +
          '<form class="signup-form" data-source="' + source + '" novalidate>' +
            '<div class="signup-row">' +
              '<input type="email" name="email" placeholder="your@email.com" required autocomplete="email" aria-label="Email address">' +
              '<button type="submit">Sign Me Up</button>' +
            '</div>' +
            '<button type="button" class="signup-toggle" aria-expanded="false">Have a question? Add a note &rarr;</button>' +
            '<div class="signup-msg" hidden>' +
              '<textarea name="message" placeholder="Trip type, dates, party size, anything else..." rows="3" aria-label="Your message"></textarea>' +
              '<small>Adding a note sends Holly a direct email as well.</small>' +
            '</div>' +
            '<p class="signup-status" role="status" aria-live="polite"></p>' +
          '</form>' +
        '</div>';
      strip.insertAdjacentElement('afterend', band);
      wireSignupForm(band.querySelector('.signup-form'));
    });
  }

  function wireSignupForm(form) {
    const toggle = form.querySelector('.signup-toggle');
    const msgWrap = form.querySelector('.signup-msg');
    toggle.addEventListener('click', () => {
      const isOpen = !msgWrap.hasAttribute('hidden');
      if (isOpen) {
        msgWrap.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = 'Have a question? Add a note &rarr;';
      } else {
        msgWrap.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.innerHTML = 'Hide note &uarr;';
        msgWrap.querySelector('textarea').focus();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.signup-status');
      const emailInput = form.querySelector('input[name="email"]');
      const email = emailInput.value.trim();
      const message = (form.querySelector('textarea[name="message"]') || {}).value || '';
      const source = form.dataset.source || 'unknown';
      if (!email) return;
      status.textContent = 'Sending...';

      // 1) Klaviyo legacy identify/track — matches site-wide pattern
      if (window._learnq) {
        window._learnq.push(['identify', { '$email': email, 'source_page': source }]);
        window._learnq.push(['track', 'Newsletter Band Signup', {
          source_page: source,
          has_message: !!message.trim()
        }]);
      }

      const tasks = [];

      // 2) Klaviyo client subscribe — actually adds them to list Vb6jsz
      // (triggers any flows attached to that list). Public company_id only,
      // no secret key in the browser.
      tasks.push(fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + KLAVIYO_COMPANY_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'revision': '2024-10-15' },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              custom_source: 'Website signup band — ' + source,
              profile: {
                data: {
                  type: 'profile',
                  attributes: { email: email }
                }
              }
            },
            relationships: {
              list: { data: { type: 'list', id: KLAVIYO_LIST_ID } }
            }
          }
        })
      }).catch(() => null));

      // 3) Formspree — only if they actually typed an inquiry. Keeps Holly's
      // inbox from being flooded with bare list signups.
      if (message.trim()) {
        const fd = new FormData();
        fd.append('email', email);
        fd.append('message', message.trim());
        fd.append('source_page', source);
        fd.append('_subject', 'Website inquiry from ' + source);
        tasks.push(fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        }).catch(() => null));
      }

      try {
        await Promise.allSettled(tasks);
        const note = message.trim()
          ? 'You\'re in. Holly will follow up on your note.'
          : 'You\'re in. Watch your inbox for Lindsey\'s next report.';
        form.innerHTML = '<p class="signup-success">' + note + '</p>';
      } catch (err) {
        status.textContent = 'Something went wrong. Email channeloutfitters1@gmail.com.';
      }
    });
  }

  buildSignupBand();

  // --- Smooth scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
});
