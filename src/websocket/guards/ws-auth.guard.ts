// src/websocket/guards/ws-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../app/auth/repositories/user.repository';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new WsException('User not found or inactive');
      }

      // Attach user to context
      context.switchToWs().getData().user = user;
      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: any): string | null {
    return (
      client.request.headers.authorization?.replace('Bearer ', '') ||
      client.handshake.auth.token ||
      client.handshake.query.token
    );
  }
}
