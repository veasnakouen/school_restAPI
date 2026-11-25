import React from 'react';
import { Outlet, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Group as GroupIcon, Security as SecurityIcon, Lock as LockIcon, Settings as SettingsIcon, Category as CategoryIcon } from '@mui/icons-material';
import { Receipt as ReceiptIcon, ReportProblem as ReportProblemIcon } from '@mui/icons-material';
import { PageTransition } from '../../components/PageTransition';
import { AnimatedNavTabs, type AnimatedNavTabItem } from '../../components/AnimatedNavTabs';
import { prefetchRoute } from '../../routes/routeLoaders';

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
          : location.pathname.includes('/admin/write-offs')
            ? '/admin/write-offs'
            : location.pathname.includes('/admin/lookups')
              ? '/admin/lookups'
              : '/admin/users';

  const tabLabels: Record<string, string> = {
    "/admin/users": "Users",
    "/admin/roles": "Roles",
    "/admin/permissions": "Permissions",
    "/admin/settings": "System Settings",
    "/admin/lookups": "Product Data",
    "/admin/transactions": "Transactions",
    "/admin/write-offs": "WriteOffs",
  };

  const adminTabs: AnimatedNavTabItem<string>[] = [
    { label: 'Users', value: '/admin/users', to: '/admin/users', onPrefetch: () => prefetchRoute('/admin/users'), icon: <GroupIcon /> },
    { label: 'Roles', value: '/admin/roles', to: '/admin/roles', onPrefetch: () => prefetchRoute('/admin/roles'), icon: <SecurityIcon /> },
    { label: 'Permissions', value: '/admin/permissions', to: '/admin/permissions', onPrefetch: () => prefetchRoute('/admin/permissions'), icon: <LockIcon /> },
    { label: 'System Settings', value: '/admin/settings', to: '/admin/settings', onPrefetch: () => prefetchRoute('/admin/settings'), icon: <SettingsIcon /> },
    { label: 'Product Data', value: '/admin/lookups', to: '/admin/lookups', onPrefetch: () => prefetchRoute('/admin/lookups'), icon: <CategoryIcon /> },
    { label: 'Transactions', value: '/admin/transactions', to: '/admin/transactions', onPrefetch: () => prefetchRoute('/admin/transactions'), icon: <ReceiptIcon /> },
    { label: 'Write-Offs', value: '/admin/write-offs', to: '/admin/write-offs', onPrefetch: () => prefetchRoute('/admin/write-offs'), icon: <ReportProblemIcon /> },
  ];

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
        <AnimatedNavTabs
          value={currentTab}
          onChange={(newValue) => navigate(newValue)}
          items={adminTabs}
          layoutGroupId="admin-nav"
          ariaLabel="admin dashboard tabs"
        />
      </Box>

      <Box>
        <PageTransition pageKey={location.pathname} variant="tab">
          <Outlet />
        </PageTransition>
      </Box>
    </Box>
  );
};