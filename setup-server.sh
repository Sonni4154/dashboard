#!/bin/bash

# 🚀 Marin Pest Control - Server Setup Script
# This script prepares the server for CI/CD deployment

set -e

echo "🚀 Setting up Marin Pest Control Server for CI/CD..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx nodejs npm pm2 ufw

# Install latest Node.js if needed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Create project directory
PROJECT_DIR="/home/$(whoami)/dash3"
print_status "Setting up project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone repository if not exists
if [ ! -d ".git" ]; then
    print_status "Cloning repository..."
    # Replace with your actual repository URL
    git clone https://github.com/Sonni4154/dashboard.git .
fi

# Create logs directory
mkdir -p logs

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/marin-pest-control > /dev/null << 'EOF'
server {
    listen 80;
    server_name www.wemakemarin.com wemakemarin.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Frontend static files
    location / {
        root /home/ubuntu/dash3/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/marin-pest-control /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Setup firewall
print_status "Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create environment file template
print_status "Creating environment file template..."
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# QuickBooks
QBO_CLIENT_ID=your_qbo_client_id
QBO_CLIENT_SECRET=your_qbo_client_secret
QBO_REDIRECT_URI=your_qbo_redirect_uri

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri

# Deployment
DEPLOY_WEBHOOK_SECRET=your_webhook_secret

# Server
NODE_ENV=production
PORT=5000
EOF

# Make deployment script executable
chmod +x deploy.sh

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/marin-pest-control > /dev/null << 'EOF'
/home/ubuntu/dash3/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

print_success "🎉 Server setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Run: ./deploy.sh to deploy the application"
echo "3. Configure your domain DNS to point to this server"
echo "4. Set up SSL certificates with Let's Encrypt"
echo ""
echo "🔧 Useful Commands:"
echo "  • Deploy: ./deploy.sh"
echo "  • View logs: pm2 logs marin-pest-control-backend"
echo "  • Restart: pm2 restart marin-pest-control-backend"
echo "  • Status: pm2 status"
echo "  • Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🌐 After deployment, your app will be available at:"
echo "  • http://www.wemakemarin.com"
echo "  • http://wemakemarin.com"
