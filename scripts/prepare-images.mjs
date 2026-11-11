// Prepara las fotos de la web a partir de los originales de source-assets/.
// - Aplica la orientación EXIF y elimina los metadatos (GPS, cámara, etc.).
// - Recorta con cuidado y corrige de forma sutil exposición y color en las fotos de móvil.
// - Guarda masters JPEG de alta calidad con nombres descriptivos en src/assets/photos/
//   (astro:assets genera después las versiones AVIF + WebP responsive).
// - Genera los placeholders desenfocados (LQIP) en src/data/photo-meta.json.
//
// Uso: npm run assets:images
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'source-assets/wp-uploads');
const OUT = path.join(ROOT, 'src/assets/photos');
const META = path.join(ROOT, 'src/data/photo-meta.json');
const MAX = 2400;

/**
 * enhance:
 *  - 'pro'   sesión profesional (2023): solo un enfoque muy suave.
 *  - 'phone' fotos de WhatsApp: niveles, algo de saturación y enfoque.
 * crop: fracciones { left, top, width, height } sobre la imagen ya orientada.
 */
const PHOTOS = [
  // Local
  { out: 'salon-restaurante-el-carnivoro-collado-villalba', src: '2023/03/restaurante-el-carnivoro-fondo-home.jpg', enhance: 'pro' },
  { out: 'fachada-terraza-exterior-el-carnivoro', src: '2023/03/fachada-el-carnivoro.jpg', enhance: 'pro' },
  { out: 'fachada-calle-restaurante-el-carnivoro', src: '2024/01/fondo-resenas.png', enhance: 'phone', crop: { left: 0.16, top: 0.04, width: 0.68, height: 0.96 } },
  { out: 'barra-restaurante-el-carnivoro', src: '2023/03/barra-l-carnivoro.jpg', enhance: 'pro' },
  { out: 'vinoteca-restaurante-el-carnivoro', src: '2023/03/vinoteca-el-carnivoro.jpg', enhance: 'pro' },
  { out: 'pizarra-cortes-carne-el-carnivoro', src: '2023/03/restaurante-carnivoro-parrilla-1.jpg', enhance: 'pro' },
  { out: 'carta-el-carnivoro-mesa', src: '2023/03/carta-el-carnivoro.jpg', enhance: 'pro' },
  // Terraza
  { out: 'terraza-cubierta-el-carnivoro', src: '2023/06/IMG-20230531-WA0024.jpg', enhance: 'phone' },
  { out: 'terraza-cubierta-mesas-el-carnivoro', src: '2023/06/IMG-20230531-WA0026.jpg', enhance: 'phone' },
  { out: 'terraza-mural-sierra-el-carnivoro', src: '2023/06/IMG-20230531-WA0025.jpg', enhance: 'phone', crop: { left: 0, top: 0, width: 0.62, height: 1 } },
  // Parrilla
  { out: 'parrilla-carbon-carnes-el-carnivoro', src: '2024/01/IMG-20231218-WA0039.jpg', enhance: 'phone' },
  // Platos
  { out: 'chuleton-parrilla-carbon-el-carnivoro', src: '2023/03/chuleton.jpg', enhance: 'pro' },
  { out: 'chuleton-tomahawk-el-carnivoro', src: '2023/03/cguleton-tomahawk.jpg', enhance: 'pro' },
  { out: 'entrana-parrilla-el-carnivoro', src: '2023/03/entrana.jpg', enhance: 'pro' },
  { out: 'carnes-brasa-pizarra-el-carnivoro', src: '2023/03/entrana-el-carnivoro.jpg', enhance: 'pro' },
  { out: 't-bone-brasa-el-carnivoro', src: '2024/01/IMG-20231219-WA0014.jpg', enhance: 'phone', crop: { left: 0, top: 0.12, width: 1, height: 0.88 } },
  { out: 'paletilla-cordero-asada-el-carnivoro', src: '2024/01/IMG-20231218-WA0019.jpg', enhance: 'phone' },
  { out: 'contramuslo-pollo-parrilla-el-carnivoro', src: '2024/01/IMG-20231218-WA0028.jpg', enhance: 'phone' },
  { out: 'hamburguesa-el-carnivoro', src: '2024/01/IMG-20231219-WA0016.jpg', enhance: 'phone' },
  { out: 'morcilla-brasa-huevos-el-carnivoro', src: '2024/01/IMG-20231219-WA0015.jpg', enhance: 'phone' },
  { out: 'pescado-brasa-ensalada-el-carnivoro', src: '2024/01/IMG-20231219-WA0010.jpg', enhance: 'phone' },
  { out: 'patatas-gajo-salsas-el-carnivoro', src: '2024/01/IMG-20231219-WA0011.jpg', enhance: 'phone' },
  { out: 'crepe-tarta-queso-el-carnivoro', src: '2024/01/IMG-20231219-WA0012.jpg', enhance: 'phone' },
  { out: 'bacalao-ajoarriero-el-carnivoro', src: '2023/03/bacalao-el-carnivoro.jpg', enhance: 'pro' },
  { out: 'gambon-brasa-el-carnivoro', src: '2024/01/gambon.jpg', enhance: 'phone', crop: { left: 0.06, top: 0.07, width: 0.94, height: 0.93 } },
  { out: 'provolone-cazuela-el-carnivoro', src: '2024/01/provolone.jpg', enhance: 'phone' },
  // Recorte de 1 px: el ancho original (de 1.6 mil px) coincidía con el prefijo del antiguo móvil y hacía saltar la QA.
  { out: 'parrillada-verduras-el-carnivoro', src: '2024/01/parrillada-verduras.jpg', enhance: 'phone', crop: { left: 0, top: 0, width: 0.9994, height: 1 } },
  { out: 'ensalada-queso-cabra-el-carnivoro', src: '2023/03/ensalada-queso-cabra.jpg', enhance: 'pro' },
  { out: 'chuletillas-cordero-el-carnivoro', src: '2023/03/chuletillas-cordero.jpg', enhance: 'pro' },
  { out: 'arroz-con-leche-el-carnivoro', src: '2023/03/arroz-con-leche-el-carnivoro.jpg', enhance: 'pro' },
  { out: 'postre-casero-el-carnivoro', src: '2023/03/tiramisu-el-carnivoro.jpg', enhance: 'pro' },
];

// Pósters de vídeo generados por scripts/prepare-video.sh: solo LQIP.
const POSTERS = [
  'hero-parrilla-carbon-poster',
  'hero-parrilla-carbon-poster-vertical',
  'brasas-parrilla-el-carnivoro-poster',
];

async function lqip(input) {
  const buf = await sharp(input)
    .resize(24, 24, { fit: 'inside' })
    .modulate({ saturation: 1.1 })
    .blur(1.2)
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function processPhoto(p) {
  let img = sharp(path.join(SRC, p.src)).rotate();
  const { width, height } = await img.metadata().then(async (m) => {
    // metadata() no refleja la rotación EXIF; calcula las dimensiones orientadas.
    const swap = m.orientation && m.orientation >= 5;
    return { width: swap ? m.height : m.width, height: swap ? m.width : m.height };
  });
  // Rasteriza la orientación antes de recortar.
  img = sharp(await img.toBuffer());
  if (p.crop) {
    img = img.extract({
      left: Math.round(p.crop.left * width),
      top: Math.round(p.crop.top * height),
      width: Math.round(p.crop.width * width),
      height: Math.round(p.crop.height * height),
    });
  }
  if (p.enhance === 'phone') {
    img = img
      .normalise({ lower: 0.5, upper: 99.6 })
      .modulate({ brightness: 1.02, saturation: 1.06 })
      .sharpen({ sigma: 0.8, m1: 0.6, m2: 2.2 });
  } else {
    img = img.sharpen({ sigma: 0.5, m1: 0.4, m2: 1.5 });
  }
  const out = path.join(OUT, `${p.out}.jpg`);
  const info = await img
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .toColourspace('srgb')
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(out);
  return { name: p.out, width: info.width, height: info.height, lqip: await lqip(out) };
}

await mkdir(OUT, { recursive: true });
const meta = {};
for (const p of PHOTOS) {
  const r = await processPhoto(p);
  meta[r.name] = { width: r.width, height: r.height, lqip: r.lqip };
  console.log(`✓ ${r.name} ${r.width}×${r.height}`);
}
for (const name of POSTERS) {
  const file = path.join(OUT, `${name}.jpg`);
  const m = await sharp(file).metadata();
  meta[name] = { width: m.width, height: m.height, lqip: await lqip(file) };
  console.log(`✓ ${name} (póster)`);
}
await writeFile(META, JSON.stringify(meta, null, 2) + '\n');
console.log(`\nMetadatos: ${path.relative(ROOT, META)}`);
