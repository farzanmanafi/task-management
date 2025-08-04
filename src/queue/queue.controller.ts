// src/queue/queue.controller.ts
import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../app/auth/guards/jwt-auth.guard';
import { RoleGuard } from '../app/auth/guards/role.guard';
import { Roles } from '../app/auth/decorators/roles.decorator';
import { UserRoleEnum } from '../app/auth/enums/user-role.enum';

@ApiTags('Queue Management')
@Controller('queue')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth('JWT-auth')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get('stats')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getStats() {
    return await this.queueService.getQueueStats();
  }

  @Post(':queueName/pause')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiResponse({ status: 200, description: 'Queue paused successfully' })
  async pauseQueue(@Param('queueName') queueName: string) {
    await this.queueService.pauseQueue(queueName);
    return { message: `Queue ${queueName} paused successfully` };
  }

  @Post(':queueName/resume')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Resume a queue' })
  @ApiResponse({ status: 200, description: 'Queue resumed successfully' })
  async resumeQueue(@Param('queueName') queueName: string) {
    await this.queueService.resumeQueue(queueName);
    return { message: `Queue ${queueName} resumed successfully` };
  }

  @Post(':queueName/clear')
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Clear a queue' })
  @ApiResponse({ status: 200, description: 'Queue cleared successfully' })
  async clearQueue(@Param('queueName') queueName: string) {
    await this.queueService.clearQueue(queueName);
    return { message: `Queue ${queueName} cleared successfully` };
  }
}
