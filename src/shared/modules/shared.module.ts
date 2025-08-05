import { Module, Global } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { AdvancedCacheService } from '../services/advanced-cache.service';
import { EmailService } from '../services/email.service';
import { FileUploadService } from '../services/file-upload.service';
import { ReportService } from '../services/report.service';
import { EventEmitterService } from '../services/event-emitter.service';

@Global()
@Module({
  imports: [CacheModule],
  providers: [
    AdvancedCacheService,
    EmailService,
    FileUploadService,
    ReportService,
    EventEmitterService,
  ],
  exports: [
    CacheModule,
    AdvancedCacheService,
    EmailService,
    FileUploadService,
    ReportService,
    EventEmitterService,
  ],
})
export class SharedModule {}
