import { Locale, LocalizedString } from './common';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'delivered' | 'cancelled';

export type OrderCategory = 'food' | 'drink' | 'spa' | 'taxi' | 'wakeup' | 'housekeeping' | 'other';

export interface MenuItemOption {
  id: string;
  label: LocalizedString;
  priceDelta?: number;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  category: OrderCategory;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  currency: string;
  image?: string;
  options?: MenuItemOption[];
  allergens?: string[];
  available: boolean;
  preparationMinutes?: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  options?: string[];
  notes?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  by?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  room: string;
  guestName?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  locale: Locale;
  notes?: string;
  source: 'kiosk' | 'tablet' | 'reception';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  room: string;
  guestName?: string;
  items: { menuItemId: string; quantity: number; options?: string[]; notes?: string }[];
  locale?: Locale;
  source: 'kiosk' | 'tablet' | 'reception';
  notes?: string;
}
