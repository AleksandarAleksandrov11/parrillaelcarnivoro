// QA 7 · Formulario de reserva por WhatsApp:
//  - martes, miércoles y fechas pasadas deshabilitados en el calendario;
//  - navegación por teclado en el calendario y validación con errores anunciados;
//  - el mensaje se genera bien codificado (acentos, emojis, saltos de línea);
//  - escritorio: pestaña nueva; iOS/Android: navegación a wa.me (abre la app).
import { chromium, devices } from 'playwright';
import { BASE, startServer, writeReport } from './lib.mjs';

const stop = await startServer();
const browser = await chromium.launch();
const results = [];
const check = (ok, msg) => results.push({ ok: !!ok, check: msg });

async function setup(ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...ctxOpts });
  await ctx.addInitScript(() => {
    localStorage.setItem('pec-consent', JSON.stringify({ v: 1, analytics: false, maps: false, ts: Date.now(), exp: Date.now() + 1e10 }));
  });
  await ctx.route(/wa\.me/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>wa</title>' }));
  const page = await ctx.newPage();
  await page.goto(BASE + '/contacto/', { waitUntil: 'load' });
  return { ctx, page };
}

async function fill(page) {
  await page.fill('#rf-name', 'María José Núñez 😊');
  await page.selectOption('#rf-people', '4');
  await page.click('[data-date-trigger]');
  const date = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.cal-day')].find((x) => !x.hasAttribute('aria-disabled'));
    return b?.dataset.date;
  });
  await page.click(`.cal-day[data-date="${date}"]`);
  // Una hora válida (la última de cenas) para no depender de la hora actual.
  await page.selectOption('#rf-time', '23:30');
  await page.check('input[name="zone"][value="terraza"]', { force: true });
  await page.fill('#rf-notes', 'Celebramos un cumpleaños 🎂\nUna persona es celíaca & alérgica al marisco.');
  return date;
}

try {
  // Calendario: días deshabilitados.
  {
    const { ctx, page } = await setup();
    await page.click('[data-date-trigger]');
    const info = await page.evaluate(() => {
      const days = [...document.querySelectorAll('.cal-day')].map((b) => ({ date: b.dataset.date, disabled: b.getAttribute('aria-disabled') === 'true' }));
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      return { days, today: fmt, focused: document.activeElement?.dataset?.date, open: document.querySelector('[data-calendar]').open };
    });
    const wd = (d) => new Date(d + 'T12:00:00').getDay();
    const tueWedEnabled = info.days.filter((d) => [2, 3].includes(wd(d.date)) && !d.disabled);
    const pastEnabled = info.days.filter((d) => d.date < info.today && !d.disabled);
    const otherDisabled = info.days.filter((d) => d.date >= info.today && ![2, 3].includes(wd(d.date)) && d.disabled);
    check(info.open, 'El calendario se abre como diálogo modal');
    check(!tueWedEnabled.length, `Martes y miércoles deshabilitados (${info.days.filter((d) => [2, 3].includes(wd(d.date))).length} días revisados)`);
    check(!pastEnabled.length, `Fechas pasadas deshabilitadas (${info.days.filter((d) => d.date < info.today).length} días anteriores a hoy)`);
    check(!otherDisabled.length, 'El resto de días futuros están disponibles');
    check(info.focused && ![2, 3].includes(wd(info.focused)), `El foco empieza en el primer día disponible (${info.focused})`);
    // Teclado.
    await page.keyboard.press('ArrowRight');
    const afterRight = await page.evaluate(() => document.activeElement?.dataset?.date);
    await page.keyboard.press('PageDown');
    const afterPgDn = await page.evaluate(() => document.activeElement?.dataset?.date);
    check(afterRight && afterRight > info.focused, `Flecha derecha mueve el foco (${afterRight})`);
    check(afterPgDn && afterPgDn.slice(0, 7) > afterRight.slice(0, 7), `AvPág pasa al mes siguiente (${afterPgDn})`);
    await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => !document.querySelector('[data-calendar]').open && document.activeElement?.hasAttribute('data-date-trigger'));
    check(closed, 'Esc cierra el calendario y devuelve el foco al campo');
    // Intentar elegir un martes con el ratón no hace nada.
    await page.click('[data-date-trigger]');
    const tue = info.days.find((d) => wd(d.date) === 2 && d.date >= info.today)?.date;
    if (tue) {
      await page.click(`.cal-day[data-date="${tue}"]`, { force: true });
      const val = await page.inputValue('input[name="date"]');
      check(val === '', `Pulsar un martes (${tue}) no lo selecciona`);
    }
    await page.keyboard.press('Escape');
    await ctx.close();
  }

  // Validación.
  {
    const { ctx, page } = await setup();
    await page.click('.rf-submit');
    const v = await page.evaluate(() => ({
      summary: document.querySelector('[data-rf-summary]')?.textContent,
      role: document.querySelector('[data-rf-summary]')?.getAttribute('role'),
      invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.getAttribute('data-control')),
      focus: document.activeElement?.id,
    }));
    check(v.invalid.join() === 'name,people,date,time', `Envío vacío marca los 4 campos obligatorios (${v.invalid.join(', ')})`);
    check(v.role === 'alert' && v.summary?.includes('Revisa'), 'Los errores se anuncian (role="alert") con un resumen');
    check(v.focus === 'rf-name', 'El foco va al primer campo con error');
    await ctx.close();
  }

  // Escritorio: pestaña nueva con el mensaje codificado.
  {
    const { ctx, page } = await setup();
    const date = await fill(page);
    const [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('.rf-submit')]);
    const url = popup.url();
    const text = decodeURIComponent(new URL(url).searchParams.get('text') ?? '');
    check(url.startsWith('https://wa.me/34915013983?text='), `Escritorio: se abre una pestaña nueva con wa.me/34915013983`);
    check(page.url().startsWith(BASE), 'Escritorio: la web sigue abierta en su pestaña');
    check(text.includes('👤 Nombre: María José Núñez 😊') && text.includes('🎂') && text.includes('celíaca & alérgica'), 'Acentos, eñes, emojis y «&» se conservan');
    check(text.split('\n').length >= 10, `Saltos de línea correctos (${text.split('\n').length} líneas)`);
    check(!/[ \n]/.test(url.split('?text=')[1]), 'La URL va completamente codificada (sin espacios ni saltos crudos)');
    check(text.includes('👥 Personas: 4') && text.includes('🕒 Hora: 23:30 (cena)') && text.includes('📍 Zona: Terraza'), 'Personas, hora con franja y zona en el mensaje');
    const [y, m, d] = date.split('-').map(Number);
    check(text.includes(`📅 Fecha: `) && text.includes(` ${d} de `) && text.includes(` de ${y}`), 'Fecha en formato largo en español');
    const status = await page.locator('[data-rf-done]').isVisible();
    check(status, 'Se muestra la confirmación con enlace alternativo');
    results.push({ ok: true, check: 'Mensaje generado (muestra)', sample: text });
    await ctx.close();
  }

  // iPhone y Android: misma pestaña → abre la app.
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    const { ctx, page } = await setup({ ...devices[dev] });
    await fill(page);
    const nav = page.waitForURL(/wa\.me/);
    await page.click('.rf-submit');
    await nav;
    check(page.url().startsWith('https://wa.me/34915013983?text='), `${dev}: navega a wa.me en la misma pestaña (abre la app de WhatsApp)`);
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}
const file = await writeReport('form', results);
results.forEach((r) => console.log(`${r.ok ? '✓' : '✗'} ${r.check}${r.sample ? '\n' + r.sample.replace(/^/gm, '    ') : ''}`));
const bad = results.filter((r) => !r.ok).length;
console.log(`Formulario: ${results.length - bad}/${results.length} comprobaciones correctas → ${file}`);
process.exitCode = bad ? 1 : 0;
