# 🚀 Marin Pest Control Dashboard - API Endpoints

## 📋 Overview

This document provides a comprehensive list of all available API endpoints for the Marin Pest Control Dashboard. The API is built with Express.js and provides endpoints for QuickBooks integration, Google Calendar management, employee scheduling, and business operations.

---

## 🔐 Authentication

All protected endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🏥 Health & System Endpoints

### Health Check
- **GET** `/health` - Basic health check
- **GET** `/api/health` - API health check with database connectivity
- **GET** `/api/debug/health` - Detailed system health check

### System Information
- **GET** `/api/debug/system` - System information and resource usage
- **GET** `/api/debug/database` - Database connectivity and schema info
- **GET** `/api/debug/logs` - Recent log entries
- **POST** `/api/debug/test-connection` - Test specific connections

---

## 🔗 QuickBooks Integration

### OAuth & Authentication
- **GET** `/api/qbo/connect` - Get QuickBooks OAuth URL
- **GET** `/api/qbo/callback` - OAuth callback handler
- **GET** `/api/qbo/token-status` - Get current token status
- **POST** `/api/qbo/refresh-token` - Force token refresh

### Token Management
- **GET** `/api/tokens/status` - Get token status and validity
- **GET** `/api/tokens/info` - Get detailed token information (admin)
- **DELETE** `/api/tokens/:id` - Delete specific token (admin)

### Data Synchronization
- **POST** `/api/sync` - Trigger full QuickBooks data sync
- **POST** `/api/sync/:entityType` - Sync specific entity type
- **GET** `/api/sync/status` - Get sync status and statistics
- **POST** `/api/sync/refresh-token` - Manually refresh token
- **GET** `/api/sync/health` - Check sync service health

---

## 👥 Customer Management

### Customer Operations
- **GET** `/api/customers` - List all customers (paginated)
- **GET** `/api/customers/:id` - Get specific customer
- **GET** `/api/customers/stats` - Get customer statistics

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search term (future implementation)

---

## 📦 Product/Item Management

### Item Operations
- **GET** `/api/items` - List all items (paginated)
- **GET** `/api/items/:id` - Get specific item
- **GET** `/api/items/stats` - Get item statistics

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

---

## 🧾 Invoice Management

### Invoice Operations
- **GET** `/api/invoices` - List all invoices with line items
- **GET** `/api/invoices/:id` - Get specific invoice with line items
- **GET** `/api/invoices/stats` - Get invoice statistics

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### Statistics Available
- Total invoices
- Paid vs unpaid invoices
- Total revenue
- Outstanding balance

---

## 📋 Estimate Management

### Estimate Operations
- **GET** `/api/estimates` - List all estimates with line items
- **GET** `/api/estimates/:id` - Get specific estimate with line items
- **GET** `/api/estimates/stats` - Get estimate statistics

### Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

---

## 📅 Calendar & Scheduling

### Calendar Events
- **GET** `/api/calendar/events` - Get all calendar events
- **GET** `/api/calendar/events/today` - Get today's events
- **POST** `/api/calendar/sync` - Trigger Google Calendar sync

### Query Parameters for Events
- `start_date` - Filter events from date
- `end_date` - Filter events to date
- `calendar_id` - Filter by calendar ID
- `include_assigned` - Include assigned events (default: false)

### Work Assignments
- **POST** `/api/assignments` - Assign work to employee
- **PUT** `/api/assignments/:id` - Update work assignment
- **DELETE** `/api/assignments/:id` - Remove work assignment
- **GET** `/api/assignments/employee/:employeeId` - Get employee assignments
- **GET** `/api/assignments/today` - Get today's assignments
- **GET** `/api/work-queue` - Get unassigned work for today

### Assignment Status Options
- `assigned` - Work assigned but not started
- `in_progress` - Work in progress
- `completed` - Work completed
- `cancelled` - Work cancelled

---

## 👷 Employee Management

### Employee Operations
- **GET** `/api/employees` - Get all employees
- **GET** `/api/employees/working-today` - Get employees working today

### Query Parameters
- `active_only` - Show only active employees (default: false)

### Employee Data Includes
- Personal information
- Work assignments
- Availability status
- Contact details

---

## 📝 Internal Notes

### Note Operations
- **GET** `/api/notes` - Get internal notes
- **POST** `/api/notes` - Create new note
- **PUT** `/api/notes/:id` - Update note
- **DELETE** `/api/notes/:id` - Delete note

### Query Parameters
- `entity_type` - Filter by entity type
- `entity_id` - Filter by entity ID
- `category` - Filter by category
- `pinned_only` - Show only pinned notes

### Note Categories
- `general` - General notes
- `customer` - Customer-related notes
- `work` - Work assignment notes
- `system` - System notes

---

## ⏰ Time Clock

### Clock Operations
- **POST** `/api/clock/in` - Clock in
- **POST** `/api/clock/out` - Clock out
- **GET** `/api/clock/status` - Get current clock status
- **GET** `/api/clock/entries` - Get clock entries

### Clock Data Includes
- Employee ID
- Clock in/out times
- Location information
- IP address and user agent
- Duration calculations

### Query Parameters for Entries
- `employee_id` - Filter by employee
- `start_date` - Filter from date
- `end_date` - Filter to date
- `approved` - Filter by approval status

---

## 🔔 Webhooks

### Webhook Endpoints
- **POST** `/api/webhook/quickbooks` - QuickBooks webhook handler
- **GET** `/api/webhook/health` - Webhook health check

### Webhook Features
- Signature verification
- Event processing
- Automatic data sync
- Error handling

---

## 👤 User Management

### User Operations
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get specific user
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

### Authentication
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/logout` - User logout
- **GET** `/api/auth/verify` - Verify token validity

---

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

---

## 🔒 Security Features

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable via environment variables

### CORS
- Configurable origins
- Credentials support
- Preflight handling

### Security Headers
- Helmet.js security headers
- Content Security Policy
- XSS protection

---

## 📈 Monitoring & Debugging

### Debug Endpoints
- **GET** `/api/debug/health` - System health
- **GET** `/api/debug/system` - System information
- **GET** `/api/debug/database` - Database status
- **GET** `/api/debug/quickbooks` - QuickBooks status
- **GET** `/api/debug/logs` - Recent logs

### Health Checks
- Database connectivity
- QuickBooks authentication
- File system access
- Memory usage
- CPU usage

---

## 🚀 Deployment Endpoints

### Production Health
- **GET** `/health` - Basic health check
- **GET** `/api/health` - Detailed health check
- **GET** `/api/debug/health` - System diagnostics

### Monitoring
- Process monitoring
- Resource usage
- Error tracking
- Performance metrics

---

## 📝 Notes

### Development vs Production
- Development endpoints may have additional debug information
- Production endpoints are optimized for performance
- Authentication requirements may vary by environment

### Rate Limits
- Default: 100 requests per 15 minutes
- Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
- Applied to all `/api/` routes

### Error Handling
- All endpoints include comprehensive error handling
- Errors are logged for debugging
- User-friendly error messages
- Proper HTTP status codes

---

## 🔄 Data Synchronization

### Automatic Sync
- QuickBooks webhooks trigger automatic sync
- Scheduled sync jobs (configurable)
- Real-time data updates

### Manual Sync
- Full data synchronization
- Entity-specific sync
- Token refresh and validation
- Sync status monitoring

---

**Last Updated:** 2025-10-15  
**API Version:** 1.0.0  
**Base URL:** `http://localhost:5000` (development) / `https://wemakemarin.com` (production)