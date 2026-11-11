/**
 * sitemap.xml propio (misma URL que la web anterior, ya registrada en Search Console).
 * Incluye las páginas indexables con sus imágenes principales; excluye legales y 404.
 */
import type { APIRoute } from 'astro';
import { SITE_URL } from '../data/site';

const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly', images: ['/og/inicio.jpg'] },
  { path: '/carta/', priority: '0.9', changefreq: 'weekly', images: ['/og/carta.jpg'] },
  { path: '/galeria/', priority: '0.7', changefreq: 'monthly', images: ['/og/galeria.jpg'] },
  { path: '/contacto/', priority: '0.8', changefreq: 'monthly', images: ['/og/contacto.jpg'] },
];

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
${p.images.map((i) => `    <image:image><image:loc>${SITE_URL}${i}</image:loc></image:image>`).join('\n')}
  </url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
