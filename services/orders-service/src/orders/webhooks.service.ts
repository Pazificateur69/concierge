import { Injectable, Logger } from '@nestjs/common';
import type { Order } from '@concierge/types';

interface WebhookEndpoint {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private endpoints: WebhookEndpoint[] = [];

  constructor() {
    if (process.env.WEBHOOK_DEFAULT_URL) {
      this.endpoints.push({
        id: 'default',
        tenantId: '*',
        url: process.env.WEBHOOK_DEFAULT_URL,
        events: ['order.created', 'order.updated', 'order.delivered', 'order.cancelled'],
        active: true,
      });
    }
  }

  register(ep: WebhookEndpoint) {
    this.endpoints = this.endpoints.filter((e) => e.id !== ep.id);
    this.endpoints.push(ep);
  }

  list(tenantId: string) {
    return this.endpoints.filter((e) => e.active && (e.tenantId === '*' || e.tenantId === tenantId));
  }

  async fire(event: string, payload: Order) {
    const targets = this.list(payload.tenantId);
    for (const ep of targets) {
      if (!ep.events.includes(event)) continue;
      try {
        const body = JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() });
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-webhook-event': event,
            'x-webhook-id': ep.id,
            'x-webhook-tenant': payload.tenantId,
            ...(ep.secret ? { 'x-webhook-signature': await this.sign(body, ep.secret) } : {}),
          },
          body,
        });
        this.logger.log(`webhook ${event} → ${ep.url} status=${res.status}`);
      } catch (e: any) {
        this.logger.warn(`webhook ${event} → ${ep.url} failed: ${e.message}`);
      }
    }
  }

  private async sign(body: string, secret: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
    return Buffer.from(sig).toString('hex');
  }
}
