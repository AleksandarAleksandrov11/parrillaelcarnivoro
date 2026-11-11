/**
 * Datos del negocio (NAP, horario, enlaces). Fuente única para toda la web y el schema.
 * Cualquier cambio aquí se refleja en header, footer, contacto, JSON-LD y textos legales.
 */

export const SITE_URL = 'https://www.parrillaelcarnivoro.es';

export const business = {
  name: 'Restaurante Parrilla El Carnívoro',
  shortName: 'El Carnívoro',
  slogan: 'Pasión por la carne',
  positioning: 'La mejor carne a la parrilla de la sierra de Madrid, en Collado Villalba',
  cuisine: ['Carnes a la parrilla de carbón', 'Parrilla', 'Asador', 'Española', 'Mediterránea'],
  priceRange: '€€',
  email: 'parrilla.carnivoro@gmail.com',
  /** Único teléfono de la web, para llamadas y WhatsApp. */
  phone: {
    display: '91 501 39 83',
    e164: '+34915013983',
    tel: 'tel:+34915013983',
    whatsapp: '34915013983',
  },
  instagram: {
    handle: '@elcarnivoro.villalba',
    url: 'https://www.instagram.com/elcarnivoro.villalba/',
  },
  /** Dirección comercial. TODO: confirmar con el cliente "Local 4" (comercial) frente a "Local 3-4" (legal). */
  address: {
    street: 'C/ Pasaje Piscina Delfe, 3, Local 4',
    postalCode: '28400',
    locality: 'Collado Villalba',
    region: 'Madrid',
    country: 'ES',
    oneLine: 'C/ Pasaje Piscina Delfe, 3, Local 4, 28400 Collado Villalba (Madrid)',
  },
  /**
   * Coordenadas del edificio de Pasaje Piscina Delfe, 3 (OpenStreetMap). El centro del embed
   * antiguo (40.6355, -4.0167) era solo el centro del mapa. TODO: confirmar con el cliente.
   */
  geo: { latitude: 40.6315027, longitude: -4.0076629 },
  maps: {
    embed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12110.984191824411!2d-4.016686864021739!3d40.63548214966094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd4175b2adf35209%3A0x338034b62cee88a!2sRestaurante%20Parrilla%20El%20Carn%C3%ADvoro!5e0!3m2!1ses!2ses!4v1678103504523!5m2!1ses!2ses',
    /** Ficha del restaurante en Google Maps (CID obtenido del embed de la web anterior). */
    place: 'https://maps.google.com/?cid=231939003124738186',
    directions:
      'https://www.google.com/maps/dir/?api=1&destination=Restaurante+Parrilla+El+Carn%C3%ADvoro%2C+Pasaje+Piscina+Delfe+3%2C+28400+Collado+Villalba',
  },
} as const;

/** Titular legal (aviso legal y política de privacidad). */
export const legal = {
  company: 'Ivosi 2022, S.L.',
  nif: 'B62749882',
  /** Domicilio legal según el aviso legal anterior. TODO: confirmar "Local 3-4". */
  address: 'Pasaje de la Piscina Delfe, 3, Local 3-4, 28400 Collado Villalba (Madrid)',
  email: 'parrilla.carnivoro@gmail.com',
} as const;

export type DayKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface DayHours {
  key: DayKey;
  label: string;
  /** schema.org DayOfWeek */
  schema: string;
  /** 0 = domingo … 6 = sábado (Date.getDay) */
  jsDay: number;
  open: string | null;
  close: string | null;
}

/** Horario: lunes, jueves, viernes, sábado y domingo de 10:00 a 01:00. Martes y miércoles cerrado. */
export const hours: DayHours[] = [
  { key: 'lunes', label: 'Lunes', schema: 'Monday', jsDay: 1, open: '10:00', close: '01:00' },
  { key: 'martes', label: 'Martes', schema: 'Tuesday', jsDay: 2, open: null, close: null },
  { key: 'miercoles', label: 'Miércoles', schema: 'Wednesday', jsDay: 3, open: null, close: null },
  { key: 'jueves', label: 'Jueves', schema: 'Thursday', jsDay: 4, open: '10:00', close: '01:00' },
  { key: 'viernes', label: 'Viernes', schema: 'Friday', jsDay: 5, open: '10:00', close: '01:00' },
  { key: 'sabado', label: 'Sábado', schema: 'Saturday', jsDay: 6, open: '10:00', close: '01:00' },
  { key: 'domingo', label: 'Domingo', schema: 'Sunday', jsDay: 0, open: '10:00', close: '01:00' },
];

/** Días cerrados en formato Date.getDay() (para el calendario de reservas). */
export const closedWeekdays = hours.filter((d) => !d.open).map((d) => d.jsDay);

export const hoursSummary = {
  open: 'Lunes, jueves, viernes, sábado y domingo',
  openShort: 'Lun · Jue – Dom',
  time: '10:00 – 01:00',
  closed: 'Martes y miércoles cerrado',
};

/** Navegación principal. */
export const nav = [
  { href: '/', label: 'Inicio' },
  { href: '/carta/', label: 'Carta' },
  { href: '/nuestra-historia/', label: 'Nuestra historia' },
  { href: '/contacto/', label: 'Contacto' },
] as const;

export const legalNav = [
  { href: '/aviso-legal/', label: 'Aviso legal' },
  { href: '/politica-de-privacidad/', label: 'Política de privacidad' },
  { href: '/politica-de-cookies/', label: 'Política de cookies' },
] as const;

/** Enlace de WhatsApp con mensaje opcional (URL-encoded). */
export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${business.phone.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const defaultWhatsappText = 'Hola, me gustaría reservar mesa en El Carnívoro.';
