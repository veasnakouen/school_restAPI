import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Box, Alert, Button } from '@mui/material';

interface ProtectedRouteProps {
  requiredRoles?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles, children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return null; // GlobalSpinner will usually cover this loading state
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.roles?.includes(role));
    if (!hasRequiredRole) {
      return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, justifyContent: 'center', fontSize: '1.1rem', py: 2 }}>
            Access Denied. You do not have the required permissions to view this page.
          </Alert>
          <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Box>
      );
    }
  }

  // Render children directly, or <Outlet /> if used as a layout route
  return <>{children ? children : <Outlet />}</>;
};