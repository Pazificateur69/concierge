import { Locale } from './common';

export type TenantFeature = 'lobby' | 'rooms' | 'smiley' | 'reception' | 'analytics';

export interface TenantTheme {
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  logoUrl: string;
  font: string;
}

export interface TenantContact {
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  theme: TenantTheme;
  contact: TenantContact;
  locales: Locale[];
  defaultLocale: Locale;
  features: TenantFeature[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicTenant {
  id: string;
  slug: string;
  name: string;
  theme: TenantTheme;
  locales: Locale[];
  defaultLocale: Locale;
  features: TenantFeature[];
  contact?: TenantContact;
}
