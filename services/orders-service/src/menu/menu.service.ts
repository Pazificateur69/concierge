import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItemEntity, MenuItemDocument } from './menu-item.schema';
import type { MenuItem, OrderCategory } from '@concierge/types';

@Injectable()
export class MenuService {
  constructor(@InjectModel(MenuItemEntity.name) private readonly model: Model<MenuItemDocument>) {}

  async list(tenantId: string, category?: OrderCategory, onlyAvailable = true): Promise<MenuItem[]> {
    const filter: any = { tenantId };
    if (onlyAvailable) filter.available = true;
    if (category) filter.category = category;
    const items = await this.model.find(filter).sort({ category: 1, price: 1 });
    return items.map((m) => this.toDto(m));
  }

  async create(tenantId: string, payload: Partial<MenuItemEntity>): Promise<MenuItem> {
    const created = await this.model.create({ ...payload, tenantId });
    return this.toDto(created);
  }

  async update(tenantId: string, id: string, payload: Partial<MenuItemEntity>): Promise<MenuItem> {
    const updated = await this.model.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { ...payload } },
      { new: true },
    );
    if (!updated) throw new NotFoundException(`Menu item ${id} not found`);
    return this.toDto(updated);
  }

  async delete(tenantId: string, id: string): Promise<{ ok: true }> {
    const res = await this.model.deleteOne({ _id: id, tenantId });
    if (res.deletedCount === 0) throw new NotFoundException(`Menu item ${id} not found`);
    return { ok: true };
  }

  private toDto(m: MenuItemDocument): MenuItem {
    return {
      id: m._id.toString(),
      tenantId: m.tenantId,
      category: m.category,
      name: m.name,
      description: m.description,
      price: m.price,
      currency: m.currency,
      image: m.image,
      options: m.options,
      allergens: m.allergens,
      available: m.available,
      preparationMinutes: m.preparationMinutes,
    };
  }
}
