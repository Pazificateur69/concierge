import { Order } from './orders';

export interface WsServerEvents {
  'order:new': (order: Order) => void;
  'order:updated': (order: Order) => void;
  'survey:submitted': (payload: { surveyId: string; score: number }) => void;
  'connected': (payload: { tenantId: string; rooms: string[] }) => void;
}

export interface WsClientEvents {
  'order:ack': (payload: { orderId: string }) => void;
  'ping': () => void;
}

export const WS_NAMESPACE = '/concierge';
