import { UserRoleEnum } from '../enum';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
  role: UserRoleEnum;
  iat: number; // issued at
  exp?: number; // expires at
}
