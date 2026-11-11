// Integración de Astro: al terminar el build elimina de dist/_astro/ las imágenes
// originales (masters JPEG/PNG) que ninguna página referencia. astro:assets las
// emite porque se importan, pero la web solo usa las versiones AVIF/WebP generadas.
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

export default function pruneUnusedAssets() {
  return {
    name: 'prune-unused-assets',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await walk(root);
        const textFiles = files.filter((f) => /\.(html|css|js|mjs|xml|json|webmanifest|txt)$/.test(f));
        let corpus = '';
        for (const f of textFiles) corpus += await readFile(f, 'utf8');
        const images = files.filter((f) => f.includes(`${path.sep}_astro${path.sep}`) && /\.(jpe?g|png|webp|avif)$/i.test(f));
        let removed = 0;
        let bytes = 0;
        for (const img of images) {
          const name = path.basename(img);
          if (!corpus.includes(name)) {
            bytes += (await stat(img)).size;
            await rm(img);
            removed++;
          }
        }
        logger.info(`Eliminadas ${removed} imágenes originales sin uso (${(bytes / 1048576).toFixed(1)} MB).`);
      },
    },
  };
}
