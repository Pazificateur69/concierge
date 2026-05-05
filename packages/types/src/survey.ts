import { Locale, LocalizedString } from './common';

export type QuestionType = 'smiley' | 'nps' | 'mcq' | 'text' | 'date' | 'numeric';

export interface QuestionOption {
  value: string | number;
  label: LocalizedString;
  icon?: string;
  color?: string;
}

export interface QuestionConditional {
  questionId: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
  value: string | number;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: LocalizedString;
  description?: LocalizedString;
  required: boolean;
  options?: QuestionOption[];
  showIf?: QuestionConditional;
  validation?: { min?: number; max?: number; minLength?: number; maxLength?: number };
}

export interface Survey {
  id: string;
  tenantId: string;
  slug: string;
  title: LocalizedString;
  description?: LocalizedString;
  questions: Question[];
  locales: Locale[];
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  value: string | number | string[];
}

export interface SurveyResponseMetadata {
  device?: string;
  room?: string;
  orderId?: string;
  userAgent?: string;
}

export interface SurveyResponse {
  id: string;
  tenantId: string;
  surveyId: string;
  answers: SurveyAnswer[];
  locale: Locale;
  metadata?: SurveyResponseMetadata;
  completedAt: string;
}

export interface SubmitSurveyRequest {
  answers: SurveyAnswer[];
  locale?: Locale;
  metadata?: SurveyResponseMetadata;
}

export interface SurveyStats {
  total: number;
  bySmiley?: { value: number; count: number; percentage: number }[];
  nps?: { score: number; promoters: number; passives: number; detractors: number };
  averageScore?: number;
  byDay?: { date: string; count: number; avg: number }[];
}
