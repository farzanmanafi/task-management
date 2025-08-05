import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { AuthModule } from '../app/auth/auth.module';
import { CacheModule } from '../shared/cache/cache.module';

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
    CacheModule,
  ],
  providers: [WebSocketGateway, WebSocketService, WsAuthGuard],
  exports: [WebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
