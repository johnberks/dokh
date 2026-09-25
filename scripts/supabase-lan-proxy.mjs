import { createServer, request as httpRequest } from 'node:http';

const UPSTREAM_HOST = '127.0.0.1';
const UPSTREAM_PORT = 54321;
const LISTEN_PORT = 8082;

/** Local-development HTTP bridge for a physical device when Docker's published port is unreachable. */
export function createSupabaseLanProxy(upstreamPort = UPSTREAM_PORT) {
  return createServer((incoming, outgoing) => {
    const upstream = httpRequest(
      {
        hostname: UPSTREAM_HOST,
        port: upstreamPort,
        method: incoming.method,
        path: incoming.url,
        headers: { ...incoming.headers, host: `${UPSTREAM_HOST}:${upstreamPort}` },
      },
      (response) => {
        outgoing.writeHead(response.statusCode ?? 502, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on('error', () => {
      if (outgoing.headersSent) outgoing.destroy();
      else {
        outgoing.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
        outgoing.end('Supabase local indisponível.');
      }
    });
    incoming.pipe(upstream);
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.env.EXPO_PUBLIC_APP_ENV !== 'local') {
    throw new Error('O proxy é permitido apenas com EXPO_PUBLIC_APP_ENV=local.');
  }
  const appUrl = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
  if (
    appUrl.protocol !== 'http:' ||
    !/^192\.168\.\d+\.\d+$/.test(appUrl.hostname) ||
    appUrl.port !== String(LISTEN_PORT) ||
    appUrl.pathname !== '/'
  ) {
    throw new Error('Configure EXPO_PUBLIC_SUPABASE_URL=http://<IP-LAN-DO-MAC>:8082.');
  }
  const health = await fetch(`http://${UPSTREAM_HOST}:${UPSTREAM_PORT}/auth/v1/health`);
  if (!health.ok) throw new Error('Supabase local não está saudável na porta 54321.');
  const server = createSupabaseLanProxy();
  server.on('error', () => {
    console.error('Proxy indisponível: confira o IP do Mac e se a porta 8082 está livre.');
    process.exitCode = 1;
  });
  server.listen(LISTEN_PORT, appUrl.hostname, () => {
    console.log(`Supabase local disponível ao iPhone em ${appUrl.origin}`);
  });
}
