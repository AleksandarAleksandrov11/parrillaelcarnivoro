/**
 * Google Maps diferido: nada se pide a Google sin consentimiento («Mapas de Google»)
 * o sin una acción explícita del usuario. Si se revoca, el mapa se retira.
 */
import { grantMaps, hasMapsConsent, type Consent } from './consent';

const TITLE = 'Mapa de Google Maps con la ubicación de Restaurante Parrilla El Carnívoro';

function load(map: HTMLElement) {
  if (map.querySelector('iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.src = map.dataset.src!;
  iframe.title = TITLE;
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.allowFullscreen = true;
  map.appendChild(iframe);
  map.classList.add('is-loaded');
}

function unload(map: HTMLElement) {
  map.querySelector('iframe')?.remove();
  map.classList.remove('is-loaded');
}

export function initMaps() {
  const maps = Array.from(document.querySelectorAll<HTMLElement>('[data-map]'));
  if (!maps.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && hasMapsConsent()) {
          load(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '300px 0px' },
  );

  maps.forEach((map) => {
    io.observe(map);
    map.querySelector('[data-map-load]')?.addEventListener('click', () => {
      grantMaps();
      load(map);
      map.querySelector('iframe')?.focus();
    });
  });

  document.addEventListener('consentchange', (e) => {
    const c = (e as CustomEvent<Consent>).detail;
    maps.forEach((map) => {
      if (!c.maps) unload(map);
      else io.observe(map);
    });
  });
}
