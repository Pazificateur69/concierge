import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseEntity, ResponseDocument } from './response.schema';
import { SurveysService } from '../surveys/surveys.service';
import type { SubmitSurveyRequest, SurveyResponse, SurveyStats } from '@concierge/types';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectModel(ResponseEntity.name) private readonly model: Model<ResponseDocument>,
    private readonly surveysService: SurveysService,
  ) {}

  async submit(tenantId: string, surveySlug: string, dto: SubmitSurveyRequest): Promise<{ ok: true; id: string }> {
    const survey = await this.surveysService.findBySlug(tenantId, surveySlug);
    const created = await this.model.create({
      tenantId,
      surveyId: survey.id,
      answers: dto.answers,
      locale: dto.locale ?? 'fr',
      metadata: dto.metadata,
      completedAt: new Date(),
    });
    return { ok: true, id: created._id.toString() };
  }

  async list(tenantId: string, surveyId: string, from?: Date, to?: Date): Promise<SurveyResponse[]> {
    const filter: any = { tenantId, surveyId };
    if (from || to) {
      filter.completedAt = {};
      if (from) filter.completedAt.$gte = from;
      if (to) filter.completedAt.$lte = to;
    }
    const items = await this.model.find(filter).sort({ completedAt: -1 }).limit(500);
    return items.map((r) => this.toDto(r));
  }

  async stats(tenantId: string, surveyId: string): Promise<SurveyStats> {
    const responses = await this.model.find({ tenantId, surveyId });
    if (responses.length === 0) return { total: 0 };

    const smileyAnswers = responses
      .map((r) => r.answers.find((a) => typeof a.value === 'number'))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    smileyAnswers.forEach((a) => {
      const v = Number(a.value);
      if (v in distribution) distribution[v]++;
    });
    const total = smileyAnswers.length || 1;
    const bySmiley = Object.entries(distribution).map(([value, count]) => ({
      value: Number(value),
      count,
      percentage: Math.round((count / total) * 100),
    }));

    const avg =
      smileyAnswers.reduce((s, a) => s + Number(a.value), 0) / (smileyAnswers.length || 1);

    const byDay = this.groupByDay(responses);

    return {
      total: responses.length,
      bySmiley,
      averageScore: Number(avg.toFixed(2)),
      byDay,
    };
  }

  private groupByDay(responses: ResponseDocument[]): { date: string; count: number; avg: number }[] {
    const groups: Record<string, { count: number; sum: number }> = {};
    for (const r of responses) {
      const day = r.completedAt.toISOString().slice(0, 10);
      if (!groups[day]) groups[day] = { count: 0, sum: 0 };
      groups[day].count++;
      const numeric = r.answers.find((a) => typeof a.value === 'number');
      if (numeric) groups[day].sum += Number(numeric.value);
    }
    return Object.entries(groups)
      .map(([date, g]) => ({ date, count: g.count, avg: Number((g.sum / g.count).toFixed(2)) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  private toDto(r: ResponseDocument): SurveyResponse {
    return {
      id: r._id.toString(),
      tenantId: r.tenantId,
      surveyId: r.surveyId,
      answers: r.answers,
      locale: r.locale,
      metadata: r.metadata,
      completedAt: r.completedAt.toISOString(),
    };
  }
}
