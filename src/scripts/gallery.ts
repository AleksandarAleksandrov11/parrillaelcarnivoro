/**
 * Filtros de la galería y visor (lightbox) accesible:
 * - <dialog> modal: el foco queda atrapado y el fondo es inerte; Esc cierra.
 * - Flechas ← → para navegar; gesto de deslizar en táctil.
 * - Al cerrar, el foco vuelve a la miniatura que lo abrió.
 */
import { lockScroll, unlockScroll } from './scroll-lock';

const LABELS: Record<string, string> = { all: 'todas las categorías', platos: 'Platos', local: 'Local', terraza: 'Terraza', parrilla: 'Parrilla' };

export function initGalleries() {
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(initGallery);
}

function initGallery(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';
  const cells = Array.from(root.querySelectorAll<HTMLElement>('.cell'));
  const status = root.querySelector<HTMLElement>('[data-gallery-status]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-lightbox]')!;
  // El <picture> del visor se crea aquí (así el HTML inicial no tiene <img> sin src).
  const media = dialog.querySelector<HTMLElement>('[data-lb-media]')!;
  const pic = document.createElement('picture');
  const avif = document.createElement('source');
  const webp = document.createElement('source');
  const img = document.createElement('img');
  avif.type = 'image/avif';
  webp.type = 'image/webp';
  avif.sizes = webp.sizes = '100vw';
  img.decoding = 'async';
  pic.append(avif, webp, img);
  media.append(pic);
  const caption = dialog.querySelector<HTMLElement>('[data-lb-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lb-count]')!;
  let current = 0;
  let opener: HTMLElement | null = null;

  /* Filtros ---------------------------------------------------------------- */
  root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter!;
      root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let n = 0;
      cells.forEach((c) => {
        const show = f === 'all' || c.dataset.cat === f;
        c.hidden = !show;
        if (show) {
          n++;
          c.classList.add('is-in');
        }
      });
      if (status) status.textContent = `Mostrando ${n} ${n === 1 ? 'foto' : 'fotos'} de ${LABELS[f] ?? f}.`;
    });
  });

  /* Visor ------------------------------------------------------------------ */
  // Orden visual (la rejilla densa puede recolocar alguna foto): de arriba abajo y de izquierda a derecha.
  const visible = () =>
    cells
      .filter((c) => !c.hidden)
      .map((c) => ({ c, r: c.getBoundingClientRect() }))
      .sort((a, b) => Math.round(a.r.top) - Math.round(b.r.top) || a.r.left - b.r.left)
      .map(({ c }) => c.querySelector<HTMLButtonElement>('[data-lightbox-open]')!);
  let nextToPreload: HTMLButtonElement | null = null;

  const show = (index: number) => {
    const list = visible();
    if (!list.length) return;
    current = (index + list.length) % list.length;
    const t = list[current];
    img.classList.add('is-loading');
    avif.srcset = t.dataset.avif || '';
    webp.srcset = t.dataset.webp || '';
    img.width = Number(t.dataset.w);
    img.height = Number(t.dataset.h);
    img.alt = t.dataset.alt || '';
    const lastWebp = (t.dataset.webp || '').split(',').pop()?.trim().split(' ')[0];
    if (lastWebp) img.src = lastWebp;
    caption.textContent = t.dataset.alt || '';
    count.textContent = `${current + 1} / ${list.length}`;
    nextToPreload = list[(current + 1) % list.length] ?? null;
  };
  img.addEventListener('load', () => {
    img.classList.remove('is-loading');
    // Precarga la siguiente en el mismo formato que ha elegido el navegador (AVIF o WebP).
    const next = nextToPreload;
    if (!next) return;
    const set = img.currentSrc.includes('.avif') ? next.dataset.avif : next.dataset.webp;
    if (set) {
      const pre = new Image();
      pre.sizes = '100vw';
      pre.srcset = set;
    }
  });

  const open = (btn: HTMLButtonElement) => {
    opener = btn;
    show(visible().indexOf(btn));
    dialog.showModal();
    lockScroll();
    requestAnimationFrame(() => dialog.classList.add('is-open'));
  };
  const close = () => {
    dialog.classList.remove('is-open');
    window.setTimeout(() => dialog.open && dialog.close(), 250);
  };

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-lightbox-open]');
    if (btn) open(btn);
  });
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', close);
  dialog.querySelector('[data-lb-prev]')!.addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lb-next]')!.addEventListener('click', () => show(current + 1));
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    unlockScroll();
    opener?.focus();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(current - 1);
    }
  });
  // Clic fuera de la imagen cierra.
  dialog.querySelector('[data-lb-stage]')!.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('img')) close();
  });

  // Gesto de deslizar.
  let x0: number | null = null;
  let y0 = 0;
  dialog.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    x0 = e.clientX;
    y0 = e.clientY;
  });
  dialog.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
  });
  dialog.addEventListener('pointercancel', () => (x0 = null));
}
