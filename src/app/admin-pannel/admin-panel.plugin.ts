import AdminJS, { AdminJSOptions } from 'adminjs';
import {
  LabelResource,
  UserResource,
  ProjectResource,
  TaskResource,
} from './resources';

export const adminJSOptions: AdminJSOptions = {
  rootPath: '/admin',
  dashboard: {},
  databases: [],
  resources: [LabelResource, UserResource, ProjectResource, TaskResource],
  locale: {
    language: 'en',
    translations: {
      labels: {
        // change Heading for Login
        loginWelcome: 'Welcome to Task-Management',
      },
      messages: {
        loginWelcome: '',
      },
    },
  },
  branding: {
    companyName: 'Task-Managment',
    softwareBrothers: false,
    logo: '',
  },
};
