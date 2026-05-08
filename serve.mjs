import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

// ── SSE client registry ──────────────────────────────────────────────────────
const clients = new Map();
let _clientId = 0;

// Latest pending session stored so late-joining admins get it immediately
let pendingSession = null;

function relay(msg, toRole, toSessionId) {
  // Track pending session state
  if (toRole === 'admin' && msg.type === 'SESSION_DATA') {
    pendingSession = { ...msg, to: toRole, sessionId: toSessionId };
  } else if (msg.type === 'AGENT_JOINED' || msg.type === 'AGENT_LEFT') {
    pendingSession = null;
  }

  const payload = `data: ${JSON.stringify(msg)}\n\n`;
  for (const [, c] of clients) {
    if (c.role !== toRole) continue;
    if (toSessionId && c.sessionId !== toSessionId) continue;
    try { c.res.write(payload); } catch(_) {}
  }
}

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url      = new URL(req.url, `http://localhost`);
  const pathname = url.pathname;

  // SSE endpoint: GET /events?role=admin|customer&sessionId=xxx
  if (pathname === '/events' && req.method === 'GET') {
    const role      = url.searchParams.get('role') || 'customer';
    const sessionId = url.searchParams.get('sessionId') || '';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(': connected\n\n');

    const id = ++_clientId;
    clients.set(id, { id, role, sessionId, res });

    // Send pending session to newly connected admin
    if (role === 'admin' && pendingSession) {
      try { res.write(`data: ${JSON.stringify(pendingSession)}\n\n`); } catch(_) {}
    }

    // Heartbeat every 25 s to survive proxy timeouts
    const hb = setInterval(() => {
      try { res.write(': ping\n\n'); } catch(_) { clearInterval(hb); }
    }, 25000);

    req.on('close', () => { clients.delete(id); clearInterval(hb); });
    return;
  }

  // Relay endpoint: POST /relay  body: { to, sessionId?, type, ...rest }
  if (pathname === '/relay' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { to, sessionId, ...msg } = JSON.parse(body);
        relay(msg, to || 'admin', sessionId || '');
        res.end('{"ok":true}');
      } catch(_) { res.end('{"ok":false}'); }
    });
    return;
  }

  // Static file serving
  let p = pathname === '/' ? '/index.html' : pathname;
  const filePath    = join(__dirname, p);
  const contentType = MIME[extname(filePath)] || 'application/octet-stream';
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

// Listen on all interfaces so other devices on the network can reach the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
