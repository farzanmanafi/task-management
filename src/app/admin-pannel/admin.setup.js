// admin.setup.js - JavaScript file to avoid TypeScript module resolution issues
const AdminJS = require('adminjs');
const {
    Database,
    Resource
} = require('@adminjs/typeorm');

// Register the adapter
AdminJS.registerAdapter({
    Database,
    Resource
});

const createAdminConfig = (entities) => {
    return {
        rootPath: '/admin',
        dashboard: {},
        resources: [{
                resource: entities.User,
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
                        'isEmailVerified',
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
                        'isEmailVerified',
                    ],
                    filterProperties: ['username', 'email', 'role', 'isActive'],
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
                },
            },
            {
                resource: entities.Task,
                options: {
                    parent: {
                        name: 'Task Management',
                        icon: 'CheckSquare',
                    },
                    listProperties: [
                        'id',
                        'title',
                        'status',
                        'priority',
                        'issueType',
                        'assigneeId',
                        'createdAt',
                    ],
                    showProperties: [
                        'id',
                        'title',
                        'description',
                        'status',
                        'priority',
                        'issueType',
                        'assigneeId',
                        'projectId',
                        'createdById',
                        'estimatedHours',
                        'actualHours',
                        'createdAt',
                        'updatedAt',
                    ],
                    editProperties: [
                        'title',
                        'description',
                        'status',
                        'priority',
                        'issueType',
                        'assigneeId',
                        'projectId',
                        'estimatedHours',
                        'actualHours',
                        'startDate',
                        'dueDate',
                    ],
                    filterProperties: ['status', 'priority', 'issueType', 'assigneeId', 'projectId'],
                    properties: {
                        description: {
                            type: 'textarea',
                            props: {
                                rows: 4,
                            },
                        },
                        startDate: {
                            type: 'datetime',
                        },
                        dueDate: {
                            type: 'datetime',
                        },
                        completedAt: {
                            type: 'datetime',
                            isVisible: {
                                edit: false,
                                new: false,
                            },
                        },
                    },
                },
            },
            {
                resource: entities.Project,
                options: {
                    parent: {
                        name: 'Project Management',
                        icon: 'Folder',
                    },
                    listProperties: ['id', 'name', 'status', 'userId', 'startDate', 'endDate'],
                    showProperties: [
                        'id',
                        'name',
                        'description',
                        'status',
                        'userId',
                        'startDate',
                        'endDate',
                        'createdAt',
                        'updatedAt',
                    ],
                    editProperties: ['name', 'description', 'status', 'userId', 'startDate', 'endDate'],
                    filterProperties: ['status', 'userId'],
                    properties: {
                        description: {
                            type: 'textarea',
                            props: {
                                rows: 3,
                            },
                        },
                        startDate: {
                            type: 'date',
                        },
                        endDate: {
                            type: 'date',
                        },
                    },
                },
            },
            {
                resource: entities.Label,
                options: {
                    parent: {
                        name: 'Configuration',
                        icon: 'Tag',
                    },
                    listProperties: ['id', 'name', 'color'],
                    showProperties: ['id', 'name', 'color', 'description', 'createdAt'],
                    editProperties: ['name', 'color', 'description'],
                    filterProperties: ['name'],
                    properties: {
                        color: {
                            type: 'string',
                            props: {
                                type: 'color',
                            },
                        },
                    },
                },
            },
        ],
        locale: {
            language: 'en',
            availableLanguages: ['en'],
            translations: {
                en: {
                    labels: {
                        loginWelcome: 'Welcome to Task Management Admin',
                    },
                    messages: {
                        loginWelcome: 'Please sign in to continue',
                    },
                },
            },
        },
        branding: {
            companyName: 'Task Management System',
            logo: false,
            favicon: '/favicon.ico',
            theme: {
                colors: {
                    primary100: '#3b82f6',
                    primary80: '#60a5fa',
                    primary60: '#93c5fd',
                    primary40: '#dbeafe',
                    primary20: '#eff6ff',
                    grey100: '#1f2937',
                    grey80: '#374151',
                    grey60: '#6b7280',
                    grey40: '#9ca3af',
                    grey20: '#f3f4f6',
                    filterBg: '#ffffff',
                    accent: '#10b981',
                    hoverBg: '#f9fafb',
                },
            },
        },
    };
};

module.exports = {
    createAdminConfig
};