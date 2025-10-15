#!/bin/bash

# Deploy User Management System to Production Server
# Run this script from the project root directory

SERVER="root@23.128.116.9"
BACKEND_PATH="/opt/dashboard/backend"

echo "🚀 Deploying User Management System to Production..."

# Upload new backend files
echo "📤 Uploading new files..."
scp backend/src/db/user-schema.ts $SERVER:$BACKEND_PATH/src/db/
scp backend/src/services/userService.ts $SERVER:$BACKEND_PATH/src/services/
scp backend/src/middleware/customAuth.ts $SERVER:$BACKEND_PATH/src/middleware/
scp backend/src/routes/auth.ts $SERVER:$BACKEND_PATH/src/routes/
scp backend/src/routes/users.ts $SERVER:$BACKEND_PATH/src/routes/

# Upload updated files
echo "📤 Uploading updated files..."
scp backend/src/index.ts $SERVER:$BACKEND_PATH/src/
scp backend/src/db/index.ts $SERVER:$BACKEND_PATH/src/db/
scp backend/env.example $SERVER:$BACKEND_PATH/

echo "✅ Files uploaded successfully!"

# Generate JWT secret
echo ""
echo "🔑 Generating JWT Secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "Generated JWT_SECRET: $JWT_SECRET"
echo ""

# Instructions for manual steps
echo "📋 Manual Steps Required:"
echo ""
echo "1. SSH into the server:"
echo "   ssh $SERVER"
echo ""
echo "2. Add to /opt/dashboard/backend/.env:"
echo "   JWT_SECRET=\"$JWT_SECRET\""
echo "   JWT_EXPIRES_IN=\"24h\""
echo "   SESSION_EXPIRES_IN=\"7d\""
echo "   REGISTRATION_ENABLED=\"false\""
echo ""
echo "3. Rebuild and restart:"
echo "   cd $BACKEND_PATH"
echo "   npm run build"
echo "   pm2 restart all"
echo ""
echo "4. Test the login endpoint:"
echo "   curl -X POST https://api.wemakemarin.com/api/auth/login \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"identifier\":\"admin\",\"password\":\"admin123\"}'"
echo ""
echo "5. IMPORTANT: Change default passwords!"
echo "   - Admin: admin / admin123"
echo "   - Manager: manager / manager123"
echo "   - User: user / user123"
echo ""
echo "✅ Deployment script complete!"
