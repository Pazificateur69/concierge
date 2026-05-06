import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoiEntity, PoiDocument } from './poi.schema';
import type { Poi, PoiCategory } from '@concierge/types';

@Injectable()
export class PoisService {
  constructor(@InjectModel(PoiEntity.name) private readonly model: Model<PoiDocument>) {}

  async list(tenantId: string, category?: PoiCategory, q?: string): Promise<Poi[]> {
    const filter: any = { tenantId };
    if (category) filter.category = category;
    if (q && q.trim()) {
      const re = new RegExp(q.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      filter.$or = [
        { 'name.fr': re }, { 'name.en': re },
        { 'description.fr': re }, { 'description.en': re },
      ];
    }
    const items = await this.model.find(filter).sort({ category: 1 });
    return items.map((p) => this.toDto(p));
  }

  async softDelete(tenantId: string, id: string): Promise<{ ok: true }> {
    const updated = await this.model.findOneAndUpdate({ _id: id, tenantId }, { $set: { deletedAt: new Date() } }, { new: true });
    if (!updated) throw new NotFoundException(`POI ${id} not found`);
    return { ok: true };
  }

  async create(tenantId: string, payload: Partial<PoiEntity>): Promise<Poi> {
    const created = await this.model.create({ ...payload, tenantId });
    return this.toDto(created);
  }

  async update(tenantId: string, id: string, payload: Partial<PoiEntity>): Promise<Poi> {
    const updated = await this.model.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { ...payload } },
      { new: true },
    );
    if (!updated) throw new NotFoundException(`POI ${id} not found`);
    return this.toDto(updated);
  }

  async delete(tenantId: string, id: string): Promise<{ ok: true }> {
    const res = await this.model.deleteOne({ _id: id, tenantId });
    if (res.deletedCount === 0) throw new NotFoundException(`POI ${id} not found`);
    return { ok: true };
  }

  private toDto(p: PoiDocument): Poi {
    return {
      id: p._id.toString(),
      tenantId: p.tenantId,
      name: p.name,
      category: p.category,
      lat: p.lat,
      lng: p.lng,
      description: p.description,
      photo: p.photo,
      rating: p.rating,
      hours: p.hours,
      phone: p.phone,
      website: p.website,
    };
  }
}
