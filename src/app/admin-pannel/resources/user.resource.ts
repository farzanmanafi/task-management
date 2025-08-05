import { ResourceOptions } from 'adminjs';
import { User } from '../../auth/entities/user.entity';

export const UserResource = {
  resource: User,
  options: {
    parent: {
      name: 'User Management',
      icon: 'User',
    },
    listProperties: [
      'id',
      'username',
      'email',
      'role',
      'isActive',
      'createdAt',
    ],
    showProperties: [
      'id',
      'username',
      'email',
      'firstName',
      'lastName',
      'role',
      'isActive',
      'createdAt',
      'updatedAt',
    ],
    editProperties: [
      'username',
      'email',
      'firstName',
      'lastName',
      'role',
      'isActive',
    ],
    filterProperties: ['username', 'email', 'role', 'isActive'],
    actions: {
      new: {
        before: async (request, context) => {
          if (request.method === 'post' && request.payload?.password) {
            const bcrypt = require('bcrypt');
            request.payload.password = await bcrypt.hash(
              request.payload.password,
              10,
            );
          }
          return request;
        },
      },
      edit: {
        before: async (request, context) => {
          if (request.method === 'post' && request.payload?.password) {
            const bcrypt = require('bcrypt');
            request.payload.password = await bcrypt.hash(
              request.payload.password,
              10,
            );
          }
          return request;
        },
      },
    },
    properties: {
      password: {
        type: 'password',
        isVisible: {
          list: false,
          show: false,
          edit: true,
          filter: false,
        },
      },
      id: {
        isVisible: {
          list: true,
          show: true,
          edit: false,
          filter: false,
        },
      },
    },
  } as ResourceOptions,
};
