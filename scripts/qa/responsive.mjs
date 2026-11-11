// QA 3 y 10 · Responsive y consola: capturas de cada página en 320–1920 px y en horizontal,
// detección de scroll horizontal y de elementos que se salen del viewport, y errores o
// avisos de la consola del navegador.
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { BASE, OUT, PAGES, scrollThrough, startServer, writeReport } from './lib.mjs';

const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440, 1920];
const LANDSCAPE = [
  { name: 'iphone-se-horizontal', width: 667, height: 375 },
  { name: 'iphone-14-horizontal', width: 844, height: 390 },
  { name: 'tablet-horizontal', width: 1180, height: 820 },
];
const DIR = path.join(OUT, 'screens');
await mkdir(DIR, { recursive: true });

const stop = await startServer();
const browser = await chromium.launch();
const results = [];
try {
  const viewports = [...WIDTHS.map((w) => ({ name: `${w}`, width: w, height: w < 768 ? 800 : 900 })), ...LANDSCAPE];
  for (const p of PAGES) {
    for (const vp of viewports) {
      const mobile = vp.width < 1000;
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: mobile && vp.width < 900,
        hasTouch: mobile,
        userAgent: mobile ? devices['iPhone 13'].userAgent : undefined,
      });
      // Consentimiento ya elegido (rechazo) para que el banner no tape la captura;
      // la sesión ya ha visto la intro.
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem('pec-consent', JSON.stringify({ v: 1, analytics: false, maps: false, ts: Date.now(), exp: Date.now() + 1e10 }));
          sessionStorage.setItem('pec-visited', '1');
        } catch {}
      });
      const page = await ctx.newPage();
      const consoleMsgs = [];
      page.on('console', (m) => ['error', 'warning'].includes(m.type()) && consoleMsgs.push(`${m.type()}: ${m.text()}`));
      page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${e.message}`));
      await page.goto(BASE + p.path, { waitUntil: 'load' });
      await scrollThrough(page);
      const check = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const overflowX = document.documentElement.scrollWidth > vw + 1;
        const offenders = [];
        document.querySelectorAll('body *').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || el.closest('dialog:not([open])') || cs.visibility === 'hidden' || cs.display === 'none') return;
          if (el.closest('.cn-list, .lb-stage, .hero-media, .ph-media, .cta-ember, .nf-glow, [data-parallax]')) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.right > vw + 1 || r.left < -1) offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(r.left)}→${Math.round(r.right)})`);
        });
        // Texto cortado: elementos con overflow oculto cuyo contenido es más ancho.
        const clipped = [];
        document.querySelectorAll('h1, h2, h3, p, a, button, li, dt, dd, span.item-name, span.item-price').forEach((el) => {
          const cs = getComputedStyle(el);
          if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && !el.closest('.split')) clipped.push(el.tagName.toLowerCase() + ': ' + (el.textContent || '').trim().slice(0, 40));
        });
        return { overflowX, offenders: offenders.slice(0, 10), clipped: clipped.slice(0, 10) };
      });
      const file = path.join(DIR, `${p.name}-${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      results.push({ page: p.path, viewport: vp.name, ...check, console: consoleMsgs, file: path.relative(OUT, file) });
      await ctx.close();
    }
    console.log(`✓ ${p.path}`);
  }
} finally {
  await browser.close();
  stop();
}
const issues = results.filter((r) => r.overflowX || r.offenders.length || r.clipped.length || r.console.length);
await writeReport('responsive', { total: results.length, issues, results });
console.log(`Responsive: ${results.length} capturas · ${issues.length} con incidencias`);
issues.forEach((r) => console.log(`  ✗ ${r.page} @${r.viewport}`, JSON.stringify({ overflowX: r.overflowX, offenders: r.offenders, clipped: r.clipped, console: r.console })));
process.exitCode = issues.length ? 1 : 0;
