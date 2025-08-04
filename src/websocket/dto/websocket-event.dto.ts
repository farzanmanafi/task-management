// src/websocket/dto/websocket-event.dto.ts
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class JoinProjectDto {
  @IsString()
  projectId: string;
}

export class LeaveProjectDto {
  @IsString()
  projectId: string;
}

export class TypingDto {
  @IsString()
  taskId: string;

  @IsBoolean()
  isTyping: boolean;
}

export class WebSocketEventDto {
  @IsString()
  event: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsString()
  timestamp?: string;
}
