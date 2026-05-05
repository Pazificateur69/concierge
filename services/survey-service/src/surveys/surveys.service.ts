import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SurveyEntity, SurveyDocument } from './survey.schema';
import type { Survey } from '@concierge/types';

@Injectable()
export class SurveysService {
  constructor(@InjectModel(SurveyEntity.name) private readonly model: Model<SurveyDocument>) {}

  async findBySlug(tenantId: string, slug: string): Promise<Survey> {
    const survey = await this.model.findOne({ tenantId, slug });
    if (!survey) throw new NotFoundException(`Survey ${slug} not found`);
    return this.toDto(survey);
  }

  async list(tenantId: string): Promise<Survey[]> {
    const items = await this.model.find({ tenantId }).sort({ slug: 1 });
    return items.map((s) => this.toDto(s));
  }

  async create(tenantId: string, payload: Partial<SurveyEntity>): Promise<Survey> {
    const created = await this.model.create({ ...payload, tenantId });
    return this.toDto(created);
  }

  async update(tenantId: string, id: string, payload: Partial<SurveyEntity>): Promise<Survey> {
    const updated = await this.model.findOneAndUpdate({ _id: id, tenantId }, payload, { new: true });
    if (!updated) throw new NotFoundException('Survey not found');
    return this.toDto(updated);
  }

  toDto(s: SurveyDocument): Survey {
    return {
      id: s._id.toString(),
      tenantId: s.tenantId,
      slug: s.slug,
      title: s.title,
      description: s.description,
      questions: s.questions,
      locales: s.locales,
      publishedAt: s.publishedAt?.toISOString(),
      expiresAt: s.expiresAt?.toISOString(),
      createdAt: (s as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: (s as any).updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
