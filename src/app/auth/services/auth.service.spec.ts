// src/app/auth/services/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { UserRoleEnum } from '../enums/user-role.enum';
import { TestUtils } from '../../../../test/utils/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findOne: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findByRefreshToken: jest.fn(),
            createUser: jest.fn(),
            updateLastLogin: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockUser = await TestUtils.createMockUser({
        email: createUserDto.email,
        username: createUserDto.username,
      });

      userRepository.findOne.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.register(createUserDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserDto.email.toLowerCase() },
          { username: createUserDto.username.toLowerCase() },
        ],
      });
      expect(userRepository.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const existingUser = await TestUtils.createMockUser({
        email: createUserDto.email,
      });

      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const existingUser = await TestUtils.createMockUser({
        username: createUserDto.username,
      });

      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user successfully with email', async () => {
      const loginDto: LoginDto = {
        usernameOrEmail: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = await TestUtils.createMockUser({
        email: loginDto.usernameOrEmail,
      });

      mockUser.validatePassword = jest.fn().mockResolvedValue(true);

      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.updateLastLogin.mockResolvedValue(undefined);
      userRepository.save.mockResolvedValue(mockUser);

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_SECRET':
            return 'access-secret';
          case 'JWT_REFRESH_SECRET':
            return 'refresh-secret';
          case 'JWT_ACCESS_EXPIRES_IN':
            return '15m';
          case 'JWT_REFRESH_EXPIRES_IN':
            return '7d';
          default:
            return null;
        }
      });

      jwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.usernameOrEmail,
      );
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should login user successfully with username', async () => {
      const loginDto: LoginDto = {
        usernameOrEmail: 'testuser',
        password: 'Password123!',
      };

      const mockUser = await TestUtils.createMockUser({
        username: loginDto.usernameOrEmail,
      });

      mockUser.validatePassword = jest.fn().mockResolvedValue(true);

      userRepository.findByUsername.mockResolvedValue(mockUser);
      userRepository.updateLastLogin.mockResolvedValue(undefined);
      userRepository.save.mockResolvedValue(mockUser);

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_SECRET':
            return 'access-secret';
          case 'JWT_REFRESH_SECRET':
            return 'refresh-secret';
          case 'JWT_ACCESS_EXPIRES_IN':
            return '15m';
          case 'JWT_REFRESH_EXPIRES_IN':
            return '7d';
          default:
            return null;
        }
      });

      jwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(userRepository.findByUsername).toHaveBeenCalledWith(
        loginDto.usernameOrEmail,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        usernameOrEmail: 'test@example.com',
        password: 'wrongpassword',
      };

      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const loginDto: LoginDto = {
        usernameOrEmail: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = await TestUtils.createMockUser({
        email: loginDto.usernameOrEmail,
        isActive: false,
      });

      mockUser.validatePassword = jest.fn().mockResolvedValue(true);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      const mockUser = await TestUtils.createMockUser({ email });
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);

      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(password);
    });

    it('should return null for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      const mockUser = await TestUtils.createMockUser({ email });
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);

      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = await TestUtils.createMockUser();

      mockUser.isRefreshTokenValid = jest.fn().mockReturnValue(true);

      userRepository.findByRefreshToken.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_SECRET':
            return 'access-secret';
          case 'JWT_REFRESH_SECRET':
            return 'refresh-secret';
          case 'JWT_ACCESS_EXPIRES_IN':
            return '15m';
          case 'JWT_REFRESH_EXPIRES_IN':
            return '7d';
          default:
            return null;
        }
      });

      jwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(userRepository.findByRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      userRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const refreshToken = 'expired-refresh-token';
      const mockUser = await TestUtils.createMockUser();

      mockUser.isRefreshTokenValid = jest.fn().mockReturnValue(false);

      userRepository.findByRefreshToken.mockResolvedValue(mockUser);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'test-user-id';
      const mockUser = await TestUtils.createMockUser({ id: userId });

      mockUser.clearRefreshToken = jest.fn();

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.logout(userId);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.clearRefreshToken).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = 'non-existent-user-id';

      userRepository.findById.mockResolvedValue(null);

      await expect(service.logout(userId)).rejects.toThrow('User not found');
    });
  });
});
