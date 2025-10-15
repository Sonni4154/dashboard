#!/bin/bash

echo "🔧 Fixing invoices column name in compiled JavaScript..."

# SSH into server and fix the column name
ssh root@23.128.116.9 << 'EOF'
cd /opt/dashboard/backend

# Backup the file
cp dist/routes/invoices.js dist/routes/invoices.js.backup

# Fix the column name: invoices_lineItems -> invoice_line_items
sed -i 's/invoices_lineItems/invoice_line_items/g' dist/routes/invoices.js

echo "✅ Fixed column name in dist/routes/invoices.js"

# Restart PM2
pm2 restart all

echo "✅ PM2 restarted"

# Test the endpoint
echo ""
echo "Testing invoices endpoint..."
curl -s https://api.wemakemarin.com/api/invoices | head -c 500

EOF

echo ""
echo "✅ Done! Test the invoices endpoint now."

