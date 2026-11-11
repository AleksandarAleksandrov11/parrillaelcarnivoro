/**
 * Comportamiento global, ligero y sin dependencias en la carga inicial:
 * cabecera, menú móvil, revelados al hacer scroll, parallax suave, botón de WhatsApp
 * y medición de clics. Lenis (scroll suave) se carga en diferido solo en escritorio.
 * Todo respeta prefers-reduced-motion.
 */
import { initClickTracking } from './analytics';
import { lockScroll, unlockScroll } from './scroll-lock';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Cabecera: estado «scrolled» (se encoge con transform) ----------------------- */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  };
  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

/* Menú móvil (dialog modal: foco atrapado, Esc, fondo inerte) ---------------- */
function initMenu() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (!dialog || !openBtn) return;

  const open = () => {
    dialog.showModal();
    lockScroll();
    openBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => dialog.classList.add('is-open'));
  };
  const close = () => {
    dialog.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    const done = () => dialog.open && dialog.close();
    if (reduced.matches) done();
    else window.setTimeout(done, 380);
  };

  openBtn.addEventListener('click', open);
  dialog.querySelector('[data-menu-close]')?.addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    openBtn.setAttribute('aria-expanded', 'false');
    unlockScroll();
    // Si el botón ya no se ve (ventana ensanchada a escritorio), el foco va al enlace activo.
    if (openBtn.offsetParent) openBtn.focus();
    else (document.querySelector<HTMLElement>('.nav a[aria-current]') ?? document.querySelector<HTMLElement>('#contenido'))?.focus({ preventScroll: true });
  });
  // Al navegar a un ancla de la misma página, cerrar el menú.
  dialog.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) close();
  });
  // Si se agranda la ventana a escritorio, cerrar.
  window.matchMedia('(min-width: 1000px)').addEventListener('change', (m) => m.matches && dialog.open && close());
}

/* Revelados al entrar en pantalla -------------------------------------------- */
function initReveals() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal], .split');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

/* Parallax suave: solo transform; desactivado con movimiento reducido -------- */
function initParallax() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  if (!els.length || reduced.matches) return;
  const visible = new Set<HTMLElement>();
  let ticking = false;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement)));
    onScroll();
  });
  els.forEach((el) => io.observe(el));
  function update() {
    const vh = window.innerHeight;
    visible.forEach((el) => {
      const speed = Number(el.dataset.parallax) || 0.12;
      const r = (el.parentElement ?? el).getBoundingClientRect();
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(-progress * speed * 100).toFixed(2)}px, 0)`;
    });
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* Botón flotante de WhatsApp: se oculta al bajar y reaparece al subir -------- */
function initFab() {
  const fab = document.querySelector<HTMLElement>('[data-fab]');
  if (!fab) return;
  let last = window.scrollY;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const nearBottom = window.innerHeight + y > document.documentElement.scrollHeight - 160;
    const goingDown = y > last + 4;
    const goingUp = y < last - 4;
    if (y < 200 || goingUp || nearBottom) fab.classList.remove('is-hidden');
    else if (goingDown) fab.classList.add('is-hidden');
    last = y;
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

/* Scroll suave con Lenis: diferido, solo puntero fino y sin movimiento reducido */
function initSmoothScroll() {
  if (reduced.matches || !window.matchMedia('(pointer: fine)').matches) return;
  const start = async () => {
    const { default: Lenis } = await import('lenis');
    // Lenis ya respeta scroll-padding-top y scroll-margin-top: sin offset adicional.
    const lenis = new Lenis({ duration: 1.05, anchors: true, autoRaf: true, prevent: (node: HTMLElement) => node.closest('dialog, [data-lenis-prevent]') !== null });
    document.documentElement.classList.add('lenis');
    document.addEventListener('lenis:stop', () => lenis.stop());
    document.addEventListener('lenis:start', () => lenis.start());
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (document.readyState === 'complete') (idle ? idle(start) : setTimeout(start, 200));
  else window.addEventListener('load', () => (idle ? idle(() => start()) : setTimeout(start, 200)), { once: true });
}

initHeader();
initMenu();
initReveals();
initParallax();
initFab();
initClickTracking();
initSmoothScroll();
