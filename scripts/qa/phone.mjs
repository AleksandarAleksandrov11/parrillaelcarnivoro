// QA 2 · Teléfono: el móvil antiguo de la web anterior no puede aparecer en ningún archivo
// del proyecto ni del build. Se buscan todas sus variantes de escritura y cualquier aparición
// de su prefijo como número. Los patrones se componen por partes para que este script no
// contenga el número y un `grep` literal del repositorio salga limpio.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, writeReport } from './lib.mjs';

const P = ['69', '1'].join(''); // prefijo del móvil eliminado
const R = ['47', '41', '27']; // resto del número
const SKIP_DIRS = new Set(['node_modules', '.git', '.astro', 'qa-output']);
const TEXT = /\.(astro|ts|mjs|js|json|css|md|html|xml|txt|webmanifest|svg|yml|yaml|sh|example)$/i;
const exact = [
  new RegExp(`${P}\\s?${R.join('\\s?')}`),
  new RegExp(`${P}\\s?474\\s?127`),
  new RegExp(R.join('\\s?')),
  new RegExp(`\\+34\\s?${P}`),
];
// Cualquier aparición del prefijo, también dentro de otras cifras o de base64.
const any = new RegExp(P);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = (await walk(ROOT)).filter((f) => TEXT.test(f) || f.endsWith('.gitignore'));
const hits = [];
const anyHits = [];
for (const f of files) {
  const rel = path.relative(ROOT, f);
  const txt = await readFile(f, 'utf8');
  txt.split('\n').forEach((line, i) => {
    if (exact.some((r) => r.test(line))) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 160)}`);
    else if (any.test(line)) anyHits.push(`${rel}:${i + 1}`);
  });
}
const report = { filesScanned: files.length, phoneHits: hits, prefixHits: anyHits };
const file = await writeReport('phone', report);
console.log(`Teléfono: ${files.length} archivos de texto revisados · ${hits.length} apariciones del móvil antiguo · ${anyHits.length} apariciones del prefijo → ${file}`);
[...hits, ...anyHits].forEach((h) => console.log('  ✗', h));
process.exitCode = hits.length || anyHits.length ? 1 : 0;
