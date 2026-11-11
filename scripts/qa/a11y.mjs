// QA de accesibilidad (WCAG 2.2 AA) con axe-core en cada página, en escritorio y móvil,
// con y sin el banner de cookies, y con el menú móvil y el visor de la galería abiertos.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { BASE, PAGES, scrollThrough, startServer, writeReport } from './lib.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const stop = await startServer();
const browser = await chromium.launch();
const results = [];
async function run(page, label) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  results.push({
    label,
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) })),
  });
}
try {
  for (const vp of [{ w: 1280, h: 900 }, { w: 375, h: 800 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    await ctx.addInitScript(() => sessionStorage.setItem('pec-visited', '1'));
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(BASE + p.path, { waitUntil: 'load' });
      await scrollThrough(page);
      await run(page, `${p.path} @${vp.w} (banner visible)`);
    }
    // Con consentimiento elegido.
    await page.locator('[data-cc-banner] [data-cc="reject"]').click();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await scrollThrough(page);
    await run(page, `/ @${vp.w} (sin banner)`);
    if (vp.w < 1000) {
      await page.click('[data-menu-open]');
      await page.waitForTimeout(600);
      await run(page, `/ @${vp.w} (menú móvil abierto)`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    await page.goto(BASE + '/nuestra-historia/', { waitUntil: 'load' });
    await page.locator('#galeria [data-lightbox-open]').first().click();
    await page.waitForTimeout(800);
    await run(page, `/nuestra-historia/ @${vp.w} (visor abierto)`);
    await page.keyboard.press('Escape');
    await page.goto(BASE + '/contacto/', { waitUntil: 'load' });
    await page.click('[data-date-trigger]');
    await page.waitForTimeout(300);
    await run(page, `/contacto/ @${vp.w} (calendario abierto)`);
    await page.keyboard.press('Escape');
    await page.click('[data-cookie-settings]');
    await page.waitForTimeout(300);
    await run(page, `/contacto/ @${vp.w} (panel de cookies)`);
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}
const total = results.reduce((n, r) => n + r.violations.length, 0);
const file = await writeReport('a11y', results);
results.forEach((r) => {
  console.log(`${r.violations.length ? '✗' : '✓'} ${r.label}`);
  r.violations.forEach((v) => console.log(`    [${v.impact}] ${v.id}: ${v.help}\n      ${v.nodes.join('\n      ')}`));
});
console.log(`Accesibilidad (axe, WCAG 2.2 AA): ${results.length} estados revisados · ${total} incumplimientos → ${file}`);
process.exitCode = total ? 1 : 0;
