import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { SurveyEntity, SurveySchema } from './survey.schema';
import { JwtStrategy } from '../jwt.strategy';

@Module({
  imports: [MongooseModule.forFeature([{ name: SurveyEntity.name, schema: SurveySchema }])],
  controllers: [SurveysController],
  providers: [SurveysService, JwtStrategy],
  exports: [SurveysService, MongooseModule],
})
export class SurveysModule {}
