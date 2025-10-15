# User Management System

## Overview

The Marin Pest Control Dashboard now includes a complete user management system with role-based access control, JWT authentication, and granular permissions.

---

## 🔐 Authentication System

### Technology Stack
- **Password Hashing:** bcrypt with 10 salt rounds
- **Token Type:** JWT (JSON Web Tokens)
- **Token Expiry:** 24 hours (configurable)
- **Session Management:** Database-backed sessions with automatic cleanup

---

## 👥 User Roles

### 1. Admin
**Full system access** - Can manage all aspects of the system
- Manage users (create, edit, delete, change roles)
- Access all data and reports
- Configure system settings
- Grant/revoke permissions
- View all time tracking data
- Manage calendar assignments
- Access payroll information

### 2. Manager
**Limited administrative access** - Can manage day-to-day operations
- View all employees and their data
- Approve time entries
- Assign work calendar events
- View reports and analytics
- Cannot create/delete users
- Cannot change system settings
- Cannot modify pay rates

### 3. User (Employee)
**Basic access** - Can use core features
- Clock in/out
- View own schedule
- View own time entries
- Access assigned jobs
- Update own profile
- Cannot access admin features
- Cannot view other employees' data

---

## 🔑 Default Users

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | `admin` | `admin123` | admin@wemakemarin.com |
| Manager | `manager` | `manager123` | manager@wemakemarin.com |
| User | `user` | `user123` | user@wemakemarin.com |

---

## 📡 API Endpoints

### Authentication Endpoints (No auth required)

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "admin",  // username or email
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@wemakemarin.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionToken": "abc123...",
    "expiresIn": "24h"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "sessionToken": "abc123..."
}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Register (Disabled by default)
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@wemakemarin.com",
  "password": "SecurePass123!",
  "firstName": "New",
  "lastName": "User"
}

Note: Requires REGISTRATION_ENABLED=true in .env
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@wemakemarin.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "isActive": true,
    "lastLogin": "2025-10-11T03:30:00.000Z"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "sessionToken": "abc123..."
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### User Management Endpoints (Auth required)

#### Get All Users (Admin/Manager only)
```http
GET /api/users
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@wemakemarin.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "isActive": true,
      "lastLogin": "2025-10-11T03:30:00.000Z",
      "createdAt": "2025-10-11T00:00:00.000Z",
      "updatedAt": "2025-10-11T03:30:00.000Z"
    },
    ...
  ]
}
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <token>

Note: Users can only view their own profile unless admin/manager
```

#### Create User (Admin only)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@wemakemarin.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"  // admin, manager, or user
}

Response:
{
  "success": true,
  "data": { ... user object ... }
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "newemail@wemakemarin.com",
  "role": "manager"  // Only admins can change roles
}

Note: Users can update their own profile, admins can update anyone
```

#### Delete User (Admin only)
```http
DELETE /api/users/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User deleted successfully"
}

Note: Cannot delete your own account
```

#### Change Password
```http
POST /api/users/:id/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "admin123",
  "newPassword": "NewSecurePass123!"
}

Note: Users can only change their own password unless admin
```

---

### Permission Endpoints

#### Get User Permissions
```http
GET /api/users/:id/permissions
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    "manage_users",
    "manage_settings",
    "view_all_data",
    "manage_invoices"
  ]
}
```

#### Grant Permission (Admin only)
```http
POST /api/users/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission": "manage_invoices"
}
```

#### Revoke Permission (Admin only)
```http
DELETE /api/users/:id/permissions/:permission
Authorization: Bearer <token>
```

---

## 🛡️ Permission Types

### Available Permissions
- `manage_users` - Create, edit, delete users
- `manage_settings` - Configure system settings
- `view_all_data` - Access all company data
- `manage_invoices` - Create, edit QuickBooks invoices
- `manage_customers` - Manage customer records
- `manage_items` - Manage QuickBooks items/products
- `view_reports` - Access reports and analytics
- `manage_time_tracking` - Approve/adjust time entries
- `manage_calendar` - Assign work calendar events

### Permission Inheritance
- **Admin role:** Automatically has ALL permissions
- **Manager role:** Must be granted specific permissions
- **User role:** Must be granted specific permissions

---

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- Must be hashed with bcrypt (10 rounds)
- Never stored in plain text
- Never sent in API responses

### JWT Tokens
- Signed with secret key (stored in .env)
- Includes user ID, username, email, role
- Expires after 24 hours (configurable)
- Verified on every protected route

### Session Management
- Sessions stored in database
- Automatic expiration after 7 days
- Can be manually invalidated (logout)
- Tracks last accessed time

### Role-Based Access Control (RBAC)
- Middleware checks user role on protected routes
- Fine-grained permission checks available
- Automatic 401/403 responses for unauthorized access

---

## 📋 Database Schema

### users table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_sessions table
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_permissions table
```sql
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, permission)
);
```

---

## 🚀 Implementation Checklist

### Backend ✅
- [x] Database schema created
- [x] User service (CRUD, auth, permissions)
- [x] Auth middleware
- [x] API routes
- [x] JWT generation/verification
- [x] Password hashing
- [x] Session management
- [x] Role-based access control
- [x] bcrypt dependency installed

### Frontend (TODO)
- [ ] Login page component
- [ ] Authentication context/provider
- [ ] Protected route wrapper
- [ ] Token storage (localStorage/sessionStorage)
- [ ] Auto-refresh token logic
- [ ] User management UI (admin)
- [ ] Profile page
- [ ] Password change form
- [ ] Role badges in UI
- [ ] Logout functionality

---

## 🔧 Configuration

### Environment Variables

Add to `backend/.env`:
```env
# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
SESSION_EXPIRES_IN="7d"

# Registration
REGISTRATION_ENABLED="false"  # Set to "true" to allow public registration
```

**🔴 CRITICAL:** Generate a strong JWT_SECRET before production:
```bash
# Generate a secure random key
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 Usage Examples

### Frontend Login Component (Example)
```typescript
import { useState } from 'react';
import api from '@/lib/api';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      });

      const { token, user } = response.data.data;
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Protected Route Wrapper (Example)
```typescript
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';

function ProtectedRoute({ children, requiredRole }: { 
  children: React.ReactNode; 
  requiredRole?: string;
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.data);
      } catch (error) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid token" errors
- Check if JWT_SECRET matches between token generation and verification
- Ensure token hasn't expired (24h default)
- Verify token is being sent in Authorization header: `Bearer <token>`

#### 2. "User not found" errors
- Confirm users table has data: `SELECT * FROM users;`
- Check if user is active: `is_active = true`
- Verify username/email is correct

#### 3. "Permission denied" errors
- Check user role: admin bypasses all permission checks
- For manager/user: verify permissions in `user_permissions` table
- Ensure middleware is checking correct permission

#### 4. Password reset not working
- Confirm current password is correct
- Check password meets minimum requirements (8 chars)
- Verify bcrypt is working: `npm list bcrypt`

---

## 📚 Next Steps

1. **Deploy Backend Code:**
   - Upload new files to server
   - Add JWT_SECRET to .env
   - Rebuild and restart PM2

2. **Create Frontend Login:**
   - Build login page
   - Implement auth context
   - Add protected routes

3. **Test Authentication:**
   - Test all default users
   - Test role-based access
   - Test password changes

4. **Security Hardening:**
   - Change all default passwords
   - Generate strong JWT_SECRET
   - Enable HTTPS
   - Add rate limiting to login endpoint

5. **User Management UI:**
   - Create admin panel for user management
   - Add user list/table
   - Add user creation form
   - Add role/permission management

---

*Last Updated: October 11, 2025*
*Status: Backend Complete, Frontend Pending*
