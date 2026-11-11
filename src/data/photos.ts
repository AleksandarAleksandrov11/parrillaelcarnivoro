/**
 * Registro de fotos optimizables (src/assets/photos). Los masters JPEG se generan con
 * `npm run assets:images` desde source-assets/ y astro:assets crea AVIF + WebP responsive.
 *
 * Para cambiar una foto: sustituye el JPEG en src/assets/photos/ manteniendo el nombre
 * (o añade uno nuevo y su nombre aparecerá aquí automáticamente) y ejecuta
 * `npm run assets:images` para regenerar el placeholder desenfocado.
 *
 * La importación es perezosa: solo las fotos realmente usadas acaban en el build.
 */
import type { ImageMetadata } from 'astro';
import meta from './photo-meta.json';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg');

export type PhotoName = keyof typeof meta;

const loaders = Object.fromEntries(
  Object.entries(files).map(([file, load]) => [file.split('/').pop()!.replace(/\.jpg$/, ''), load]),
) as Record<PhotoName, () => Promise<{ default: ImageMetadata }>>;

export async function photo(name: PhotoName): Promise<ImageMetadata> {
  const load = loaders[name];
  if (!load) throw new Error(`Foto no encontrada: ${name}`);
  return (await load()).default;
}

export function photoSize(name: PhotoName): { width: number; height: number } {
  const m = meta[name];
  return { width: m.width, height: m.height };
}

export function lqip(name: PhotoName): string {
  return meta[name]?.lqip ?? '';
}
