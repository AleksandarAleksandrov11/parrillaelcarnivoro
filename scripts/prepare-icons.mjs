// Genera el logotipo optimizado y los iconos (favicon, apple-touch-icon, manifest)
// a partir del logotipo y del icono originales de la web anterior.
//
// Uso: npm run assets:icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'source-assets/wp-uploads');
const BRAND = path.join(ROOT, 'src/assets/brand');
const PUB = path.join(ROOT, 'public');
const INK = { r: 11, g: 10, b: 9, alpha: 1 }; // #0B0A09

await mkdir(BRAND, { recursive: true });

// 1) Logotipo blanco recortado (sin márgenes transparentes). astro:assets genera
//    después las versiones AVIF/WebP a 1x/2x.
const logo = await sharp(path.join(SRC, '2023/02/Logotipo-elcarnivoro-blanco.png')).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(path.join(BRAND, 'logo-el-carnivoro-blanco.png'));
console.log(`✓ logo ${logo.width}×${logo.height}`);

// 2) Icono (chuletón) recortado.
const iconBuf = await sharp(path.join(SRC, '2023/02/icono-el-carnivoro.png')).trim({ threshold: 1 }).toBuffer();
await sharp(iconBuf).png({ compressionLevel: 9 }).toFile(path.join(BRAND, 'icono-el-carnivoro.png'));

/** Coloca el icono centrado en un lienzo cuadrado. */
async function squareIcon(size, { padding = 0.12, background = null } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const resized = await sharp(iconBuf).resize(inner, inner, { fit: 'inside' }).toBuffer();
  const meta = await sharp(resized).metadata();
  return sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left: Math.round((size - meta.width) / 2), top: Math.round((size - meta.height) / 2) }])
    .png({ compressionLevel: 9 });
}

await (await squareIcon(32, { padding: 0.02 })).toFile(path.join(PUB, 'favicon-32x32.png'));
await (await squareIcon(180, { padding: 0.14, background: INK })).toFile(path.join(PUB, 'apple-touch-icon.png'));
await (await squareIcon(192, { padding: 0.1, background: INK })).toFile(path.join(PUB, 'icons/icon-192.png'));
await (await squareIcon(512, { padding: 0.1, background: INK })).toFile(path.join(PUB, 'icons/icon-512.png'));
// Maskable: zona segura del 80 % → más margen.
await (await squareIcon(512, { padding: 0.22, background: INK })).toFile(path.join(PUB, 'icons/icon-maskable-512.png'));

// favicon.ico con 16, 32 y 48 px (contenedor ICO con PNG embebidos).
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(async (s) => (await squareIcon(s, { padding: 0.02 })).toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
const dir = Buffer.alloc(16 * sizes.length);
let offset = 6 + dir.length;
sizes.forEach((s, i) => {
  const b = i * 16;
  dir.writeUInt8(s, b);
  dir.writeUInt8(s, b + 1);
  dir.writeUInt8(0, b + 2);
  dir.writeUInt8(0, b + 3);
  dir.writeUInt16LE(1, b + 4);
  dir.writeUInt16LE(32, b + 6);
  dir.writeUInt32LE(pngs[i].length, b + 8);
  dir.writeUInt32LE(offset, b + 12);
  offset += pngs[i].length;
});
await writeFile(path.join(PUB, 'favicon.ico'), Buffer.concat([header, dir, ...pngs]));
console.log('✓ favicon.ico, favicon-32x32.png, apple-touch-icon.png, icons/*');

// Logotipo para datos estructurados y Open Graph (fondo carbón, 600×600 px).
{
  const size = 600;
  const inner = await sharp(path.join(BRAND, 'logo-el-carnivoro-blanco.png')).resize(480, 480, { fit: 'inside' }).toBuffer();
  const m = await sharp(inner).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: inner, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUB, 'logo-el-carnivoro.png'));
  console.log('✓ public/logo-el-carnivoro.png');
}
