#!/bin/bash

# MeterFlow Deployment Script
# This script helps deploy MeterFlow to various platforms

set -e

echo "🚀 MeterFlow Deployment Script"
echo "================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Docker
deploy_docker() {
    echo "🐳 Deploying with Docker Compose..."
    
    # Check if Docker and Docker Compose are installed
    if ! command_exists docker || ! command_exists docker-compose; then
        echo "❌ Docker and Docker Compose are required"
        exit 1
    fi
    
    # Build and start containers
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    echo "✅ Docker deployment complete!"
    echo "🌐 Frontend: http://localhost"
    echo "🔧 Backend API: http://localhost:5000"
}

# Function to deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    
    # Check if Render CLI is installed
    if ! command_exists render; then
        echo "❌ Render CLI is not installed"
        echo "Install it with: npm install -g @render/cli"
        exit 1
    fi
    
    # Deploy to Render
    render deploy
    
    echo "✅ Render deployment complete!"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "⚡ Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command_exists vercel; then
        echo "❌ Vercel CLI is not installed"
        echo "Install it with: npm install -g vercel"
        exit 1
    fi
    
    # Deploy to Vercel
    vercel --prod
    
    echo "✅ Vercel deployment complete!"
}

# Function to setup environment
setup_env() {
    echo "⚙️ Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "backend/.env" ]; then
        echo "Creating backend/.env file..."
        cat > backend/.env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meterflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id
EOF
        echo "✅ Created backend/.env file"
        echo "⚠️ Please update the environment variables with your actual values"
    else
        echo "✅ backend/.env file already exists"
    fi
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Backend tests
    echo "Running backend tests..."
    cd backend
    npm test
    cd ..
    
    # Frontend tests
    echo "Running frontend tests..."
    cd frontend
    npm test -- --coverage --watchAll=false
    cd ..
    
    echo "✅ All tests passed!"
}

# Function to build for production
build_production() {
    echo "🏗️ Building for production..."
    
    # Build backend
    echo "Building backend..."
    cd backend
    npm ci --only=production
    cd ..
    
    # Build frontend
    echo "Building frontend..."
    cd frontend
    npm ci
    npm run build
    cd ..
    
    echo "✅ Production build complete!"
}

# Main menu
case "$1" in
    "docker")
        setup_env
        build_production
        deploy_docker
        ;;
    "render")
        setup_env
        build_production
        deploy_render
        ;;
    "vercel")
        setup_env
        build_production
        deploy_vercel
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_production
        ;;
    "setup")
        setup_env
        ;;
    *)
        echo "Usage: $0 {docker|render|vercel|test|build|setup}"
        echo ""
        echo "Commands:"
        echo "  docker  - Deploy with Docker Compose"
        echo "  render  - Deploy to Render"
        echo "  vercel  - Deploy to Vercel"
        echo "  test    - Run all tests"
        echo "  build   - Build for production"
        echo "  setup   - Setup environment files"
        exit 1
        ;;
esac

echo "🎉 Deployment completed successfully!"
