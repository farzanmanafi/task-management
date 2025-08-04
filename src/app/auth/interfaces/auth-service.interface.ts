import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthServiceInterface {
  register(createUserDto: CreateUserDto): Promise<User>;
  login(loginDto: LoginDto): Promise<AuthTokens>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  validateUser(usernameOrEmail: string, password: string): Promise<User | null>;
  verifyAccessToken(token: string): Promise<User>;
}
