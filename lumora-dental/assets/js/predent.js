/* PreDent homepage behaviour: reveals, phone menu, call-back form. Content works without it. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveals: one calm rise per block, staggered inside each section.
  if (!reduce && 'IntersectionObserver' in window) {
    doc.classList.add('js');
    var targets = document.querySelectorAll(
      'main section .pd-h2, main .pd-body, .pd-frame, .pd-facts, .pd-ledger li, .pd-reviews__score, .pd-acc, .pd-print, .pd-hours, .pd-map, .pd-panel, .pd-footer__cta'
    );
    targets.forEach(function (el, i) { el.classList.add('pd-reveal'); el.style.transitionDelay = (i % 4) * 70 + 'ms'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
    // Safety net: never leave anything hidden.
    setTimeout(function () { targets.forEach(function (el) { el.classList.add('is-in'); }); }, 2600);
  }

  // GSAP motion: hero entrance, gentle depth on scroll, inked 4.8 count-up.
  var g = window.gsap;
  if (g && !reduce) {
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
    var ease = 'expo.out';

    // Hero headline: each line rises from behind a mask.
    var title = document.querySelector('.pd-hero__title');
    if (title) {
      title.innerHTML = title.innerHTML.split(/<br\s*\/?>/i)
        .map(function (l) { return '<span class="pd-line"><span>' + l.trim() + '</span></span>'; }).join('');
      var tl = g.timeline({ defaults: { ease: ease } });
      tl.from('.pd-line > span', { yPercent: 105, duration: 1.3, stagger: 0.12 })
        .from('.pd-rule', { scaleX: 0, transformOrigin: 'left center', duration: 1.1 }, '-=0.8')
        .from('.pd-hero__lede, .pd-hero__copy .pd-actions', { y: 18, autoAlpha: 0, duration: 1, stagger: 0.1 }, '-=0.9')
        .from('.pd-hero__window > img:first-child', { y: 36, scale: 0.97, autoAlpha: 0, filter: 'blur(6px)', duration: 1.6 }, 0.15)
        .from('.pd-hero__branch', { rotate: -8, x: 30, autoAlpha: 0, transformOrigin: '50% 0%', duration: 1.8 }, 0.5)
        .from('.pd-proof', { y: 20, autoAlpha: 0, duration: 1.1 }, '-=1.2')
        .from('.pd-hero__pots', { y: 30, autoAlpha: 0, duration: 1.2 }, '-=1');
      setTimeout(function () { tl.progress(1); }, 4000); // safety net
    }

    // Depth: the window, branch and pots drift at different speeds as you scroll past.
    if (window.ScrollTrigger) {
      var hero = document.querySelector('.pd-hero');
      var depth = function (sel, y) {
        if (document.querySelector(sel)) g.to(sel, { y: y, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
      };
      depth('.pd-hero__window', -60);
      depth('.pd-hero__branch', -110);
      depth('.pd-hero__pots', 40);
      g.utils.toArray('.pd-leaves').forEach(function (el) {
        g.to(el, { y: 80, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });

      // The inked 4.8 counts up once it is in view.
      g.utils.toArray('.pd-reviews .pd-ink').forEach(function (el) {
        var target = parseFloat(el.textContent);
        if (isNaN(target)) return;
        var n = { v: 0 };
        g.to(n, {
          v: target, duration: 1.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: function () { el.textContent = n.v.toFixed(1); },
          onComplete: function () { el.textContent = target.toFixed(1); }
        });
      });
    }
  }

  // Accordions (treatments, FAQ): smooth open and close instead of a snap.
  document.querySelectorAll('.pd-acc details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.pd-acc__body');
    if (!summary || !body || reduce || !g) return;
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = '1';
      if (!d.open) {
        d.open = true;
        var tw = g.fromTo(body, { height: 0, paddingBottom: 0, autoAlpha: 0 }, { height: 'auto', paddingBottom: 26, autoAlpha: 1, duration: 0.55, ease: 'expo.out',
          onComplete: function () { g.set(body, { clearProps: 'height,paddingBottom,opacity,visibility' }); delete d.dataset.busy; } });
      } else {
        var tw = g.to(body, { height: 0, paddingBottom: 0, autoAlpha: 0, duration: 0.4, ease: 'power2.inOut',
          onComplete: function () { d.open = false; g.set(body, { clearProps: 'height,paddingBottom,opacity,visibility' }); delete d.dataset.busy; } });
      }
      setTimeout(function () { if (tw.progress() < 1) tw.progress(1); }, 900); // never leave a panel half-open
    });
  });

  // Phone menu: close after choosing a link or tapping outside.
  var menu = document.querySelector('.pd-nav__menu');
  if (menu) {
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  }

  // Call-back form: validate, then open WhatsApp with the details prefilled.
  var form = document.getElementById('pd-callback');
  if (form) {
    var msg = form.querySelector('.pd-form__msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.replace(/[^\d+]/g, '');
      form.elements.name.setAttribute('aria-invalid', name ? 'false' : 'true');
      var okPhone = phone.replace(/^\+?91/, '').length >= 10;
      form.elements.phone.setAttribute('aria-invalid', okPhone ? 'false' : 'true');
      if (!name || !okPhone) {
        msg.className = 'pd-form__msg is-error';
        msg.textContent = !name ? 'Please add your name so we know who to ask for.' : 'Please enter a 10-digit mobile number so we can call you back.';
        (!name ? form.elements.name : form.elements.phone).focus();
        return;
      }
      var text = 'Hello PreDent, I am ' + name + '. Please call me back on ' + phone + ' to book a visit.';
      window.open('https://wa.me/918390426787?text=' + encodeURIComponent(text), '_blank', 'noopener');
      msg.className = 'pd-form__msg is-done';
      msg.textContent = 'Thank you, ' + name + '. WhatsApp has opened with your details. Press send and the clinic will call you back.';
      form.reset();
    });
  }
})();
