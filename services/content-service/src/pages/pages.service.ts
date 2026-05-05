import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContentPageEntity, ContentPageDocument } from './page.schema';
import { TenantContext } from '@concierge/nest-common';
import type { ContentPage } from '@concierge/types';

@Injectable()
export class PagesService {
  constructor(@InjectModel(ContentPageEntity.name) private readonly model: Model<ContentPageDocument>) {}

  async list(tenantId: string): Promise<ContentPage[]> {
    const items = await this.model.find({ tenantId, published: true }).sort({ slug: 1 });
    return items.map((p) => this.toDto(p));
  }

  async findBySlug(tenantId: string, slug: string): Promise<ContentPage> {
    const page = await this.model.findOne({ tenantId, slug });
    if (!page) throw new NotFoundException(`Page ${slug} not found`);
    return this.toDto(page);
  }

  async create(payload: Partial<ContentPageEntity>): Promise<ContentPage> {
    const tenantId = TenantContext.requireTenantId();
    const page = await this.model.create({ ...payload, tenantId });
    return this.toDto(page);
  }

  async update(id: string, payload: Partial<ContentPageEntity>): Promise<ContentPage> {
    const tenantId = TenantContext.requireTenantId();
    const page = await this.model.findOneAndUpdate(
      { _id: id, tenantId },
      { ...payload, $inc: { version: 1 } },
      { new: true },
    );
    if (!page) throw new NotFoundException('Page not found');
    return this.toDto(page);
  }

  async delete(id: string): Promise<void> {
    const tenantId = TenantContext.requireTenantId();
    await this.model.deleteOne({ _id: id, tenantId });
  }

  private toDto(p: ContentPageDocument): ContentPage {
    return {
      id: p._id.toString(),
      tenantId: p.tenantId,
      slug: p.slug,
      title: p.title,
      blocks: p.blocks,
      published: p.published,
      version: p.version,
      createdAt: (p as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (p as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
