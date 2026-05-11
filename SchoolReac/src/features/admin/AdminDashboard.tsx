import React from 'react';
import { Outlet, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Tabs, Tab, Typography, Breadcrumbs, Link } from '@mui/material';
import { Group as GroupIcon, Security as SecurityIcon, Lock as LockIcon, Settings as SettingsIcon, Category as CategoryIcon } from '@mui/icons-material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine the current tab based on the active URL path
  const currentTab = location.pathname.includes('/admin/roles') 
    ? '/admin/roles' 
    : location.pathname.includes('/admin/permissions') 
      ? '/admin/permissions' 
      : location.pathname.includes('/admin/settings')
        ? '/admin/settings'
        : location.pathname.includes('/admin/transactions')
          ? '/admin/transactions'
          : location.pathname.includes('/admin/lookups')
            ? '/admin/lookups'
            : '/admin/users';

  const tabLabels: Record<string, string> = {
    '/admin/users': 'Users',
    '/admin/roles': 'Roles',
    '/admin/permissions': 'Permissions',
    '/admin/settings': 'System Settings',
    '/admin/lookups': 'Product Data',
    '/admin/transactions': 'Transactions'
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ mb: 1 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Admin</Typography>
          <Typography color="text.primary">{tabLabels[currentTab]}</Typography>
        </Breadcrumbs>
        <Typography variant="h4" fontWeight="bold">Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Manage users, roles, and system permissions.
        </Typography>
      </Box>

      <Box sx={{ width: '100%', mb: 1 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="admin dashboard tabs"
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': { display: 'none' }, // Hide default underline
            '& .MuiTabs-flexContainer': { gap: 1 } // Add space between tabs
          }}
        >
          {[
            { label: 'Users', value: '/admin/users', icon: <GroupIcon /> },
            { label: 'Roles', value: '/admin/roles', icon: <SecurityIcon /> },
            { label: 'Permissions', value: '/admin/permissions', icon: <LockIcon /> },
          { label: 'System Settings', value: '/admin/settings', icon: <SettingsIcon /> },
          { label: 'Product Data', value: '/admin/lookups', icon: <CategoryIcon /> },
          { label: 'Transactions', value: '/admin/transactions', icon: <ReceiptIcon /> }
          ].map((tab) => (
            <Tab
              key={tab.value}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
              value={tab.value}
              disableRipple
              sx={{
                minHeight: 48,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: currentTab === tab.value ? 'bold' : 'medium',
                px: 3,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Subtle pop effect for active tab
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'action.hover',
                }
              }}
            />
          ))}
        </Tabs>
      </Box>

      <Box>
        <Outlet />
      </Box>
    </Box>
  );
};