import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './tenant.schema';
import type { PublicTenant, Tenant as TenantDto } from '@concierge/types';

@Injectable()
export class TenantService {
  constructor(@InjectModel(Tenant.name) private readonly model: Model<TenantDocument>) {}

  async findBySlug(slug: string): Promise<PublicTenant> {
    const t = await this.model.findOne({ slug: slug.toLowerCase() });
    if (!t) throw new NotFoundException(`Tenant ${slug} not found`);
    return this.toPublic(t);
  }

  async list(): Promise<TenantDto[]> {
    const items = await this.model.find().sort({ name: 1 });
    return items.map((t) => this.toFull(t));
  }

  async findById(id: string): Promise<TenantDto> {
    const t = await this.model.findById(id);
    if (!t) throw new NotFoundException(`Tenant ${id} not found`);
    return this.toFull(t);
  }

  async create(payload: Partial<Tenant>): Promise<TenantDto> {
    const created = await this.model.create(payload);
    return this.toFull(created);
  }

  async update(id: string, payload: Partial<Tenant>): Promise<TenantDto> {
    const updated = await this.model.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) throw new NotFoundException(`Tenant ${id} not found`);
    return this.toFull(updated);
  }

  private toPublic(t: TenantDocument): PublicTenant {
    return {
      id: t._id.toString(),
      slug: t.slug,
      name: t.name,
      theme: t.theme,
      locales: t.locales,
      defaultLocale: t.defaultLocale,
      features: t.features,
    };
  }

  private toFull(t: TenantDocument): TenantDto {
    return {
      ...this.toPublic(t),
      contact: t.contact,
      createdAt: (t as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (t as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
