export type Locale = 'fr' | 'en' | 'de' | 'es' | 'jp';

export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en', 'de', 'es', 'jp'];

export const DEFAULT_LOCALE: Locale = 'fr';

export type LocalizedString = Partial<Record<Locale, string>>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export const TENANT_HEADER = 'X-Tenant-Slug';
export const REQUEST_ID_HEADER = 'X-Request-Id';
export const INTERNAL_KEY_HEADER = 'X-Internal-Key';
