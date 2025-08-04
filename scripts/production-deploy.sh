
# Final deployment script (scripts/production-deploy.sh)
#!/bin/bash

set -e

echo "Starting production deployment..."

# Build and push Docker image
echo "Building Docker image..."
docker build -t task-management-api:latest .

# Tag and push to registry
echo "Pushing to registry..."
docker tag task-management-api:latest ghcr.io/your-username/task-management-api:latest
docker push ghcr.io/your-username/task-management-api:latest

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl apply -f k8s/

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
kubectl rollout status deployment/task-management-api -n task-management

# Run database migrations
echo "Running database migrations..."
kubectl exec -it deployment/task-management-api -n task-management -- npm run migration:run

# Run health check
echo "Running health check..."
kubectl port-forward service/task-management-api-service 3000:80 -n task-management &
sleep 5
curl -f http://localhost:3000/health || (echo "Health check failed" && exit 1)

echo "Production deployment completed successfully!"
echo "API is available at: https://api.taskmanagement.com"
echo "Documentation: https://api.taskmanagement.com/api/docs"