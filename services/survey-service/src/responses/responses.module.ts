import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { ResponseEntity, ResponseSchema } from './response.schema';
import { SurveysModule } from '../surveys/surveys.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ResponseEntity.name, schema: ResponseSchema }]),
    SurveysModule,
  ],
  controllers: [ResponsesController],
  providers: [ResponsesService],
})
export class ResponsesModule {}
