import { Body, Controller, Get, Headers, Post, Logger, HttpException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'node:crypto';

/**
 * Demo-grade auth fallback embedded in the gateway.
 *
 * Background : the dedicated auth-service on Render free tier has been unreliable
 * during the V4 demo prep — the instance fails to wake from cold-start. To keep the
 * demo bullet-proof for the Dymension interview, the gateway exposes the same
 * /auth/login + /auth/refresh + /auth/me contract here, signs JWTs with the same
 * JWT_SECRET that every microservice validates, so the rest of the platform doesn't
 * notice the difference.
 *
 * For production, the real auth-service (with bcrypt + DB-backed refresh tokens) takes
 * over once it boots — this controller only catches /auth/login when the upstream is
 * unreachable, behind a `setupProxies` denylist.
 */

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const ACCESS_TTL_SEC = 60 * 60 * 8;        // 8h — generous for kiosk demo
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

// Tenant IDs are fetched lazily from tenant-service on first login. We cache them.
// We also seed real tenant IDs from MongoDB if the gateway shares the same DB env.
const tenantIdBySlug = new Map<string, string>([
  // Real ObjectIds from the seeded MongoDB Atlas collection — verified live.
  // These let logins issue valid JWTs even when tenant-service is slow to wake.
  ['royal-lyon', '69fb2eb1e95cf9145870dbff'],
  ['cote-azur',  '69fb2eb1e95cf9145870dc00'],
]);

interface DemoUser {
  email: string;
  password: string;
  tenantSlug: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'staff' | 'guest';
}

const DEMO_USERS: DemoUser[] = [
  { email: 'admin@royal-lyon.fr',     password: 'Demo2026!', tenantSlug: 'royal-lyon', firstName: 'Sophie', lastName: 'Lefèvre',  role: 'admin' },
  { email: 'staff@royal-lyon.fr',     password: 'Demo2026!', tenantSlug: 'royal-lyon', firstName: 'Marie',  lastName: 'Réception', role: 'staff' },
  { email: 'manager@royal-lyon.fr',   password: 'Demo2026!', tenantSlug: 'royal-lyon', firstName: 'Marc',   lastName: 'Bertrand',  role: 'admin' },
  { email: 'admin@cote-azur.fr',      password: 'Demo2026!', tenantSlug: 'cote-azur',  firstName: 'Léa',    lastName: 'Petit',     role: 'admin' },
  { email: 'staff@cote-azur.fr',      password: 'Demo2026!', tenantSlug: 'cote-azur',  firstName: 'Antoine',lastName: 'Moreau',    role: 'staff' },
];

function base64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64url(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function signJwt(payload: object, ttlSec: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + ttlSec };
  const headerB = base64url(JSON.stringify(header));
  const payloadB = base64url(JSON.stringify(fullPayload));
  const signed = `${headerB}.${payloadB}`;
  const sig = base64url(crypto.createHmac('sha256', JWT_SECRET).update(signed).digest());
  return `${signed}.${sig}`;
}

function verifyJwt(token: string): any | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB, payloadB, sigB] = parts;
  const expected = base64url(crypto.createHmac('sha256', JWT_SECRET).update(`${headerB}.${payloadB}`).digest());
  if (expected !== sigB) return null;
  try {
    const payload = JSON.parse(fromBase64url(payloadB).toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function resolveTenantId(slug: string): Promise<string> {
  if (tenantIdBySlug.has(slug)) return tenantIdBySlug.get(slug)!;
  // Try local proxy first (same host) — falls back to public URL.
  const tries = [
    `http://localhost:${process.env.PORT_TENANT ?? 3007}/tenants/${slug}`,
    process.env.SERVICE_TENANT_URL ? `${process.env.SERVICE_TENANT_URL}/tenants/${slug}` : null,
    `https://concierge-tenant.onrender.com/tenants/${slug}`,
  ].filter(Boolean) as string[];
  for (const url of tries) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const data: any = await r.json();
      if (data?.id) {
        tenantIdBySlug.set(slug, data.id);
        return data.id;
      }
    } catch { /* keep trying */ }
  }
  // Last resort : a deterministic synthetic id so the JWT stays valid for the demo.
  const hash = crypto.createHash('sha256').update(slug).digest('hex').slice(0, 24);
  tenantIdBySlug.set(slug, hash);
  return hash;
}

@ApiTags('auth')
@Controller('auth')
export class AuthFallbackController {
  private readonly logger = new Logger(AuthFallbackController.name);

  @Post('login')
  @ApiOperation({ summary: 'Demo login. Validates against hardcoded demo accounts and signs a JWT with JWT_SECRET (HS256). Drop-in replacement for auth-service when it is asleep on Render free tier.' })
  async login(@Body() body: { email?: string; password?: string }) {
    const email = (body?.email || '').trim().toLowerCase();
    const password = body?.password || '';
    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== password) {
      throw new HttpException({ message: 'Invalid credentials' }, 401);
    }
    const tenantId = await resolveTenantId(user.tenantSlug);
    const userId = base64url(crypto.createHash('sha1').update(user.email).digest()).slice(0, 16);
    const accessToken = signJwt({ sub: userId, tenantId, role: user.role, email: user.email, type: 'access' }, ACCESS_TTL_SEC);
    const refreshToken = signJwt({ sub: userId, tenantId, role: user.role, email: user.email, type: 'refresh' }, REFRESH_TTL_SEC);
    this.logger.log(`Demo login: ${email} → ${user.role} on tenant ${user.tenantSlug}`);
    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        locale: 'fr',
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Issue a new access token from a valid refresh token (same JWT_SECRET).' })
  async refresh(@Body() body: { refreshToken?: string }) {
    const payload = verifyJwt(body?.refreshToken || '');
    if (!payload || payload.type !== 'refresh') {
      throw new HttpException({ message: 'Invalid refresh token' }, 401);
    }
    const accessToken = signJwt(
      { sub: payload.sub, tenantId: payload.tenantId, role: payload.role, email: payload.email, type: 'access' },
      ACCESS_TTL_SEC,
    );
    return { accessToken };
  }

  @Post('logout')
  @ApiOperation({ summary: 'No-op for the demo (tokens are stateless in fallback mode).' })
  logout() { return { ok: true }; }

  @Get('me')
  @ApiOperation({ summary: 'Decodes the bearer token and returns the user payload.' })
  me(@Headers('authorization') authHeader?: string) {
    const token = (authHeader || '').replace(/^Bearer\s+/i, '');
    const payload = verifyJwt(token);
    if (!payload) throw new HttpException({ message: 'Unauthorized' }, 401);
    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === (payload.email || '').toLowerCase());
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    };
  }

  @Get('healthz')
  health() {
    return { status: 'ok', service: 'gateway-auth-fallback', users: DEMO_USERS.length };
  }
}
