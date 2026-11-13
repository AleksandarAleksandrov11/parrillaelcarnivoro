// Ejecuta toda la QA (sección 13) contra el build actual (dist/). Ejecuta antes `npm run build`.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const steps = ['phone', 'redirects', 'anchors', 'links', 'validate', 'consent', 'a11y', 'interactions', 'responsive', 'lighthouse'];
const only = process.argv.slice(2);
const summary = [];
for (const s of only.length ? only : steps) {
  console.log(`\n━━ ${s} ━━`);
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/qa', `${s}.mjs`)], { stdio: 'inherit' });
  summary.push(`${r.status === 0 ? '✓' : '✗'} ${s}`);
}
console.log('\n' + summary.join('\n'));
process.exitCode = summary.some((s) => s.startsWith('✗')) ? 1 : 0;
