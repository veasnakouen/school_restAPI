import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GlobalSpinner } from '../components/GlobalSpinner';

export const AdminGuard: React.FC = () => {
  const { isAdmin, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) {
    return <GlobalSpinner />;
  }
  if (!isAuthenticated) { 
    return <Navigate to="/login" state={{from:location}} replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};