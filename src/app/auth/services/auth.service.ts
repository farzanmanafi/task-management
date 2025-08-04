// src/app/auth/services/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../entities/user.entity';
import {
  AuthServiceInterface,
  AuthTokens,
} from '../interfaces/auth-service.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import * as crypto from 'crypto';

@Injectable()
export class AuthService implements AuthServiceInterface {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, username } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new ConflictException('Username already exists');
      }
    }

    try {
      const user = await this.userRepository.createUser(createUserDto);
      this.logger.log(`User registered successfully: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const { usernameOrEmail, password } = loginDto;

    const user = await this.validateUser(usernameOrEmail, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);

    // Update last login and save refresh token
    await this.userRepository.updateLastLogin(user.id);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in successfully: ${user.email}`);
    return tokens;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const user = await this.userRepository.findByRefreshToken(refreshToken);
    if (!user || !user.isRefreshTokenValid()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`Token refreshed successfully: ${user.email}`);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.clearRefreshToken();
    await this.userRepository.save(user);

    this.logger.log(`User logged out successfully: ${user.email}`);
  }

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | null> {
    try {
      let user: User | null = null;

      // Check if input is email or username
      if (usernameOrEmail.includes('@')) {
        user = await this.userRepository.findByEmail(usernameOrEmail);
      } else {
        user = await this.userRepository.findByUsername(usernameOrEmail);
      }

      if (!user) {
        return null;
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(
        `User validation failed: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async verifyAccessToken(token: string): Promise<User> {
    try {
      const payload: JwtPayload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return user;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessTokenSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    const accessTokenExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    const refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds(accessTokenExpiresIn),
    };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + this.getExpiresInSeconds(expiresIn) * 1000,
    );

    const user = await this.userRepository.findById(userId);
    user.setRefreshToken(refreshToken, expiresAt);
    await this.userRepository.save(user);
  }

  private getExpiresInSeconds(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // 15 minutes default
    }
  }
}
