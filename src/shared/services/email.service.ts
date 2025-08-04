// src/shared/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as handlebars from 'handlebars';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: any;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private templates: Map<string, EmailTemplate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter(): void {
    const config = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    };

    this.transporter = nodemailer.createTransporter(config);
    this.logger.log('Email transporter initialized');
  }

  private loadTemplates(): void {
    try {
      const templateDir = join(__dirname, '../../templates/email');

      // Load email templates
      const templates = [
        'welcome',
        'task-assigned',
        'task-completed',
        'task-overdue',
        'project-invitation',
        'password-reset',
        'email-verification',
        'daily-digest',
        'weekly-report',
      ];

      templates.forEach((templateName) => {
        try {
          const htmlContent = readFileSync(
            join(templateDir, `${templateName}.html`),
            'utf8',
          );
          const textContent = readFileSync(
            join(templateDir, `${templateName}.txt`),
            'utf8',
          );

          this.templates.set(templateName, {
            subject: this.extractSubject(htmlContent),
            html: htmlContent,
            text: textContent,
          });
        } catch (error) {
          this.logger.warn(`Template ${templateName} not found or invalid`);
        }
      });

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error(`Failed to load email templates: ${error.message}`);
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { to, subject, template, context, html, text, attachments } =
        options;

      let emailHtml = html;
      let emailText = text;
      let emailSubject = subject;

      // Use template if provided
      if (template && this.templates.has(template)) {
        const templateData = this.templates.get(template);
        emailHtml = this.renderTemplate(templateData.html, context);
        emailText = this.renderTemplate(templateData.text, context);
        emailSubject = this.renderTemplate(templateData.subject, context);
      }

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM'),
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendTaskAssignedEmail(
    userEmail: string,
    taskTitle: string,
    assignedBy: string,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'New Task Assigned',
      template: 'task-assigned',
      context: {
        taskTitle,
        assignedBy,
        taskUrl: `${this.configService.get('APP_URL')}/tasks`,
      },
    });
  }

  async sendTaskCompletedEmail(
    userEmail: string,
    taskTitle: string,
    completedBy: string,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Task Completed',
      template: 'task-completed',
      context: {
        taskTitle,
        completedBy,
        taskUrl: `${this.configService.get('APP_URL')}/tasks`,
      },
    });
  }

  async sendTaskOverdueEmail(
    userEmail: string,
    taskTitle: string,
    dueDate: Date,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Task Overdue',
      template: 'task-overdue',
      context: {
        taskTitle,
        dueDate: dueDate.toLocaleDateString(),
        taskUrl: `${this.configService.get('APP_URL')}/tasks`,
      },
    });
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Task Management',
      template: 'welcome',
      context: {
        userName,
        loginUrl: `${this.configService.get('APP_URL')}/login`,
      },
    });
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        resetUrl: `${this.configService.get(
          'APP_URL',
        )}/reset-password?token=${resetToken}`,
        expirationTime: '1 hour',
      },
    });
  }

  async sendEmailVerificationEmail(
    userEmail: string,
    verificationToken: string,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        verificationUrl: `${this.configService.get(
          'APP_URL',
        )}/verify-email?token=${verificationToken}`,
      },
    });
  }

  async sendProjectInvitationEmail(
    userEmail: string,
    projectName: string,
    invitedBy: string,
    invitationToken: string,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Project Invitation',
      template: 'project-invitation',
      context: {
        projectName,
        invitedBy,
        acceptUrl: `${this.configService.get(
          'APP_URL',
        )}/accept-invitation?token=${invitationToken}`,
      },
    });
  }

  async sendDailyDigestEmail(
    userEmail: string,
    tasks: any[],
    stats: any,
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Daily Task Digest',
      template: 'daily-digest',
      context: {
        tasks,
        stats,
        dashboardUrl: `${this.configService.get('APP_URL')}/dashboard`,
      },
    });
  }

  async sendWeeklyReportEmail(userEmail: string, report: any): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: 'Weekly Progress Report',
      template: 'weekly-report',
      context: {
        report,
        dashboardUrl: `${this.configService.get('APP_URL')}/dashboard`,
      },
    });
  }

  private renderTemplate(template: string, context: any = {}): string {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(context);
  }

  private extractSubject(htmlContent: string): string {
    const subjectMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    return subjectMatch ? subjectMatch[1] : 'No Subject';
  }
}
