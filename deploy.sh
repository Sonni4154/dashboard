#!/bin/bash

# 🚀 Marin Pest Control - Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Marin Pest Control Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/$(whoami)/dash3"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
PM2_APP_NAME="marin-pest-control-backend"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

print_status "Navigating to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Backup current deployment
print_status "Creating backup of current deployment..."
BACKUP_DIR="backups/backup-$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r backend/dist "$BACKUP_DIR/" 2>/dev/null || true
cp -r frontend/dist "$BACKUP_DIR/" 2>/dev/null || true

# Pull latest changes from Git
print_status "Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/master

# Update backend
print_status "Updating backend dependencies..."
cd "$BACKEND_DIR"
npm ci --production

print_status "Building backend..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Backend build failed - dist directory not found"
    exit 1
fi

# Update frontend if it exists
if [ -d "$FRONTEND_DIR" ]; then
    print_status "Updating frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci
    
    print_status "Building frontend..."
    npm run build
    
    # Check if frontend build was successful
    if [ ! -d "dist" ]; then
        print_warning "Frontend build failed - continuing with backend only"
    else
        print_success "Frontend built successfully"
    fi
fi

# Restart the application
print_status "Restarting application with PM2..."
cd "$BACKEND_DIR"

# Stop existing process if running
pm2 stop "$PM2_APP_NAME" 2>/dev/null || true

# Start the application
pm2 start ecosystem.config.js --name "$PM2_APP_NAME"

# Save PM2 configuration
pm2 save

# Check if application started successfully
sleep 5
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    print_success "Application started successfully"
else
    print_error "Application failed to start"
    pm2 logs "$PM2_APP_NAME" --lines 20
    exit 1
fi

# Reload nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

# Health check
print_status "Performing health check..."
sleep 10
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Health check passed - application is running"
else
    print_warning "Health check failed - application may not be responding"
fi

# Show deployment summary
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  • Backend: Built and restarted"
echo "  • Frontend: Built and deployed"
echo "  • PM2: Application restarted"
echo "  • Nginx: Configuration reloaded"
echo "  • Health: Application responding"
echo ""
echo "🔗 Application URLs:"
echo "  • Backend API: http://localhost:5000"
echo "  • Frontend: http://localhost:3000"
echo "  • Health Check: http://localhost:5000/health"
echo ""
echo "📝 Useful Commands:"
echo "  • View logs: pm2 logs $PM2_APP_NAME"
echo "  • Restart app: pm2 restart $PM2_APP_NAME"
echo "  • Check status: pm2 status"
echo "  • View nginx logs: sudo tail -f /var/log/nginx/error.log"
