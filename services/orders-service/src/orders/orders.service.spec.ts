import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderEntity } from './order.schema';
import { MenuItemEntity } from '../menu/menu-item.schema';
import { OrdersGateway } from './orders.gateway';

describe('OrdersService — state machine', () => {
  let service: OrdersService;
  let orderModel: any;
  const gatewayMock = { emitNewOrder: jest.fn(), emitOrderUpdated: jest.fn() };

  beforeEach(async () => {
    const orderInstance: any = {
      _id: { toString: () => 'o1' },
      tenantId: 't1', room: '101', items: [], subtotal: 0, total: 0, currency: 'EUR',
      status: 'pending', statusHistory: [{ status: 'pending', at: '2026' }],
      locale: 'fr', source: 'kiosk',
      save: jest.fn().mockResolvedValue(undefined),
    };
    orderModel = {
      findOne: jest.fn().mockResolvedValue(orderInstance),
      find: jest.fn(),
      create: jest.fn(),
    };
    const menuModel = { find: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(OrderEntity.name), useValue: orderModel },
        { provide: getModelToken(MenuItemEntity.name), useValue: menuModel },
        { provide: OrdersGateway, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('allows pending → accepted', async () => {
    const r = await service.updateStatus('t1', 'o1', { status: 'accepted' } as any);
    expect(r.status).toBe('accepted');
  });

  it('rejects pending → delivered', async () => {
    await expect(service.updateStatus('t1', 'o1', { status: 'delivered' } as any)).rejects.toThrow(BadRequestException);
  });
});
