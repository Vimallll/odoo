# Dayflow HRMS - System Architecture

## Overview

Dayflow HRMS is a full-stack web application built using the MERN (MongoDB, Express.js, React, Node.js) stack. The system follows a RESTful API architecture with a clear separation between frontend and backend.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React App  │  │  React Router│  │  Axios Client │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/REST API
┌────────────────────────────┼────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js Server                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │   CORS   │  │   Auth   │  │  Routes   │           │  │
│  │  │ Middleware│  │Middleware│  │          │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Employee │  │Attendance│  │  Leave   │   │
│  │Controller│  │Controller│  │Controller│  │Controller│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                               │
│  │ Payroll  │  │  Report  │                               │
│  │Controller│  │Controller│                               │
│  └──────────┘  └──────────┘                               │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   User  │  │Attendance│  │  Leave   │  │ Payroll  │   │
│  │  Model  │  │  Model   │  │  Model   │  │  Model   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      DATABASE LAYER                          │
│                    ┌──────────────┐                         │
│                    │   MongoDB     │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

#### 1. **Component Hierarchy**
```
App
├── AuthProvider (Context)
├── Router
│   ├── SignUp
│   ├── SignIn
│   ├── PrivateRoute
│   │   ├── Layout
│   │   │   ├── Dashboard (Employee)
│   │   │   ├── Profile
│   │   │   ├── Attendance
│   │   │   ├── Leaves
│   │   │   └── Payroll
│   │   └── Admin Routes
│   │       ├── AdminDashboard
│   │       ├── Employees
│   │       ├── AdminAttendance
│   │       ├── AdminLeaves
│   │       ├── AdminPayroll
│   │       └── Reports
```

#### 2. **State Management**
- **React Context API** for global authentication state
- **Local State** for component-specific data
- **API Calls** via Axios interceptors

#### 3. **Routing Strategy**
- Public routes: `/signin`, `/signup`
- Protected routes: `/dashboard`, `/profile`, etc.
- Role-based routes: `/admin/*` (HR/Admin only)

### Backend Architecture

#### 1. **Layered Architecture**
```
Routes Layer
    ↓
Controller Layer (Business Logic)
    ↓
Model Layer (Data Access)
    ↓
Database (MongoDB)
```

#### 2. **Middleware Chain**
```
Request → CORS → JSON Parser → Auth → Route Handler → Response
```

#### 3. **Authentication Flow**
```
1. User signs up/signs in
2. Server validates credentials
3. JWT token generated
4. Token sent to client
5. Client stores token
6. Token included in subsequent requests
7. Server validates token on protected routes
```

## Database Design

### Entity Relationship Diagram

```
User (1) ────< (N) Attendance
  │
  │ (1)
  │
  └───< (N) Leave
  │
  │ (1)
  │
  └───< (N) Payroll
```

### Collections

1. **users**
   - Stores employee and admin user data
   - Indexes: `employeeId` (unique), `email` (unique)

2. **attendances**
   - Daily attendance records
   - Indexes: `employeeId + date` (compound unique)

3. **leaves**
   - Leave applications
   - References: `employeeId`, `approvedBy`

4. **payrolls**
   - Monthly payroll records
   - Indexes: `employeeId + month + year` (compound unique)

## Security Architecture

### Authentication & Authorization

1. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Strong password validation (regex)
   - Password never sent in responses

2. **JWT Tokens**
   - 7-day expiration
   - Stored in localStorage (client)
   - Sent via Authorization header

3. **Role-Based Access Control (RBAC)**
   - Employee: Read own data, limited write
   - HR/Admin: Full CRUD on all resources

4. **API Security**
   - CORS configuration
   - Input validation
   - Error handling (no sensitive data exposure)

## API Design Patterns

### RESTful Conventions
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Remove resources (future)

### Response Format
```json
{
  "message": "Success message",
  "data": { ... },
  "error": "Error message (if any)"
}
```

### Error Handling
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Data Flow

### User Registration Flow
```
1. User fills signup form
2. Frontend validates input
3. POST /api/auth/signup
4. Backend validates & hashes password
5. User created in database
6. JWT token generated
7. Token + user data returned
8. Frontend stores token
9. Redirect to dashboard
```

### Attendance Check-in Flow
```
1. Employee clicks "Check In"
2. POST /api/attendance/checkin
3. Auth middleware validates token
4. Controller checks if already checked in
5. Attendance record created/updated
6. Response sent to frontend
7. UI updated with check-in time
```

### Leave Approval Flow
```
1. Employee applies for leave
2. POST /api/leaves
3. Leave record created (status: Pending)
4. Admin views pending leaves
5. Admin approves/rejects
6. PUT /api/leaves/:id/status
7. Leave status updated
8. Employee sees updated status
```

## Scalability Considerations

### Current Architecture
- Monolithic backend
- Single MongoDB instance
- Stateless API (JWT)

### Future Scalability Options
1. **Horizontal Scaling**
   - Load balancer
   - Multiple API instances
   - Session storage (Redis)

2. **Database Scaling**
   - MongoDB replica sets
   - Read replicas
   - Sharding (if needed)

3. **Caching**
   - Redis for frequently accessed data
   - CDN for static assets

4. **Microservices** (if needed)
   - Separate services for auth, attendance, payroll
   - API Gateway
   - Service mesh

## Performance Optimizations

1. **Database**
   - Indexed fields for fast queries
   - Compound indexes for common queries
   - Population for related data

2. **Frontend**
   - Component lazy loading
   - API response caching
   - Optimistic UI updates

3. **API**
   - Pagination for large datasets
   - Field selection (projection)
   - Query optimization

## Deployment Architecture

### Development
```
Frontend (React Dev Server) → Backend (Node.js) → MongoDB (Local)
```

### Production (Recommended)
```
CDN/Static Hosting → Load Balancer → API Servers → MongoDB Cluster
```

## Monitoring & Logging

### Current
- Console logging
- Error handling middleware

### Future Enhancements
- Structured logging (Winston)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Analytics (Google Analytics)

## Testing Strategy

### Unit Tests
- Controller functions
- Utility functions
- Model methods

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### E2E Tests
- User workflows
- Admin workflows
- Cross-browser testing

---

This architecture provides a solid foundation for the Dayflow HRMS system while maintaining flexibility for future enhancements.

