import type { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

interface RouteConfig { prefix: string; target: string; }

const ALLOW_HEADERS = 'Authorization,Content-Type,X-Tenant-Slug,X-Tenant-Id,X-Request-Id,Accept,Accept-Language';
const ALLOW_METHODS = 'GET,POST,PATCH,PUT,DELETE,OPTIONS';

export function setupProxies(app: Application) {
  // ─── CORS layer (runs BEFORE proxies, applies to every request) ───
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = (req.headers.origin as string) || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', ALLOW_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
    res.setHeader('Access-Control-Max-Age', '600');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Render free tier blocks internal hostport networking — services must be reached
  // via public HTTPS URLs. Use the env var when it's a valid HTTPS, otherwise fall
  // back to the canonical Render service URL when running in production.
  function resolveTarget(envValue: string | undefined, fallbackHttps: string, localPort: number): string {
    const isProd = !!process.env.RENDER || process.env.NODE_ENV === 'production';
    if (envValue && envValue.startsWith('https://')) return envValue;
    if (isProd) return fallbackHttps;
    return envValue || `http://localhost:${localPort}`;
  }

  const routes: RouteConfig[] = [
    { prefix: '/auth',    target: resolveTarget(process.env.SERVICE_AUTH_URL,    'https://concierge-auth.onrender.com',    3001) },
    { prefix: '/tenants', target: resolveTarget(process.env.SERVICE_TENANT_URL,  'https://concierge-tenant.onrender.com',  3007) },
    { prefix: '/content', target: resolveTarget(process.env.SERVICE_CONTENT_URL, 'https://concierge-content.onrender.com', 3002) },
    { prefix: '/orders',  target: resolveTarget(process.env.SERVICE_ORDERS_URL,  'https://concierge-orders.onrender.com',  3003) },
    { prefix: '/surveys', target: resolveTarget(process.env.SERVICE_SURVEY_URL,  'https://concierge-survey.onrender.com',  3004) },
  ];

  // eslint-disable-next-line no-console
  console.log('[proxy] resolved upstream targets:\n' + routes.map(r => `  ${r.prefix.padEnd(10)} → ${r.target}`).join('\n'));

  for (const route of routes) {
    app.use(
      route.prefix,
      createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        ws: true,
        // Allow up to 90s for the upstream — covers cold-start on Render free tier.
        proxyTimeout: 90_000,
        timeout: 90_000,
        pathRewrite: (path) => `${route.prefix}${path}`,
        on: {
          proxyReq: (proxyReq, req) => {
            const requestId = (req.headers['x-request-id'] as string) || `gw-${Date.now()}`;
            proxyReq.setHeader('X-Request-Id', requestId);
          },
          // Force CORS headers on the response to override anything from upstream.
          // Browsers see the gateway origin, not the upstream — so the gateway
          // is the authority on Access-Control-Allow-Origin.
          proxyRes: (proxyRes, req) => {
            const origin = (req.headers as any).origin || '*';
            proxyRes.headers['access-control-allow-origin'] = origin;
            proxyRes.headers['access-control-allow-credentials'] = 'true';
            proxyRes.headers['vary'] = 'Origin';
          },
          error: (err, req, res: any) => {
            if (res?.writeHead) {
              const origin = (req.headers as any).origin || '*';
              res.writeHead(502, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Credentials': 'true',
              });
              res.end(JSON.stringify({ statusCode: 502, message: `Upstream error: ${err.message}` }));
            }
          },
        },
      }) as any,
    );
  }
}
