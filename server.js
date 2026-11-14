// Composite: small static server. Multiplayer rooms will be added to this file later.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// URL prefix -> folder on disk. Libraries and fonts are served straight from node_modules,
// so nothing is loaded from other sites.
const MOUNTS = [
  ['/vendor/pixi/', path.join(ROOT, 'node_modules/pixi.js/dist')],
  ['/vendor/pixi-filters/', path.join(ROOT, 'node_modules/pixi-filters/dist')],
  ['/fonts/', path.join(ROOT, 'node_modules/@fontsource')],
  ['/', path.join(ROOT, 'public')],
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

function resolve(urlPath) {
  for (const [prefix, dir] of MOUNTS) {
    if (!urlPath.startsWith(prefix)) continue;
    const rel = urlPath.slice(prefix.length);
    const file = path.normalize(path.join(dir, rel));
    if (!file.startsWith(dir)) return null; // no escaping the folder
    return file;
  }
  return null;
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (urlPath === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    return;
  }
  let file = resolve(urlPath);
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err2, data) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': urlPath.startsWith('/vendor/') || urlPath.startsWith('/fonts/') ? 'public, max-age=86400' : 'no-cache',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Composite running at http://localhost:${PORT}`);
});
