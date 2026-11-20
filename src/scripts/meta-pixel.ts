/**
 * Píxel de Meta (Facebook e Instagram), solo con consentimiento de «Publicidad».
 * - fbevents.js NO se descarga hasta que el usuario acepta la categoría «Publicidad».
 * - Al revocar: se retira el consentimiento del píxel, se deja de enviar y se borran las cookies _fbp y _fbc.
 * El ID se lee de PUBLIC_META_PIXEL_ID (atributo data-meta-pixel del <html>).
 */
declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
  }
}

let loaded = false;
let granted = false;

function pixelId(): string | null {
  const id = document.documentElement.dataset.metaPixel?.trim();
  return id && /^\d{10,20}$/.test(id) ? id : null;
}

function load(id: string) {
  if (loaded) return;
  loaded = true;
  /* Snippet oficial de Meta, sin cambios de comportamiento. */
  const w = window;
  if (!w.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else (n.queue as unknown[]).push(args);
    } as NonNullable<Window['fbq']>;
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  w.fbq!('consent', 'grant');
  w.fbq!('init', id);
  w.fbq!('track', 'PageView');
}

function deleteMetaCookies() {
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.replace(/^www\./, '')}`];
  ['_fbp', '_fbc'].forEach((name) => {
    domains.forEach((d) => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    });
  });
}

export function applyAdsConsent(allow: boolean) {
  const id = pixelId();
  granted = allow;
  if (allow) {
    if (id) {
      if (loaded && window.fbq) window.fbq('consent', 'grant');
      else load(id);
    }
  } else {
    if (loaded && window.fbq) window.fbq('consent', 'revoke');
    deleteMetaCookies();
  }
}

/** Evento estándar de Meta solo si hay consentimiento y el píxel está cargado. */
export function metaTrack(name: string, params: Record<string, unknown> = {}) {
  if (!granted || !loaded || !window.fbq) return;
  window.fbq('track', name, params);
}

/** Clic en el teléfono = evento «Contact» (llamada iniciada). */
export function initMetaClickTracking() {
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="tel:"]');
      if (a) metaTrack('Contact', { content_name: 'llamada_restaurante' });
    },
    { capture: true },
  );
}
