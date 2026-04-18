import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import { Group as GroupIcon, Security as SecurityIcon, Lock as LockIcon } from '@mui/icons-material';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine the current tab based on the active URL path
  const currentTab = location.pathname.includes('/admin/roles') 
    ? '/admin/roles' 
    : location.pathname.includes('/admin/permissions') 
      ? '/admin/permissions' 
      : '/admin/users';

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight="bold">Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Manage users, roles, and system permissions.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 1, boxShadow: 2 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="admin dashboard tabs"
        >
          <Tab icon={<GroupIcon />} iconPosition="start" label="Users" value="/admin/users" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Roles" value="/admin/roles" />
          <Tab icon={<LockIcon />} iconPosition="start" label="Permissions" value="/admin/permissions" />
        </Tabs>
      </Paper>

      <Box>
        <Outlet />
      </Box>
    </Box>
  );
};