import { ResourceWithOptions, ValidationError } from 'adminjs';
import { User } from 'src/app/auth/entities/user.entity';

export const UserResource: ResourceWithOptions = {
  resource: User,
  options: {
    actions: {
      new: {
        before: async (request) => {
          const { method, payload } = request;
          if (method === 'post' && payload.name === 'forbidden') {
            throw new ValidationError(
              {
                name: {
                  message: 'cannot be "forbidden"',
                },
              },
              {
                message: 'something wrong happened',
              },
            );
          }
          return request;
        },
      },
    },
  },
  features: [],
};
export default UserResource;
