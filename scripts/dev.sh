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
