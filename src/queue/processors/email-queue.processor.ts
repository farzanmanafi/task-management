// src/queue/processors/email-queue.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EmailService } from '../../shared/services/email.service';
import { EmailJobData } from '../queue.service';

@Processor('email')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { data } = job;

    try {
      this.logger.log(`Processing email job: ${data.type} to ${data.to}`);

      await this.emailService.sendEmail({
        to: data.to,
        subject: data.subject,
        template: data.template,
        context: data.context,
      });

      this.logger.log(`Email sent successfully: ${data.type} to ${data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
