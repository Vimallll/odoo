import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { isProfileComplete } from '../utils/profileCompletion';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [fullUser, setFullUser] = useState(user);

  useEffect(() => {
    const checkProfile = async () => {
      if (user && user.role === 'Employee' && !location.pathname.includes('/profile') && !location.pathname.includes('/complete-profile')) {
        try {
          const response = await api.get('/auth/me');
          setFullUser(response.data);
          setProfileChecked(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setFullUser(user);
          setProfileChecked(true);
        }
      } else {
        setFullUser(user);
        setProfileChecked(true);
      }
    };

    if (user && !loading) {
      checkProfile();
    } else if (!user && !loading) {
      setProfileChecked(true);
    }
  }, [user, loading, location.pathname]);

  if (loading || !profileChecked) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  // Check profile completion for employees (except on profile pages)
  if (user.role === 'Employee' && 
      !location.pathname.includes('/profile') && 
      !location.pathname.includes('/complete-profile') &&
      fullUser) {
    if (!isProfileComplete(fullUser)) {
      return <Navigate to="/profile" state={{ message: 'Please complete your profile to access this page', requireCompletion: true }} />;
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;

