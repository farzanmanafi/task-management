// src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGateway } from './websocket.gateway';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { AuthModule } from '../app/auth/auth.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  providers: [WebSocketGateway, WsAuthGuard],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}
