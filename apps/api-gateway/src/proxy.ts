import type { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

interface RouteConfig {
  prefix: string;
  target: string;
}

export function setupProxies(app: Application) {
  const routes: RouteConfig[] = [
    { prefix: '/auth', target: process.env.SERVICE_AUTH_URL || 'http://localhost:3001' },
    { prefix: '/tenants', target: process.env.SERVICE_TENANT_URL || 'http://localhost:3007' },
    { prefix: '/content', target: process.env.SERVICE_CONTENT_URL || 'http://localhost:3002' },
    { prefix: '/orders', target: process.env.SERVICE_ORDERS_URL || 'http://localhost:3003' },
    { prefix: '/surveys', target: process.env.SERVICE_SURVEY_URL || 'http://localhost:3004' },
  ];

  for (const route of routes) {
    app.use(
      route.prefix,
      createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        ws: true,
        // app.use(prefix, ...) strips `prefix` before this middleware runs.
        // Re-add it so each downstream microservice still sees its own globalPrefix.
        pathRewrite: (path) => `${route.prefix}${path}`,
        on: {
          proxyReq: (proxyReq, req) => {
            const requestId = (req.headers['x-request-id'] as string) || `gw-${Date.now()}`;
            proxyReq.setHeader('X-Request-Id', requestId);
          },
          error: (err, _req, res: any) => {
            if (res?.writeHead) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ statusCode: 502, message: `Upstream error: ${err.message}` }));
            }
          },
        },
      }) as any,
    );
  }
}
