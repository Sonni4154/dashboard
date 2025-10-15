# 🌐 Nginx Configuration Guide

Complete guide for configuring Nginx for the Marin Pest Control Dashboard.

---

## 📦 Available Configurations

### 1. **Development** (`nginx-dev.conf`)
- For local development with hot reload
- Proxies to Vite dev server (port 5173)
- Proxies API to backend (port 5000)
- Permissive CORS
- WebSocket support for HMR
- Verbose logging

### 2. **Production** (`nginx-production.conf`)
- For production deployment
- Serves static built files
- Proxies API to backend
- Strict security headers
- Optimized caching
- Multiple domain support

### 3. **Generic** (`nginx.conf`)
- Flexible configuration
- Can be adapted for various environments
- Includes webhook subdomain example

---

## 🚀 Quick Setup

### Development Setup

```bash
# 1. Copy dev config to Nginx sites-available
sudo cp nginx-dev.conf /etc/nginx/sites-available/dashboard-dev

# 2. Create symbolic link
sudo ln -s /etc/nginx/sites-available/dashboard-dev /etc/nginx/sites-enabled/

# 3. Test configuration
sudo nginx -t

# 4. Reload Nginx
sudo systemctl reload nginx

# 5. Start your dev servers
cd backend && npm run dev &
cd frontend && npm run dev &

# 6. Access at http://localhost
```

### Production Setup

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Copy production config
sudo cp nginx-production.conf /etc/nginx/sites-available/wemakemarin

# 3. Edit config with your domain
sudo nano /etc/nginx/sites-available/wemakemarin

# 4. Create symbolic link
sudo ln -s /etc/nginx/sites-available/wemakemarin /etc/nginx/sites-enabled/

# 5. Test configuration
sudo nginx -t

# 6. Reload Nginx
sudo systemctl reload nginx

# 7. Set up SSL with Let's Encrypt
sudo certbot --nginx -d wemakemarin.com -d www.wemakemarin.com -d api.wemakemarin.com
```

---

## 🔧 Configuration Details

### Development Configuration

**Upstream Servers:**
```nginx
upstream vite_dev {
    server 127.0.0.1:5173;  # Vite dev server
}

upstream backend_dev {
    server 127.0.0.1:5000;  # Backend API
}
```

**Key Features:**
- ✅ Hot Module Replacement (HMR) support
- ✅ WebSocket proxy for live reload
- ✅ Permissive CORS for local testing
- ✅ No caching (fresh content always)
- ✅ Verbose logging for debugging

**Access:**
- Frontend: `http://localhost/`
- API: `http://localhost/api/`
- Health: `http://localhost/health`

---

### Production Configuration

**Upstream Server:**
```nginx
upstream backend {
    server 127.0.0.1:5000;  # Backend API only
    keepalive 64;
}
```

**Key Features:**
- ✅ Serves static files from `/opt/dashboard/frontend/dist`
- ✅ Aggressive caching for assets (1 year)
- ✅ Gzip compression
- ✅ Security headers
- ✅ Multiple domain support
- ✅ SSL ready

**Domains:**
- Main: `wemakemarin.com` (frontend + API)
- API: `api.wemakemarin.com` (API only)
- Webhook: `webhook.wemakemarin.com` (webhooks only)

---

## 🛡️ Security Headers

### Production Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### CORS Configuration

**Development (Permissive):**
```nginx
add_header Access-Control-Allow-Origin "*" always;
```

**Production (Strict):**
```nginx
add_header Access-Control-Allow-Origin "https://wemakemarin.com" always;
add_header Access-Control-Allow-Credentials "true" always;
```

---

## 📝 SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot --nginx \
  -d wemakemarin.com \
  -d www.wemakemarin.com \
  -d api.wemakemarin.com \
  -d webhook.wemakemarin.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Manual SSL Configuration

After obtaining certificates, Nginx will auto-update. Verify:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wemakemarin.com;
    
    ssl_certificate /etc/letsencrypt/live/wemakemarin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wemakemarin.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # ... rest of config
}
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **502 Bad Gateway**
**Cause:** Backend not running or wrong port

**Fix:**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart backend
cd backend
npm run dev
```

#### 2. **403 Forbidden**
**Cause:** Nginx user doesn't have access to files

**Fix:**
```bash
# Set correct permissions
sudo chown -R www-data:www-data /opt/dashboard/frontend/dist
sudo chmod -R 755 /opt/dashboard/frontend/dist
```

#### 3. **Hot Reload Not Working (Dev)**
**Cause:** WebSocket proxy not configured

**Fix:**
```nginx
# Ensure these headers are set in location /
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

#### 4. **CORS Errors**
**Cause:** CORS headers not properly configured

**Dev Fix:**
```nginx
add_header Access-Control-Allow-Origin "*" always;
```

**Prod Fix:**
```nginx
add_header Access-Control-Allow-Origin "https://wemakemarin.com" always;
add_header Access-Control-Allow-Credentials "true" always;
```

---

## 📊 Performance Optimization

### Caching Strategy

```nginx
# Static assets - 1 year
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# HTML - no cache
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

### Gzip Compression

Add to `http` block in `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss
           application/rss+xml font/truetype font/opentype
           application/vnd.ms-fontobject image/svg+xml;
```

### Connection Pooling

```nginx
upstream backend {
    server 127.0.0.1:5000;
    keepalive 64;  # Keep 64 connections alive
}
```

---

## 🧪 Testing Configuration

### Syntax Check
```bash
sudo nginx -t
```

### Reload Without Downtime
```bash
sudo systemctl reload nginx
```

### Full Restart
```bash
sudo systemctl restart nginx
```

### Check Status
```bash
sudo systemctl status nginx
```

### View Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Specific site logs
sudo tail -f /var/log/nginx/wemakemarin-access.log
```

---

## 📋 Checklist

### Pre-Deployment
- [ ] Frontend built (`npm run build` in frontend/)
- [ ] Backend running on port 5000
- [ ] Nginx installed
- [ ] Firewall allows HTTP/HTTPS (ports 80/443)
- [ ] DNS configured for all domains

### During Setup
- [ ] Config file copied to `/etc/nginx/sites-available/`
- [ ] Symbolic link created in `/etc/nginx/sites-enabled/`
- [ ] Nginx syntax test passed (`nginx -t`)
- [ ] Nginx reloaded successfully

### Post-Setup
- [ ] Frontend accessible at domain
- [ ] API endpoints working (`/api/health`)
- [ ] SSL certificates installed
- [ ] HTTP redirects to HTTPS
- [ ] No browser console errors
- [ ] CORS working correctly

---

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx SSL Configuration](https://ssl-config.mozilla.org/#server=nginx)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)

---

## 🆘 Support

If you encounter issues:

1. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check backend logs: `cd backend && tail -f logs/error.log`
3. Verify services running: `sudo systemctl status nginx`
4. Test configuration: `sudo nginx -t`

---

**Last Updated:** 2025-10-15  
**Config Files:**
- `nginx-dev.conf` - Development
- `nginx-production.conf` - Production  
- `nginx.conf` - Generic/Flexible

