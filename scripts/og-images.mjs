// Genera las imágenes Open Graph / Twitter (1200×630, JPEG) de cada página a partir
// de fotos reales y el logotipo, renderizando una plantilla HTML con Playwright.
// Salida: public/og/*.jpg
//
// Uso: npm run assets:og
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/og');
const asset = async (p, type) => `data:${type};base64,${(await readFile(path.join(ROOT, p))).toString('base64')}`;

const logo = await asset('src/assets/brand/logo-el-carnivoro-blanco.png', 'image/png');
const serif = await asset('src/assets/fonts/cormorant-garamond-latin-wght-normal.woff2', 'font/woff2');
const serifItalic = await asset('src/assets/fonts/cormorant-garamond-latin-wght-italic.woff2', 'font/woff2');
const sans = await asset('src/assets/fonts/manrope-latin-wght-normal.woff2', 'font/woff2');

const cards = [
  { file: 'inicio', photo: 'hero-parrilla-carbon-poster', kicker: 'Restaurante parrilla · Collado Villalba', title: 'Pasión <em>por la carne</em>', sub: 'Carnes a la brasa de carbón en la sierra de Madrid', pos: 'center' },
  { file: 'carta', photo: 'chuleton-parrilla-carbon-el-carnivoro', kicker: 'Carta y menús', title: 'Carnes <em>a la brasa</em>', sub: 'Chuletón, T-Bone, entraña y menú de cenas y fines de semana', pos: 'center 60%' },
  { file: 'galeria', photo: 'salon-restaurante-el-carnivoro-collado-villalba', kicker: 'Galería', title: 'Fuego, mesa <em>y sierra</em>', sub: 'Fotos y opiniones de El Carnívoro, Collado Villalba', pos: 'center' },
  { file: 'contacto', photo: 'fachada-terraza-exterior-el-carnivoro', kicker: 'Contacto y reservas', title: 'Reserva <em>tu mesa</em>', sub: 'Reservas por teléfono: 91 501 39 83', pos: 'center' },
];

const html = (c, photo) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(${serif}) format('woff2');font-weight:300 700}
@font-face{font-family:S;src:url(${serifItalic}) format('woff2');font-style:italic;font-weight:300 700}
@font-face{font-family:M;src:url(${sans}) format('woff2');font-weight:200 800}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0b0a09;color:#f3ecdf;font-family:M}
.bg{position:absolute;inset:0;background:url(${photo}) ${c.pos}/cover}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,10,9,.94) 0%,rgba(11,10,9,.82) 42%,rgba(11,10,9,.25) 100%),linear-gradient(0deg,rgba(11,10,9,.6),transparent 40%)}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.logo{width:170px}
.kicker{font-size:20px;letter-spacing:.24em;text-transform:uppercase;color:#c9a86a;font-weight:600;display:flex;align-items:center;gap:16px}
.kicker:before{content:'';width:44px;height:1px;background:#c9a86a}
h1{font-family:S;font-weight:500;font-size:96px;line-height:.98;letter-spacing:-.015em;margin:18px 0 18px;max-width:760px;font-variant-numeric:lining-nums}
h1 em{font-style:italic;font-weight:400;color:#c9a86a}
.sub{font-size:26px;font-weight:300;color:rgba(243,236,223,.88);max-width:640px}
.url{font-size:18px;letter-spacing:.12em;color:rgba(243,236,223,.7)}
.bar{position:absolute;left:0;right:0;bottom:0;height:8px;background:#9b000e}
</style></head><body><div class="bg"></div><div class="shade"></div><div class="bar"></div>
<div class="wrap"><img class="logo" src="${logo}" alt=""><div><p class="kicker">${c.kicker}</p><h1>${c.title}</h1><p class="sub">${c.sub}</p></div><p class="url">parrillaelcarnivoro.es</p></div></body></html>`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const c of cards) {
  const photo = await asset(`src/assets/photos/${c.photo}.jpg`, 'image/jpeg');
  await page.setContent(html(c, photo), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, `${c.file}.jpg`), type: 'jpeg', quality: 86 });
  console.log(`✓ public/og/${c.file}.jpg`);
}
await browser.close();
