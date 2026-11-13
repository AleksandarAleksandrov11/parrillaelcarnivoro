// QA · Interacción real en varios dispositivos: cada enlace y botón visible de cada página
// se puede pulsar (no lo tapa nada, ni la cabecera ni el botón fijo de llamar), cada enlace
// interno responde 200, todos los `tel:` van al número correcto y los controles principales
// funcionan (menú móvil, carta, galería y visor, mapa, banner de cookies, saltar intro).
import { chromium, devices } from 'playwright';
import { BASE, PAGES, startServer, writeReport } from './lib.mjs';

const DEVICES = [
  { name: 'iPhone 13', opts: devices['iPhone 13'] },
  { name: 'Pixel 7', opts: devices['Pixel 7'] },
  { name: 'iPad Mini', opts: devices['iPad Mini'] },
  { name: 'Escritorio 1440', opts: { viewport: { width: 1440, height: 900 } } },
  { name: 'Escritorio 1920', opts: { viewport: { width: 1920, height: 1080 } } },
];
const TEL = 'tel:+34915013983';
const stop = await startServer();
const browser = await chromium.launch();
const results = [];
const fail = (where, msg) => results.push({ ok: false, where, msg });
const pass = (where, msg) => results.push({ ok: true, where, msg });
const statusCache = new Map();

async function status(ctx, url) {
  if (!statusCache.has(url)) statusCache.set(url, (await ctx.request.get(url, { maxRedirects: 0 })).status());
  return statusCache.get(url);
}

try {
  for (const d of DEVICES) {
    const ctx = await browser.newContext({ ...d.opts, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('pec-consent', JSON.stringify({ v: 1, analytics: false, maps: false, ts: Date.now(), exp: Date.now() + 1e10 }));
        sessionStorage.setItem('pec-visited', '1');
      } catch {}
    });
    for (const p of PAGES) {
      const where = `${d.name} ${p.path}`;
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(BASE + p.path, { waitUntil: 'load' });
      // Todos los controles visibles (fuera de diálogos cerrados).
      const handles = await page.$$('a[href], button');
      let checked = 0;
      let covered = 0;
      for (const h of handles) {
        const info = await h.evaluate((el) => {
          if (el.closest('dialog:not([open])') || el.closest('[hidden]')) return null;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || el.classList.contains('visually-hidden') || el.classList.contains('skip-link')) return null;
          el.scrollIntoView({ block: 'center', inline: 'nearest' });
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return null;
          // Enlaces partidos en varias líneas: se prueba el centro del primer fragmento.
          const f = el.getClientRects()[0] || r;
          const x = f.left + Math.min(f.width / 2, 12);
          const y = f.top + f.height / 2;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return { off: true, text: el.textContent.trim().slice(0, 40) };
          const top = document.elementFromPoint(x, y);
          const hit = top === el || el.contains(top) || (top && top.closest('a, button') === el);
          return {
            hit,
            tag: el.tagName,
            href: el.getAttribute('href'),
            text: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 50),
            by: top ? `${top.tagName.toLowerCase()}.${[...top.classList].join('.')}` : null,
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        });
        if (!info || info.off) continue;
        checked++;
        // Si algo lo tapa, se espera a que terminen las transiciones (el botón de llamar se aparta).
        if (!info.hit) {
          await page.waitForTimeout(800);
          info.hit = await h.evaluate((el) => {
            const f = el.getClientRects()[0] || el.getBoundingClientRect();
            const top = document.elementFromPoint(f.left + Math.min(f.width / 2, 12), f.top + f.height / 2);
            return top === el || el.contains(top);
          });
        }
        if (!info.hit) {
          covered++;
          fail(where, `«${info.text}» tapado por ${info.by}`);
        }
        if (info.tag === 'A' && info.href) {
          const href = info.href;
          if (href.startsWith('tel:') && href !== TEL) fail(where, `tel incorrecto ${href}`);
          if (/wa\.me|whatsapp/i.test(href)) fail(where, `enlace de WhatsApp ${href}`);
          if (href.startsWith('/') && !href.startsWith('//')) {
            const st = await status(ctx, BASE + href.split('#')[0]);
            if (st !== 200) fail(where, `${href} → ${st}`);
          }
        }
        // Zona táctil mínima en pantallas táctiles (WCAG 2.5.8: 24×24 px).
        if (d.opts.hasTouch && (info.w < 24 || info.h < 24) && info.tag === 'BUTTON') fail(where, `botón pequeño «${info.text}» ${info.w}×${info.h}`);
      }
      pass(where, `${checked} controles visibles comprobados, ${covered} tapados`);

      // Botón fijo de llamar: visible y con el número correcto.
      const call = page.locator('[data-fab]');
      if ((await call.getAttribute('href')) !== TEL) fail(where, 'el botón fijo no llama al número correcto');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(300);
      const callVisible = await call.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && cs.opacity !== '0' && r.bottom <= innerHeight + 1 && r.top >= 0;
      });
      // En escritorio se aparta a propósito sobre las listas de precios de la carta y la 404.
      const avoids = p.path === '/carta/' || p.name === '404';
      if (!callVisible && !(avoids && !d.opts.hasTouch)) fail(where, 'el botón de llamar no está visible a mitad de página');
      if (errors.length) fail(where, `errores JS: ${errors.join(' | ')}`);
      await page.close();
    }

    // Controles principales ----------------------------------------------------
    const page = await ctx.newPage();
    const where = `${d.name} controles`;
    await page.goto(BASE + '/', { waitUntil: 'load' });
    const mobileMenu = await page.locator('[data-menu-open]').isVisible();
    if (mobileMenu) {
      await page.click('[data-menu-open]');
      await page.waitForTimeout(500);
      (await page.locator('dialog[data-menu][open]').count()) ? pass(where, 'menú móvil se abre') : fail(where, 'menú móvil no se abre');
      await page.click('dialog[data-menu] a[href="/carta/"]');
      await page.waitForURL('**/carta/');
      pass(where, 'navegación desde el menú móvil a la carta');
    } else {
      await page.click('header nav a[href="/carta/"]');
      await page.waitForURL('**/carta/');
      pass(where, 'navegación desde la cabecera a la carta');
    }
    // Barra de la carta: salta a «Vinos».
    await page.click('[data-carta-link="vinos"]');
    await page.waitForTimeout(1200);
    const vTop = await page.evaluate(() => document.getElementById('vinos').getBoundingClientRect().top);
    vTop > 0 && vTop < 260 ? pass(where, `barra de la carta lleva a Vinos (${Math.round(vTop)} px)`) : fail(where, `barra de la carta: Vinos queda a ${Math.round(vTop)} px`);
    // Galería: filtro y visor.
    await page.goto(BASE + '/galeria/', { waitUntil: 'load' });
    const filter = page.locator('[data-filter]').nth(1);
    if (await filter.count()) {
      await filter.click();
      await page.waitForTimeout(400);
      pass(where, 'filtro de la galería');
    }
    await page.locator('#fotos [data-lightbox-open]:visible').first().click();
    await page.waitForTimeout(600);
    const lbOpen = await page.locator('dialog[open]').count();
    lbOpen ? pass(where, 'visor de fotos se abre') : fail(where, 'visor de fotos no se abre');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    (await page.locator('dialog[open]').count()) === 0 ? pass(where, 'visor se cierra con Esc') : fail(where, 'visor no se cierra');
    // Mapa: carga bajo demanda.
    await page.goto(BASE + '/contacto/', { waitUntil: 'load' });
    await page.route('**/www.google.com/maps/**', (r) => r.fulfill({ status: 200, body: '<html></html>', contentType: 'text/html' }));
    await page.locator('[data-map-load]').click();
    await page.waitForTimeout(500);
    (await page.locator('.map iframe').count()) ? pass(where, '«Ver mapa interactivo» carga el mapa') : fail(where, 'el mapa no carga');
    // «Configurar cookies» del pie abre el panel.
    await page.locator('[data-cookie-settings]').first().click();
    await page.waitForTimeout(400);
    (await page.locator('dialog[open]').count()) ? pass(where, '«Configurar cookies» abre el panel') : fail(where, 'el panel de cookies no se abre');
    await page.close();
    await ctx.close();
  }

  // Primera visita (sin consentimiento): banner e intro.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const skip = page.locator('[data-intro-skip]');
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    pass('Móvil primera visita', '«Saltar introducción» funciona');
  }
  await page.waitForTimeout(800);
  const reject = page.getByRole('button', { name: 'Rechazar' }).first();
  await reject.click();
  await page.waitForTimeout(400);
  const consent = await page.evaluate(() => document.documentElement.dataset.consent);
  consent ? pass('Móvil primera visita', `banner de cookies: «Rechazar» guarda la elección (${consent})`) : fail('Móvil primera visita', 'el banner no guarda la elección');
  const callShown = await page.locator('[data-fab]').evaluate((el) => getComputedStyle(el).visibility !== 'hidden');
  callShown ? pass('Móvil primera visita', 'tras elegir en el banner aparece la barra de llamar') : fail('Móvil primera visita', 'la barra de llamar no aparece tras el banner');
  await ctx.close();
} finally {
  await browser.close();
  stop();
}

const bad = results.filter((r) => !r.ok);
results.filter((r) => r.ok).forEach((r) => console.log(`✓ ${r.where}: ${r.msg}`));
bad.forEach((r) => console.log(`✗ ${r.where}: ${r.msg}`));
const file = await writeReport('interactions', results);
console.log(`Interacción: ${results.length - bad.length}/${results.length} comprobaciones correctas → ${file}`);
process.exitCode = bad.length ? 1 : 0;
