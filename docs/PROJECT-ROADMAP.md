# Marin Pest Control Dashboard - Project Roadmap

## Overview
This document outlines the complete vision for the Marin Pest Control Dashboard, mapping the planned features to the current implementation status and providing a clear path forward.

---

## 🎯 Project Vision

A comprehensive field service management system that combines:
- **Time tracking & payroll** (Clock in/out with automatic pay calculations)
- **Work calendar & scheduling** (Google Calendar integration with drag-and-drop assignments)
- **QuickBooks integration** (Invoices, customers, items sync)
- **Performance analytics** (Charts, reports, efficiency tracking)
- **User management** (Role-based access control)

---

## 📊 Current Status: Foundation Complete ✅

### ✅ Completed Features

#### 1. Backend Infrastructure
- ✅ Express.js server with TypeScript
- ✅ NeonDB PostgreSQL database with Drizzle ORM
- ✅ PM2 process management (backend, token refresher, sync service)
- ✅ Nginx reverse proxy configuration
- ✅ Environment variable management
- ✅ Logging system (Winston)
- ✅ CORS and security middleware (Helmet, rate limiting)
- ✅ Database migrations system

#### 2. QuickBooks Integration
- ✅ OAuth 2.0 authentication flow
- ✅ Token management and auto-refresh
- ✅ Webhook endpoint for real-time updates
- ✅ Complete data sync for:
  - ✅ Customers
  - ✅ Invoices (with line items)
  - ✅ Items/Products
  - ✅ Estimates (with line items)
- ✅ Database schema for QuickBooks entities
- ✅ Upsert logic for incremental updates

#### 3. Frontend Foundation
- ✅ React + Vite + TypeScript
- ✅ TanStack Query for data fetching
- ✅ React Router for navigation
- ✅ Shadcn/ui component library
- ✅ Tailwind CSS styling
- ✅ Responsive sidebar navigation

#### 4. User Management System (NEW! 🎉)
- ✅ Database schema (users, sessions, permissions)
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (admin, manager, user)
- ✅ User CRUD operations API
- ✅ Session management
- ✅ Permission system
- ✅ Default users created:
  - Admin (username: `admin`, password: `admin123`)
  - Manager (username: `manager`, password: `manager123`)
  - User (username: `user`, password: `user123`)

#### 5. Pages Implemented
- ✅ Dashboard (Home)
- ✅ Products/Items (QuickBooks sync)
- ✅ Customers (QuickBooks sync)
- ✅ Invoices (QuickBooks sync)
- ✅ Estimates (QuickBooks sync)
- ✅ Settings (Debug & system health)
- ✅ Calendar (Basic structure)
- ✅ Time Clock (Basic structure)

---

## 🚧 In Progress

### 1. QuickBooks Pages Enhancement
**Current Issues:**
- Invoices showing drafts instead of actual invoices
- Need clickable invoices/customers for detail views
- Missing pagination (10, 25, 50, all)
- Customers need sorting/filtering options
- "Outstanding" should show "Amount Owed" in red

**API Endpoints:** ✅ Backend ready
**Frontend Work Needed:** 🚧 UI improvements

### 2. Database Schema Organization
- ✅ Created separate schemas: `google`, `employee`, `time_clock`
- ✅ Migration to reorganize tables completed
- 🚧 Need to update code references to new schema locations

---

## 📅 Roadmap by Feature Area

### 🏠 1. Dashboard (Home Page)
**Status:** 🟡 Partially Complete

**Current State:**
- ✅ Basic dashboard layout
- ✅ Navigation structure
- ❌ Today's work schedule (not implemented)
- ❌ Quick metrics (jobs, hours, earnings)
- ❌ "Next Job" preview
- ❌ Alerts/flags

**Required Work:**
1. Create dashboard widgets for:
   - Today's schedule from Google Calendar
   - Time tracking summary (hours today, week total)
   - Earnings calculator (hours × rate)
   - Next job preview with map link
2. Implement alerts system:
   - Incomplete clock-ins
   - Admin notices
   - Schedule conflicts
3. Role-based dashboard views:
   - Employee: Personal metrics & schedule
   - Admin: Team overview & flags

**Backend Requirements:**
- ✅ User authentication (completed)
- 🚧 Google Calendar integration (schema ready, API needed)
- 🚧 Time tracking data (schema ready, API needed)
- 🚧 Earnings calculations

---

### ⏰ 2. Time Tracking System
**Status:** 🟡 Partially Complete

**Current State:**
- ✅ Clock page exists
- ✅ Database schema ready (`time_clock.time_entries`)
- ✅ Employee schema ready
- ❌ Clock in/out functionality not implemented
- ❌ Suspicious activity detection not implemented
- ❌ Admin time management tools not implemented

**Required Work:**

#### A. Employee Features
1. **Clock In/Out Interface**
   - Large, easy-to-tap clock in/out button
   - Current status indicator (clocked in/out)
   - Live timer when clocked in
   - Automatic geolocation capture
   - Photo capture option (optional)

2. **Personal Time View**
   - Last 5 clock-ins table
   - Weekly hours total
   - Current pay rate display
   - Estimated weekly earnings

3. **API Endpoints Needed:**
   ```
   POST   /api/time/clock-in
   POST   /api/time/clock-out
   GET    /api/time/my-entries
   GET    /api/time/weekly-summary
   ```

#### B. Admin Features
1. **All Entries View**
   - Filterable table (by employee, date range)
   - Suspicious entry flags with icons
   - Manual time adjustment tools
   - Approve/reject capabilities

2. **Suspicious Activity Detection**
   - Odd hours (before 5 AM, after 10 PM)
   - Double punches (multiple clock-ins without clock-out)
   - Location mismatches
   - Extremely long shifts (>12 hours)
   - Missing lunch breaks

3. **API Endpoints Needed:**
   ```
   GET    /api/admin/time/all-entries
   GET    /api/admin/time/suspicious
   PUT    /api/admin/time/:id/adjust
   POST   /api/admin/time/:id/approve
   ```

**Database Schema:**
```sql
-- Already created in time_clock schema
time_entries (
  id, user_id, clock_in, clock_out,
  duration_minutes, location_in, location_out,
  notes, is_suspicious, suspicious_reason,
  approved_by, approved_at
)
```

---

### 📅 3. Work Calendar & Assignment System
**Status:** 🟡 Schema Ready, Implementation Needed

**Current State:**
- ✅ Calendar page exists
- ✅ Database schema ready (`google.calendar_events`)
- ✅ Employee availability schema ready
- ❌ Google Calendar API integration not implemented
- ❌ Drag-and-drop assignment not implemented
- ❌ Event sync not working

**Required Work:**

#### A. Google Calendar Integration
1. **API Setup**
   - Google OAuth 2.0 flow
   - Calendar API permissions
   - Event creation/update/delete
   - Webhook for real-time updates

2. **Environment Variables Needed:**
   ```
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_REDIRECT_URI=
   GOOGLE_CALENDAR_ID=
   ```

3. **Backend Endpoints:**
   ```
   GET    /api/calendar/events
   POST   /api/calendar/events
   PUT    /api/calendar/events/:id
   DELETE /api/calendar/events/:id
   POST   /api/calendar/sync
   ```

#### B. Employee View: "Today's Work"
- **Card-based layout showing:**
  - Customer name
  - Jobsite address (with Google Maps link)
  - Arrival time
  - Contact phone number
  - Job details/description
  - Special instructions

- **Features:**
  - Auto-updates from Google Calendar
  - "Navigate" button → Google Maps
  - "Call Customer" button → phone dialer
  - Mark job as complete

#### C. Admin View: "Assign Work"
- **Drag-and-drop interface:**
  - Left panel: Unassigned calendar events
  - Right panel: Employee timelines (hourly view)
  - Drag events to assign to employees
  - Visual conflict detection (overlapping jobs)

- **Features:**
  - Real-time sync with Google Calendar
  - Auto-save on drop
  - Undo/redo functionality
  - Bulk assignment tools
  - Employee availability indicators

**Database Schema:**
```sql
-- Already created in google schema
calendar_events (
  id, google_event_id, summary, description,
  start_time, end_time, location,
  assigned_to, customer_id,
  status, created_at, updated_at
)

-- Already created in employee schema
employees (
  id, user_id, first_name, last_name,
  phone, email, role, pay_rate,
  hire_date, is_active
)

employee_availability (
  id, employee_id, day_of_week,
  start_time, end_time, is_available
)
```

---

### 💼 4. Jobs / Clients
**Status:** 🟡 Partially Complete

**Current State:**
- ✅ Customers page with QuickBooks data
- ✅ Invoices page with QuickBooks data
- ❌ Job management not implemented
- ❌ Service history not tracked
- ❌ File uploads not implemented

**Required Work:**

1. **Enhanced Customer Detail View**
   - Click customer → modal or detail page
   - Contact info, addresses
   - List of all invoices/jobs
   - Service history timeline
   - Notes section
   - Photo gallery

2. **Job Management**
   - Create jobs from calendar events
   - Link jobs to QuickBooks invoices
   - Track completion status
   - Technician assignment
   - Before/after photos
   - Customer signature capture

3. **Search & Filtering**
   - By customer name
   - By address
   - By date range
   - By technician
   - By completion status

4. **API Endpoints Needed:**
   ```
   GET    /api/jobs
   GET    /api/jobs/:id
   POST   /api/jobs
   PUT    /api/jobs/:id
   DELETE /api/jobs/:id
   GET    /api/customers/:id/jobs
   POST   /api/jobs/:id/photos
   POST   /api/jobs/:id/signature
   ```

---

### 💲 5. Payroll & Reports (Admin)
**Status:** 🔴 Not Started

**Required Work:**

1. **Payroll Calculator**
   - Auto-calculate weekly pay (hours × rate)
   - Overtime calculations (>40 hours)
   - Holiday pay multipliers
   - Deductions tracking
   - Tax withholding

2. **Export Features**
   - CSV export for payroll system
   - XLS export with formatting
   - PDF report generation
   - Email reports

3. **Time Summaries**
   - Weekly summary per employee
   - Monthly totals
   - Year-to-date calculations
   - Comparison charts (week over week)

4. **API Endpoints Needed:**
   ```
   GET    /api/payroll/weekly-summary
   GET    /api/payroll/employee/:id/summary
   POST   /api/payroll/export (CSV/XLS)
   GET    /api/payroll/report/:period
   ```

---

### 📈 6. Performance Analytics (Admin)
**Status:** 🔴 Not Started

**Required Work:**

1. **Dashboard Charts (Using Recharts)**
   - Hours worked vs. jobs completed (bar chart)
   - On-time performance (pie chart)
   - Revenue per employee (horizontal bar)
   - Trend lines (line chart over time)
   - Heatmap for busy days/times

2. **Filters**
   - Date range selector
   - Employee/team selector
   - Job type filter
   - Customer segment filter

3. **Metrics to Track**
   - Average job completion time
   - Customer satisfaction scores
   - Repeat customer rate
   - Revenue per hour worked
   - Equipment/supply costs
   - Profit margins

4. **API Endpoints Needed:**
   ```
   GET    /api/analytics/overview
   GET    /api/analytics/employee-performance
   GET    /api/analytics/job-metrics
   GET    /api/analytics/revenue-trends
   GET    /api/analytics/customer-metrics
   ```

---

### ⚙️ 7. Admin Settings
**Status:** 🟢 Core Complete, Enhancement Needed

**Current State:**
- ✅ Settings page with system health
- ✅ Database connectivity test
- ✅ QBO auth check
- ✅ Log fetching
- ✅ Environment variable checks
- ❌ User management UI not created
- ❌ Pay rate management not implemented
- ❌ Threshold settings not implemented
- ❌ Integration management incomplete

**Required Work:**

1. **User Management Tab**
   - List all users (table)
   - Add/edit/delete users
   - Reset passwords
   - Assign roles
   - Grant/revoke permissions
   - View activity logs

2. **Pay Rate Management**
   - Set employee hourly rates
   - Overtime multipliers
   - Holiday pay rates
   - Bonus calculations
   - Rate change history

3. **Alert Thresholds**
   - Suspicious clock-in settings
   - Notification rules
   - Email/SMS triggers
   - Webhook URLs for integrations

4. **Integration Management**
   - QuickBooks connection status
   - Google Calendar setup
   - Jibble.io config (if used)
   - API key management
   - Test connection buttons

---

### 👤 8. My Profile
**Status:** 🔴 Not Started

**Required Work:**

1. **Personal Info**
   - View/edit name, email, phone
   - Change password
   - Profile photo upload
   - Notification preferences

2. **Employment Details** (Read-only for employees)
   - Hire date
   - Hourly pay rate
   - Role/position
   - Manager/supervisor

3. **Performance Stats**
   - Total hours worked (all-time)
   - Jobs completed
   - Attendance percentage
   - Average job completion time
   - Customer ratings (if collected)

4. **Attendance Logs**
   - All clock-in/out history
   - Filter by date range
   - Export to PDF

---

## 🛠️ Technical Priorities

### Phase 1: Core Functionality (Next 2-4 Weeks)
1. ✅ User Management (COMPLETED!)
2. 🚧 Time Tracking Implementation
3. 🚧 Google Calendar Integration
4. 🚧 QuickBooks UI Improvements

### Phase 2: Advanced Features (4-8 Weeks)
5. Work Assignment Drag-and-Drop
6. Job Management System
7. Payroll Calculator
8. Basic Analytics Dashboard

### Phase 3: Polish & Scale (8-12 Weeks)
9. Advanced Analytics
10. Mobile Optimization
11. Push Notifications
12. Performance Tuning
13. Comprehensive Testing

---

## 📋 Immediate Next Steps

### 1. Upload Backend Code to Server
```bash
# Upload new files
scp backend/src/db/user-schema.ts root@SERVER:/opt/dashboard/backend/src/db/
scp backend/src/services/userService.ts root@SERVER:/opt/dashboard/backend/src/services/
scp backend/src/middleware/customAuth.ts root@SERVER:/opt/dashboard/backend/src/middleware/
scp backend/src/routes/auth.ts root@SERVER:/opt/dashboard/backend/src/routes/
scp backend/src/routes/users.ts root@SERVER:/opt/dashboard/backend/src/routes/

# Update main files
scp backend/src/index.ts root@SERVER:/opt/dashboard/backend/src/
scp backend/src/db/index.ts root@SERVER:/opt/dashboard/backend/src/db/
scp backend/env.example root@SERVER:/opt/dashboard/backend/
```

### 2. Add Environment Variables
Add to `/opt/dashboard/backend/.env`:
```
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
SESSION_EXPIRES_IN="7d"
REGISTRATION_ENABLED="false"
```

### 3. Rebuild Backend
```bash
cd /opt/dashboard/backend
npm run build
pm2 restart all
```

### 4. Create Frontend Login Page
- Login form component
- Authentication context
- Protected routes
- Token storage

### 5. Test User System
- Test login with default users
- Test role-based access
- Test password changes
- Change default passwords

---

## 📝 API Documentation Status

### Completed Endpoints
- ✅ `/api/auth/*` - Authentication (login, logout, register, refresh)
- ✅ `/api/users/*` - User management (CRUD, permissions)
- ✅ `/api/customers` - QuickBooks customers
- ✅ `/api/invoices` - QuickBooks invoices
- ✅ `/api/items` - QuickBooks items/products
- ✅ `/api/estimates` - QuickBooks estimates
- ✅ `/api/qbo/*` - QuickBooks OAuth & sync
- ✅ `/api/debug/*` - System health & debugging

### Needed Endpoints
- ❌ `/api/time/*` - Time tracking
- ❌ `/api/calendar/*` - Calendar & scheduling
- ❌ `/api/jobs/*` - Job management
- ❌ `/api/payroll/*` - Payroll calculations
- ❌ `/api/analytics/*` - Performance metrics
- ❌ `/api/employees/*` - Employee management

---

## 🎓 Learning Resources

### Technologies Used
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (NeonDB), Drizzle ORM
- **Frontend:** React, Vite, TypeScript, TanStack Query
- **Auth:** JWT, bcrypt
- **UI:** Tailwind CSS, Shadcn/ui, Lucide Icons
- **Charts:** Recharts
- **API:** QuickBooks Online API, Google Calendar API

### Key Documentation
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [QuickBooks API Docs](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/invoice)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)

---

## 🚀 Success Metrics

### Technical Goals
- ⏱️ Page load time < 2 seconds
- 📱 Mobile responsive (100% features)
- 🔒 Zero authentication vulnerabilities
- ⚡ API response time < 500ms
- 💾 Database queries < 100ms

### Business Goals
- 👥 Support 10-50 employees
- 📊 100% payroll accuracy
- 🗓️ Zero scheduling conflicts
- 💰 Reduce payroll processing time by 80%
- 📈 Increase job completion tracking to 100%

---

## 📞 Support & Maintenance

### Default Credentials (CHANGE IMMEDIATELY!)
- **Admin:** username: `admin`, password: `admin123`
- **Manager:** username: `manager`, password: `manager123`
- **User:** username: `user`, password: `user123`

### Deployment Checklist
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Enable SSL/HTTPS
- [ ] Configure backup system
- [ ] Set up error monitoring
- [ ] Test all integrations
- [ ] Document custom configurations
- [ ] Train users on the system

---

*Last Updated: October 11, 2025*
*Status: Foundation Complete, Core Features In Progress*
