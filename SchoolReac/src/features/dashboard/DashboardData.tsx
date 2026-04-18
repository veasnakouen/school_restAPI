import React, { use } from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { getProducts, getUsers, getRoles } from '../../services/api';
import { ActivityChart } from './ActivityChart';
import { StatCard } from './StatCard';

// Helper to safely execute promises and return null on error
const safePromise = <T,>(promise: Promise<T>): Promise<T | null> =>
  promise.catch(error => {
    // Log the error for debugging but don't let it crash the component
    console.warn('A dashboard data request failed:', error.response?.data || error.message);
    return null;
  });

// Fetch all dashboard stats concurrently and safely.
const statsPromise = Promise.all([
  safePromise(getProducts({ pageNumber: 1, pageSize: 1 })),
  safePromise(getUsers()),
  safePromise(getRoles()),
]);

export const DashboardData: React.FC = () => {
  // The `use` hook will suspend this component until the promise resolves.
  const [productsRes, usersRes, rolesRes] = use(statsPromise);

  const stats = {
    products: productsRes?.totalCount || 0,
    users: usersRes?.length || 0,
    roles: rolesRes?.length || 0,
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <StatCard title="Total Products" value={stats.products} link="/products" linkText="Manage Products" icon={<Inventory2OutlinedIcon fontSize="inherit" />} color="primary.main" loading={false} />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard title="Registered Users" value={stats.users} link="/admin/users" linkText="Manage Users" icon={<PeopleOutlineIcon fontSize="inherit" />} color="secondary.main" loading={false} />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard title="User Roles" value={stats.roles} link="/admin/roles" linkText="Manage Roles" icon={<ShieldOutlinedIcon fontSize="inherit" />} color="success.main" loading={false} />
      </Grid>

      <Grid item xs={12} lg={7}>
        <ActivityChart stats={stats} />
      </Grid>
      <Grid item xs={12} lg={5}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>Welcome to your Dashboard!</Typography>
            <Typography color="text.secondary">This is the central hub for your application. From here, you can quickly access key management areas.</Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>To show more "recent activity", you could add other charts in the future, such as:</Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
              <li>Recent product additions (line chart)</li>
              <li>User sign-up trends over time</li>
              <li>A geographic overview map</li>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};