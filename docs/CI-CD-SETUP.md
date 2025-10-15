# 🚀 CI/CD Setup Guide

This guide explains how to set up continuous integration and deployment (CI/CD) for the Marin Pest Control dashboard.

## 📋 Prerequisites

- GitHub repository with your code
- Ubuntu server (20.04+ recommended)
- Domain name pointing to your server
- SSH access to your server

## 🔧 Server Setup

### 1. Run the Server Setup Script

On your server, run:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/Sonni4154/dashboard/master/setup-server.sh | bash
```

Or manually run:

```bash
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Configure Environment Variables

Copy the environment template and fill in your values:

```bash
cp .env.example .env
nano .env
```

Required environment variables:
- `DATABASE_URL`: Your Supabase database connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `QBO_CLIENT_ID`: QuickBooks OAuth client ID
- `QBO_CLIENT_SECRET`: QuickBooks OAuth client secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `DEPLOY_WEBHOOK_SECRET`: Secret for webhook deployments

## 🔑 GitHub Secrets Configuration

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add these secrets:

### Required Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Your server's IP address or domain | `123.456.789.0` |
| `SERVER_USER` | SSH username | `ubuntu` |
| `SERVER_SSH_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH port (optional, defaults to 22) | `22` |

### How to Generate SSH Key:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@yourdomain.com"
# Save as ~/.ssh/github_actions_key

# Copy the public key to your server
ssh-copy-id -i ~/.ssh/github_actions_key.pub ubuntu@your-server-ip

# Copy the private key content for GitHub secrets
cat ~/.ssh/github_actions_key
```

## 🚀 Deployment Methods

### 1. Automatic Deployment (GitHub Actions)

When you push to the `master` or `main` branch, GitHub Actions will automatically:

1. Build the backend
2. Deploy to your server
3. Restart the application
4. Reload Nginx

### 2. Manual Deployment

You can also trigger deployment manually:

```bash
# On your server
cd /home/ubuntu/dash3
./deploy.sh
```

### 3. Webhook Deployment

Send a POST request to trigger deployment:

```bash
curl -X POST https://www.wemakemarin.com/api/deploy/webhook \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_webhook_secret", "branch": "master"}'
```

## 📊 Monitoring and Management

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs marin-pest-control-backend

# Restart application
pm2 restart marin-pest-control-backend
```

### Check Deployment Status

```bash
# Via API
curl https://www.wemakemarin.com/api/deploy/status

# Via PM2
pm2 monit
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security Considerations

1. **SSH Key Security**: Keep your private SSH key secure and never commit it to the repository
2. **Environment Variables**: Never commit `.env` files to the repository
3. **Webhook Secret**: Use a strong, random secret for webhook deployments
4. **Firewall**: Ensure only necessary ports are open (22, 80, 443)
5. **SSL**: Set up SSL certificates for production

## 🛠️ Troubleshooting

### Common Issues:

1. **Deployment Fails**: Check GitHub Actions logs for specific errors
2. **Application Won't Start**: Check PM2 logs with `pm2 logs marin-pest-control-backend`
3. **Nginx Errors**: Check Nginx configuration with `sudo nginx -t`
4. **Database Connection**: Verify your `DATABASE_URL` is correct
5. **Environment Variables**: Ensure all required variables are set

### Debug Commands:

```bash
# Check if application is running
pm2 status

# View recent logs
pm2 logs marin-pest-control-backend --lines 50

# Check Nginx status
sudo systemctl status nginx

# Test database connection
node -e "console.log(process.env.DATABASE_URL)"

# Check disk space
df -h

# Check memory usage
free -h
```

## 📈 Performance Optimization

1. **PM2 Clustering**: For high-traffic applications, consider using PM2 cluster mode
2. **Nginx Caching**: Configure Nginx to cache static assets
3. **Database Optimization**: Ensure proper database indexing
4. **Monitoring**: Set up monitoring with PM2 Plus or similar tools

## 🔄 Rollback Procedure

If a deployment fails, you can rollback:

```bash
# Stop current application
pm2 stop marin-pest-control-backend

# Restore from backup
cp -r backups/backup-YYYY-MM-DD_HHMMSS/* ./

# Restart application
pm2 start ecosystem.config.js
```

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify all environment variables are set
3. Ensure the server has sufficient resources
4. Check network connectivity
5. Review the GitHub Actions workflow logs

For additional help, check the project documentation or create an issue in the repository.
