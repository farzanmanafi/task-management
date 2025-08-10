import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { AdvancedCacheService } from '../services/advanced-cache.service';
import { EmailService } from '../services/email.service';
import { FileUploadService } from '../services/file-upload.service';
import { ReportService } from '../services/report.service';
import { EventEmitterService } from '../services/event-emitter.service';

// Import the entities that ReportService needs
import { User } from '../../app/auth/entities/user.entity';
import { Task } from '../../app/tasks/entities/task.entity';

@Global()
@Module({
  imports: [
    CacheModule,
    // Add TypeORM feature for entities needed by ReportService
    TypeOrmModule.forFeature([User, Task]),
  ],
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
