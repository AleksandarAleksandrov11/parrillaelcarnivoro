// QA · Anclas: los destinos de las redirecciones antiguas (/carta/#desayunos, #grupos,
// #menu-del-dia y /nuestra-historia/#galeria) deben quedar visibles bajo la cabecera al llegar.
import { chromium, devices } from 'playwright';
import { BASE, startServer, writeReport } from './lib.mjs';

const TARGETS = ['/carta/#desayunos', '/carta/#grupos', '/carta/#menu-del-dia', '/carta/#menu-cenas', '/carta/#vinos', '/nuestra-historia/#galeria', '/contacto/#reserva', '/#visitanos'];
const stop = await startServer();
const browser = await chromium.launch();
const rows = [];
try {
  for (const [name, opts] of [
    ['escritorio', { viewport: { width: 1280, height: 800 } }],
    ['móvil', devices['iPhone 13']],
  ]) {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => {
      localStorage.setItem('pec-consent', JSON.stringify({ v: 1, analytics: false, maps: false, ts: Date.now(), exp: Date.now() + 1e10 }));
      sessionStorage.setItem('pec-visited', '1');
    });
    const page = await ctx.newPage();
    for (const t of TARGETS) {
      await page.goto(BASE + t, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      const top = await page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), t.split('#')[1]);
      const vh = (opts.viewport ?? opts.viewport)?.height ?? 664;
      const ok = top >= 0 && top <= Math.min(320, vh * 0.5);
      rows.push({ device: name, target: t, top, ok });
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}
await writeReport('anchors', rows);
rows.forEach((r) => console.log(`${r.ok ? '✓' : '✗'} ${r.device} ${r.target} → sección a ${r.top}px del borde superior`));
const bad = rows.filter((r) => !r.ok).length;
console.log(`Anclas: ${rows.length - bad}/${rows.length} correctas`);
process.exitCode = bad ? 1 : 0;
