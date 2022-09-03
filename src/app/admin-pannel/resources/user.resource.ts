import { ResourceWithOptions } from 'adminjs';
import { User } from 'src/app/auth/entities/user.entitty';

export const UserResource: ResourceWithOptions = {
  resource: User,
  options: {
    properties: {},
  },
  features: [],
};
export default UserResource;
