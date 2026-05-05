import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PoiEntity, PoiDocument } from './poi.schema';
import type { Poi, PoiCategory } from '@concierge/types';

@Injectable()
export class PoisService {
  constructor(@InjectModel(PoiEntity.name) private readonly model: Model<PoiDocument>) {}

  async list(tenantId: string, category?: PoiCategory): Promise<Poi[]> {
    const filter: any = { tenantId };
    if (category) filter.category = category;
    const items = await this.model.find(filter).sort({ category: 1 });
    return items.map((p) => this.toDto(p));
  }

  async create(tenantId: string, payload: Partial<PoiEntity>): Promise<Poi> {
    const created = await this.model.create({ ...payload, tenantId });
    return this.toDto(created);
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
