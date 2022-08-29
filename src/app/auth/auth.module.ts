import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReppsitory } from './user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserReppsitory])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
