// QA 8 · Redirecciones 301 de las URLs antiguas (emulando las reglas de vercel.json).
import { BASE, startServer, writeReport } from './lib.mjs';

const CASES = [
  ['/desayunos', '/carta/'],
  ['/desayunos/', '/carta/'],
  ['/menu-grupos', '/carta/#menu-cenas'],
  ['/menu-grupos/', '/carta/#menu-cenas'],
  ['/parrillaelcarnivoro/carta', '/carta/'],
  ['/parrillaelcarnivoro/carta/', '/carta/'],
  ['/galeria', '/galeria/'],
  ['/nuestra-historia', '/galeria/'],
  ['/nuestra-historia/', '/galeria/'],
  ['/aviso-legal', '/aviso-legal/'],
  ['/politica-de-privacidad', '/politica-de-privacidad/'],
  ['/politica-de-cookies', '/politica-de-cookies/'],
  ['/wp-admin/', '/'],
  ['/wp-login.php', '/'],
  ['/wp-content/uploads/2023/03/chuleton.jpg', '/'],
  ['/wp-json/', '/'],
  ['/xmlrpc.php', '/'],
  ['/feed/', '/'],
  ['/comments/feed/', '/'],
  ['/?p=123', '/?origen=wp'],
  ['/carta', '/carta/'],
  ['/contacto', '/contacto/'],
];
const HOST_CASES = [
  ['/', 'https://www.parrillaelcarnivoro.es/'],
  ['/carta/', 'https://www.parrillaelcarnivoro.es/carta/'],
];
const OK_200 = ['/', '/carta/', '/galeria/', '/contacto/', '/aviso-legal/', '/politica-de-privacidad/', '/politica-de-cookies/', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/?p=1&origen=wp'];

const stop = await startServer();
const rows = [];
let fail = 0;
try {
  for (const [from, to] of CASES) {
    const r = await fetch(BASE + from, { redirect: 'manual' });
    const loc = r.headers.get('location');
    const ok = r.status === 301 && loc === to;
    if (!ok) fail++;
    rows.push({ from, status: r.status, location: loc, expected: to, ok });
  }
  for (const [from, to] of HOST_CASES) {
    const r = await fetch(BASE + from, { redirect: 'manual', headers: { 'x-forwarded-host': 'parrillaelcarnivoro.es' } });
    const loc = r.headers.get('location');
    const ok = r.status === 301 && loc === to;
    if (!ok) fail++;
    rows.push({ from: `parrillaelcarnivoro.es${from}`, status: r.status, location: loc, expected: to, ok });
  }
  for (const u of OK_200) {
    const r = await fetch(BASE + u, { redirect: 'manual' });
    const ok = r.status === 200;
    if (!ok) fail++;
    rows.push({ from: u, status: r.status, expected: 200, ok });
  }
  const nf = await fetch(BASE + '/no-existe/', { redirect: 'manual' });
  rows.push({ from: '/no-existe/', status: nf.status, expected: 404, ok: nf.status === 404 });
  if (nf.status !== 404) fail++;
} finally {
  stop();
}
const file = await writeReport('redirects', rows);
rows.forEach((r) => console.log(`${r.ok ? '✓' : '✗'} ${r.from} → ${r.status} ${r.location ?? ''}`));
console.log(`Redirecciones: ${rows.length - fail}/${rows.length} correctas → ${file}`);
process.exitCode = fail ? 1 : 0;
