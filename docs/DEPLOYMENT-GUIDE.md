# 🚀 Production Deployment Guide
## Marin Pest Control Dashboard

---

## Prerequisites
- Ubuntu/Debian server
- Node.js 18+ installed
- Nginx installed
- PM2 installed globally (`npm install -g pm2`)
- Domain DNS configured (A records for wemakemarin.com, www, api)

---

## Step 1: Upload Files to Server

```bash
# On your local machine, from the project root
# Upload the entire project (or use git clone)
scp -r . user@your-server:/opt/dashboard/

# Or if using Git:
ssh user@your-server
cd /opt
git clone <your-repo-url> dashboard
cd dashboard
```

---

## Step 2: Upload Environment Files

```bash
# Upload backend .env
# From your local machine:
scp /path/to/your/backend.env user@your-server:/opt/dashboard/backend/.env

# Upload frontend .env  
scp /path/to/your/frontend.env user@your-server:/opt/dashboard/frontend/.env

# Or manually create them on the server using nano/vim
```

---

## Step 3: Backend Setup

```bash
# SSH into your server
ssh user@your-server

# Navigate to backend directory
cd /opt/dashboard/backend

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Verify the build succeeded
ls -la dist/

# Test the backend (optional)
node dist/index.js
# Press Ctrl+C to stop after confirming it starts
```

---

## Step 4: Frontend Setup

```bash
# Navigate to frontend directory (from /opt/dashboard/backend)
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify the build succeeded
ls -la dist/
# You should see index.html, assets/, etc.
```

---

## Step 5: Configure Nginx

```bash
# Copy the nginx config to sites-available
sudo cp /opt/dashboard/nginx-production.conf /etc/nginx/sites-available/wemakemarin

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/wemakemarin /etc/nginx/sites-enabled/

# Remove default nginx config (if exists)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

---

## Step 6: Start Backend with PM2

```bash
# Navigate to backend directory
cd /opt/dashboard/backend

# Start the backend with PM2
pm2 start dist/index.js --name "marin-backend" --time

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually requires sudo)

# Check PM2 status
pm2 status

# View logs
pm2 logs marin-backend

# View specific logs
pm2 logs marin-backend --lines 50
```

---

## Step 7: Verify Deployment

### Check Backend
```bash
# Test backend health endpoint
curl http://localhost:5000/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend
```bash
# Test nginx is serving frontend
curl -I http://wemakemarin.com

# Should return: 200 OK
```

### Check API Proxy
```bash
# Test API through nginx
curl http://wemakemarin.com/api/health

# Or with api subdomain
curl http://api.wemakemarin.com/health
```

---

## Step 8: Setup SSL (Optional but Recommended)

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates
sudo certbot --nginx -d wemakemarin.com -d www.wemakemarin.com -d api.wemakemarin.com

# Certbot will automatically update your nginx config and reload nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Common PM2 Commands

```bash
# View all processes
pm2 list

# View logs (follow mode)
pm2 logs marin-backend --lines 100

# Restart backend
pm2 restart marin-backend

# Stop backend
pm2 stop marin-backend

# Delete process from PM2
pm2 delete marin-backend

# Monitor resources
pm2 monit

# View detailed info
pm2 show marin-backend
```

---

## Troubleshooting

### Backend not starting?
```bash
# Check PM2 logs
pm2 logs marin-backend --err

# Check if port 5000 is in use
sudo lsof -i :5000

# Check environment variables
cd /opt/dashboard/backend
cat .env | head -n 5  # Don't print entire file (has secrets)

# Try running directly to see errors
cd /opt/dashboard/backend
node dist/index.js
```

### Frontend not loading?
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/wemakemarin-error.log

# Check if files exist
ls -la /opt/dashboard/frontend/dist/

# Verify nginx config
sudo nginx -t

# Check nginx is running
sudo systemctl status nginx
```

### API calls failing?
```bash
# Check CORS settings in backend .env
cd /opt/dashboard/backend
grep CORS .env

# Check if backend is running
pm2 status

# Test backend directly
curl http://localhost:5000/health

# Test through nginx
curl http://wemakemarin.com/api/health

# Check nginx access logs
sudo tail -f /var/log/nginx/wemakemarin-access.log
```

### Database connection issues?
```bash
# Check DATABASE_URL in .env
cd /opt/dashboard/backend
grep DATABASE_URL .env

# Test database connection (from Node)
node -e "require('pg').Client.prototype.connect.call(new (require('pg').Client)(process.env.DATABASE_URL))"
```

---

## Updating the Application

### Backend updates:
```bash
cd /opt/dashboard/backend

# Pull latest code (if using Git)
git pull

# Install any new dependencies
npm install

# Rebuild TypeScript
npm run build

# Restart PM2 process
pm2 restart marin-backend

# Check logs
pm2 logs marin-backend --lines 50
```

### Frontend updates:
```bash
cd /opt/dashboard/frontend

# Pull latest code
git pull

# Install any new dependencies
npm install

# Rebuild
npm run build

# No need to restart anything - nginx serves static files
# Just verify the new build
ls -la dist/

# Clear browser cache and refresh page
```

---

## Environment File Locations

- **Backend:** `/opt/dashboard/backend/.env`
- **Frontend:** `/opt/dashboard/frontend/.env`

**Never commit these files to Git!** They contain secrets.

---

## Quick Start Commands (After Initial Setup)

```bash
# Start everything
cd /opt/dashboard/backend && pm2 start dist/index.js --name marin-backend

# Stop everything
pm2 stop marin-backend

# Restart everything
pm2 restart marin-backend

# View logs
pm2 logs marin-backend

# Monitor
pm2 monit
```

---

## File Permissions

Make sure proper permissions are set:

```bash
# Set ownership to your user
sudo chown -R $USER:$USER /opt/dashboard

# Set proper permissions
chmod -R 755 /opt/dashboard
chmod 600 /opt/dashboard/backend/.env
chmod 600 /opt/dashboard/frontend/.env
```

---

## 🎉 Deployment Complete!

Your application should now be running at:
- **Main Site:** http://wemakemarin.com (or https:// with SSL)
- **API:** http://api.wemakemarin.com/health
- **Backend Health:** http://wemakemarin.com/api/health

Next steps:
1. Test QuickBooks OAuth: http://wemakemarin.com/api/qbo/connect
2. Configure QuickBooks webhook in developer dashboard
3. Monitor logs: `pm2 logs marin-backend`

