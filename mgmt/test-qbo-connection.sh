#!/bin/bash

# QuickBooks Connection Test Script
# Tests all aspects of the updated QB integration

echo "🧪 QuickBooks Integration Test Suite"
echo "===================================="
echo ""

# Configuration
API_BASE="http://localhost:5000"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_health() {
    echo "1. Testing Backend Health..."
    response=$(curl -s "${API_BASE}/health")
    if echo "$response" | grep -q "\"ok\":true"; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        echo "$response"
        return 1
    fi
}

test_database() {
    echo ""
    echo "2. Testing Database Connection..."
    response=$(curl -s "${API_BASE}/health")
    if echo "$response" | grep -q "\"database\":\"connected\""; then
        echo -e "${GREEN}✅ Database connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        return 1
    fi
}

test_token_status() {
    echo ""
    echo "3. Testing Token Status..."
    response=$(curl -s "${API_BASE}/api/qbo/token-status")
    
    if echo "$response" | grep -q "hasToken"; then
        hasToken=$(echo "$response" | grep -o '"hasToken":[^,]*' | cut -d':' -f2)
        
        if [ "$hasToken" = "true" ]; then
            echo -e "${GREEN}✅ Token found in database${NC}"
            echo "   Status: $(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
            echo "   Active: $(echo "$response" | grep -o '"isActive":[^,]*' | cut -d':' -f2)"
            return 0
        else
            echo -e "${YELLOW}⚠️  No active token found${NC}"
            echo "   Please run OAuth flow: ${API_BASE}/api/qbo/connect"
            return 2
        fi
    else
        echo -e "${RED}❌ Token status check failed${NC}"
        echo "$response"
        return 1
    fi
}

test_oauth_endpoint() {
    echo ""
    echo "4. Testing OAuth Endpoints..."
    
    # Test connect endpoint (should return redirect)
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/api/qbo/connect")
    
    if [ "$status_code" = "302" ] || [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ OAuth connect endpoint working${NC}"
        echo "   Connect URL: ${API_BASE}/api/qbo/connect"
        return 0
    else
        echo -e "${RED}❌ OAuth connect endpoint failed (${status_code})${NC}"
        return 1
    fi
}

test_schema_alignment() {
    echo ""
    echo "5. Testing Schema Alignment..."
    
    # Check if the token has new schema fields
    response=$(curl -s "${API_BASE}/api/qbo/token-status")
    
    has_realm_id=$(echo "$response" | grep -c "realmId")
    has_environment=$(echo "$response" | grep -c "environment")
    has_refresh_expires=$(echo "$response" | grep -c "refreshTokenExpiresAt")
    
    if [ "$has_realm_id" -gt 0 ] && [ "$has_environment" -gt 0 ] && [ "$has_refresh_expires" -gt 0 ]; then
        echo -e "${GREEN}✅ Schema migration successful${NC}"
        echo "   ✓ realm_id field present"
        echo "   ✓ environment field present"
        echo "   ✓ refresh_token_expires_at field present"
        return 0
    else
        echo -e "${YELLOW}⚠️  Schema partially migrated${NC}"
        [ "$has_realm_id" -eq 0 ] && echo "   ✗ realm_id missing"
        [ "$has_environment" -eq 0 ] && echo "   ✗ environment missing"
        [ "$has_refresh_expires" -eq 0 ] && echo "   ✗ refresh_token_expires_at missing"
        return 2
    fi
}

print_instructions() {
    echo ""
    echo "================================================"
    echo "📋 Next Steps"
    echo "================================================"
    echo ""
    echo "To complete QuickBooks integration:"
    echo ""
    echo "1. Configure OAuth credentials in backend/.env:"
    echo "   QBO_CLIENT_ID=your_client_id"
    echo "   QBO_CLIENT_SECRET=your_client_secret"
    echo "   QBO_REDIRECT_URI=http://localhost:5000/api/qbo/callback"
    echo ""
    echo "2. Run OAuth flow:"
    echo "   Open: ${API_BASE}/api/qbo/connect"
    echo ""
    echo "3. Test data sync:"
    echo "   curl -X POST ${API_BASE}/api/sync/all"
    echo ""
    echo "4. Check sync status:"
    echo "   curl ${API_BASE}/api/sync/status"
    echo ""
}

# Run all tests
echo "Starting tests..."
echo ""

test_health
health_result=$?

test_database
db_result=$?

test_token_status
token_result=$?

test_oauth_endpoint
oauth_result=$?

test_schema_alignment
schema_result=$?

# Summary
echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"
echo ""

total_tests=5
passed=0
failed=0
warnings=0

[ $health_result -eq 0 ] && ((passed++)) || ((failed++))
[ $db_result -eq 0 ] && ((passed++)) || ((failed++))
[ $token_result -eq 0 ] && ((passed++)) || { [ $token_result -eq 2 ] && ((warnings++)) || ((failed++)); }
[ $oauth_result -eq 0 ] && ((passed++)) || ((failed++))
[ $schema_result -eq 0 ] && ((passed++)) || { [ $schema_result -eq 2 ] && ((warnings++)) || ((failed++)); }

echo -e "${GREEN}Passed:  $passed${NC}"
echo -e "${RED}Failed:  $failed${NC}"
echo -e "${YELLOW}Warnings: $warnings${NC}"
echo ""

if [ $failed -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Your QuickBooks integration is ready!"
elif [ $failed -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Tests passed with warnings${NC}"
    print_instructions
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please check the errors above and:"
    echo "1. Make sure backend is running: cd backend && npm run dev"
    echo "2. Verify DATABASE_URL in backend/.env"
    echo "3. Check backend logs for errors"
fi

echo ""

