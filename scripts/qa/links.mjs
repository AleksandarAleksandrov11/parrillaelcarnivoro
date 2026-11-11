// QA 1 · Enlaces y botones: rastreo completo con linkinator (internos, externos, anclas)
// y comprobación específica de tel:, mailto:, wa.me y atributos data-* con URLs.
import { LinkChecker } from 'linkinator';
import { chromium } from 'playwright';
import { BASE, PAGES, startServer, writeReport } from './lib.mjs';

const stop = await startServer();
const problems = [];
try {
  // 1) Rastreo recursivo con comprobación de fragmentos (#anclas).
  const checker = new LinkChecker();
  const res = await checker.check({
    path: `${BASE}/`,
    recurse: true,
    checkFragments: true,
    timeout: 20000,
    retryErrors: true,
    retryErrorsCount: 2,
    concurrency: 8,
    // Las URLs absolutas del dominio de producción (canonical, og:image, schema) se comprueban
    // contra este build: el dominio todavía sirve la web antigua hasta el despliegue.
    urlRewriteExpressions: [{ pattern: /^https:\/\/www\.parrillaelcarnivoro\.es/, replacement: BASE }],
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  });
  const links = res.links.map((l) => ({ url: l.url, state: l.state, status: l.status, parent: l.parent, failure: l.failureDetails?.[0]?.message }));
  const broken = links.filter((l) => l.state === 'BROKEN');
  // Los perfiles de Instagram y la ficha de Maps bloquean a los robots (429/403); se anotan aparte.
  const botWalls = broken.filter((l) => /instagram\.com|google\.com\/maps|maps\.google\.com/.test(l.url) && [403, 429, 0].includes(l.status ?? 0));
  const realBroken = broken.filter((l) => !botWalls.includes(l));

  // 2) Revisión de cada página: tel:, mailto:, wa.me, anclas internas y botones.
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const perPage = [];
  for (const p of PAGES) {
    await page.goto(BASE + p.path, { waitUntil: 'load' });
    const info = await page.evaluate(() => {
      const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
      const buttons = [...document.querySelectorAll('button')].map((b) => ({
        name: (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' '),
        type: b.getAttribute('type'),
      }));
      return { hrefs, ids: [...ids], buttons };
    });
    const tel = info.hrefs.filter((h) => h.startsWith('tel:'));
    const mail = info.hrefs.filter((h) => h.startsWith('mailto:'));
    const wa = info.hrefs.filter((h) => h.includes('wa.me'));
    tel.filter((h) => h !== 'tel:+34915013983').forEach((h) => problems.push(`${p.path}: tel incorrecto ${h}`));
    mail.filter((h) => !/^mailto:parrilla\.carnivoro@gmail\.com(\?subject=[^ ]+)?$/.test(h)).forEach((h) => problems.push(`${p.path}: mailto incorrecto ${h}`));
    wa.filter((h) => !/^https:\/\/wa\.me\/34915013983(\?text=[^ ]+)?$/.test(h)).forEach((h) => problems.push(`${p.path}: wa.me incorrecto ${h}`));
    info.hrefs
      .filter((h) => h.startsWith('#'))
      .forEach((h) => {
        if (h.length > 1 && !info.ids.includes(decodeURIComponent(h.slice(1)))) problems.push(`${p.path}: ancla inexistente ${h}`);
      });
    info.buttons.filter((b) => !b.name).forEach(() => problems.push(`${p.path}: botón sin nombre accesible`));
    info.buttons.filter((b) => !b.type).forEach((b) => problems.push(`${p.path}: botón sin type (${b.name})`));
    perPage.push({ page: p.path, links: info.hrefs.length, tel: tel.length, mailto: mail.length, whatsapp: wa.length, buttons: info.buttons.length });
  }
  await browser.close();

  const report = {
    total: links.length,
    ok: links.filter((l) => l.state === 'OK').length,
    skipped: links.filter((l) => l.state === 'SKIPPED').length,
    broken: realBroken,
    botWalls,
    perPage,
    problems,
  };
  const file = await writeReport('links', report);
  console.log(`Enlaces: ${report.total} comprobados · ${report.ok} OK · ${realBroken.length} rotos · ${botWalls.length} bloqueados por anti-robots · ${problems.length} problemas → ${file}`);
  realBroken.forEach((l) => console.log('  ROTO', l.status, l.url, '←', l.parent));
  botWalls.forEach((l) => console.log('  ANTI-ROBOT', l.status, l.url));
  problems.forEach((x) => console.log('  ', x));
  process.exitCode = realBroken.length || problems.length ? 1 : 0;
} finally {
  stop();
}
