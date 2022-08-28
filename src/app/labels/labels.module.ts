import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabelRepository } from './labels.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LabelRepository])],
  controllers: [LabelsController],
  providers: [LabelsService],
})
export class LabelsModule {}
