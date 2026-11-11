/**
 * Gestión del consentimiento de cookies (AEPD) y Google Consent Mode v2.
 * El estado por defecto (todo denegado) se fija en un script en línea del <head>
 * antes de cualquier otra cosa. Aquí se gestionan las elecciones del usuario.
 */
import { applyAnalyticsConsent } from './analytics';
import { lockScroll, unlockScroll } from './scroll-lock';

export interface Consent {
  v: 1;
  analytics: boolean;
  maps: boolean;
  /** Fecha de expiración (ms). Se vuelve a preguntar a los 12 meses. */
  exp: number;
  ts: number;
}

const KEY = 'pec-consent';
const TWELVE_MONTHS = 365 * 24 * 60 * 60 * 1000;

// Copia en memoria: si el navegador bloquea el almacenamiento, la elección vale para esta visita.
let memo: Consent | null = null;
let storageWritable = true;

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
      const c = JSON.parse(raw) as Consent | null;
      return c && c.v === 1 && c.exp > Date.now() ? c : null;
    }
    // Sin registro guardado: solo vale la copia en memoria si no se pudo escribir.
    if (storageWritable) return null;
  } catch {
    /* almacenamiento no disponible: se usa la copia en memoria */
  }
  return memo && memo.exp > Date.now() ? memo : null;
}

/** Guarda una elección. `keepExpiry` conserva el vencimiento previo (no prorroga consentimientos anteriores). */
function writeConsent(analytics: boolean, maps: boolean, keepExpiry?: number): Consent {
  const c: Consent = { v: 1, analytics, maps, ts: Date.now(), exp: keepExpiry ?? Date.now() + TWELVE_MONTHS };
  memo = c;
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* modo privado sin almacenamiento: queda la copia en memoria */
    storageWritable = false;
  }
  return c;
}

function apply(c: Consent, changed: boolean) {
  const html = document.documentElement;
  html.dataset.consent = 'set';
  html.classList.toggle('consent-maps', c.maps);
  applyAnalyticsConsent(c.analytics);
  if (changed) document.dispatchEvent(new CustomEvent<Consent>('consentchange', { detail: c }));
}

export function hasMapsConsent(): boolean {
  return readConsent()?.maps === true;
}

/** Concede el consentimiento de mapas (al pulsar «Cargar mapa»), manteniendo el resto. */
export function grantMaps() {
  const prev = readConsent();
  const c = writeConsent(prev?.analytics ?? false, true, prev?.exp);
  apply(c, true);
}

/** Estado efectivo (sin elección o caducada = todo denegado). */
function effective(): Consent {
  return readConsent() ?? { v: 1, analytics: false, maps: false, ts: 0, exp: 0 };
}

export function initConsent() {
  const banner = document.querySelector<HTMLElement>('[data-cc-banner]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-cc-dialog]');
  if (!banner || !dialog) return;
  const analyticsBox = dialog.querySelector<HTMLInputElement>('#cc-analytics')!;
  const mapsBox = dialog.querySelector<HTMLInputElement>('#cc-maps')!;

  const current = readConsent();
  if (current) apply(current, false);
  else delete document.documentElement.dataset.consent;

  const choose = (analytics: boolean, maps: boolean) => {
    const fromBanner = banner.contains(document.activeElement);
    const c = writeConsent(analytics, maps);
    apply(c, true);
    if (dialog.open) dialog.close();
    // El banner desaparece: el foco pasa al contenido en vez de perderse en <body>.
    if (fromBanner || !document.activeElement || document.activeElement === document.body) {
      document.querySelector<HTMLElement>('#contenido')?.focus({ preventScroll: true });
    }
  };

  const openPreferences = () => {
    const c = readConsent();
    analyticsBox.checked = c?.analytics ?? false;
    mapsBox.checked = c?.maps ?? false;
    dialog.showModal();
    lockScroll();
  };
  dialog.addEventListener('close', unlockScroll);

  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cc], [data-cookie-settings]');
    if (!target) return;
    if (target.hasAttribute('data-cookie-settings')) {
      openPreferences();
      return;
    }
    switch (target.dataset.cc) {
      case 'accept':
        choose(true, true);
        break;
      case 'reject':
        choose(false, false);
        break;
      case 'save':
        choose(analyticsBox.checked, mapsBox.checked);
        break;
      case 'configure':
        openPreferences();
        break;
    }
  });

  // Cerrar el panel sin elegir no implica consentimiento.
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });

  // Cambios hechos en otra pestaña, o al volver con «Atrás» (bfcache): se aplica el estado actual
  // para dejar de medir, borrar cookies y retirar el mapa si se ha revocado.
  const resync = () => {
    const c = readConsent();
    if (c) apply(c, true);
    else {
      delete document.documentElement.dataset.consent;
      const denied = effective();
      document.documentElement.classList.remove('consent-maps');
      applyAnalyticsConsent(false);
      document.dispatchEvent(new CustomEvent<Consent>('consentchange', { detail: denied }));
    }
  };
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) resync();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) resync();
  });
}
