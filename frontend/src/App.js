import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TabbedProfile from './pages/TabbedProfile';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeCards from './pages/admin/EmployeeCards';
import Employees from './pages/admin/Employees';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminPayroll from './pages/admin/AdminPayroll';
import Reports from './pages/admin/Reports';
import './App.css';

const AppRoutes = () => {
  const { user } = React.useContext(AuthContext);

  return (
    <Routes>
      <Route path="/signup" element={!user ? <SignUp /> : <Navigate to={user.role === 'Employee' ? '/dashboard' : '/admin/dashboard'} />} />
      <Route path="/signin" element={!user ? <SignIn /> : <Navigate to={user.role === 'Employee' ? '/dashboard' : '/admin/dashboard'} />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/complete-profile" element={
        <PrivateRoute>
          <TabbedProfile />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <TabbedProfile />
        </PrivateRoute>
      } />
      <Route path="/attendance" element={
        <PrivateRoute>
          <Attendance />
        </PrivateRoute>
      } />
      <Route path="/leaves" element={
        <PrivateRoute>
          <Leaves />
        </PrivateRoute>
      } />
      <Route path="/payroll" element={
        <PrivateRoute>
          <Payroll />
        </PrivateRoute>
      } />

      <Route path="/admin/dashboard" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <AdminDashboard />
        </PrivateRoute>
      } />
      <Route path="/admin/employee-cards" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <EmployeeCards />
        </PrivateRoute>
      } />
      <Route path="/admin/employees" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <Employees />
        </PrivateRoute>
      } />
      <Route path="/admin/employees/:id" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <Profile />
        </PrivateRoute>
      } />
      <Route path="/admin/attendance" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <AdminAttendance />
        </PrivateRoute>
      } />
      <Route path="/admin/leaves" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <AdminLeaves />
        </PrivateRoute>
      } />
      <Route path="/admin/payroll" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <AdminPayroll />
        </PrivateRoute>
      } />
      <Route path="/admin/reports" element={
        <PrivateRoute allowedRoles={['HR', 'Admin']}>
          <Reports />
        </PrivateRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'Employee' ? '/dashboard' : '/admin/dashboard') : '/signin'} />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

