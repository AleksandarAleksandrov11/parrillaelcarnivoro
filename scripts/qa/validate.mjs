// QA 5 · Validación: HTML (validador W3C Nu, vnu.jar), JSON-LD, canonical, Open Graph,
// un único <h1>, jerarquía de encabezados, sitemap.xml y robots.txt.
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, writeReport } from './lib.mjs';

const require = createRequire(import.meta.url);
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://www.parrillaelcarnivoro.es';
const htmlFiles = [];
async function walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
}
await walk(DIST);

// 1) W3C Nu HTML Checker (offline).
const vnu = require('vnu-jar');
let vnuMessages = [];
{
  // vnu escribe el resultado JSON en stderr (sale con 1 si hay errores, 0 si no).
  const r = spawnSync('java', ['-jar', vnu, '--format', 'json', '--also-check-svg', ...htmlFiles], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  // Java puede anteponer avisos (p. ej. «Picked up JAVA_TOOL_OPTIONS»): se busca el JSON.
  const raw = String(r.stderr || '');
  const i = raw.indexOf('{"messages"');
  try {
    vnuMessages = i >= 0 ? JSON.parse(raw.slice(i)).messages : [];
  } catch {
    vnuMessages = [{ type: 'fatal', message: raw.slice(0, 500) }];
  }
}
const vnuErrors = vnuMessages.filter((m) => m.type === 'error' || m.type === 'fatal');
const vnuWarnings = vnuMessages.filter((m) => m.subType === 'warning');

// 2) SEO, encabezados y JSON-LD por página.
const pages = [];
const problems = [];
for (const f of htmlFiles) {
  const rel = '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const html = await readFile(f, 'utf8');
  const is404 = rel === '/404.html';
  const get = (re) => html.match(re)?.[1];
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const canonical = get(/<link rel="canonical" href="([^"]+)"/);
  const title = get(/<title>([^<]+)<\/title>/);
  const desc = get(/<meta name="description" content="([^"]+)"/);
  const ogImage = get(/<meta property="og:image" content="([^"]+)"/);
  const ogUrl = get(/<meta property="og:url" content="([^"]+)"/);
  const lang = get(/<html lang="([^"]+)"/);
  const headings = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  const jumps = headings.filter((h, i) => i > 0 && h > headings[i - 1] + 1);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      problems.push(`${rel}: JSON-LD no válido (${e.message})`);
      return null;
    }
  });
  const types = ld.filter(Boolean).map((x) => x['@type']);
  if (lang !== 'es-ES') problems.push(`${rel}: lang=${lang}`);
  if (h1 !== 1) problems.push(`${rel}: ${h1} <h1>`);
  if (jumps.length) problems.push(`${rel}: saltos de encabezado ${JSON.stringify(headings)}`);
  if (!title || title.length > 70) problems.push(`${rel}: title ausente o largo (${title?.length})`);
  if (!desc || desc.length < 70 || desc.length > 170) problems.push(`${rel}: description fuera de rango (${desc?.length})`);
  if (!ogImage?.startsWith(SITE + '/og/')) problems.push(`${rel}: og:image ${ogImage}`);
  if (!is404) {
    if (canonical !== SITE + rel) problems.push(`${rel}: canonical ${canonical}`);
    if (ogUrl !== canonical) problems.push(`${rel}: og:url distinto del canonical`);
    if (rel !== '/' && !types.includes('BreadcrumbList')) problems.push(`${rel}: falta BreadcrumbList`);
  } else if (!html.includes('noindex')) problems.push('404 sin noindex');
  const ldText = JSON.stringify(ld);
  if (/aggregateRating|"Review"/.test(ldText)) problems.push(`${rel}: el schema incluye reseñas/valoraciones`);
  // El patrón se compone por partes para que el propio script no contenga el número.
  if (new RegExp(['69', '1'].join('')).test(ldText)) problems.push(`${rel}: teléfono antiguo en el schema`);
  pages.push({ page: rel, title, titleLength: title?.length, descriptionLength: desc?.length, h1, headings: headings.join(''), canonical, schema: types });
}

// 3) Schema del restaurante: campos obligatorios del encargo.
const home = await readFile(path.join(DIST, 'index.html'), 'utf8');
const restaurant = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'Restaurant');
const need = ['name', 'logo', 'image', 'address', 'geo', 'telephone', 'email', 'openingHoursSpecification', 'servesCuisine', 'priceRange', 'acceptsReservations', 'hasMenu', 'sameAs'];
need.filter((k) => !restaurant?.[k]).forEach((k) => problems.push(`Restaurant sin ${k}`));
if (restaurant?.telephone !== '+34915013983') problems.push('Restaurant.telephone incorrecto');
const days = restaurant?.openingHoursSpecification?.[0]?.dayOfWeek?.map((d) => d.split('/').pop()).sort().join(',');
if (days !== 'Friday,Monday,Saturday,Sunday,Thursday') problems.push(`Horario del schema: ${days}`);
const carta = await readFile(path.join(DIST, 'carta/index.html'), 'utf8');
const menu = [...carta.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((x) => x['@type'] === 'Menu');
const menuItems = JSON.stringify(menu).match(/"@type":"MenuItem"/g)?.length ?? 0;
if (menuItems < 60) problems.push(`Menu con pocos platos (${menuItems})`);

// 4) sitemap.xml y robots.txt.
const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const expectedLocs = ['/', '/carta/', '/nuestra-historia/', '/contacto/'].map((p) => SITE + p);
if (JSON.stringify(locs) !== JSON.stringify(expectedLocs)) problems.push(`sitemap: ${locs.join(' ')}`);
if (/aviso-legal|politica|404/.test(sitemap)) problems.push('sitemap incluye páginas legales o 404');
const robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) problems.push('robots.txt sin Sitemap');

const report = {
  vnu: { errors: vnuErrors.map((m) => ({ file: m.url?.split('/dist/')[1], line: m.lastLine, message: m.message })), warnings: vnuWarnings.length },
  pages,
  restaurantSchema: restaurant,
  menuItems,
  sitemap: locs,
  robots,
  problems,
};
const file = await writeReport('validate', report);
console.log(`HTML (W3C Nu): ${htmlFiles.length} páginas · ${vnuErrors.length} errores · ${vnuWarnings.length} avisos`);
report.vnu.errors.slice(0, 40).forEach((e) => console.log(`  ✗ ${e.file}:${e.line} ${e.message}`));
console.log(`SEO/JSON-LD: ${problems.length} problemas · MenuItem en schema: ${menuItems} → ${file}`);
problems.forEach((p) => console.log('  ✗', p));
pages.forEach((p) => console.log(`  ${p.page} · h1=${p.h1} · title ${p.titleLength} · desc ${p.descriptionLength} · ${p.schema.join(', ')}`));
process.exitCode = vnuErrors.length || problems.length ? 1 : 0;
