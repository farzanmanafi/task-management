import { AdminJSOptions } from 'adminjs';
import {
  LabelResource,
  UserResource,
  ProjectResource,
  TaskResource,
} from './resources';

export const adminJSOptions: AdminJSOptions = {
  rootPath: '/admin',
  dashboard: {
    component: false, // Disable custom dashboard for now
  },
  resources: [UserResource, TaskResource, ProjectResource, LabelResource],
  locale: {
    language: 'en',
    availableLanguages: ['en'],
    translations: {
      en: {
        labels: {
          loginWelcome: 'Welcome to Task Management Admin',
        },
        messages: {
          loginWelcome: '',
        },
      },
    },
  },
  branding: {
    companyName: 'Task Management System',
    softwareBrothers: false,
    logo: false,
    favicon: '/favicon.ico',
    theme: {
      colors: {
        primary100: '#3b82f6',
        primary80: '#60a5fa',
        primary60: '#93c5fd',
      },
    },
  },
  pages: {},
};
