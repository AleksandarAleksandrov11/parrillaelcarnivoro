// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import pruneUnusedAssets from './integrations/prune-unused-assets.mjs';

// Dominio canónico de producción (con www, HTTPS y barra final en todas las URLs).
export const SITE = 'https://www.parrillaelcarnivoro.es';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory',
    // CSS crítico en línea: elimina peticiones bloqueantes y mejora el LCP.
    inlineStylesheets: 'always',
  },
  image: {
    responsiveStyles: false,
    // Calidad por formato (la escala de AVIF no equivale a la de WebP/JPEG).
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        avif: { quality: 50, effort: 4 },
        webp: { quality: 74, effort: 4 },
        jpeg: { quality: 76, mozjpeg: true },
        png: { compressionLevel: 9, palette: true, quality: 90 },
      },
    },
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [pruneUnusedAssets()],
  devToolbar: { enabled: false },
  // Fuentes autoalojadas (WOFF2, subset latino, font-display: swap) con fallback métrico
  // ajustado automáticamente para evitar saltos de diseño al cargar.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-display',
      fallbacks: ['Georgia', 'serif'],
      display: 'swap',
      options: {
        variants: [
          { src: ['./src/assets/fonts/cormorant-garamond-latin-wght-normal.woff2'], weight: '300 700', style: 'normal' },
          { src: ['./src/assets/fonts/cormorant-garamond-latin-wght-italic.woff2'], weight: '300 700', style: 'italic' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Manrope',
      cssVariable: '--font-sans',
      fallbacks: ['Arial', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [{ src: ['./src/assets/fonts/manrope-latin-wght-normal.woff2'], weight: '200 800', style: 'normal' }],
      },
    },
  ],
  vite: {
    build: {
      assetsInlineLimit: 2048,
    },
  },
});
