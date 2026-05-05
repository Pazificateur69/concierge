import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextValue {
  tenantId: string;
  userId?: string;
  role?: string;
  requestId?: string;
}

const storage = new AsyncLocalStorage<TenantContextValue>();

export const TenantContext = {
  run<T>(value: TenantContextValue, fn: () => T): T {
    return storage.run(value, fn);
  },
  get(): TenantContextValue | undefined {
    return storage.getStore();
  },
  getTenantId(): string | undefined {
    return storage.getStore()?.tenantId;
  },
  getUserId(): string | undefined {
    return storage.getStore()?.userId;
  },
  requireTenantId(): string {
    const id = this.getTenantId();
    if (!id) throw new Error('TenantContext: no tenantId in scope');
    return id;
  },
};
