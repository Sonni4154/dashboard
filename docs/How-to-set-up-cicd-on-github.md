# 🚀 How to Set Up CI/CD on GitHub

This guide walks you through setting up continuous integration and deployment (CI/CD) for your Marin Pest Control dashboard using GitHub Actions.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ A GitHub repository with your code
- ✅ An Ubuntu server (20.04+ recommended) with SSH access
- ✅ A domain name pointing to your server
- ✅ Your application code pushed to GitHub

## 🔧 Step 1: Prepare Your Server

### 1.1 Connect to Your Server

```bash
ssh ubuntu@your-server-ip
```

### 1.2 Run the Server Setup Script

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/Sonni4154/dashboard/master/setup-server.sh | bash
```

**What this script does:**
- Updates system packages
- Installs Node.js, Nginx, PM2
- Sets up project directory
- Configures Nginx for your application
- Sets up firewall rules
- Creates log rotation

### 1.3 Configure Environment Variables

```bash
# Copy the environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Required environment variables:**
```bash
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
```

## 🔑 Step 2: Set Up GitHub Secrets

### 2.1 Generate SSH Key for GitHub Actions

On your **local machine** (not the server):

```bash
# Generate a new SSH key
ssh-keygen -t ed25519 -C "github-actions@yourdomain.com"

# When prompted, save it as:
# /Users/yourusername/.ssh/github_actions_key
```

### 2.2 Copy Public Key to Server

```bash
# Copy the public key to your server
ssh-copy-id -i ~/.ssh/github_actions_key.pub ubuntu@your-server-ip

# Test the connection
ssh -i ~/.ssh/github_actions_key ubuntu@your-server-ip
```

### 2.3 Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SERVER_HOST` | `your-server-ip` | Your server's IP address or domain |
| `SERVER_USER` | `ubuntu` | SSH username (usually 'ubuntu') |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Content of your private SSH key |
| `SERVER_PORT` | `22` | SSH port (optional, defaults to 22) |

**To get your private SSH key content:**
```bash
cat ~/.ssh/github_actions_key
```

## 🚀 Step 3: Test the CI/CD Pipeline

### 3.1 Make a Test Change

```bash
# Make a small change to test deployment
echo "# Test deployment $(date)" >> README.md
git add README.md
git commit -m "Test CI/CD deployment"
git push origin master
```

### 3.2 Monitor the Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see a workflow run called "Deploy to Production Server"
4. Click on it to see the progress

**What happens during deployment:**
- ✅ Code is checked out
- ✅ Dependencies are installed
- ✅ Backend is built
- ✅ Code is deployed to server
- ✅ Application is restarted
- ✅ Nginx is reloaded

## 🔍 Step 4: Verify Deployment

### 4.1 Check Application Status

```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Check PM2 status
pm2 status

# View logs
pm2 logs marin-pest-control-backend
```

### 4.2 Test Your Application

```bash
# Test backend health
curl http://localhost:5000/health

# Test frontend (if configured)
curl http://localhost:3000
```

### 4.3 Check Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ Step 5: Advanced Configuration

### 5.1 Customize Deployment Script

Edit `deploy.sh` to customize your deployment process:

```bash
# Add custom build steps
echo "Running custom build steps..."
npm run test
npm run lint

# Add custom environment setup
echo "Setting up custom environment..."
```

### 5.2 Set Up SSL (Recommended for Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.wemakemarin.com -d wemakemarin.com

# Auto-renewal is set up automatically
```

### 5.3 Configure Monitoring

```bash
# Set up PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🔄 Step 6: Deployment Methods

### 6.1 Automatic Deployment (Default)

Every push to `master` or `main` branch triggers automatic deployment.

### 6.2 Manual Deployment

You can trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production Server**
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### 6.3 Webhook Deployment

Send a POST request to trigger deployment:

```bash
curl -X POST https://www.wemakemarin.com/api/deploy/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_webhook_secret", "branch": "master"}'
```

## 🚨 Troubleshooting

### Common Issues and Solutions:

#### 1. **Deployment Fails with SSH Error**
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/github_actions_key

# Test SSH connection manually
ssh -i ~/.ssh/github_actions_key ubuntu@your-server-ip
```

#### 2. **Application Won't Start**
```bash
# Check PM2 logs
pm2 logs marin-pest-control-backend

# Check if port is in use
sudo netstat -tlnp | grep :5000

# Restart PM2
pm2 restart marin-pest-control-backend
```

#### 3. **Nginx Configuration Error**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

#### 4. **Environment Variables Not Set**
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables
node -e "console.log(process.env.DATABASE_URL)"
```

#### 5. **Build Failures**
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Commands:

```bash
# Check system resources
df -h          # Disk space
free -h        # Memory usage
top            # CPU usage

# Check application status
pm2 status
pm2 monit

# Check network connectivity
curl -I http://localhost:5000/health
```

## 📊 Monitoring and Maintenance

### Daily Checks:
- ✅ Application is running: `pm2 status`
- ✅ Nginx is working: `sudo systemctl status nginx`
- ✅ Disk space: `df -h`
- ✅ Memory usage: `free -h`

### Weekly Tasks:
- ✅ Review logs: `pm2 logs marin-pest-control-backend`
- ✅ Update system packages: `sudo apt update && sudo apt upgrade`
- ✅ Check SSL certificate: `sudo certbot certificates`

### Monthly Tasks:
- ✅ Review and rotate logs
- ✅ Update dependencies: `npm audit`
- ✅ Backup database and files

## 🎉 Success!

If everything is set up correctly, you should have:

- ✅ **Automatic deployments** when you push to master
- ✅ **Health monitoring** with PM2
- ✅ **SSL certificates** (if configured)
- ✅ **Log rotation** and management
- ✅ **Firewall protection**
- ✅ **Nginx reverse proxy**

## 📞 Need Help?

If you encounter issues:

1. **Check the logs first** - Most issues are visible in the logs
2. **Verify environment variables** - Ensure all required variables are set
3. **Test connectivity** - Make sure your server can reach external services
4. **Review GitHub Actions logs** - Check the Actions tab for detailed error messages
5. **Check server resources** - Ensure sufficient disk space and memory

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**🎯 Next Steps:**
1. Test your deployment with a small change
2. Set up SSL certificates for production
3. Configure monitoring and alerting
4. Set up database backups
5. Consider setting up staging environment
