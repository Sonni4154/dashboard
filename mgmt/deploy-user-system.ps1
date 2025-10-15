# Deploy User Management System to Production
Write-Host "🚀 Deploying User Management System..." -ForegroundColor Green
Write-Host ""

# Step 1: Upload files
Write-Host "Step 1: Uploading backend files..." -ForegroundColor Cyan
scp backend/src/db/user-schema.ts root@23.128.116.9:/opt/dashboard/backend/src/db/
scp backend/src/services/userService.ts root@23.128.116.9:/opt/dashboard/backend/src/services/
scp backend/src/middleware/customAuth.ts root@23.128.116.9:/opt/dashboard/backend/src/middleware/
scp backend/src/routes/auth.ts root@23.128.116.9:/opt/dashboard/backend/src/routes/
scp backend/src/routes/users.ts root@23.128.116.9:/opt/dashboard/backend/src/routes/
scp backend/src/index.ts root@23.128.116.9:/opt/dashboard/backend/src/
scp backend/src/db/index.ts root@23.128.116.9:/opt/dashboard/backend/src/db/

Write-Host ""
Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""

# Step 2: Generate JWT Secret
Write-Host "Step 2: Generate JWT Secret..." -ForegroundColor Cyan
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host "Generated JWT_SECRET: $JWT_SECRET" -ForegroundColor Yellow
Write-Host ""

# Step 3: Instructions
Write-Host "Step 3: SSH into server and run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh root@23.128.116.9" -ForegroundColor White
Write-Host "cd /opt/dashboard/backend" -ForegroundColor White
Write-Host "nano .env" -ForegroundColor White
Write-Host ""
Write-Host "Add these lines to .env:" -ForegroundColor Yellow
Write-Host "JWT_SECRET=`"$JWT_SECRET`"" -ForegroundColor White
Write-Host "JWT_EXPIRES_IN=`"24h`"" -ForegroundColor White
Write-Host "SESSION_EXPIRES_IN=`"7d`"" -ForegroundColor White
Write-Host "REGISTRATION_ENABLED=`"false`"" -ForegroundColor White
Write-Host ""
Write-Host "Then rebuild and restart:" -ForegroundColor Yellow
Write-Host "npm run build" -ForegroundColor White
Write-Host "pm2 restart all" -ForegroundColor White
Write-Host "pm2 logs --lines 20" -ForegroundColor White
Write-Host ""

Write-Host "Step 4: Test the login:" -ForegroundColor Cyan
Write-Host 'curl -X POST https://api.wemakemarin.com/api/auth/login -H "Content-Type: application/json" -d "{\"identifier\":\"admin\",\"password\":\"admin123\"}"' -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment script complete!" -ForegroundColor Green
