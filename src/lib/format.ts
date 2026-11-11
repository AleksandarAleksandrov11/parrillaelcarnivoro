import type { Price, Section, MenuItem } from '../data/carta';
import { carta } from '../data/carta';

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 14.9 → «14,90 €» (espacio no separable antes del símbolo, formato español). */
export function euros(amount: number): string {
  return eur.format(amount);
}

const UNIT: Record<NonNullable<Price['per']>, string> = {
  kg: '/kg',
  unidad: '/ud.',
  persona: '/persona',
};

/** Precio con unidad: «48,00 €/kg», «4,50 €/ud.», «32,50 €/persona». */
export function formatPrice(p: Price): string {
  return p.per ? `${euros(p.amount)}${UNIT[p.per]}` : euros(p.amount);
}

/** Texto accesible del precio («48,00 € el kilo»). */
export function priceLabel(p: Price): string {
  const base = euros(p.amount);
  switch (p.per) {
    case 'kg':
      return `${base} el kilo`;
    case 'unidad':
      return `${base} la unidad`;
    case 'persona':
      return `${base} por persona`;
    default:
      return base;
  }
}

export function findItem(sectionId: string, name: string): MenuItem {
  const s = carta.find((x) => x.id === sectionId) as Section | undefined;
  if (!s || s.kind !== 'carta') throw new Error(`Sección no válida: ${sectionId}`);
  const item = s.groups.flatMap((g) => g.items).find((i) => i.name === name);
  if (!item) throw new Error(`Plato no encontrado en la carta: ${name}`);
  return item;
}

/** Precio mínimo de una sección (o de uno de sus grupos) para «desde …». */
export function minPrice(sectionId: string, groupTitle?: string): number {
  const s = carta.find((x) => x.id === sectionId);
  if (!s) throw new Error(`Sección no válida: ${sectionId}`);
  const amounts =
    s.kind === 'carta'
      ? s.groups
          .filter((g) => !groupTitle || g.title === groupTitle)
          .flatMap((g) => g.items.flatMap((i) => i.prices.map((p) => p.amount)))
      : s.menus.map((m) => m.price.amount);
  if (!amounts.length) throw new Error(`Sin precios en ${sectionId} ${groupTitle ?? ''}`);
  return Math.min(...amounts);
}
