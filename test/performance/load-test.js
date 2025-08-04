import http from 'k6/http';
import {
    check,
    sleep
} from 'k6';

export let options = {
    stages: [{
            duration: '2m',
            target: 100
        }, // Ramp up to 100 users
        {
            duration: '5m',
            target: 100
        }, // Stay at 100 users
        {
            duration: '2m',
            target: 200
        }, // Ramp up to 200 users
        {
            duration: '5m',
            target: 200
        }, // Stay at 200 users
        {
            duration: '2m',
            target: 0
        }, // Ramp down to 0 users
    ],
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
    // Login and get token
    const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, {
        usernameOrEmail: 'admin@taskmanagement.com',
        password: 'Admin123!',
    });

    const token = loginResponse.json('data.accessToken');
    return {
        token
    };
}

export default function (data) {
    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json',
    };

    // Test GET /api/v1/tasks
    const tasksResponse = http.get(`${BASE_URL}/api/v1/tasks`, {
        headers
    });
    check(tasksResponse, {
        'tasks endpoint status is 200': (r) => r.status === 200,
        'tasks response time < 500ms': (r) => r.timings.duration < 500,
    });

    // Test GET /api/v1/projects
    const projectsResponse = http.get(`${BASE_URL}/api/v1/projects`, {
        headers
    });
    check(projectsResponse, {
        'projects endpoint status is 200': (r) => r.status === 200,
        'projects response time < 500ms': (r) => r.timings.duration < 500,
    });

    // Test health endpoint
    const healthResponse = http.get(`${BASE_URL}/health`);
    check(healthResponse, {
        'health endpoint status is 200': (r) => r.status === 200,
        'health response time < 100ms': (r) => r.timings.duration < 100,
    });

    sleep(1);
}