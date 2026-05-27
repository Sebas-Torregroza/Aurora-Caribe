/* ═══════════════════════════════════════════════
   Aurora Caribe — main.js
   Funciones: navbar sticky, menú móvil,
   validación formulario, filtros, scroll reveal,
   prellenado de suite desde URL
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── EMAILJS: inicializar con tu Public Key ── */
  if (typeof emailjs !== 'undefined') {
    emailjs.init('WQFNiIsAiXSvYRn-6');
  }

  /* ── NAVBAR: sticky + menú móvil ── */
  const navbar    = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');

  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── PRELLENAR SUITE desde URL (?suite=ejecutiva) ── */
  const suiteSelect = document.getElementById('suite');
  if (suiteSelect) {
    const params = new URLSearchParams(window.location.search);
    const suiteParam = params.get('suite');
    const allowed = ['estandar', 'superior', 'ejecutiva'];
    if (suiteParam && allowed.includes(suiteParam)) {
      const option = suiteSelect.querySelector('option[value="' + suiteParam + '"]');
      if (option) option.selected = true;
    }
  }

  /* ── VALIDACIÓN DE FORMULARIO ── */
  const form = document.getElementById('contactForm');
  if (form) {
    const submitBtn   = document.getElementById('submitBtn');
    const formSuccess = document.getElementById('formSuccess');
    const habeasCheck = document.getElementById('habeasData');

    function showError(id, msg) {
      const el = document.getElementById('error-' + id);
      if (el) el.textContent = msg;
    }
    function clearError(id) {
      const el = document.getElementById('error-' + id);
      if (el) el.textContent = '';
    }
    function markError(input)  { if (input) input.classList.add('error'); }
    function clearMark(input)  { if (input) input.classList.remove('error'); }

    ['nombre', 'correo', 'mensaje'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function () {
          clearError(id);
          clearMark(el);
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let valid = true;

      const nombre    = document.getElementById('nombre');
      const correo    = document.getElementById('correo');
      const mensaje   = document.getElementById('mensaje');

      if (!nombre || nombre.value.trim().length < 2) {
        showError('nombre', 'Por favor ingrese su nombre completo.');
        markError(nombre); valid = false;
      } else { clearError('nombre'); clearMark(nombre); }

      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!correo || !emailRe.test(correo.value.trim())) {
        showError('correo', 'Ingrese un correo electrónico válido.');
        markError(correo); valid = false;
      } else { clearError('correo'); clearMark(correo); }

      if (!mensaje || mensaje.value.trim().length < 5) {
        showError('mensaje', 'Por favor escriba su mensaje.');
        markError(mensaje); valid = false;
      } else { clearError('mensaje'); clearMark(mensaje); }

      if (habeasCheck && !habeasCheck.checked) {
        showError('habeas', 'Debe aceptar el tratamiento de datos para enviar el formulario.');
        valid = false;
      } else { clearError('habeas'); }

      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'ENVIANDO...';

      const formData = new FormData(form);
      const objeto   = Object.fromEntries(formData);

      grecaptcha.ready(function () {
        grecaptcha.execute('6Lfgjf4sAAAAAFw9Hg1P2jKIbGEcCgUVCsSBsZFr', { action: 'contact_form' })
          .then(function (token) {
            objeto['g-recaptcha-response'] = token;

            fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(objeto)
            })
            .then(function (res) {
              return res.json().then(function (data) {
                if (res.status === 200) {
                  if (typeof emailjs !== 'undefined') {
                    emailjs.send('service_5rc3ijj', 'template_yc3ue3n', {
                      name:         objeto.name,
                      email:        objeto.email,
                      telefono:     objeto.telefono     || 'No indicado',
                      llegada_dd:   objeto.llegada_dd   || '-',
                      llegada_mm:   objeto.llegada_mm   || '-',
                      llegada_yyyy: objeto.llegada_yyyy || '-',
                      salida_dd:    objeto.salida_dd    || '-',
                      salida_mm:    objeto.salida_mm    || '-',
                      salida_yyyy:  objeto.salida_yyyy  || '-',
                      huespedes:    objeto.huespedes    || 'No indicado',
                      suite:        objeto.suite        || 'No indicada',
                      mensaje:      objeto.mensaje
                    }).catch(function (err) {
                      console.warn('EmailJS (auto-reply):', err);
                    });
                  }
                  form.reset();
                  if (formSuccess) {
                    formSuccess.removeAttribute('hidden');
                    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                } else {
                  throw new Error(data.message || 'Error al enviar');
                }
              });
            })
            .catch(function (err) {
              console.error(err);
              alert('Hubo un problema al enviar el formulario. Por favor intente de nuevo o contáctenos directamente.');
            })
            .finally(function () {
              submitBtn.disabled = false;
              submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> ENVIAR MENSAJE';
            });
          });
      });
    });
  }

  /* ── FILTROS DE HABITACIONES ── */
  const filterTabs = document.querySelectorAll('.filter-tab');
  const suiteCards = document.querySelectorAll('[data-category]');

  if (filterTabs.length && suiteCards.length) {
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const filter = tab.getAttribute('data-filter');

        filterTabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        suiteCards.forEach(function (card) {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.removeAttribute('hidden');
          } else {
            card.setAttribute('hidden', '');
          }
        });
      });
    });
  }

  /* ── SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll(
    '.suite-card, .suite-card-full, .testi-card, .servicio-card, .prop-item, .nosotros-content, .nosotros-img-wrap, .asesoria-card'
  );

  if ('IntersectionObserver' in window && revealEls.length) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('reveal', 'visible'); });
  }

  /* ── SMOOTH SCROLL para anclas internas ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
