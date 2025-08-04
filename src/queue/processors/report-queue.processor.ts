// src/queue/processors/report-queue.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ReportService } from '../../shared/services/report.service';
import { ReportJobData } from '../queue.service';

@Processor('report')
export class ReportQueueProcessor {
  private readonly logger = new Logger(ReportQueueProcessor.name);

  constructor(private reportService: ReportService) {}

  @Process('generate-report')
  async handleGenerateReport(job: Job<ReportJobData>) {
    const { data } = job;

    try {
      this.logger.log(
        `Processing report job: ${data.type} for user ${data.userId}`,
      );

      await this.reportService.generateReport(data);

      this.logger.log(
        `Report generated successfully: ${data.type} for user ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate report: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
