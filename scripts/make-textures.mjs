// Genera texturas sutiles y repetibles (sin costuras) para los fondos de sección.
// Se renderizan una sola vez con feTurbulence (stitchTiles) y se guardan como WebP
// muy ligeros en src/assets/textures/ (Vite les añade hash para la caché inmutable).
//
// Uso: npm run assets:textures
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/assets/textures');

const svg = (size, body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`,
  );

const textures = {
  // Grano fino de película (se usa con opacidad baja y mix-blend-mode).
  grain: {
    size: 160,
    body: `<filter id="n" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/>`,
    format: 'png',
  },
  // Papel crema con fibras.
  paper: {
    size: 420,
    body: `<filter id="p" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="4" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.86  0 0 0 -1.1 0.95"/></filter><rect width="100%" height="100%" fill="#F6F0E4"/><rect width="100%" height="100%" filter="url(#p)" opacity="0.55"/><filter id="q"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.5 -0.18"/></filter><rect width="100%" height="100%" filter="url(#q)"/>`,
    format: 'webp',
  },
  // Veta de madera oscura muy contenida (tablero de servicio).
  wood: {
    size: 512,
    body: `<filter id="w" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="4" seed="11" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.11  0 0 0 0 0.085  0 0 0 0 0.065  0.9 0 0 0 0.25"/></filter><rect width="100%" height="100%" fill="#0E0C0A"/><rect width="100%" height="100%" filter="url(#w)" opacity="0.9"/>`,
    format: 'webp',
  },
  // Pizarra: carbón con matiz frío y moteado.
  slate: {
    size: 420,
    body: `<filter id="s" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="5" seed="23" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.125  0 0 0 0.9 0"/></filter><rect width="100%" height="100%" fill="#0C0C0C"/><rect width="100%" height="100%" filter="url(#s)" opacity="0.8"/>`,
    format: 'webp',
  },
};

await mkdir(OUT, { recursive: true });
for (const [name, t] of Object.entries(textures)) {
  const file = path.join(OUT, `${name}.${t.format}`);
  let img = sharp(svg(t.size, t.body));
  img = t.format === 'png' ? img.greyscale().png({ compressionLevel: 9, palette: true, colours: 32 }) : img.webp({ quality: 72 });
  const info = await img.toFile(file);
  console.log(`✓ ${path.relative(ROOT, file)} ${(info.size / 1024).toFixed(1)} KB`);
}
