# Deploy Auth Fix (Replace problematic files)
Write-Host "🔧 Deploying Auth Fix..." -ForegroundColor Green
Write-Host ""

# Step 1: Upload fixed files
Write-Host "Step 1: Uploading fixed backend files..." -ForegroundColor Cyan
scp backend/src/routes/auth-simple.ts root@23.128.116.9:/opt/dashboard/backend/src/routes/auth.ts
scp backend/src/services/userServiceSimple.ts root@23.128.116.9:/opt/dashboard/backend/src/services/
scp backend/src/middleware/customAuth.ts root@23.128.116.9:/opt/dashboard/backend/src/middleware/

Write-Host ""
Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions
Write-Host "Step 2: SSH into server and run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh root@23.128.116.9" -ForegroundColor White
Write-Host "cd /opt/dashboard/backend" -ForegroundColor White
Write-Host ""
Write-Host "Add these lines to .env if not already there:" -ForegroundColor Yellow
Write-Host "JWT_SECRET=`"your-secret-here`"" -ForegroundColor White
Write-Host "JWT_EXPIRES_IN=`"24h`"" -ForegroundColor White
Write-Host "SESSION_EXPIRES_IN=`"7d`"" -ForegroundColor White
Write-Host "REGISTRATION_ENABLED=`"false`"" -ForegroundColor White
Write-Host ""
Write-Host "Then rebuild and restart:" -ForegroundColor Yellow
Write-Host "npm run build" -ForegroundColor White
Write-Host "pm2 restart all" -ForegroundColor White
Write-Host "pm2 logs --lines 20" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Test the login:" -ForegroundColor Cyan
Write-Host 'curl -X POST https://api.wemakemarin.com/api/auth/login -H "Content-Type: application/json" -d "{\"identifier\":\"admin\",\"password\":\"admin123\"}"' -ForegroundColor White
Write-Host ""
Write-Host "Step 4: Default users:" -ForegroundColor Cyan
Write-Host "admin / admin123" -ForegroundColor White
Write-Host "manager / admin123" -ForegroundColor White
Write-Host "user / admin123" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment script complete!" -ForegroundColor Green
