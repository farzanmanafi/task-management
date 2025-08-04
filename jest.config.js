// jest.config.js
module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.spec.ts',
        '!src/**/*.e2e-spec.ts',
        '!src/**/index.ts',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.enum.ts',
        '!src/**/*.dto.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    moduleNameMapping: {
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    projects: [{
            displayName: 'unit',
            testMatch: ['<rootDir>/src/**/*.spec.ts'],
            setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
            setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
        },
        {
            displayName: 'e2e',
            testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
            setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
        },
    ],
};