import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GlobalSpinner } from '../components/GlobalSpinner';

export const AuthGuard: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) {
    return <GlobalSpinner />;
  }
// Not Authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{from:location}} replace />;
  }

  // Authenticated - render the childe route
  return <Outlet />;
};