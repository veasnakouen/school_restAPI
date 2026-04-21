import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../auth/AuthContext';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { Bar, Line, getElementAtEvent, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTheme as useMuiTheme } from '@mui/material/styles';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SummaryData {
  totalProducts: number;
  totalUsers: number;
  totalRoles: number;
  totalCategories: number;
  productsByCategory: { [key: string]: number };
  salesByMonth: { [key: string]: number };
}

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement; linkTo: string; }> = ({ title, value, icon, linkTo }) => {
  const navigate = useNavigate();
  return (
    <Card
      onClick={() => navigate(linkTo)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        boxShadow: 3,
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 6,
        },
      }}
    >
      <Box sx={{ mr: 2, p: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '50%' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight="bold">{value}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const barChartRef = useRef<ChartJS<'bar'>>(null);
  const muiTheme = useMuiTheme();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Admin');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel for efficiency
        const [productsResult, usersResult, roles, categories, transactionsResult] = await Promise.all([
          api.getProducts({ pageNumber: 1, pageSize: 10000 }).catch(() => ({ items: [], totalCount: 0 })),
          isAdmin ? api.getUsers({ pageSize: 1 }).catch(() => ({ items: [], totalCount: 0 })) : Promise.resolve({ items: [], totalCount: 0 }),
          isAdmin ? api.getRoles().catch(() => []) : Promise.resolve([]),
          api.getCategories().catch(() => []),
          // Fetch transactions. If api.getTransactions isn't defined yet, this safely defaults to empty.
          (api as any).getTransactions ? (api as any).getTransactions({ pageNumber: 1, pageSize: 10000 }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
        ]);

        const productsByCategory = productsResult.items.reduce((acc, product) => {
          const category = product.categoryName || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // Group transactions by month for the line chart
        const salesByMonth = transactionsResult.items.reduce((acc: { [key: string]: number }, transaction: any) => {
          const dateStr = transaction.transactionDate || transaction.createdAt || transaction.date;
          if (!dateStr) return acc;
          
          const date = new Date(dateStr);
          const month = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g. "Oct 2024"
          
          acc[month] = (acc[month] || 0) + (transaction.totalAmount || transaction.amount || 0);
          return acc;
        }, {} as { [key: string]: number });

        setSummary({
          totalProducts: productsResult.totalCount,
          totalUsers: usersResult.totalCount,
          totalRoles: roles.length,
          totalCategories: categories.length,
          productsByCategory,
          salesByMonth,
        });
      } catch (err: any) {
        const message = err.response?.data?.title || 'Failed to load dashboard data.';
        setError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    void fetchDashboardData();
  }, [showToast]);

  const barChartData = {
    labels: summary ? Object.keys(summary.productsByCategory) : [],
    datasets: [
      {
        label: 'Products per Category',
        data: summary ? Object.values(summary.productsByCategory) : [],
        backgroundColor: muiTheme.palette.primary.light,
        borderColor: muiTheme.palette.primary.main,
        borderWidth: 1,
      },
    ],
  };

  const sortedSalesMonths = summary ? Object.keys(summary.salesByMonth).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) : [];

  const lineChartData = {
    labels: sortedSalesMonths,
    datasets: [
      {
        label: 'Transaction Activity',
        data: summary ? sortedSalesMonths.map(month => summary.salesByMonth[month]) : [],
        fill: true,
        backgroundColor: muiTheme.palette.secondary.light + '60', // Add alpha transparency
        borderColor: muiTheme.palette.secondary.main,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      scales: {
        y: {
          ticks: { color: muiTheme.palette.text.secondary },
        },
        x: {
          ticks: { color: muiTheme.palette.text.secondary },
        }
      }
    },
  };

  const handleBarChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = barChartRef.current;
    if (!chart) {
      return;
    }

    const elements = getElementAtEvent(chart, event);
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const category = chart.data.labels?.[elementIndex];
      if (typeof category === 'string') {
        // Navigate to products page with the category as a filter
        navigate(`/products?category=${encodeURIComponent(category)}`);
      }
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={isAdmin ? 3 : 6}>
          <SummaryCard title="Total Products" value={summary?.totalProducts ?? 0} icon={<InventoryIcon />} linkTo="/products" />
        </Grid>
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard title="Total Users" value={summary?.totalUsers ?? 0} icon={<GroupIcon />} linkTo="/admin/users" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard title="Total Roles" value={summary?.totalRoles ?? 0} icon={<SecurityIcon />} linkTo="/admin/roles" />
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6} md={isAdmin ? 3 : 6}>
          <SummaryCard title="Total Categories" value={summary?.totalCategories ?? 0} icon={<CategoryIcon />} linkTo="/products" />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Transaction Activity</Typography>
            <Line options={chartOptions} data={lineChartData} />
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Products by Category</Typography>
            <Bar
              ref={barChartRef}
              options={{
                ...chartOptions,
                indexAxis: 'y',
                onHover: (event, elements) => {
                  (event.native?.target as HTMLElement).style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
              }}
              data={barChartData}
              onClick={handleBarChartClick}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};