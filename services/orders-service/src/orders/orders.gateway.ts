import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload, Order } from '@concierge/types';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/concierge' })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(OrdersGateway.name);
  private readonly jwt: JwtService;

  constructor() {
    this.jwt = new JwtService({ secret: process.env.JWT_SECRET || 'dev_secret_change_me' });
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || (client.handshake.headers.authorization || '').replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      client.data.tenantId = payload.tenantId;
      client.data.role = payload.role;
      client.join(`tenant:${payload.tenantId}`);
      if (payload.role === 'staff' || payload.role === 'admin') {
        client.join(`tenant:${payload.tenantId}:staff`);
      }
      client.emit('connected', { tenantId: payload.tenantId, rooms: Array.from(client.rooms) });
      this.logger.log(`socket ${client.id} joined tenant:${payload.tenantId} role=${payload.role}`);
    } catch (e) {
      this.logger.warn(`Reject WS connection: ${(e as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`socket ${client.id} disconnected`);
  }

  emitNewOrder(order: Order) {
    this.server.to(`tenant:${order.tenantId}:staff`).emit('order:new', order);
  }

  emitOrderUpdated(order: Order) {
    this.server.to(`tenant:${order.tenantId}:staff`).emit('order:updated', order);
  }
}
