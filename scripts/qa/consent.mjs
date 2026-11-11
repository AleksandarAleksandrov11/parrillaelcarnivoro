// QA 6 · Cookies, GA4 y Google Maps:
//  - sin consentimiento: ninguna cookie no esencial ni peticiones a Google Analytics/Maps;
//  - al aceptar: se carga gtag.js y Consent Mode pasa a «granted»;
//  - al rechazar/revocar: consentimiento «denied», envío desactivado, cookies _ga borradas;
//  - Maps: el iframe solo aparece tras aceptar o pulsar «Ver mapa interactivo» y se retira al revocar.
// Para probar GA4 sin un ID real se inyecta un ID de prueba y se intercepta googletagmanager.
import { chromium } from 'playwright';
import { BASE, PAGES, startServer, writeReport } from './lib.mjs';

const GOOGLE = /google-analytics\.com|googletagmanager\.com|google\.com\/maps|maps\.google|gstatic\.com|doubleclick/;
const TEST_ID = 'G-QATEST1234';
const stop = await startServer();
const browser = await chromium.launch();
const results = [];
const fail = (m) => results.push({ ok: false, check: m });
const pass = (m) => results.push({ ok: true, check: m });

async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const requests = [];
  ctx.on('request', (r) => requests.push(r.url()));
  await ctx.route(GOOGLE, (route) => {
    const u = route.request().url();
    if (u.includes('googletagmanager.com/gtag/js')) return route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__gtagLoaded = true;' });
    if (u.includes('google.com/maps')) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>mapa</title>' });
    return route.fulfill({ status: 204 });
  });
  // Simula un ID real de GA4 (la web usa el atributo data-ga del <html>).
  await ctx.addInitScript((id) => {
    document.addEventListener('readystatechange', () => document.documentElement.setAttribute('data-ga', id), { once: true });
  }, TEST_ID);
  return { ctx, requests };
}

try {
  // 1) Sin consentimiento, en todas las páginas.
  {
    const { ctx, requests } = await newCtx();
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(BASE + p.path, { waitUntil: 'load' });
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(800);
    }
    const google = requests.filter((u) => GOOGLE.test(u));
    const cookies = await ctx.cookies();
    google.length ? fail(`Sin consentimiento hubo peticiones a Google: ${google.join(', ')}`) : pass('Sin consentimiento: 0 peticiones a Google Analytics, Tag Manager o Maps en las 8 páginas');
    cookies.length ? fail(`Sin consentimiento hay cookies: ${cookies.map((c) => c.name).join(', ')}`) : pass('Sin consentimiento: 0 cookies');
    const banner = await page.locator('[data-cc-banner]').isVisible();
    banner ? pass('El banner de cookies se muestra mientras no hay elección') : fail('El banner no se muestra');
    const btns = await page.locator('[data-cc-banner] .cc-btn').evaluateAll((els) => els.map((e) => { const s = getComputedStyle(e); return [e.textContent.trim(), s.backgroundColor, s.color, s.borderColor, s.fontSize, s.fontWeight, e.getBoundingClientRect().width.toFixed(0)].join('|'); }));
    const styles = new Set(btns.map((b) => b.split('|').slice(1).join('|')));
    styles.size === 1 ? pass(`Aceptar/Rechazar/Configurar con el mismo estilo (${btns.map((b) => b.split('|')[0]).join(', ')})`) : fail(`Botones del banner con estilos distintos: ${btns.join(' / ')}`);
    await ctx.close();
  }

  // 2) Aceptar → GA4 se carga; Maps se carga; luego revocar desde el pie.
  {
    const { ctx, requests } = await newCtx();
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.locator('[data-cc-banner] [data-cc="accept"]').click();
    await page.waitForTimeout(500);
    const gtagReq = requests.find((u) => u.includes(`googletagmanager.com/gtag/js?id=${TEST_ID}`));
    gtagReq ? pass('Al aceptar se descarga gtag.js con el ID configurado') : fail('Al aceptar no se descargó gtag.js');
    const consent = await page.evaluate(() => window.dataLayer.filter((e) => e[0] === 'consent').map((e) => [e[1], e[2].analytics_storage]));
    JSON.stringify(consent).includes('["update","granted"]') ? pass(`Consent Mode: ${JSON.stringify(consent)}`) : fail(`Consent Mode sin update granted: ${JSON.stringify(consent)}`);
    const defaults = await page.evaluate(() => window.dataLayer.find((e) => e[0] === 'consent' && e[1] === 'default')?.[2]);
    ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'].every((k) => defaults?.[k] === 'denied')
      ? pass('Consent Mode v2: los 4 parámetros empiezan en «denied»')
      : fail(`Defaults: ${JSON.stringify(defaults)}`);
    await page.locator('#visitanos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const iframe = await page.locator('[data-map] iframe').count();
    iframe ? pass('Con «Mapas» aceptado, el iframe de Google Maps se carga al acercarse') : fail('No se cargó el mapa tras aceptar');
    // Simula una cookie _ga y revoca.
    await ctx.addCookies([{ name: '_ga', value: 'GA1.1.1.1', url: BASE }, { name: '_ga_QATEST1234', value: 'GS1', url: BASE }]);
    await page.locator('[data-cookie-settings]').click();
    await page.locator('#cc-analytics').uncheck();
    await page.locator('#cc-maps').uncheck();
    await page.locator('[data-cc-dialog] [data-cc="save"]').click();
    await page.waitForTimeout(400);
    const after = await page.evaluate((id) => ({ disabled: window[`ga-disable-${id}`], last: window.dataLayer.filter((e) => e[0] === 'consent').pop()?.[2] }), TEST_ID);
    const cookiesLeft = (await ctx.cookies()).filter((c) => c.name.startsWith('_ga'));
    after.disabled && after.last?.analytics_storage === 'denied' ? pass('Al revocar: consent «denied» y ga-disable activo') : fail(`Revocación incompleta: ${JSON.stringify(after)}`);
    cookiesLeft.length ? fail(`Quedan cookies: ${cookiesLeft.map((c) => c.name)}`) : pass('Al revocar se borran las cookies _ga y _ga_*');
    (await page.locator('[data-map] iframe').count()) ? fail('El mapa sigue cargado tras revocar') : pass('Al revocar «Mapas», el iframe se retira');
    // Tras revocar, una navegación no vuelve a pedir gtag.
    const before = requests.length;
    await page.goto(BASE + '/carta/', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const newGoogle = requests.slice(before).filter((u) => GOOGLE.test(u));
    newGoogle.length ? fail(`Tras revocar hubo peticiones: ${newGoogle}`) : pass('Tras revocar no se hace ninguna petición a Google en la siguiente página');
    await ctx.close();
  }

  // 2b) Revocar en otra pestaña detiene la analítica en la primera (evento storage).
  {
    const { ctx } = await newCtx();
    const a = await ctx.newPage();
    await a.goto(BASE + '/carta/', { waitUntil: 'load' });
    await a.locator('[data-cc-banner] [data-cc="accept"]').click();
    const b = await ctx.newPage();
    await b.goto(BASE + '/politica-de-cookies/', { waitUntil: 'load' });
    await b.locator('footer [data-cookie-settings]').click();
    await b.locator('[data-cc-dialog] [data-cc="reject"]').click();
    await a.waitForTimeout(400);
    const st = await a.evaluate((id) => ({ disabled: window[`ga-disable-${id}`], last: window.dataLayer.filter((e) => e[0] === 'consent').pop()?.[2]?.analytics_storage }), TEST_ID);
    st.disabled && st.last === 'denied' ? pass('Revocar en otra pestaña desactiva GA4 también en la pestaña abierta') : fail(`Sincronización entre pestañas: ${JSON.stringify(st)}`);
    await ctx.close();
  }

  // 3) Rechazar → nada; el mapa solo se carga si se pulsa «Ver mapa interactivo».
  {
    const { ctx, requests } = await newCtx();
    const page = await ctx.newPage();
    await page.goto(BASE + '/contacto/', { waitUntil: 'load' });
    await page.locator('[data-cc-banner] [data-cc="reject"]').click();
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(800);
    requests.some((u) => GOOGLE.test(u)) ? fail('Tras rechazar hubo peticiones a Google') : pass('Tras rechazar: 0 peticiones a Google');
    await page.locator('[data-map-load]').first().click();
    await page.waitForTimeout(500);
    requests.some((u) => u.includes('google.com/maps/embed')) ? pass('El mapa se carga al pulsar «Ver mapa interactivo» (acción explícita)') : fail('El botón no cargó el mapa');
    requests.some((u) => u.includes('googletagmanager')) ? fail('Cargar el mapa activó GA4') : pass('Cargar el mapa no activa la analítica');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pec-consent')));
    stored?.analytics === false && stored?.maps === true ? pass('La elección queda guardada (analítica no, mapas sí)') : fail(`Consentimiento guardado: ${JSON.stringify(stored)}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}
const file = await writeReport('consent', results);
results.forEach((r) => console.log(`${r.ok ? '✓' : '✗'} ${r.check}`));
const bad = results.filter((r) => !r.ok).length;
console.log(`Cookies y GA4: ${results.length - bad}/${results.length} comprobaciones correctas → ${file}`);
process.exitCode = bad ? 1 : 0;
