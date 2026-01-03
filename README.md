# Dayflow HRMS - Every workday, perfectly aligned

A modern, secure, and scalable Human Resource Management System built with the MERN stack.

## 🚀 Features

### Authentication & Authorization
- Secure Sign Up and Sign In
- Employee ID, Email, and Password registration
- Strong password validation
- Role-based access control (Employee/HR/Admin)
- Email verification support
- JWT-based authentication

### Employee Dashboard
- Quick access to Profile, Attendance, Leave Requests, and Payroll
- Recent activity alerts and notifications
- Clean, intuitive interface

### Admin/HR Dashboard
- Comprehensive employee management
- Attendance tracking and management
- Leave request approval system
- Payroll overview and management
- Analytics and reporting

### Employee Profile Management
- View personal and job details
- Edit limited fields (address, phone, profile image)
- Read-only salary structure
- Document management

### Attendance Management
- Daily check-in/check-out system
- Weekly and monthly attendance views
- Attendance statuses: Present, Absent, Half-day, Leave
- Working hours calculation
- Employee-specific and admin views

### Leave & Time-Off Management
- Apply for leave (Paid, Sick, Unpaid)
- Date range selection with automatic day calculation
- Leave request status tracking (Pending, Approved, Rejected)
- Admin approval workflow with comments
- Real-time status updates

### Payroll & Salary Management
- Employee read-only access to payroll details
- Admin/HR payroll management
- Salary structure updates
- Monthly payroll generation
- Payslip download support

### Reports & Analytics
- Attendance reports
- Payroll summaries
- Dashboard analytics
- Custom date range filtering

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **CSS3** - Styling (Modern, responsive design)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
odoo/
├── backend/
│   ├── models/          # MongoDB models
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── Leave.js
│   │   └── Payroll.js
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── payrollController.js
│   │   └── reportController.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── payrollRoutes.js
│   │   └── reportRoutes.js
│   ├── middleware/      # Custom middleware
│   │   └── auth.js
│   ├── server.js        # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/   # Reusable components
    │   │   ├── Layout.js
    │   │   └── PrivateRoute.js
    │   ├── pages/        # Page components
    │   │   ├── SignUp.js
    │   │   ├── SignIn.js
    │   │   ├── Dashboard.js
    │   │   ├── Profile.js
    │   │   ├── Attendance.js
    │   │   ├── Leaves.js
    │   │   ├── Payroll.js
    │   │   └── admin/    # Admin pages
    │   ├── context/      # React context
    │   │   └── AuthContext.js
    │   ├── utils/        # Utilities
    │   │   └── api.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🗄️ Database Schema

### User Model
- Employee ID (unique)
- Email (unique)
- Password (hashed)
- Role (Employee/HR/Admin)
- Profile (firstName, lastName, phone, address, department, position, etc.)
- Salary structure
- Email verification status

### Attendance Model
- Employee reference
- Date
- Check-in/Check-out times
- Status (Present/Absent/Half-day/Leave)
- Working hours

### Leave Model
- Employee reference
- Leave type (Paid/Sick/Unpaid)
- Start/End dates
- Total days
- Status (Pending/Approved/Rejected)
- Approval information

### Payroll Model
- Employee reference
- Month/Year
- Salary breakdown (base, allowances, deductions, bonus, overtime, tax)
- Net salary
- Status (Pending/Processed/Paid)

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd odoo
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Environment Setup**

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

Create a `.env` file in the `frontend` directory (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

5. **Start MongoDB**
```bash
# Make sure MongoDB is running on your system
mongod
```

6. **Run the Application**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

7. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees (Admin/HR only)
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance` - Get attendance records
- `PUT /api/attendance/:id` - Update attendance (Admin/HR only)

### Leaves
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves` - Get leave requests
- `PUT /api/leaves/:id/status` - Approve/Reject leave (Admin/HR only)

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll` - Create/Update payroll (Admin/HR only)
- `GET /api/payroll/summary` - Get payroll summary (Admin/HR only)

### Reports
- `GET /api/reports/attendance` - Get attendance report
- `GET /api/reports/dashboard` - Get dashboard statistics

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation
- CORS configuration
- Secure password requirements

## 🎨 UI/UX Features

- Modern, clean design
- Responsive layout (desktop & mobile)
- Intuitive navigation
- Clear approval workflows
- Professional HR software aesthetic
- Minimalistic cards and data tables
- Status badges and visual indicators

## 🔮 Future Enhancements

- Email notification system
- Document upload and management
- Advanced analytics and charts
- Export reports to PDF/Excel
- Mobile app (React Native)
- Real-time notifications
- Multi-language support
- Integration with external payroll systems
- Biometric attendance integration
- Employee performance reviews
- Training and development tracking
- Recruitment module

## 📄 License

ISC

## 👥 Author

Built with ❤️ for modern HR management

---

**Dayflow - Every workday, perfectly aligned.**

