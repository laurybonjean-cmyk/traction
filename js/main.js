/* La Traction – scripts communs : menu, carrousel, parallaxe */
(function () {
  'use strict';
  var hdr = document.getElementById('hdr'),
      nav = document.getElementById('nav'),
      burger = document.getElementById('burger'),
      hs = document.getElementById('hs'),
      sb = hs && hs.querySelector('.sb');

  /* Menu burger + sous-menu L'ATELIER */
  burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  function closeSub() { hs.classList.remove('open'); sb.setAttribute('aria-expanded', 'false'); }
  sb.addEventListener('click', function () {
    var o = hs.classList.toggle('open');
    sb.setAttribute('aria-expanded', o);
  });
  document.addEventListener('click', function (e) { if (!hs.contains(e.target)) closeSub(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSub(); });

  /* Carrousel d'actualités (boucle aux extrémités) */
  var track = document.getElementById('track');
  if (track) {
    var step = function (d) {
      var it = track.querySelector('.item'), w = it.offsetWidth + 20, max = track.scrollWidth - track.clientWidth;
      if (d > 0 && track.scrollLeft >= max - 4) track.scrollTo({ left: 0 });
      else if (d < 0 && track.scrollLeft <= 4) track.scrollTo({ left: max });
      else track.scrollBy({ left: d * w });
    };
    document.getElementById('prev').addEventListener('click', function () { step(-1); });
    document.getElementById('next').addEventListener('click', function () { step(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
  }

  /* Diaporama d'accueil : défilement auto (6 s), pause au survol / focus / bouton,
     clavier (flèches), glisser sur mobile, désactivé si « réduire les animations ». */
  var sl = document.getElementById('slider');
  if (sl) (function () {
    var slides = [].slice.call(sl.querySelectorAll('.slide')),
        dots = [].slice.call(sl.querySelectorAll('.dot')),
        box = document.getElementById('slides'),
        playBtn = document.getElementById('sl-play'),
        rm = window.matchMedia('(prefers-reduced-motion: reduce)'),
        cur = 0, timer = null, DELAY = 6000,
        userPaused = rm.matches, hover = false, focus = false;

    /* Photo absente : on garde le fond coloré et le picto */
    slides.forEach(function (s) {
      var img = s.querySelector('.sl-bg img');
      if (!img) return;
      function ok() { s.classList.add('has-img'); }
      function ko() { img.remove(); }
      if (img.complete) { img.naturalWidth ? ok() : ko(); }
      else { img.addEventListener('load', ok); img.addEventListener('error', ko); }
    });

    function go(i, manual) {
      slides[cur].classList.remove('on');
      dots[cur].removeAttribute('aria-current');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('on');
      dots[cur].setAttribute('aria-current', 'true');
      box.setAttribute('aria-live', manual ? 'polite' : 'off');
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!userPaused && !hover && !focus && !document.hidden) timer = setTimeout(function () { go(cur + 1); }, DELAY);
    }
    function setPaused(p) {
      userPaused = p;
      sl.classList.toggle('paused', p);
      playBtn.setAttribute('aria-label', p ? 'Lancer le diaporama' : 'Mettre le diaporama en pause');
      schedule();
    }

    document.getElementById('sl-prev').addEventListener('click', function () { go(cur - 1, true); });
    document.getElementById('sl-next').addEventListener('click', function () { go(cur + 1, true); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i, true); }); });
    playBtn.addEventListener('click', function () { setPaused(!userPaused); });

    sl.addEventListener('mouseenter', function () { hover = true; schedule(); });
    sl.addEventListener('mouseleave', function () { hover = false; schedule(); });
    sl.addEventListener('focusin', function () { focus = true; schedule(); });
    sl.addEventListener('focusout', function (e) { if (!sl.contains(e.relatedTarget)) { focus = false; schedule(); } });
    sl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
    });
    var x0 = null;
    sl.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
    document.addEventListener('visibilitychange', schedule);

    setPaused(userPaused);
  })();

  /* Parallaxe : requestAnimationFrame + IntersectionObserver.
     La position est lue sur le parent (jamais transformé) pour éviter toute boucle de rétroaction. */
  var els = [].slice.call(document.querySelectorAll('[data-speed]')),
      visible = new Set(), queued = false,
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function disabled() { return reduce.matches; }

  function update() {
    queued = false;
    hdr.classList.toggle('scrolled', window.scrollY > 10);
    if (disabled()) { els.forEach(function (el) { el.style.transform = ''; }); return; }
    var vh = window.innerHeight;
    visible.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect(),
          p = (r.top + r.height / 2 - vh / 2) / vh,           // ~ -1 .. 1
          k = window.innerWidth < 720 ? 0.5 : 1,
          y = -p * parseFloat(el.dataset.speed) * vh * k,
          z = el.dataset.zoom ? 1 + parseFloat(el.dataset.zoom) * (1 - Math.min(1, Math.abs(p))) * k : 1;
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)' + (z !== 1 ? ' scale(' + z.toFixed(3) + ')' : '');
    });
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? visible.add(e.target) : visible.delete(e.target); });
      request();
    }, { rootMargin: '150px' });
    els.forEach(function (el) { io.observe(el); });
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (reduce.addEventListener) reduce.addEventListener('change', request);
  request();

  /* Effets d'apparition : IntersectionObserver, délais échelonnés entre frères */
  (function () {
    if (reduce.matches) return;
    var groups = ['.photo', '.lieu .txt > *', '.box', '.band h2', '.cards .card',
      '.news h2', '.news .car', '.phero .wrap > *',
      '.sec .wrap > h2', '.sec .wrap > .intro', '.sec .wrap > .note', '.sec .wrap > table', '.sec .wrap > details',
      '.grid3 > *', '.grid2 > *', '.cta-band div > *', '.ft .cols > *'];
    var items = [];
    groups.forEach(function (sel) {
      [].forEach.call(document.querySelectorAll(sel), function (el) {
        if (items.indexOf(el) === -1) items.push(el);
      });
    });
    items.forEach(function (el) {
      var sibs = [].filter.call(el.parentElement.children, function (c) { return items.indexOf(c) !== -1; });
      el.style.setProperty('--d', Math.min(sibs.indexOf(el) * 0.12, 0.5).toFixed(2) + 's');
      el.classList.add('rv');
    });
    var rib = document.querySelector('.ribbons');
    if (rib) { [].forEach.call(rib.querySelectorAll('path'), function (p) { p.setAttribute('pathLength', '1'); }); items.push(rib); }
    if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { (e.target.__rv || e.target).classList.add('in'); io2.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) {
      var t = el.classList.contains('photo') ? el.parentElement : el;  /* clip-path : la photo masquée n'est jamais « visible » pour l'observateur */
      if (t !== el) t.__rv = el;
      io2.observe(t);
    });
  })();
})();
