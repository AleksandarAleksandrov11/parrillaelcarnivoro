// QA 4 · Lighthouse (móvil y escritorio) en cada página.
// Para medir en condiciones lo más parecidas a producción, el build se sirve por HTTPS en el
// puerto 443 con un certificado local y Chrome resuelve www.parrillaelcarnivoro.es a esta
// máquina (--host-resolver-rules). Así el canonical, las URLs absolutas, HTTPS y la compresión
// Brotli se evalúan igual que en Vercel.
// Objetivos: Performance ≥ 95, SEO 100, Accesibilidad ≥ 95, Best Practices 100; LCP < 1,8 s, CLS < 0,05.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { OUT, PAGES, ROOT, writeReport } from './lib.mjs';

const HOST = 'www.parrillaelcarnivoro.es';
const ORIGIN = `https://${HOST}`;
const CERT_DIR = path.join(OUT, 'tls');
mkdirSync(CERT_DIR, { recursive: true });
const cert = path.join(CERT_DIR, 'cert.pem');
const key = path.join(CERT_DIR, 'key.pem');
if (!existsSync(cert)) {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '7', '-subj', `/CN=${HOST}`, '-addext', `subjectAltName=DNS:${HOST}`], { stdio: 'ignore' });
}
const server = spawn(process.execPath, [path.join(ROOT, 'scripts/serve-dist.mjs')], {
  env: { ...process.env, PORT: '443', HTTPS_CERT: cert, HTTPS_KEY: key },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('servido') && r()));

const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-proxy-server', `--host-resolver-rules=MAP ${HOST} 127.0.0.1`, '--ignore-certificate-errors'],
});
const runs = Number(process.env.LH_RUNS || 1);
const rows = [];
try {
  for (const p of PAGES.filter((x) => x.name !== '404' && (!process.env.LH_ONLY || process.env.LH_ONLY.split(',').includes(x.name)))) {
    for (const formFactor of ['mobile', 'desktop']) {
      const config = formFactor === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
      // Mediana de N ejecuciones (LH_RUNS) para reducir la variabilidad.
      const results = [];
      for (let i = 0; i < runs; i++) {
        const { lhr } = await lighthouse(`${ORIGIN}${p.path}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, config);
        results.push(lhr);
      }
      results.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
      const lhr = results[Math.floor(results.length / 2)];
      const s = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
      const a = lhr.audits;
      const row = {
        page: p.path,
        formFactor,
        performance: s('performance'),
        accessibility: s('accessibility'),
        bestPractices: s('best-practices'),
        seo: s('seo'),
        lcp: a['largest-contentful-paint'].numericValue / 1000,
        fcp: a['first-contentful-paint'].numericValue / 1000,
        cls: a['cumulative-layout-shift'].numericValue,
        tbt: a['total-blocking-time'].numericValue,
        si: a['speed-index'].numericValue / 1000,
        jsKB: Math.round((a['resource-summary']?.details?.items?.find((i) => i.resourceType === 'script')?.transferSize ?? 0) / 1024),
        totalKB: Math.round((a['total-byte-weight']?.numericValue ?? 0) / 1024),
        lcpElement: (a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? '').slice(0, 140),
        failed: Object.values(a)
          .filter((x) => x.score !== null && x.score < 0.9 && !['informative', 'notApplicable', 'manual'].includes(x.scoreDisplayMode))
          .map((x) => `${x.id} (${x.displayValue ?? x.score})`),
      };
      rows.push(row);
      console.log(
        `${p.path.padEnd(26)} ${formFactor.padEnd(8)} P${row.performance} A${row.accessibility} BP${row.bestPractices} SEO${row.seo} · LCP ${row.lcp.toFixed(2)}s · FCP ${row.fcp.toFixed(2)}s · CLS ${row.cls.toFixed(3)} · TBT ${Math.round(row.tbt)}ms · JS ${row.jsKB}KB · total ${row.totalKB}KB`,
      );
      if (row.failed.length) console.log('    ', row.failed.join(' · '));
    }
  }
} finally {
  await chrome.kill();
  server.kill();
}
const file = await writeReport('lighthouse', rows);
const bad = rows.filter((r) => r.performance < 95 || r.accessibility < 95 || r.bestPractices < 100 || r.seo < 100 || r.cls >= 0.05 || (r.formFactor === 'mobile' && r.lcp >= 1.8));
console.log(`Lighthouse: ${rows.length - bad.length}/${rows.length} ejecuciones cumplen todos los objetivos → ${file}`);
process.exitCode = bad.length ? 1 : 0;
