/**
 * Gestión del consentimiento de cookies (AEPD) y Google Consent Mode v2.
 * El estado por defecto (todo denegado) se fija en un script en línea del <head>
 * antes de cualquier otra cosa. Aquí se gestionan las elecciones del usuario.
 */
import { applyAnalyticsConsent } from './analytics';

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

export function readConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null') as Consent | null;
    if (c && c.v === 1 && c.exp > Date.now()) return c;
  } catch {
    /* almacenamiento no disponible */
  }
  return null;
}

function writeConsent(analytics: boolean, maps: boolean): Consent {
  const c: Consent = { v: 1, analytics, maps, ts: Date.now(), exp: Date.now() + TWELVE_MONTHS };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* modo privado sin almacenamiento: la elección vale para esta visita */
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
  const c = writeConsent(prev?.analytics ?? false, true);
  apply(c, true);
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
    const c = writeConsent(analytics, maps);
    apply(c, true);
    if (dialog.open) dialog.close();
  };

  const openPreferences = () => {
    const c = readConsent();
    analyticsBox.checked = c?.analytics ?? false;
    mapsBox.checked = c?.maps ?? false;
    dialog.showModal();
  };

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
    if (e.target === dialog) dialog.close();
  });
}
