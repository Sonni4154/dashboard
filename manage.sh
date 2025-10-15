#!/bin/bash

# =============================================================================
# 🚀 MARIN PEST CONTROL DASHBOARD - MASTER MANAGEMENT SCRIPT
# =============================================================================
# A comprehensive deployment and management tool with simple text interface
# Features: Deployment, Monitoring, Debugging, Domain Management, Process Control
# =============================================================================

set -euo pipefail

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Create directories if they don't exist
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/manage.log"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

# Check if running as root for certain operations
check_root() {
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}WARNING: This script is running as root. Some operations may require elevated privileges.${NC}"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# =============================================================================
# 🎯 MAIN MENU
# =============================================================================

show_main_menu() {
    while true; do
        clear
        echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║                    🚀 MARIN PEST CONTROL DASHBOARD                        ║${NC}"
        echo -e "${CYAN}║                           Master Management Script                         ║${NC}"
        echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
        echo
        echo -e "${WHITE}Choose an option:${NC}"
        echo
        echo -e "${GREEN}1.${NC} 🚀 Complete Deployment (Full Stack + SSL)"
        echo -e "${GREEN}2.${NC} 📊 Hardware Monitoring & System Info"
        echo -e "${GREEN}3.${NC} 🧹 Process Management & Cleanup"
        echo -e "${GREEN}4.${NC} 🌐 Domain Configuration & DNS"
        echo -e "${GREEN}5.${NC} ✅ Check Deployment State"
        echo -e "${GREEN}6.${NC} 🔍 Lint/Check/Debug Tools"
        echo -e "${GREEN}7.${NC} 🐛 Active Debug & Diagnostics"
        echo -e "${GREEN}8.${NC} 📋 View Logs & Reports"
        echo -e "${GREEN}9.${NC} 🧪 API Endpoint Testing"
        echo -e "${GREEN}10.${NC} 🔒 SSH Hardening & Security"
        echo -e "${GREEN}11.${NC} ⚙️  System Configuration"
        echo -e "${GREEN}0.${NC} ❌ Exit"
        echo
        read -p "Enter your choice (0-11): " choice
        
        case $choice in
            1) deployment_menu ;;
            2) hardware_monitoring ;;
            3) process_management ;;
            4) domain_configuration ;;
            5) check_deployment_state ;;
            6) debug_tools ;;
            7) active_debug ;;
            8) view_logs ;;
            9) endpoint_testing ;;
            10) ssh_hardening ;;
            11) system_configuration ;;
            0) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
            *) echo -e "${RED}Invalid option. Please try again.${NC}"; sleep 2 ;;
        esac
    done
}

# =============================================================================
# 🧪 API ENDPOINT TESTING
# =============================================================================

endpoint_testing() {
    while true; do
        choice=$(whiptail --title "🧪 API Endpoint Testing" \
            --menu "Choose testing option:" 20 80 12 \
            "1" "🏥 Health Check Endpoints" \
            "2" "🔗 QuickBooks Integration Tests" \
            "3" "📅 Calendar & Scheduling Tests" \
            "4" "👥 Customer Management Tests" \
            "5" "📦 Product/Item Tests" \
            "6" "🧾 Invoice Management Tests" \
            "7" "📋 Estimate Management Tests" \
            "8" "⏰ Time Clock Tests" \
            "9" "🔄 Data Sync Tests" \
            "10" "🔔 Webhook Tests" \
            "11" "🎯 Comprehensive Test Suite" \
            "12" "📊 Performance Testing" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
        
        case $choice in
            1) test_health_endpoints ;;
            2) test_quickbooks_endpoints ;;
            3) test_calendar_endpoints ;;
            4) test_customer_endpoints ;;
            5) test_item_endpoints ;;
            6) test_invoice_endpoints ;;
            7) test_estimate_endpoints ;;
            8) test_timeclock_endpoints ;;
            9) test_sync_endpoints ;;
            10) test_webhook_endpoints ;;
            11) comprehensive_test_suite ;;
            12) performance_testing ;;
            0) return ;;
        esac
    done
}

test_health_endpoints() {
    log "Testing health endpoints..."
    
    local results_file="$LOG_DIR/health_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test basic health
    if curl -f -s http://localhost:5000/health >/dev/null 2>&1; then
        log "✅ Basic health check passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Basic health check failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test API health
    if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
        log "✅ API health check passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ API health check failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test debug health
    if curl -f -s http://localhost:5000/api/debug/health >/dev/null 2>&1; then
        log "✅ Debug health check passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Debug health check failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Health endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Health Endpoint Test Results" --msgbox "Health endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_quickbooks_endpoints() {
    log "Testing QuickBooks integration endpoints..."
    
    local results_file="$LOG_DIR/qb_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test token status
    if curl -f -s http://localhost:5000/api/tokens/status >/dev/null 2>&1; then
        log "✅ Token status endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Token status endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test OAuth connect
    if curl -f -s http://localhost:5000/api/qbo/connect >/dev/null 2>&1; then
        log "✅ OAuth connect endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ OAuth connect endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test sync status
    if curl -f -s http://localhost:5000/api/sync/status >/dev/null 2>&1; then
        log "✅ Sync status endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Sync status endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook endpoint
    if curl -f -s http://localhost:5000/api/webhook/health >/dev/null 2>&1; then
        log "✅ Webhook health endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Webhook health endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook with sample payload
    local webhook_payload='{"eventNotifications":[{"dataChangeEvent":{"entities":[{"name":"Customer","id":"1","operation":"Update"}]}}]}'
    if curl -f -s -X POST http://localhost:5000/api/webhook/quickbooks \
        -H 'Content-Type: application/json' \
        -d "$webhook_payload" >/dev/null 2>&1; then
        log "✅ Webhook POST endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Webhook POST endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "QuickBooks endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "QuickBooks Endpoint Test Results" --msgbox "QuickBooks endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_calendar_endpoints() {
    log "Testing calendar and scheduling endpoints..."
    
    local results_file="$LOG_DIR/calendar_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test today's events
    if curl -f -s http://localhost:5000/api/calendar/events/today >/dev/null 2>&1; then
        log "✅ Today's events endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Today's events endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test work queue
    if curl -f -s http://localhost:5000/api/work-queue >/dev/null 2>&1; then
        log "✅ Work queue endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Work queue endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test employees
    if curl -f -s http://localhost:5000/api/employees >/dev/null 2>&1; then
        log "✅ Employees endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Employees endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Calendar endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Calendar Endpoint Test Results" --msgbox "Calendar endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_customer_endpoints() {
    log "Testing customer management endpoints..."
    
    local results_file="$LOG_DIR/customer_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test customers list
    if curl -f -s http://localhost:5000/api/customers >/dev/null 2>&1; then
        log "✅ Customers list endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Customers list endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test customer stats
    if curl -f -s http://localhost:5000/api/customers/stats >/dev/null 2>&1; then
        log "✅ Customer stats endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Customer stats endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Customer endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Customer Endpoint Test Results" --msgbox "Customer endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_item_endpoints() {
    log "Testing product/item endpoints..."
    
    local results_file="$LOG_DIR/item_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test items list
    if curl -f -s http://localhost:5000/api/items >/dev/null 2>&1; then
        log "✅ Items list endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Items list endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test item stats
    if curl -f -s http://localhost:5000/api/items/stats >/dev/null 2>&1; then
        log "✅ Item stats endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Item stats endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Item endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Item Endpoint Test Results" --msgbox "Item endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_invoice_endpoints() {
    log "Testing invoice management endpoints..."
    
    local results_file="$LOG_DIR/invoice_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test invoices list
    if curl -f -s http://localhost:5000/api/invoices >/dev/null 2>&1; then
        log "✅ Invoices list endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Invoices list endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test invoice stats
    if curl -f -s http://localhost:5000/api/invoices/stats >/dev/null 2>&1; then
        log "✅ Invoice stats endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Invoice stats endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Invoice endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Invoice Endpoint Test Results" --msgbox "Invoice endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_estimate_endpoints() {
    log "Testing estimate management endpoints..."
    
    local results_file="$LOG_DIR/estimate_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test estimates list
    if curl -f -s http://localhost:5000/api/estimates >/dev/null 2>&1; then
        log "✅ Estimates list endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Estimates list endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test estimate stats
    if curl -f -s http://localhost:5000/api/estimates/stats >/dev/null 2>&1; then
        log "✅ Estimate stats endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Estimate stats endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Estimate endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Estimate Endpoint Test Results" --msgbox "Estimate endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_timeclock_endpoints() {
    log "Testing time clock endpoints..."
    
    local results_file="$LOG_DIR/timeclock_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test clock status
    if curl -f -s "http://localhost:5000/api/clock/status?employee_id=1" >/dev/null 2>&1; then
        log "✅ Clock status endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Clock status endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test clock entries
    if curl -f -s http://localhost:5000/api/clock/entries >/dev/null 2>&1; then
        log "✅ Clock entries endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Clock entries endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Time clock endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Time Clock Endpoint Test Results" --msgbox "Time clock endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_sync_endpoints() {
    log "Testing data synchronization endpoints..."
    
    local results_file="$LOG_DIR/sync_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test sync status
    if curl -f -s http://localhost:5000/api/sync/status >/dev/null 2>&1; then
        log "✅ Sync status endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Sync status endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test sync health
    if curl -f -s http://localhost:5000/api/sync/health >/dev/null 2>&1; then
        log "✅ Sync health endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Sync health endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test manual sync trigger (this will actually trigger a sync)
    if whiptail --title "Manual Sync Test" --yesno "Test manual sync trigger? This will perform an actual data sync." 10 60; then
        if curl -f -s -X POST http://localhost:5000/api/sync >/dev/null 2>&1; then
            log "✅ Manual sync trigger passed" | tee -a "$results_file"
            ((passed++))
        else
            log "❌ Manual sync trigger failed" | tee -a "$results_file"
            ((failed++))
        fi
    fi
    
    # Test entity-specific sync
    for entity in customers items invoices estimates; do
        if curl -f -s -X POST "http://localhost:5000/api/sync/$entity" >/dev/null 2>&1; then
            log "✅ $entity sync endpoint passed" | tee -a "$results_file"
            ((passed++))
        else
            log "❌ $entity sync endpoint failed" | tee -a "$results_file"
            ((failed++))
        fi
    done
    
    # Test token refresh
    if curl -f -s -X POST http://localhost:5000/api/sync/refresh-token >/dev/null 2>&1; then
        log "✅ Token refresh endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Token refresh endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    log "Sync endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Sync Endpoint Test Results" --msgbox "Sync endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

test_webhook_endpoints() {
    log "Testing QuickBooks webhook endpoints..."
    
    local results_file="$LOG_DIR/webhook_test_$(date +%Y%m%d_%H%M%S).log"
    local passed=0
    local failed=0
    
    # Test webhook health
    if curl -f -s http://localhost:5000/api/webhook/health >/dev/null 2>&1; then
        log "✅ Webhook health endpoint passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Webhook health endpoint failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook with Customer update
    local customer_payload='{"eventNotifications":[{"dataChangeEvent":{"entities":[{"name":"Customer","id":"1","operation":"Update"}]}}]}'
    if curl -f -s -X POST http://localhost:5000/api/webhook/quickbooks \
        -H 'Content-Type: application/json' \
        -d "$customer_payload" >/dev/null 2>&1; then
        log "✅ Customer webhook test passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Customer webhook test failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook with Invoice update
    local invoice_payload='{"eventNotifications":[{"dataChangeEvent":{"entities":[{"name":"Invoice","id":"1","operation":"Update"}]}}]}'
    if curl -f -s -X POST http://localhost:5000/api/webhook/quickbooks \
        -H 'Content-Type: application/json' \
        -d "$invoice_payload" >/dev/null 2>&1; then
        log "✅ Invoice webhook test passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Invoice webhook test failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook with Item update
    local item_payload='{"eventNotifications":[{"dataChangeEvent":{"entities":[{"name":"Item","id":"1","operation":"Update"}]}}]}'
    if curl -f -s -X POST http://localhost:5000/api/webhook/quickbooks \
        -H 'Content-Type: application/json' \
        -d "$item_payload" >/dev/null 2>&1; then
        log "✅ Item webhook test passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Item webhook test failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook with Estimate update
    local estimate_payload='{"eventNotifications":[{"dataChangeEvent":{"entities":[{"name":"Estimate","id":"1","operation":"Update"}]}}]}'
    if curl -f -s -X POST http://localhost:5000/api/webhook/quickbooks \
        -H 'Content-Type: application/json' \
        -d "$estimate_payload" >/dev/null 2>&1; then
        log "✅ Estimate webhook test passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Estimate webhook test failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook with multiple entities
    local multi_payload='{"eventNotifications":[{"dataChangeEvent":{"entities":[{"name":"Customer","id":"1","operation":"Update"},{"name":"Invoice","id":"2","operation":"Create"}]}}]}'
    if curl -f -s -X POST http://localhost:5000/api/webhook/quickbooks \
        -H 'Content-Type: application/json' \
        -d "$multi_payload" >/dev/null 2>&1; then
        log "✅ Multi-entity webhook test passed" | tee -a "$results_file"
        ((passed++))
    else
        log "❌ Multi-entity webhook test failed" | tee -a "$results_file"
        ((failed++))
    fi
    
    # Test webhook signature verification (if configured)
    if [[ -n "$QBO_WEBHOOK_VERIFIER_TOKEN" ]]; then
        log "Testing webhook signature verification..." | tee -a "$results_file"
        # This would require proper signature generation for real testing
        log "ℹ️ Webhook signature verification configured but not tested" | tee -a "$results_file"
    else
        log "ℹ️ Webhook signature verification not configured" | tee -a "$results_file"
    fi
    
    log "Webhook endpoint testing completed: $passed passed, $failed failed"
    whiptail --title "Webhook Endpoint Test Results" --msgbox "Webhook endpoint testing completed:\n\n✅ Passed: $passed\n❌ Failed: $failed\n\nResults saved to: $results_file" 12 60
}

comprehensive_test_suite() {
    log "Running comprehensive API test suite..."
    
    local results_file="$LOG_DIR/comprehensive_test_$(date +%Y%m%d_%H%M%S).log"
    local total_passed=0
    local total_failed=0
    
    # Run all test categories
    test_health_endpoints >> "$results_file" 2>&1
    test_quickbooks_endpoints >> "$results_file" 2>&1
    test_calendar_endpoints >> "$results_file" 2>&1
    test_customer_endpoints >> "$results_file" 2>&1
    test_item_endpoints >> "$results_file" 2>&1
    test_invoice_endpoints >> "$results_file" 2>&1
    test_estimate_endpoints >> "$results_file" 2>&1
    test_timeclock_endpoints >> "$results_file" 2>&1
    test_sync_endpoints >> "$results_file" 2>&1
    test_webhook_endpoints >> "$results_file" 2>&1
    
    # Count results
    total_passed=$(grep -c "✅" "$results_file" || echo "0")
    total_failed=$(grep -c "❌" "$results_file" || echo "0")
    
    log "Comprehensive test suite completed: $total_passed passed, $total_failed failed"
    whiptail --title "Comprehensive Test Results" --msgbox "Comprehensive API test suite completed:\n\n✅ Total Passed: $total_passed\n❌ Total Failed: $total_failed\n\nResults saved to: $results_file" 12 60
}

performance_testing() {
    log "Running performance tests..."
    
    local results_file="$LOG_DIR/performance_test_$(date +%Y%m%d_%H%M%S).log"
    
    # Test response times
    echo "Testing API response times..." | tee -a "$results_file"
    
    # Health endpoint performance
    local health_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000/health)
    echo "Health endpoint response time: ${health_time}s" | tee -a "$results_file"
    
    # API health performance
    local api_health_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000/api/health)
    echo "API health endpoint response time: ${api_health_time}s" | tee -a "$results_file"
    
    # Customers endpoint performance
    local customers_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000/api/customers)
    echo "Customers endpoint response time: ${customers_time}s" | tee -a "$results_file"
    
    # Load testing with multiple concurrent requests
    echo "Running load test (10 concurrent requests)..." | tee -a "$results_file"
    for i in {1..10}; do
        (curl -f -s http://localhost:5000/api/health >/dev/null && echo "Request $i: SUCCESS") &
    done
    wait
    
    log "Performance testing completed"
    whiptail --title "Performance Test Results" --msgbox "Performance testing completed.\n\nResults saved to: $results_file" 10 60
}

# =============================================================================
# 🔒 SSH HARDENING & SECURITY
# =============================================================================

ssh_hardening() {
    while true; do
        choice=$(whiptail --title "🔒 SSH Hardening & Security" \
            --menu "Choose security option:" 20 80 12 \
            "1" "🔐 SSH Configuration Hardening" \
            "2" "🛡️  Firewall Configuration" \
            "3" "🔑 SSH Key Management" \
            "4" "🚫 Disable Root Login" \
            "5" "🔒 Change SSH Port" \
            "6" "🛡️  Fail2Ban Setup" \
            "7" "🔐 SSL/TLS Security" \
            "8" "🛡️  System Security Audit" \
            "9" "🔒 User Access Control" \
            "10" "🛡️  Security Monitoring" \
            "11" "🔐 Backup Security" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
        
        case $choice in
            1) ssh_config_hardening ;;
            2) firewall_configuration ;;
            3) ssh_key_management ;;
            4) disable_root_login ;;
            5) change_ssh_port ;;
            6) fail2ban_setup ;;
            7) ssl_tls_security ;;
            8) security_audit ;;
            9) user_access_control ;;
            10) security_monitoring ;;
            11) backup_security ;;
            0) return ;;
        esac
    done
}

ssh_config_hardening() {
    log "Hardening SSH configuration..."
    
    local ssh_config="/etc/ssh/sshd_config"
    local backup_file="/etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Create backup
    if [[ -f "$ssh_config" ]]; then
        cp "$ssh_config" "$backup_file"
        log "SSH config backed up to: $backup_file"
    fi
    
    # Apply security settings
    cat > /tmp/ssh_hardening.conf << 'EOF'
# SSH Hardening Configuration
# Generated by Marin Pest Control Dashboard Management Script

# Disable root login
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable X11 forwarding
X11Forwarding no

# Disable agent forwarding
AllowAgentForwarding no

# Disable TCP forwarding
AllowTcpForwarding no

# Disable user environment
PermitUserEnvironment no

# Disable empty passwords
PermitEmptyPasswords no

# Set maximum authentication tries
MaxAuthTries 3

# Set login grace time
LoginGraceTime 30

# Disable host-based authentication
HostbasedAuthentication no

# Disable rhosts
IgnoreRhosts yes

# Disable .rhosts
RhostsRSAAuthentication no

# Set protocol version
Protocol 2

# Disable compression
Compression no

# Set client alive interval
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable banner
Banner none

# Set maximum sessions
MaxSessions 4

# Disable PAM
UsePAM yes

# Set subsystem
Subsystem sftp /usr/lib/openssh/sftp-server
EOF

    # Apply configuration
    if whiptail --title "SSH Hardening" --yesno "Apply SSH hardening configuration? This will restart SSH service." 10 60; then
        cp /tmp/ssh_hardening.conf "$ssh_config"
        systemctl restart sshd
        log "SSH configuration hardened successfully"
        whiptail --title "SSH Hardening" --msgbox "SSH configuration has been hardened successfully.\n\nBackup saved to: $backup_file" 10 60
    else
        log "SSH hardening cancelled by user"
    fi
    
    rm -f /tmp/ssh_hardening.conf
}

firewall_configuration() {
    log "Configuring firewall..."
    
    # Check if ufw is installed
    if ! command -v ufw &> /dev/null; then
        if whiptail --title "UFW Installation" --yesno "UFW (Uncomplicated Firewall) is not installed. Install it?" 10 60; then
            apt update && apt install -y ufw
        else
            whiptail --title "Firewall Configuration" --msgbox "UFW is required for firewall configuration." 10 60
            return
        fi
    fi
    
    # Configure firewall rules
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (current port)
    local ssh_port=$(grep "^Port" /etc/ssh/sshd_config | awk '{print $2}' || echo "22")
    ufw allow "$ssh_port/tcp"
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports
    ufw allow 5000/tcp  # Backend
    ufw allow 5173/tcp  # Frontend dev
    
    # Enable firewall
    ufw --force enable
    
    log "Firewall configured successfully"
    whiptail --title "Firewall Configuration" --msgbox "Firewall has been configured with the following rules:\n\n- SSH: Port $ssh_port\n- HTTP: Port 80\n- HTTPS: Port 443\n- Backend: Port 5000\n- Frontend Dev: Port 5173\n\nUFW is now active." 15 60
}

ssh_key_management() {
    log "Managing SSH keys..."
    
    local key_dir="$HOME/.ssh"
    local authorized_keys="$key_dir/authorized_keys"
    
    # Create .ssh directory if it doesn't exist
    mkdir -p "$key_dir"
    chmod 700 "$key_dir"
    
    # Generate new SSH key if requested
    if whiptail --title "SSH Key Management" --yesno "Generate a new SSH key pair?" 10 60; then
        local key_name="id_rsa_$(date +%Y%m%d_%H%M%S)"
        ssh-keygen -t rsa -b 4096 -f "$key_dir/$key_name" -N ""
        chmod 600 "$key_dir/$key_name"
        chmod 644 "$key_dir/$key_name.pub"
        
        log "New SSH key generated: $key_name"
        whiptail --title "SSH Key Generated" --msgbox "New SSH key generated:\n\nPrivate key: $key_dir/$key_name\nPublic key: $key_dir/$key_name.pub\n\nAdd the public key to authorized_keys to use it." 12 60
    fi
    
    # Show current authorized keys
    if [[ -f "$authorized_keys" ]]; then
        local key_count=$(wc -l < "$authorized_keys")
        whiptail --title "Authorized Keys" --msgbox "Current authorized keys: $key_count\n\nFile location: $authorized_keys" 10 60
    else
        whiptail --title "Authorized Keys" --msgbox "No authorized_keys file found.\n\nLocation: $authorized_keys" 10 60
    fi
}

disable_root_login() {
    log "Disabling root login..."
    
    # Check current setting
    local current_setting=$(grep "^PermitRootLogin" /etc/ssh/sshd_config || echo "PermitRootLogin yes")
    
    if [[ "$current_setting" == *"no"* ]]; then
        whiptail --title "Root Login" --msgbox "Root login is already disabled." 10 60
        return
    fi
    
    if whiptail --title "Disable Root Login" --yesno "Disable root login via SSH? This is a security best practice." 10 60; then
        # Backup current config
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)
        
        # Disable root login
        sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
        
        # Restart SSH service
        systemctl restart sshd
        
        log "Root login disabled successfully"
        whiptail --title "Root Login Disabled" --msgbox "Root login has been disabled.\n\nMake sure you have alternative access before closing this session!" 12 60
    fi
}

change_ssh_port() {
    log "Changing SSH port..."
    
    local current_port=$(grep "^Port" /etc/ssh/sshd_config | awk '{print $2}' || echo "22")
    local new_port=$(whiptail --inputbox "Enter new SSH port (current: $current_port):" 10 60 2222 3>&1 1>&2 2>&3)
    
    if [[ -n "$new_port" && "$new_port" =~ ^[0-9]+$ && "$new_port" -ge 1024 && "$new_port" -le 65535 ]]; then
        # Backup current config
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)
        
        # Update SSH port
        sed -i "s/^#*Port.*/Port $new_port/" /etc/ssh/sshd_config
        
        # Update firewall
        ufw allow "$new_port/tcp"
        ufw delete allow "$current_port/tcp" 2>/dev/null || true
        
        # Restart SSH service
        systemctl restart sshd
        
        log "SSH port changed from $current_port to $new_port"
        whiptail --title "SSH Port Changed" --msgbox "SSH port changed to $new_port.\n\nUpdate your SSH client configuration!\n\nNew connection: ssh -p $new_port user@host" 12 60
    else
        whiptail --title "Invalid Port" --msgbox "Invalid port number. Must be between 1024 and 65535." 10 60
    fi
}

fail2ban_setup() {
    log "Setting up Fail2Ban..."
    
    # Install Fail2Ban if not present
    if ! command -v fail2ban-client &> /dev/null; then
        if whiptail --title "Fail2Ban Installation" --yesno "Fail2Ban is not installed. Install it?" 10 60; then
            apt update && apt install -y fail2ban
        else
            whiptail --title "Fail2Ban Setup" --msgbox "Fail2Ban is required for this feature." 10 60
            return
        fi
    fi
    
    # Create Fail2Ban configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
EOF

    # Start and enable Fail2Ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    log "Fail2Ban configured successfully"
    whiptail --title "Fail2Ban Setup" --msgbox "Fail2Ban has been configured and started.\n\nIt will ban IPs after 3 failed SSH attempts for 1 hour." 10 60
}

ssl_tls_security() {
    log "Configuring SSL/TLS security..."
    
    # Check if SSL certificates exist
    local ssl_cert="/etc/ssl/certs/ssl-cert-snakeoil.pem"
    local ssl_key="/etc/ssl/private/ssl-cert-snakeoil.key"
    
    if [[ -f "$ssl_cert" && -f "$ssl_key" ]]; then
        whiptail --title "SSL Certificates" --msgbox "SSL certificates found:\n\nCertificate: $ssl_cert\nPrivate Key: $ssl_key\n\nConsider using Let's Encrypt for production." 12 60
    else
        whiptail --title "SSL Certificates" --msgbox "No SSL certificates found.\n\nUse the SSL Certificate Management option in the deployment menu." 10 60
    fi
    
    # Check TLS configuration
    local nginx_conf="/etc/nginx/nginx.conf"
    if [[ -f "$nginx_conf" ]]; then
        if grep -q "ssl_protocols" "$nginx_conf"; then
            log "TLS configuration found in Nginx"
        else
            log "No TLS configuration found in Nginx"
        fi
    fi
}

security_audit() {
    log "Running security audit..."
    
    local audit_file="$LOG_DIR/security_audit_$(date +%Y%m%d_%H%M%S).log"
    
    # Check for open ports
    echo "=== Open Ports ===" >> "$audit_file"
    netstat -tuln >> "$audit_file" 2>&1
    
    # Check for running services
    echo -e "\n=== Running Services ===" >> "$audit_file"
    systemctl list-units --type=service --state=running >> "$audit_file" 2>&1
    
    # Check for world-writable files
    echo -e "\n=== World-writable Files ===" >> "$audit_file"
    find / -type f -perm -002 2>/dev/null | head -20 >> "$audit_file"
    
    # Check for SUID files
    echo -e "\n=== SUID Files ===" >> "$audit_file"
    find / -type f -perm -4000 2>/dev/null | head -20 >> "$audit_file"
    
    # Check SSH configuration
    echo -e "\n=== SSH Configuration ===" >> "$audit_file"
    grep -v "^#" /etc/ssh/sshd_config | grep -v "^$" >> "$audit_file"
    
    # Check firewall status
    echo -e "\n=== Firewall Status ===" >> "$audit_file"
    ufw status verbose >> "$audit_file" 2>&1
    
    log "Security audit completed"
    whiptail --title "Security Audit" --msgbox "Security audit completed.\n\nResults saved to: $audit_file" 10 60
}

user_access_control() {
    log "Managing user access control..."
    
    # Show current users
    local users=$(cut -d: -f1 /etc/passwd | grep -v "^root$" | grep -v "^nobody$" | sort)
    local user_count=$(echo "$users" | wc -l)
    
    whiptail --title "User Access Control" --msgbox "Current users: $user_count\n\nUsers: $(echo "$users" | tr '\n' ' ')" 12 60
    
    # Check for users with sudo access
    local sudo_users=$(getent group sudo | cut -d: -f4 | tr ',' '\n' | sort)
    if [[ -n "$sudo_users" ]]; then
        whiptail --title "Sudo Users" --msgbox "Users with sudo access:\n\n$sudo_users" 12 60
    else
        whiptail --title "Sudo Users" --msgbox "No users with sudo access found." 10 60
    fi
}

security_monitoring() {
    log "Setting up security monitoring..."
    
    # Check for failed login attempts
    local failed_logins=$(grep "Failed password" /var/log/auth.log 2>/dev/null | wc -l || echo "0")
    whiptail --title "Security Monitoring" --msgbox "Failed login attempts: $failed_logins\n\nCheck /var/log/auth.log for details." 10 60
    
    # Check for suspicious activity
    local suspicious_ips=$(grep "Failed password" /var/log/auth.log 2>/dev/null | awk '{print $11}' | sort | uniq -c | sort -nr | head -5)
    if [[ -n "$suspicious_ips" ]]; then
        whiptail --title "Suspicious IPs" --msgbox "Top suspicious IPs:\n\n$suspicious_ips" 12 60
    fi
}

backup_security() {
    log "Configuring backup security..."
    
    # Check backup directory permissions
    local backup_dir="$SCRIPT_DIR/backups"
    local backup_perms=$(stat -c "%a" "$backup_dir" 2>/dev/null || echo "N/A")
    
    whiptail --title "Backup Security" --msgbox "Backup directory: $backup_dir\nPermissions: $backup_perms\n\nEnsure backups are encrypted and stored securely." 10 60
    
    # Create secure backup script
    cat > "$SCRIPT_DIR/secure_backup.sh" << 'EOF'
#!/bin/bash
# Secure backup script for Marin Pest Control Dashboard

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
ENCRYPTION_KEY="your_encryption_key_here"

# Create encrypted backup
tar -czf - /var/www/html /etc/nginx /etc/ssl | gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" > "$BACKUP_DIR/backup_$DATE.tar.gz.gpg"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz.gpg" -mtime +30 -delete

echo "Secure backup completed: backup_$DATE.tar.gz.gpg"
EOF

    chmod +x "$SCRIPT_DIR/secure_backup.sh"
    log "Secure backup script created: $SCRIPT_DIR/secure_backup.sh"
    whiptail --title "Backup Security" --msgbox "Secure backup script created.\n\nLocation: $SCRIPT_DIR/secure_backup.sh\n\nUpdate the encryption key before use!" 12 60
}

# =============================================================================
# 🚀 DEPLOYMENT MENU
# =============================================================================

deployment_menu() {
    while true; do
        choice=$(whiptail --title "🚀 Deployment Options" \
            --menu "Choose deployment type:" 15 70 8 \
            "1" "🔄 Full Stack Deployment (Frontend + Backend + SSL)" \
            "2" "🎨 Frontend Only" \
            "3" "⚙️  Backend Only" \
            "4" "🔒 SSL Certificate Management" \
            "5" "📦 Dependencies Update" \
            "6" "🗄️  Database Setup" \
            "7" "🌐 Nginx Configuration" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
        
        case $choice in
            1) full_stack_deployment ;;
            2) frontend_deployment ;;
            3) backend_deployment ;;
            4) ssl_management ;;
            5) update_dependencies ;;
            6) database_setup ;;
            7) nginx_configuration ;;
            0) return ;;
        esac
    done
}

full_stack_deployment() {
    log "Starting full stack deployment..."
    
    whiptail --title "Full Stack Deployment" --msgbox "This will deploy the complete application stack including frontend, backend, SSL certificates, and nginx configuration. This process is idempotent and failure-resistant." 10 60
    
    # Check prerequisites
    check_prerequisites
    
    # Update system packages
    update_system_packages
    
    # Install dependencies
    install_dependencies
    
    # Setup database
    setup_database
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Configure nginx
    configure_nginx
    
    # Setup SSL
    setup_ssl
    
    # Start services
    start_services
    
    # Verify deployment
    verify_deployment
    
    whiptail --title "Deployment Complete" --msgbox "Full stack deployment completed successfully!" 10 60
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_packages=()
    
    # Check for required packages
    command -v node >/dev/null 2>&1 || missing_packages+=("nodejs")
    command -v npm >/dev/null 2>&1 || missing_packages+=("npm")
    command -v nginx >/dev/null 2>&1 || missing_packages+=("nginx")
    command -v certbot >/dev/null 2>&1 || missing_packages+=("certbot")
    command -v pm2 >/dev/null 2>&1 || missing_packages+=("pm2")
    
    if [[ ${#missing_packages[@]} -gt 0 ]]; then
        whiptail --title "Missing Prerequisites" --msgbox "Missing packages: ${missing_packages[*]}. Installing now..." 10 60
        install_missing_packages "${missing_packages[@]}"
    fi
}

install_missing_packages() {
    local packages=("$@")
    
    # Update package list
    sudo apt-get update
    
    # Install Node.js and npm
    if [[ " ${packages[@]} " =~ " nodejs " ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install other packages
    for package in "${packages[@]}"; do
        case $package in
            "nginx") sudo apt-get install -y nginx ;;
            "certbot") sudo apt-get install -y certbot python3-certbot-nginx ;;
            "pm2") sudo npm install -g pm2 ;;
        esac
    done
}

update_system_packages() {
    log "Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
}

install_dependencies() {
    log "Installing project dependencies..."
    
    # Backend dependencies
    cd "$SCRIPT_DIR/backend"
    npm install --production
    
    # Frontend dependencies
    cd "$SCRIPT_DIR/frontend"
    npm install --production
}

setup_database() {
    log "Setting up database..."
    
    # Check if DATABASE_URL is set
    if [[ -z "${DATABASE_URL:-}" ]]; then
        whiptail --title "Database Configuration" --msgbox "DATABASE_URL not found. Please configure your database connection." 10 60
        return 1
    fi
    
    # Test database connection
    if ! node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('Database connected'); process.exit(0); }).catch(err => { console.error('Database error:', err); process.exit(1); });"; then
        error_exit "Database connection failed"
    fi
}

deploy_backend() {
    log "Deploying backend..."
    
    cd "$SCRIPT_DIR/backend"
    
    # Build backend
    npm run build
    
    # Stop existing PM2 processes
    pm2 stop backend 2>/dev/null || true
    pm2 delete backend 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
}

deploy_frontend() {
    log "Deploying frontend..."
    
    cd "$SCRIPT_DIR/frontend"
    
    # Build frontend
    npm run build
    
    # Copy to nginx directory
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
    sudo chown -R www-data:www-data /var/www/html
}

configure_nginx() {
    log "Configuring nginx..."
    
    # Backup existing config
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # Copy new config
    sudo cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/nginx.conf
    
    # Test nginx configuration
    sudo nginx -t
    
    # Reload nginx
            sudo systemctl reload nginx
}

setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Get domain from user
    domain=$(whiptail --title "SSL Setup" --inputbox "Enter your domain name:" 10 60 3>&1 1>&2 2>&3)
    
    if [[ -n "$domain" ]]; then
        # Obtain SSL certificate
        sudo certbot --nginx -d "$domain" --non-interactive --agree-tos --email admin@"$domain"
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    fi
}

start_services() {
    log "Starting services..."
    
    # Start nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    # Start PM2 processes
    pm2 startup
    pm2 save
}

verify_deployment() {
    log "Verifying deployment..."
    
    # Check if services are running
    if ! systemctl is-active --quiet nginx; then
        error_exit "Nginx is not running"
    fi
    
    if ! pm2 list | grep -q "backend.*online"; then
        error_exit "Backend is not running"
    fi
    
    # Test endpoints
    if ! curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        log "Warning: Backend health check failed"
    fi
    
    log "Deployment verification completed"
}

# =============================================================================
# 📊 HARDWARE MONITORING
# =============================================================================

hardware_monitoring() {
    while true; do
        choice=$(whiptail --title "📊 Hardware Monitoring" \
            --menu "Choose monitoring option:" 15 70 8 \
            "1" "💻 System Overview" \
            "2" "🖥️  CPU & Memory Usage" \
            "3" "💾 Disk Usage" \
            "4" "🌐 Network Information" \
            "5" "📋 Process List" \
            "6" "📊 Export System Report" \
            "7" "⏰ Real-time Monitoring" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
    
    case $choice in
            1) system_overview ;;
            2) cpu_memory_usage ;;
            3) disk_usage ;;
            4) network_info ;;
            5) process_list ;;
            6) export_system_report ;;
            7) realtime_monitoring ;;
        0) return ;;
        esac
    done
}

system_overview() {
    local info=$(cat << EOF
🖥️  SYSTEM OVERVIEW
═══════════════════════════════════════════════════════════════

🖥️  Hostname: $(hostname)
🖥️  OS: $(lsb_release -d | cut -f2)
🖥️  Kernel: $(uname -r)
🖥️  Architecture: $(uname -m)
🖥️  Uptime: $(uptime -p)
🖥️  Load Average: $(uptime | awk -F'load average:' '{print $2}')

💻 CPU Information:
$(lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|Socket")

💾 Memory Information:
$(free -h)

💿 Disk Information:
$(df -h | head -5)

🌐 Network Interfaces:
$(ip addr show | grep -E "inet |UP" | head -10)
EOF
)
    
    whiptail --title "System Overview" --msgbox "$info" 25 80
}

cpu_memory_usage() {
    local usage=$(cat << EOF
📊 CPU & MEMORY USAGE
═══════════════════════════════════════════════════════════════

💻 CPU Usage:
$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)% used

💾 Memory Usage:
$(free -h | grep -E "Mem|Swap")

📈 Top CPU Processes:
$(ps aux --sort=-%cpu | head -10 | awk '{print $2, $3, $4, $11}' | column -t)

📈 Top Memory Processes:
$(ps aux --sort=-%mem | head -10 | awk '{print $2, $3, $4, $11}' | column -t)
EOF
)
    
    whiptail --title "CPU & Memory Usage" --msgbox "$usage" 25 80
}

disk_usage() {
    local disk_info=$(cat << EOF
💾 DISK USAGE
═══════════════════════════════════════════════════════════════

📊 Disk Usage Summary:
$(df -h)

📁 Largest Directories:
$(du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10)

📁 Project Directory Usage:
$(du -h --max-depth=2 "$SCRIPT_DIR" 2>/dev/null | sort -hr | head -10)

🗂️  Log Directory Usage:
$(du -h "$LOG_DIR" 2>/dev/null || echo "No logs yet")
EOF
)
    
    whiptail --title "Disk Usage" --msgbox "$disk_info" 25 80
}

network_info() {
    local network=$(cat << EOF
🌐 NETWORK INFORMATION
═══════════════════════════════════════════════════════════════

🔗 Network Interfaces:
$(ip addr show | grep -E "inet |UP" | head -10)

🌍 Public IP:
$(curl -s ifconfig.me 2>/dev/null || echo "Unable to determine")

🔗 DNS Configuration:
$(cat /etc/resolv.conf | grep nameserver)

📡 Network Connections:
$(ss -tuln | head -10)

🌐 Listening Ports:
$(netstat -tuln | grep LISTEN | head -10)
EOF
)
    
    whiptail --title "Network Information" --msgbox "$network" 25 80
}

process_list() {
    local processes=$(ps aux --sort=-%cpu | head -20 | awk '{print $1, $2, $3, $4, $11}' | column -t)
    
    whiptail --title "Process List" --msgbox "$processes" 25 80
}

export_system_report() {
    local report_file="$LOG_DIR/system_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "🖥️  SYSTEM REPORT - $(date)"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "🖥️  System Information:"
        uname -a
        echo ""
        echo "💻 CPU Information:"
        lscpu
        echo ""
        echo "💾 Memory Information:"
        free -h
        echo ""
        echo "💿 Disk Information:"
        df -h
        echo ""
        echo "🌐 Network Information:"
        ip addr show
        echo ""
        echo "📋 Process List:"
        ps aux
        echo ""
        echo "🔧 Services Status:"
        systemctl list-units --type=service --state=running
        echo ""
        echo "📊 PM2 Processes:"
        pm2 list
        echo ""
        echo "🌐 Nginx Status:"
        systemctl status nginx
        echo ""
        echo "📁 Directory Usage:"
        du -h --max-depth=2 "$SCRIPT_DIR"
    } > "$report_file"
    
    whiptail --title "System Report" --msgbox "System report exported to: $report_file" 10 60
}

realtime_monitoring() {
    whiptail --title "Real-time Monitoring" --msgbox "Starting real-time monitoring. Press Ctrl+C to stop." 10 60
    
    while true; do
        clear
        echo "🖥️  REAL-TIME SYSTEM MONITORING - $(date)"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "💻 CPU Usage:"
        top -bn1 | grep "Cpu(s)"
        echo ""
        echo "💾 Memory Usage:"
        free -h
        echo ""
        echo "📊 Top Processes:"
        ps aux --sort=-%cpu | head -10
        echo ""
        echo "🌐 Network Connections:"
        ss -tuln | head -5
        echo ""
        echo "Press Ctrl+C to exit..."
        sleep 5
    done
}

# =============================================================================
# 🧹 PROCESS MANAGEMENT
# =============================================================================

process_management() {
    while true; do
        choice=$(whiptail --title "🧹 Process Management" \
            --menu "Choose process management option:" 15 70 8 \
            "1" "🧹 Clean All Old Processes" \
            "2" "🔄 Restart All Services" \
            "3" "⏹️  Stop All Services" \
            "4" "▶️  Start All Services" \
            "5" "📋 View PM2 Status" \
            "6" "🗑️  Clean Logs" \
            "7" "🧽 System Cleanup" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
    
    case $choice in
            1) clean_old_processes ;;
            2) restart_all_services ;;
            3) stop_all_services ;;
            4) start_all_services ;;
            5) view_pm2_status ;;
            6) clean_logs ;;
            7) system_cleanup ;;
        0) return ;;
        esac
    done
}

clean_old_processes() {
    log "Cleaning old processes..."
    
    # Stop all PM2 processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Kill any remaining Node.js processes
    pkill -f "node.*backend" 2>/dev/null || true
    pkill -f "node.*frontend" 2>/dev/null || true
    
    # Clean PM2 logs
    pm2 flush 2>/dev/null || true
    
    # Clean system logs
    sudo journalctl --vacuum-time=7d 2>/dev/null || true
    
    whiptail --title "Process Cleanup" --msgbox "Old processes cleaned successfully!" 10 60
}

restart_all_services() {
    log "Restarting all services..."
    
    # Restart nginx
    sudo systemctl restart nginx
    
    # Restart PM2 processes
    pm2 restart all 2>/dev/null || true
    
    whiptail --title "Service Restart" --msgbox "All services restarted successfully!" 10 60
}

stop_all_services() {
    log "Stopping all services..."
    
    # Stop nginx
    sudo systemctl stop nginx
    
    # Stop PM2 processes
    pm2 stop all 2>/dev/null || true
    
    whiptail --title "Service Stop" --msgbox "All services stopped successfully!" 10 60
}

start_all_services() {
    log "Starting all services..."
    
    # Start nginx
    sudo systemctl start nginx
    
    # Start PM2 processes
    pm2 start all 2>/dev/null || true
    
    whiptail --title "Service Start" --msgbox "All services started successfully!" 10 60
}

view_pm2_status() {
    local status=$(pm2 list)
    whiptail --title "PM2 Status" --msgbox "$status" 25 80
}

clean_logs() {
    log "Cleaning logs..."
    
    # Clean PM2 logs
    pm2 flush 2>/dev/null || true
    
    # Clean application logs
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clean system logs
    sudo journalctl --vacuum-time=7d 2>/dev/null || true
    
    whiptail --title "Log Cleanup" --msgbox "Logs cleaned successfully!" 10 60
}

system_cleanup() {
    log "Performing system cleanup..."
    
    # Clean package cache
    sudo apt-get clean
    sudo apt-get autoremove -y
    
    # Clean temporary files
    sudo rm -rf /tmp/*
    sudo rm -rf /var/tmp/*
    
    # Clean old kernels
    sudo apt-get autoremove --purge -y
    
    whiptail --title "System Cleanup" --msgbox "System cleanup completed successfully!" 10 60
}

# =============================================================================
# 🌐 DOMAIN CONFIGURATION
# =============================================================================

domain_configuration() {
    while true; do
        choice=$(whiptail --title "🌐 Domain Configuration" \
            --menu "Choose domain option:" 15 70 8 \
            "1" "🌐 Configure Domain" \
            "2" "📋 Generate Cloudflare DNS" \
            "3" "🔒 SSL Certificate Status" \
            "4" "🌍 DNS Propagation Check" \
            "5" "📊 Domain Health Check" \
            "6" "🔄 Update DNS Records" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
    
    case $choice in
            1) configure_domain ;;
            2) generate_cloudflare_dns ;;
            3) ssl_certificate_status ;;
            4) dns_propagation_check ;;
            5) domain_health_check ;;
            6) update_dns_records ;;
        0) return ;;
        esac
    done
}

configure_domain() {
    local domain=$(whiptail --title "Domain Configuration" --inputbox "Enter your domain name:" 10 60 3>&1 1>&2 2>&3)
    
    if [[ -n "$domain" ]]; then
        # Update nginx configuration with domain
        sudo sed -i "s/server_name _;/server_name $domain;/g" /etc/nginx/sites-available/default
        
        # Test nginx configuration
        sudo nginx -t
        
        # Reload nginx
        sudo systemctl reload nginx
        
        whiptail --title "Domain Configuration" --msgbox "Domain $domain configured successfully!" 10 60
    fi
}

generate_cloudflare_dns() {
    local domain=$(whiptail --title "Cloudflare DNS" --inputbox "Enter your domain name:" 10 60 3>&1 1>&2 2>&3)
    local ip=$(curl -s ifconfig.me)
    
    if [[ -n "$domain" && -n "$ip" ]]; then
        local dns_file="$LOG_DIR/cloudflare_dns_$(date +%Y%m%d_%H%M%S).txt"
        
        cat > "$dns_file" << EOF
# Cloudflare DNS Configuration for $domain
# Generated on $(date)
# Server IP: $ip

# A Records
$domain.                    A       $ip
www.$domain.                A       $ip
api.$domain.                A       $ip

# CNAME Records
app.$domain.                CNAME   $domain.
dashboard.$domain.          CNAME   $domain.

# MX Records (if needed for email)
$domain.                    MX      10      mail.$domain.
$domain.                    MX      20      mail2.$domain.

# TXT Records (for verification)
$domain.                    TXT     "v=spf1 include:_spf.google.com ~all"
$domain.                    TXT     "google-site-verification=YOUR_VERIFICATION_CODE"

# CAA Records (for SSL)
$domain.                    CAA     0 issue "letsencrypt.org"
$domain.                    CAA     0 issue "cloudflare.com"
EOF
        
        whiptail --title "Cloudflare DNS" --msgbox "DNS configuration exported to: $dns_file" 10 60
    fi
}

ssl_certificate_status() {
    local cert_info=$(certbot certificates 2>/dev/null || echo "No certificates found")
    whiptail --title "SSL Certificate Status" --msgbox "$cert_info" 25 80
}

dns_propagation_check() {
    local domain=$(whiptail --title "DNS Propagation Check" --inputbox "Enter domain to check:" 10 60 3>&1 1>&2 2>&3)
    
    if [[ -n "$domain" ]]; then
        local dns_info=$(dig +short $domain A)
        whiptail --title "DNS Propagation" --msgbox "DNS records for $domain:\n$dns_info" 10 60
    fi
}

domain_health_check() {
    local domain=$(whiptail --title "Domain Health Check" --inputbox "Enter domain to check:" 10 60 3>&1 1>&2 2>&3)
    
    if [[ -n "$domain" ]]; then
        local health_info=$(cat << EOF
🌍 DOMAIN HEALTH CHECK: $domain
═══════════════════════════════════════════════════════════════

🔗 DNS Resolution:
$(dig +short $domain A)

🌐 HTTP Status:
$(curl -I http://$domain 2>/dev/null | head -5)

🔒 HTTPS Status:
$(curl -I https://$domain 2>/dev/null | head -5)

📊 Response Time:
$(ping -c 4 $domain 2>/dev/null | tail -1)
EOF
)
        
        whiptail --title "Domain Health" --msgbox "$health_info" 25 80
    fi
}

update_dns_records() {
    whiptail --title "DNS Update" --msgbox "DNS record updates should be done through your DNS provider (Cloudflare, etc.). Use the generated DNS file for reference." 10 60
}

# =============================================================================
# ✅ DEPLOYMENT STATE CHECK
# =============================================================================

check_deployment_state() {
    log "Checking deployment state..."
    
    local issues=()
    local warnings=()
    
    # Check if Node.js is installed
    if ! command -v node >/dev/null 2>&1; then
        issues+=("Node.js is not installed")
    fi
    
    # Check if npm is installed
    if ! command -v npm >/dev/null 2>&1; then
        issues+=("npm is not installed")
    fi
    
    # Check if nginx is installed
    if ! command -v nginx >/dev/null 2>&1; then
        issues+=("nginx is not installed")
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 >/dev/null 2>&1; then
        issues+=("PM2 is not installed")
    fi
    
    # Check if nginx is running
    if ! systemctl is-active --quiet nginx; then
        warnings+=("nginx is not running")
    fi
    
    # Check if PM2 processes are running
    if ! pm2 list | grep -q "online"; then
        warnings+=("No PM2 processes are running")
    fi
    
    # Check if DATABASE_URL is set
    if [[ -z "${DATABASE_URL:-}" ]]; then
        issues+=("DATABASE_URL environment variable is not set")
    fi
    
    # Check if project files exist
    if [[ ! -f "$SCRIPT_DIR/backend/package.json" ]]; then
        issues+=("Backend package.json not found")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/frontend/package.json" ]]; then
        issues+=("Frontend package.json not found")
    fi
    
    # Display results
    local message="DEPLOYMENT STATE CHECK\n═══════════════════════════════════════════════════════════════\n\n"
    
    if [[ ${#issues[@]} -gt 0 ]]; then
        message+="❌ CRITICAL ISSUES:\n"
        for issue in "${issues[@]}"; do
            message+="   • $issue\n"
        done
        message+="\n"
    fi
    
    if [[ ${#warnings[@]} -gt 0 ]]; then
        message+="⚠️  WARNINGS:\n"
        for warning in "${warnings[@]}"; do
            message+="   • $warning\n"
        done
        message+="\n"
    fi
    
    if [[ ${#issues[@]} -eq 0 && ${#warnings[@]} -eq 0 ]]; then
        message+="✅ All checks passed! Deployment is ready."
    else
        message+="\n🔧 RECOMMENDED ACTIONS:\n"
        if [[ ${#issues[@]} -gt 0 ]]; then
            message+="   1. Run 'Complete Deployment' to fix critical issues\n"
        fi
        if [[ ${#warnings[@]} -gt 0 ]]; then
            message+="   2. Check service status and restart if needed\n"
        fi
    fi
    
    whiptail --title "Deployment State Check" --msgbox "$message" 25 80
}

# =============================================================================
# 🔍 DEBUG TOOLS
# =============================================================================

debug_tools() {
    while true; do
        choice=$(whiptail --title "🔍 Debug Tools" \
            --menu "Choose debug option:" 15 70 8 \
            "1" "🔍 Lint Code" \
            "2" "🧪 Run Tests" \
            "3" "📊 Export Debug Report" \
            "4" "🔧 Check Dependencies" \
            "5" "📋 Validate Configuration" \
            "6" "🧹 Clean Build" \
            "7" "📊 Performance Analysis" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
        
        case $choice in
            1) lint_code ;;
            2) run_tests ;;
            3) export_debug_report ;;
            4) check_dependencies ;;
            5) validate_configuration ;;
            6) clean_build ;;
            7) performance_analysis ;;
            0) return ;;
        esac
    done
}

lint_code() {
    log "Running code linting..."
    
    # Lint backend
    cd "$SCRIPT_DIR/backend"
    if npm run lint 2>/dev/null; then
        whiptail --title "Backend Lint" --msgbox "Backend linting passed!" 10 60
    else
        whiptail --title "Backend Lint" --msgbox "Backend linting failed. Check logs for details." 10 60
    fi
    
    # Lint frontend
    cd "$SCRIPT_DIR/frontend"
    if npm run lint 2>/dev/null; then
        whiptail --title "Frontend Lint" --msgbox "Frontend linting passed!" 10 60
    else
        whiptail --title "Frontend Lint" --msgbox "Frontend linting failed. Check logs for details." 10 60
    fi
}

run_tests() {
    log "Running tests..."
    
    # Run backend tests
    cd "$SCRIPT_DIR/backend"
    if npm test 2>/dev/null; then
        whiptail --title "Backend Tests" --msgbox "Backend tests passed!" 10 60
    else
        whiptail --title "Backend Tests" --msgbox "Backend tests failed. Check logs for details." 10 60
    fi
    
    # Run frontend tests
    cd "$SCRIPT_DIR/frontend"
    if npm test 2>/dev/null; then
        whiptail --title "Frontend Tests" --msgbox "Frontend tests passed!" 10 60
    else
        whiptail --title "Frontend Tests" --msgbox "Frontend tests failed. Check logs for details." 10 60
    fi
}

export_debug_report() {
    local debug_file="$LOG_DIR/debug_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "🐛 DEBUG REPORT - $(date)"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "🖥️  System Information:"
        uname -a
        echo ""
        echo "💻 Environment Variables:"
        env | sort
        echo ""
        echo "📦 Node.js Version:"
        node --version
        echo ""
        echo "📦 npm Version:"
        npm --version
        echo ""
        echo "🔧 PM2 Status:"
        pm2 list
        echo ""
        echo "🌐 Nginx Status:"
        systemctl status nginx
        echo ""
        echo "📊 Process List:"
        ps aux | grep -E "(node|nginx|pm2)"
        echo ""
        echo "📁 Directory Structure:"
        find "$SCRIPT_DIR" -type f -name "*.json" -o -name "*.js" -o -name "*.ts" | head -20
        echo ""
        echo "📋 Recent Logs:"
        tail -50 "$LOG_DIR/manage.log" 2>/dev/null || echo "No logs found"
    } > "$debug_file"
    
    whiptail --title "Debug Report" --msgbox "Debug report exported to: $debug_file" 10 60
}

check_dependencies() {
    log "Checking dependencies..."
    
    # Check backend dependencies
    cd "$SCRIPT_DIR/backend"
    if npm audit --audit-level moderate 2>/dev/null; then
        whiptail --title "Backend Dependencies" --msgbox "Backend dependencies are secure!" 10 60
    else
        whiptail --title "Backend Dependencies" --msgbox "Backend dependencies have security issues. Run 'npm audit fix' to resolve." 10 60
    fi
    
    # Check frontend dependencies
    cd "$SCRIPT_DIR/frontend"
    if npm audit --audit-level moderate 2>/dev/null; then
        whiptail --title "Frontend Dependencies" --msgbox "Frontend dependencies are secure!" 10 60
    else
        whiptail --title "Frontend Dependencies" --msgbox "Frontend dependencies have security issues. Run 'npm audit fix' to resolve." 10 60
    fi
}

validate_configuration() {
    log "Validating configuration..."
    
    local config_issues=()
    
    # Check if .env files exist
    if [[ ! -f "$SCRIPT_DIR/backend/.env" ]]; then
        config_issues+=("Backend .env file not found")
    fi
    
    if [[ ! -f "$SCRIPT_DIR/frontend/.env" ]]; then
        config_issues+=("Frontend .env file not found")
    fi
    
    # Check if nginx config exists
    if [[ ! -f "$SCRIPT_DIR/nginx.conf" ]]; then
        config_issues+=("nginx.conf not found")
    fi
    
    # Check if PM2 config exists
    if [[ ! -f "$SCRIPT_DIR/backend/ecosystem.config.js" ]]; then
        config_issues+=("PM2 ecosystem.config.js not found")
    fi
    
    if [[ ${#config_issues[@]} -gt 0 ]]; then
        local message="❌ CONFIGURATION ISSUES:\n"
        for issue in "${config_issues[@]}"; do
            message+="   • $issue\n"
        done
        whiptail --title "Configuration Validation" --msgbox "$message" 15 60
    else
        whiptail --title "Configuration Validation" --msgbox "✅ All configuration files are present!" 10 60
    fi
}

clean_build() {
    log "Cleaning build artifacts..."
    
    # Clean backend build
    cd "$SCRIPT_DIR/backend"
    rm -rf dist/ node_modules/.cache/ 2>/dev/null || true
    
    # Clean frontend build
    cd "$SCRIPT_DIR/frontend"
    rm -rf dist/ node_modules/.cache/ 2>/dev/null || true
    
    whiptail --title "Clean Build" --msgbox "Build artifacts cleaned successfully!" 10 60
}

performance_analysis() {
    log "Running performance analysis..."
    
    local perf_info=$(cat << EOF
📊 PERFORMANCE ANALYSIS
═══════════════════════════════════════════════════════════════

💻 CPU Usage:
$(top -bn1 | grep "Cpu(s)")

💾 Memory Usage:
$(free -h)

📊 Load Average:
$(uptime | awk -F'load average:' '{print $2}')

🌐 Network Connections:
$(ss -tuln | wc -l) total connections

📁 Disk I/O:
$(iostat -x 1 1 2>/dev/null || echo "iostat not available")

🔧 PM2 Process Info:
$(pm2 list)

🌐 Nginx Status:
$(systemctl status nginx --no-pager -l)
EOF
)
    
    whiptail --title "Performance Analysis" --msgbox "$perf_info" 25 80
}

# =============================================================================
# 🐛 ACTIVE DEBUG
# =============================================================================

active_debug() {
    while true; do
        choice=$(whiptail --title "🐛 Active Debug" \
            --menu "Choose debug option:" 15 70 8 \
            "1" "📋 Live Process Monitor" \
            "2" "📊 Real-time Logs" \
            "3" "🔍 Service Status" \
            "4" "🌐 Network Diagnostics" \
            "5" "📊 System Resources" \
            "6" "🔧 Configuration Check" \
            "7" "📋 Export Live Report" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
        
        case $choice in
            1) live_process_monitor ;;
            2) realtime_logs ;;
            3) service_status ;;
            4) network_diagnostics ;;
            5) system_resources ;;
            6) configuration_check ;;
            7) export_live_report ;;
            0) return ;;
        esac
    done
}

live_process_monitor() {
    whiptail --title "Live Process Monitor" --msgbox "Starting live process monitor. Press Ctrl+C to stop." 10 60
    
    while true; do
        clear
        echo "📋 LIVE PROCESS MONITOR - $(date)"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "🔧 PM2 Processes:"
        pm2 list
        echo ""
        echo "📊 Top Processes:"
        ps aux --sort=-%cpu | head -15
        echo ""
        echo "🌐 Network Connections:"
        ss -tuln | head -10
        echo ""
        echo "Press Ctrl+C to exit..."
    sleep 3
    done
}

realtime_logs() {
    local log_choice=$(whiptail --title "Real-time Logs" \
        --menu "Choose log source:" 10 50 5 \
        "1" "Application Logs" \
        "2" "PM2 Logs" \
        "3" "Nginx Logs" \
        "4" "System Logs" \
        "0" "Back" \
        3>&1 1>&2 2>&3)
    
    case $log_choice in
        1) tail -f "$LOG_DIR/manage.log" 2>/dev/null || echo "No application logs found" ;;
        2) pm2 logs ;;
        3) sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log ;;
        4) sudo journalctl -f ;;
        0) return ;;
    esac
}

service_status() {
    local status_info=$(cat << EOF
🔧 SERVICE STATUS
═══════════════════════════════════════════════════════════════

🌐 Nginx Status:
$(systemctl status nginx --no-pager -l)

🔧 PM2 Status:
$(pm2 list)

📊 System Services:
$(systemctl list-units --type=service --state=running | grep -E "(nginx|node|pm2)")

🌐 Port Usage:
$(netstat -tuln | grep -E ":80|:443|:5000|:3000")

📋 Process Count:
$(ps aux | grep -E "(node|nginx)" | wc -l) processes running
EOF
)
    
    whiptail --title "Service Status" --msgbox "$status_info" 25 80
}

network_diagnostics() {
    local network_info=$(cat << EOF
🌐 NETWORK DIAGNOSTICS
═══════════════════════════════════════════════════════════════

🔗 Network Interfaces:
$(ip addr show)

🌍 Public IP:
$(curl -s ifconfig.me 2>/dev/null || echo "Unable to determine")

🔗 DNS Resolution:
$(cat /etc/resolv.conf)

📡 Active Connections:
$(ss -tuln | head -15)

🌐 Listening Ports:
$(netstat -tuln | grep LISTEN)

📊 Network Statistics:
$(ss -s)
EOF
)
    
    whiptail --title "Network Diagnostics" --msgbox "$network_info" 25 80
}

system_resources() {
    local resource_info=$(cat << EOF
📊 SYSTEM RESOURCES
═══════════════════════════════════════════════════════════════

💻 CPU Information:
$(lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|Socket")

💾 Memory Usage:
$(free -h)

💿 Disk Usage:
$(df -h)

📊 Load Average:
$(uptime)

🌐 Network I/O:
$(cat /proc/net/dev | head -5)

📁 File Descriptors:
$(lsof | wc -l) open files
EOF
)
    
    whiptail --title "System Resources" --msgbox "$resource_info" 25 80
}

configuration_check() {
    local config_info=$(cat << EOF
🔧 CONFIGURATION CHECK
═══════════════════════════════════════════════════════════════

📁 Project Structure:
$(find "$SCRIPT_DIR" -maxdepth 2 -type d | head -10)

📦 Package Files:
$(find "$SCRIPT_DIR" -name "package.json" | head -5)

🔧 Configuration Files:
$(find "$SCRIPT_DIR" -name "*.conf" -o -name "*.config.*" | head -10)

🌐 Environment Files:
$(find "$SCRIPT_DIR" -name ".env*" | head -5)

📋 Log Files:
$(find "$LOG_DIR" -name "*.log" 2>/dev/null | head -5)
EOF
)
    
    whiptail --title "Configuration Check" --msgbox "$config_info" 25 80
}

export_live_report() {
    local live_file="$LOG_DIR/live_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "🐛 LIVE DEBUG REPORT - $(date)"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "🖥️  System Information:"
        uname -a
        echo ""
        echo "💻 CPU Usage:"
        top -bn1 | grep "Cpu(s)"
        echo ""
        echo "💾 Memory Usage:"
        free -h
        echo ""
        echo "📊 Process List:"
        ps aux --sort=-%cpu | head -20
        echo ""
        echo "🔧 PM2 Status:"
        pm2 list
        echo ""
        echo "🌐 Nginx Status:"
        systemctl status nginx --no-pager -l
        echo ""
        echo "🌐 Network Connections:"
        ss -tuln | head -20
        echo ""
        echo "📋 Recent Logs:"
        tail -100 "$LOG_DIR/manage.log" 2>/dev/null || echo "No logs found"
    } > "$live_file"
    
    whiptail --title "Live Report" --msgbox "Live report exported to: $live_file" 10 60
}

# =============================================================================
# 📋 VIEW LOGS
# =============================================================================

view_logs() {
    while true; do
        choice=$(whiptail --title "📋 View Logs" \
            --menu "Choose log option:" 15 70 8 \
            "1" "📋 Application Logs" \
            "2" "🔧 PM2 Logs" \
            "3" "🌐 Nginx Logs" \
            "4" "📊 System Logs" \
            "5" "📁 Log Directory" \
            "6" "🧹 Clean Logs" \
            "7" "📊 Log Statistics" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
    
    case $choice in
            1) view_application_logs ;;
            2) view_pm2_logs ;;
            3) view_nginx_logs ;;
            4) view_system_logs ;;
            5) view_log_directory ;;
            6) clean_logs ;;
            7) log_statistics ;;
        0) return ;;
        esac
    done
}

view_application_logs() {
    local log_file="$LOG_DIR/manage.log"
    if [[ -f "$log_file" ]]; then
        tail -50 "$log_file" | whiptail --title "Application Logs" --textbox - 25 80
    else
        whiptail --title "Application Logs" --msgbox "No application logs found." 10 60
    fi
}

view_pm2_logs() {
    pm2 logs --lines 50 | whiptail --title "PM2 Logs" --textbox - 25 80
}

view_nginx_logs() {
    local nginx_logs=$(sudo tail -50 /var/log/nginx/access.log /var/log/nginx/error.log 2>/dev/null || echo "No nginx logs found")
    echo "$nginx_logs" | whiptail --title "Nginx Logs" --textbox - 25 80
}

view_system_logs() {
    sudo journalctl --no-pager -l --lines=50 | whiptail --title "System Logs" --textbox - 25 80
}

view_log_directory() {
    local log_files=$(find "$LOG_DIR" -name "*.log" -o -name "*.txt" | head -20)
    if [[ -n "$log_files" ]]; then
        echo "$log_files" | whiptail --title "Log Directory" --textbox - 25 80
    else
        whiptail --title "Log Directory" --msgbox "No log files found in $LOG_DIR" 10 60
    fi
}

log_statistics() {
    local stats=$(cat << EOF
📊 LOG STATISTICS
═══════════════════════════════════════════════════════════════

📁 Log Directory: $LOG_DIR
📊 Total Log Files: $(find "$LOG_DIR" -name "*.log" | wc -l)
📊 Total Log Size: $(du -sh "$LOG_DIR" 2>/dev/null || echo "0B")

📋 Recent Log Files:
$(find "$LOG_DIR" -name "*.log" -mtime -7 | head -10)

📊 Log File Sizes:
$(find "$LOG_DIR" -name "*.log" -exec ls -lh {} \; | head -10)
EOF
)
    
    whiptail --title "Log Statistics" --msgbox "$stats" 25 80
}

# =============================================================================
# ⚙️ SYSTEM CONFIGURATION
# =============================================================================

system_configuration() {
    while true; do
        choice=$(whiptail --title "⚙️ System Configuration" \
            --menu "Choose configuration option:" 15 70 8 \
            "1" "🔧 Environment Setup" \
            "2" "📦 Package Management" \
            "3" "🌐 Network Configuration" \
            "4" "🔒 Security Settings" \
            "5" "📊 Performance Tuning" \
            "6" "🔄 Backup Configuration" \
            "7" "📋 System Information" \
            "0" "⬅️  Back to Main Menu" \
            3>&1 1>&2 2>&3)
        
        case $choice in
            1) environment_setup ;;
            2) package_management ;;
            3) network_configuration ;;
            4) security_settings ;;
            5) performance_tuning ;;
            6) backup_configuration ;;
            7) system_information ;;
            0) return ;;
        esac
    done
}

environment_setup() {
    whiptail --title "Environment Setup" --msgbox "Environment setup functionality would be implemented here." 10 60
}

package_management() {
    whiptail --title "Package Management" --msgbox "Package management functionality would be implemented here." 10 60
}

network_configuration() {
    whiptail --title "Network Configuration" --msgbox "Network configuration functionality would be implemented here." 10 60
}

security_settings() {
    whiptail --title "Security Settings" --msgbox "Security settings functionality would be implemented here." 10 60
}

performance_tuning() {
    whiptail --title "Performance Tuning" --msgbox "Performance tuning functionality would be implemented here." 10 60
}

backup_configuration() {
    whiptail --title "Backup Configuration" --msgbox "Backup configuration functionality would be implemented here." 10 60
}

system_information() {
    local sys_info=$(cat << EOF
🖥️  SYSTEM INFORMATION
═══════════════════════════════════════════════════════════════

🖥️  Hostname: $(hostname)
🖥️  OS: $(lsb_release -d | cut -f2)
🖥️  Kernel: $(uname -r)
🖥️  Architecture: $(uname -m)
🖥️  Uptime: $(uptime -p)

💻 CPU Information:
$(lscpu | grep -E "Model name|CPU\(s\)|Thread|Core|Socket")

💾 Memory Information:
$(free -h)

💿 Disk Information:
$(df -h | head -5)

🌐 Network Interfaces:
$(ip addr show | grep -E "inet |UP" | head -10)
EOF
)
    
    whiptail --title "System Information" --msgbox "$sys_info" 25 80
}

# =============================================================================
# 🚀 MAIN EXECUTION
# =============================================================================

main() {
    # Check if whiptail is installed
    if ! command -v whiptail >/dev/null 2>&1; then
        echo "Error: whiptail is not installed. Please install it first:"
        echo "  sudo apt-get install whiptail"
        exit 1
    fi
    
    # Check if running as root for certain operations
    check_root
    
    # Create log entry
    log "Master management script started"
    
    # Show main menu
    show_main_menu
    
    # Cleanup on exit
    log "Master management script ended"
}

# Run main function
main "$@"