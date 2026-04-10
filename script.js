/**
 * Eloann Gaudin — Portfolio · script.js
 * Étape 3 : comportements, interactions, persistance
 * Production · zéro dépendance externe
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. DARK MODE
  ══════════════════════════════════════════════════════════════ */
  var root   = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  function applyTheme(dark) {
    root.dataset.theme = dark ? 'dark' : '';
    if (toggle) toggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  (function initTheme() {
    var stored  = localStorage.getItem('eg-theme');
    var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(stored === 'dark' || (!stored && prefers));
  })();

  if (toggle) {
    toggle.addEventListener('click', function () {
      var isDark = root.dataset.theme === 'dark';
      applyTheme(!isDark);
      localStorage.setItem('eg-theme', !isDark ? 'dark' : 'light');
    });
  }

  /* ══════════════════════════════════════════════════════════════
     2. PHOTO UPLOAD — drag & drop + clic + localStorage
  ══════════════════════════════════════════════════════════════ */
  (function initPhotoUpload() {
    var zone  = document.getElementById('photo-upload');
    var img   = document.getElementById('profile-photo');
    if (!zone || !img) return;

    /* --- Restaure une photo précédemment chargée --- */
    var saved = localStorage.getItem('eg-photo');
    if (saved) {
      img.src = saved;
      zone.classList.add('has-photo');
    } else {
      buildPlaceholder(zone);
    }

    /* --- Input file caché --- */
    var input = document.createElement('input');
    input.type   = 'file';
    input.accept = 'image/*';
    input.id     = 'photo-file-input';
    input.setAttribute('aria-label', 'Choisir une photo de profil');
    input.style.display = 'none';
    zone.appendChild(input);

    /* --- Clic sur la zone --- */
    zone.addEventListener('click', function (e) {
      if (e.target.closest('#photo-clear-btn')) return;
      input.click();
    });
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('aria-label', 'Cliquer ou déposer une photo de profil');
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });

    /* --- Sélection via input --- */
    input.addEventListener('change', function () {
      if (input.files && input.files[0]) loadFile(input.files[0]);
    });

    /* --- Drag & drop --- */
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      zone.addEventListener(ev, function () {
        zone.classList.remove('drag-over');
      });
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      var file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) loadFile(file);
    });

    /* --- Charge et affiche le fichier --- */
    function loadFile(file) {
      zone.classList.add('loading');
      var reader = new FileReader();
      reader.onload = function (e) {
        img.src = e.target.result;
        zone.classList.remove('loading');
        zone.classList.add('has-photo');
        removePlaceholder(zone);
        addClearBtn(zone);
        try { localStorage.setItem('eg-photo', e.target.result); } catch (_) { /* quota */ }
      };
      reader.readAsDataURL(file);
    }

    /* --- Bouton supprimer --- */
    if (saved) addClearBtn(zone);

    function addClearBtn(z) {
      if (z.querySelector('#photo-clear-btn')) return;
      var btn = document.createElement('button');
      btn.id          = 'photo-clear-btn';
      btn.textContent = '✕';
      btn.setAttribute('aria-label', 'Supprimer la photo');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        img.src = '';
        z.classList.remove('has-photo');
        localStorage.removeItem('eg-photo');
        btn.remove();
        buildPlaceholder(z);
      });
      z.appendChild(btn);
    }

    function buildPlaceholder(z) {
      if (z.querySelector('.photo-placeholder')) return;
      var ph = document.createElement('div');
      ph.className = 'photo-placeholder';
      ph.setAttribute('aria-hidden', 'true');
      ph.innerHTML =
        '<span class="ph-icon">🖼</span>' +
        '<span class="ph-label">Cliquez ou déposez<br>votre photo ici</span>' +
        '<span class="ph-sub">JPG · PNG · WEBP</span>';
      z.appendChild(ph);
    }

    function removePlaceholder(z) {
      var ph = z.querySelector('.photo-placeholder');
      if (ph) ph.remove();
    }
  })();

  /* ══════════════════════════════════════════════════════════════
     3. BARRES DE COMPÉTENCES — animation au scroll
  ══════════════════════════════════════════════════════════════ */
  (function initSkillBars() {
    var section = document.getElementById('competences');
    if (!section || !('IntersectionObserver' in window)) {
      /* Fallback : affiche directement */
      document.querySelectorAll('.competence-fill').forEach(function (el) {
        el.style.width = el.dataset.level + '%';
      });
      return;
    }

    var triggered = false;
    var obs = new IntersectionObserver(function (entries) {
      if (triggered) return;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        triggered = true;
        section.classList.add('competences-visible');
        obs.disconnect();
      });
    }, { threshold: 0.2 });
    obs.observe(section);
  })();

  /* ══════════════════════════════════════════════════════════════
     4. FADE-UP AU SCROLL
  ══════════════════════════════════════════════════════════════ */
  (function initFadeUp() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll(
      '.timeline-item, .reflexivite-bloc, .competence-item, ' +
      '.soft-skill-item, .interest-item, .contact-item'
    );

    targets.forEach(function (el) { el.classList.add('anim-fade-up'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    targets.forEach(function (el) { obs.observe(el); });
  })();

  /* ══════════════════════════════════════════════════════════════
     5. DOT NAV — dot actif au scroll
  ══════════════════════════════════════════════════════════════ */
  (function initDotNav() {
    if (!('IntersectionObserver' in window)) return;
    var sections = document.querySelectorAll(
      '#hero, #presentation, #parcours, #reflexivite, #competences, #contact'
    );
    var dots = document.querySelectorAll('.dot-link');
    if (!sections.length || !dots.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        dots.forEach(function (d) {
          d.classList.toggle('active', d.getAttribute('href') === '#' + id);
        });
      });
    }, { threshold: 0.45 });

    sections.forEach(function (s) { obs.observe(s); });
  })();

  /* ══════════════════════════════════════════════════════════════
     6. HERO — effet typewriter sur l'accroche (optionnel)
  ══════════════════════════════════════════════════════════════ */
  (function initTypewriter() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var tagline = document.querySelector('.hero-tagline');
    if (!tagline) return;

    var text = tagline.innerHTML;
    tagline.style.opacity = '0';

    /* Délai léger pour laisser le CSS initial se poser */
    setTimeout(function () {
      tagline.style.transition = 'opacity .6s ease';
      tagline.style.opacity    = '1';
    }, 400);
  })();

  /* ══════════════════════════════════════════════════════════════
     7. SMOOTH SCROLL dégradé pour les liens internes
  ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      /* Met le focus sur la section pour l'accessibilité */
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ══════════════════════════════════════════════════════════════
     8. BOUTON IMPRESSION
  ══════════════════════════════════════════════════════════════ */
  (function initPrintBtn() {
    var footer = document.getElementById('contact');
    if (!footer) return;

    var btn = document.createElement('button');
    btn.id          = 'print-btn';
    btn.textContent = '🖨 Imprimer / PDF';
    btn.setAttribute('aria-label', 'Imprimer ou exporter en PDF');
    btn.addEventListener('click', function () { window.print(); });

    var meta = footer.querySelector('.contact-footer-meta');
    if (meta) meta.parentNode.insertBefore(btn, meta);
    else footer.querySelector('.section-inner').appendChild(btn);
  })();

})();
