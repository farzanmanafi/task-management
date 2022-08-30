import { createParamDecorator } from '@nestjs/common';
import { User } from '../entities/user.entitty';

const GetUser = createParamDecorator((data, req): User => {
  return req.user;
});
