/**
 * Datos estructurados (JSON-LD) tipados con schema-dts.
 * Sin aggregateRating ni Review (Google no admite reseñas autogestionadas en negocios locales).
 */
import type { BreadcrumbList, Menu, MenuItem as SchemaMenuItem, MenuSection as SchemaMenuSection, Offer, Restaurant, WebSite, WithContext } from 'schema-dts';
import { business, hours, SITE_URL } from '../data/site';
import { carta, type MenuItem, type Price, type Section } from '../data/carta';

export const RESTAURANT_ID = `${SITE_URL}/#restaurant`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const abs = (path: string) => new URL(path, SITE_URL).href;

export function restaurantSchema(images: string[]): WithContext<Restaurant> {
  const openDays = hours.filter((d) => d.open);
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': RESTAURANT_ID,
    name: business.name,
    alternateName: business.shortName,
    slogan: business.slogan,
    description:
      'Restaurante de carnes a la parrilla de carbón en Collado Villalba (sierra de Madrid): chuletón, T-Bone, entraña y cortes madurados, entrantes caseros, pescados, desayunos, menú del día, menú de cenas y fines de semana y menú de grupos. Salón y gran terraza.',
    url: `${SITE_URL}/`,
    logo: abs('/logo-el-carnivoro.png'),
    image: images,
    telephone: business.phone.e164,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.locality,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: business.geo.latitude, longitude: business.geo.longitude },
    hasMap: business.maps.place,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: openDays.map((d) => `https://schema.org/${d.schema}` as never),
        opens: '10:00',
        closes: '01:00',
      },
    ],
    servesCuisine: [...business.cuisine],
    priceRange: business.priceRange,
    currenciesAccepted: 'EUR',
    acceptsReservations: true,
    hasMenu: abs('/carta/'),
    menu: abs('/carta/'),
    sameAs: [business.instagram.url, business.maps.place],
  };
}

export function websiteSchema(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: business.name,
    alternateName: business.shortName,
    inLanguage: 'es-ES',
    publisher: { '@id': RESTAURANT_ID },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

const money = (n: number) => n.toFixed(2);

function offerFor(p: Price): Offer {
  const offer: Offer = { '@type': 'Offer', price: money(p.amount), priceCurrency: 'EUR' };
  if (p.label) offer.name = p.label;
  if (p.per === 'kg') {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: money(p.amount),
      priceCurrency: 'EUR',
      unitCode: 'KGM',
      unitText: 'kg',
    };
  } else if (p.per === 'unidad') {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: money(p.amount),
      priceCurrency: 'EUR',
      unitCode: 'C62',
      unitText: 'unidad',
    };
  } else if (p.per === 'persona') {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: money(p.amount),
      priceCurrency: 'EUR',
      unitText: 'persona',
    };
  }
  return offer;
}

function itemSchema(it: MenuItem): SchemaMenuItem {
  const desc = [it.description, it.note].filter(Boolean).join('. ');
  return {
    '@type': 'MenuItem',
    name: it.name,
    ...(desc ? { description: desc } : {}),
    offers: it.prices.length === 1 ? offerFor(it.prices[0]) : it.prices.map(offerFor),
  };
}

function sectionSchema(s: Section): SchemaMenuSection {
  if (s.kind === 'carta') {
    const multi = s.groups.length > 1 || s.groups.some((g) => g.title);
    return {
      '@type': 'MenuSection',
      name: s.title,
      url: abs(`/carta/#${s.id}`),
      ...(multi
        ? {
            hasMenuSection: s.groups.map((g) => ({
              '@type': 'MenuSection',
              name: g.title ?? s.title,
              hasMenuItem: g.items.map(itemSchema),
            })),
          }
        : { hasMenuItem: s.groups.flatMap((g) => g.items).map(itemSchema) }),
    };
  }
  return {
    '@type': 'MenuSection',
    name: s.title,
    url: abs(`/carta/#${s.id}`),
    ...(s.intro ? { description: s.intro } : {}),
    hasMenuItem: s.menus.map((m) => ({
      '@type': 'MenuItem',
      name: m.name,
      description:
        [
          ...m.courses.map((c) => `${c.title}: ${c.options.join(', ')}`),
          m.includes?.length ? `Incluye: ${m.includes.join(', ')}` : '',
          s.availability ?? '',
        ]
          .filter(Boolean)
          .join('. ') || s.intro,
      offers: offerFor(m.price),
    })),
  };
}

export function menuSchema(): WithContext<Menu> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${SITE_URL}/carta/#menu`,
    name: `Carta de ${business.name}`,
    url: abs('/carta/'),
    inLanguage: 'es-ES',
    mainEntityOfPage: abs('/carta/'),
    hasMenuSection: carta.map(sectionSchema),
  };
}
