
# scripts/build.sh
#!/bin/bash

# Build script for production

set -e

echo "Building Task Management API..."

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Run tests
npm run test:coverage:ci

# Create necessary directories
mkdir -p uploads logs

echo "Build completed successfully!"

# scripts/deploy.sh
#!/bin/bash

# Deployment script

set -e

echo "Deploying Task Management API..."

# Pull latest changes
git pull origin main

# Build Docker image
docker build -t task-management-api .

# Stop existing containers
docker-compose down

# Start new containers
docker-compose up -d

# Wait for services to be ready
sleep 30

# Run health check
curl -f http://localhost:3000/health || exit 1

echo "Deployment completed successfully!"

# scripts/dev.sh
#!/bin/bash

# Development setup script

set -e

echo "Setting up development environment..."

# Install dependencies
npm install

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
sleep 10

# Run migrations
npm run migration:run

# Start development server
npm run start:dev

# package.json scripts (add these to existing scripts)
{
  "scripts": {
    "docker:build": "docker build -t task-management-api .",
    "docker:run": "docker-compose up -d",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up -d",
    "docker:stop": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "health:check": "curl -f http://localhost:3000/health",
    "build:prod": "./scripts/build.sh",
    "deploy": "./scripts/deploy.sh",
    "dev:setup": "./scripts/dev.sh"
  }
}

# health-check.js (for Docker health check)
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health/live',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();