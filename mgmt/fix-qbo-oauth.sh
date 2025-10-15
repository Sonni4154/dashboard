#!/bin/bash

echo "🔧 Fixing QuickBooks OAuth to set companyId..."

ssh root@23.128.116.9 << 'EOF'
cd /opt/dashboard/backend

# Backup the file
cp dist/routes/qbo-oauth.js dist/routes/qbo-oauth.js.backup

# Add companyId: realmId after the realmId line
sed -i '/realmId: realmId,/a\            companyId: realmId,' dist/routes/qbo-oauth.js

echo "✅ Fixed qbo-oauth.js to set companyId = realmId"

# Restart PM2
pm2 restart all

echo "✅ PM2 restarted"

EOF

echo ""
echo "✅ Done! Now try reconnecting QuickBooks:"
echo "   https://www.wemakemarin.com/api/qbo/connect"

