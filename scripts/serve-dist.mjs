// Servidor local de dist/ que emula el comportamiento de Vercel para la QA:
// aplica las redirecciones y cabeceras de vercel.json (vía @vercel/routing-utils),
// sirve index.html por directorio, 404.html con estado 404 y comprime con Brotli/gzip.
//
// Uso: npm run preview  (puerto 4321; PORT=xxxx para cambiarlo; HOST_HEADER para simular el dominio)
import http from 'node:http';
import http2 from 'node:http2';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getTransformedRoutes } = require('@vercel/routing-utils');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 4321);
const config = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const { routes, error } = getTransformedRoutes(config);
if (error) throw new Error(error.message);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
const COMPRESSIBLE = /\.(html|css|js|json|xml|txt|svg|webmanifest)$/;

function matchHas(conds = [], req, url) {
  return conds.every((c) => {
    if (c.type === 'host') return String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0] === c.value;
    if (c.type === 'query') return url.searchParams.has(c.key) && (c.value === undefined || url.searchParams.get(c.key) === c.value);
    if (c.type === 'header') return req.headers[c.key.toLowerCase()] !== undefined;
    return false;
  });
}

function resolveFile(pathname) {
  const clean = decodeURIComponent(pathname);
  const p = path.join(DIST, clean);
  if (!p.startsWith(DIST)) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  const idx = path.join(p, 'index.html');
  if (existsSync(idx)) return idx;
  return null;
}

// Con HTTPS_CERT y HTTPS_KEY sirve por HTTPS (la QA de Lighthouse lo usa para emular producción).
const tls = process.env.HTTPS_CERT && process.env.HTTPS_KEY ? { cert: readFileSync(process.env.HTTPS_CERT), key: readFileSync(process.env.HTTPS_KEY) } : null;
const handler = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const headers = {};
  // Fase de rutas: redirecciones (se detienen) y cabeceras (continue: true).
  for (const r of routes) {
    const re = new RegExp(r.src);
    const m = url.pathname.match(re);
    if (!m) continue;
    if (r.has && !matchHas(r.has, req, url)) continue;
    if (r.missing && matchHas(r.missing, req, url) && r.missing.length) continue;
    if (r.status && r.headers?.Location) {
      const loc = r.headers.Location.replace(/\$(\d+)/g, (_, i) => m[Number(i)] ?? '');
      res.writeHead(r.status, { Location: loc });
      return res.end();
    }
    if (r.headers) Object.assign(headers, r.headers);
  }

  let file = resolveFile(url.pathname);
  let status = 200;
  if (!file) {
    file = path.join(DIST, '404.html');
    status = 404;
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end('Not found');
    }
  }
  const ext = path.extname(file);
  headers['Content-Type'] ||= TYPES[ext] || 'application/octet-stream';
  if (!headers['Cache-Control']) headers['Cache-Control'] = ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=3600';

  const size = statSync(file).size;
  const accept = req.headers['accept-encoding'] || '';
  // Rangos para vídeo (Safari los exige).
  if (/\.(mp4|webm)$/.test(file) && req.headers.range) {
    const [s, e] = req.headers.range.replace('bytes=', '').split('-');
    const start = Number(s);
    const end = e ? Number(e) : size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  if (COMPRESSIBLE.test(file) && /\bbr\b/.test(accept)) {
    res.writeHead(status, { ...headers, 'Content-Encoding': 'br', Vary: 'Accept-Encoding' });
    return createReadStream(file).pipe(zlib.createBrotliCompress()).pipe(res);
  }
  if (COMPRESSIBLE.test(file) && /\bgzip\b/.test(accept)) {
    res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
    return createReadStream(file).pipe(zlib.createGzip()).pipe(res);
  }
  res.writeHead(status, { ...headers, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
};

// Con TLS se usa HTTP/2 (con respaldo HTTP/1.1), como en Vercel.
const server = tls ? http2.createSecureServer({ ...tls, allowHTTP1: true }, handler) : http.createServer(handler);
server.listen(PORT, () => console.log(`dist/ servido en ${tls ? 'https' : 'http'}://localhost:${PORT} (emulando vercel.json)`));
