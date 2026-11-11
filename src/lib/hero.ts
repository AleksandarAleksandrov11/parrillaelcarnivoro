/**
 * Srcsets del póster del hero (horizontal y vertical) para el <picture> y el preload.
 * getImage() deduplica las transformaciones, así que llamarlo desde la página y el
 * componente no genera imágenes duplicadas.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { photo } from '../data/photos';

export const PORTRAIT_MQ = '(orientation: portrait) and (max-width: 899px)';

const srcset = async (src: ImageMetadata, widths: number[], format: 'avif' | 'webp') =>
  (await Promise.all(widths.map((w) => getImage({ src, width: w, format })))).map((i) => `${i.src} ${i.attributes.width}w`).join(', ');

export async function heroPoster() {
  const land = await photo('hero-parrilla-carbon-poster');
  const port = await photo('hero-parrilla-carbon-poster-vertical');
  const landWidths = [828, 1280, 1920];
  const portWidths = [480, 608];
  const [landAvif, landWebp, portAvif, portWebp, fallback] = await Promise.all([
    srcset(land, landWidths, 'avif'),
    srcset(land, landWidths, 'webp'),
    srcset(port, portWidths, 'avif'),
    srcset(port, portWidths, 'webp'),
    getImage({ src: land, width: 1280, format: 'jpg' }),
  ]);
  return { landAvif, landWebp, portAvif, portWebp, fallback: fallback.src };
}
