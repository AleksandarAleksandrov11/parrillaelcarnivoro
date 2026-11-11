/**
 * Google Analytics 4 con Consent Mode v2 (modo básico):
 * - Por defecto todo está denegado (script en línea del <head>).
 * - gtag.js NO se descarga hasta que el usuario acepta la analítica.
 * - Al revocar: consentimiento denegado, se desactiva el envío y se borran las cookies _ga.
 * El ID se lee de PUBLIC_GA_ID (atributo data-ga del <html>); con el placeholder no se carga nada.
 */
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const PLACEHOLDER = 'G-XXXXXXXXXX';
let loaded = false;
let granted = false;

function gaId(): string | null {
  const id = document.documentElement.dataset.ga?.trim();
  if (!id || id === PLACEHOLDER || !/^G-[A-Z0-9]+$/i.test(id)) return null;
  return id;
}

/** `window.gtag` se define en el script en línea del <head> (empuja `arguments` a dataLayer). */
function gtag(...args: unknown[]) {
  if (typeof window.gtag === 'function') window.gtag(...args);
}

function load(id: string) {
  if (loaded) return;
  loaded = true;
  gtag('js', new Date());
  gtag('config', id, { send_page_view: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

function deleteGaCookies() {
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.replace(/^www\./, '')}`];
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name === '_ga' || name.startsWith('_ga_') || name === '_gid' || name === '_gat') {
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
      });
    }
  });
}

export function applyAnalyticsConsent(allow: boolean) {
  const id = gaId();
  granted = allow;
  if (allow) {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (id) {
      window[`ga-disable-${id}`] = false;
      load(id);
    }
  } else {
    gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    if (id) window[`ga-disable-${id}`] = true;
    deleteGaCookies();
  }
}

/** Envía un evento solo si hay consentimiento de analítica y GA4 está configurado. */
export function track(name: string, params: Record<string, unknown> = {}) {
  if (!granted || !loaded || !gaId()) return;
  gtag('event', name, params);
}

/** Eventos de clic: WhatsApp, teléfono y «Cómo llegar». */
export function initClickTracking() {
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const where = a.dataset.trackLocation || a.closest('[data-track-zone]')?.getAttribute('data-track-zone') || location.pathname;
      if (href.startsWith('https://wa.me/')) track('whatsapp_click', { link_location: where });
      else if (href.startsWith('tel:')) track('phone_click', { link_location: where });
      else if (a.dataset.track === 'directions') track('directions_click', { link_location: where });
    },
    { capture: true },
  );
}

/**
 * Envía el evento ahora si ya hay consentimiento; si no, en cuanto el usuario lo dé
 * durante esta visita (p. ej. «vista de carta» si acepta estando en /carta/).
 */
export function trackWhenReady(name: string, params: Record<string, unknown> = {}) {
  if (granted && loaded) return track(name, params);
  const onChange = (e: Event) => {
    const detail = (e as CustomEvent<{ analytics: boolean }>).detail;
    if (detail?.analytics) {
      document.removeEventListener('consentchange', onChange);
      track(name, params);
    }
  };
  document.addEventListener('consentchange', onChange);
}
