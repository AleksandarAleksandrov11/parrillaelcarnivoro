// Utilidades compartidas de la QA: servidor local que emula Vercel y lista de páginas.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const OUT = path.join(ROOT, 'qa-output');
export const PORT = Number(process.env.QA_PORT || 4329);
export const BASE = `http://localhost:${PORT}`;

export const PAGES = [
  { path: '/', name: 'inicio' },
  { path: '/carta/', name: 'carta' },
  { path: '/nuestra-historia/', name: 'nuestra-historia' },
  { path: '/contacto/', name: 'contacto' },
  { path: '/aviso-legal/', name: 'aviso-legal' },
  { path: '/politica-de-privacidad/', name: 'politica-de-privacidad' },
  { path: '/politica-de-cookies/', name: 'politica-de-cookies' },
  { path: '/pagina-que-no-existe/', name: '404' },
];

export async function startServer() {
  const proc = spawn(process.execPath, [path.join(ROOT, 'scripts/serve-dist.mjs')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    proc.stdout.on('data', (d) => String(d).includes('servido') && resolve());
    proc.on('exit', (c) => reject(new Error(`servidor terminado (${c})`)));
  });
  return () => proc.kill();
}

export async function writeReport(name, data) {
  await mkdir(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.json`);
  await writeFile(file, JSON.stringify(data, null, 2));
  return file;
}

/** Recorre la página para disparar los revelados y la carga diferida. */
export async function scrollThrough(page) {
  // Desplazamiento instantáneo: sin Lenis (pantallas táctiles) la web usa scroll-behavior: smooth
  // y los saltos rápidos no llegarían al final de la página.
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += Math.round(window.innerHeight * 0.7)) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 140));
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 150));
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  // Espera a que terminen de cargar todas las imágenes (carga diferida incluida).
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
}
