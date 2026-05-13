import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../auth/AuthContext';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, Button, Skeleton, TextField, IconButton } from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Category as CategoryIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import * as signalR from '@microsoft/signalr';


interface SummaryData {
  totalProducts: number;
  totalUsers: number;
  totalRoles: number;
  totalCategories: number;
  productsByCategory: { [key: string]: number };
  productsByCondition: { [key: string]: number };
  activityByMonth: { [key: string]: number };
}

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement; linkTo: string; loading?: boolean }> = ({ title, value, icon, linkTo, loading }) => {
  const navigate = useNavigate();
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === 'number' ? 0 : value);

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000; // 1 second animation
      const frameRate = 16; // ~60fps
      const totalFrames = Math.round(duration / frameRate);
      let frame = 0;
      
      const counter = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        // Easing function for a smooth slow-down at the end
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(value * easeOutQuart);
        
        if (frame >= totalFrames) {
          setDisplayValue(value);
          clearInterval(counter);
        } else {
          setDisplayValue(current);
        }
      }, frameRate);
      
      return () => clearInterval(counter);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

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
        {loading ? (
          <Skeleton variant="text" width={60} height={32} />
        ) : (
          <Typography variant="h6" fontWeight="bold">{displayValue}</Typography>
        )}
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
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleMonthChange = (offset: number) => {
    if (!selectedMonth) return;
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1; // 0-indexed
    
    month += offset;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setSelectedMonth(`${year}-${String(month + 1).padStart(2, '0')}`);
  };

  const barScrollRef = useRef<HTMLDivElement>(null);
  const [isBarDragging, setIsBarDragging] = useState(false);
  const [barStartY, setBarStartY] = useState(0);
  const [barScrollTop, setBarScrollTop] = useState(0);
  const barVelocityRef = useRef(0);
  const barMomentumRef = useRef<number | null>(null);
  const barLastPosRef = useRef(0);
  const barLastTimeRef = useRef(0);

  const { isDark: isThemeContextDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Admin');

  // Cleanup momentum animations on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (barMomentumRef.current) cancelAnimationFrame(barMomentumRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async (isBackgroundRefresh = false) => {

      try {

        if (!isBackgroundRefresh) setLoading(true);

        // Fetch all data in parallel for efficiency
        const [productsResult, usersResult, roles, categories, transactionsResult] = await Promise.all([
          api.getProducts({ 
            pageNumber: 1, 
            pageSize: 1000,
            sortBy: 'updateDate',
            isAscending: false
          }).catch(() => ({ items: [], totalCount: 0 })),
          isAdmin ? api.getUsers({ pageSize: 1 }).catch(() => ({ items: [], totalCount: 0 })) : Promise.resolve({ items: [], totalCount: 0 }),
          isAdmin ? api.getRoles().catch(() => []) : Promise.resolve([]),
          api.getCategories().catch(() => []),
          api.getTransactions ? api.getTransactions({ 
            pageNumber: 1, 
            pageSize: 1000
          }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
        ]);

        const productsByCategory = productsResult.items.reduce((acc, product) => {
          const category = product.categoryName || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        const productsByCondition = productsResult.items.reduce((acc, product) => {
          const condition = product.quality || 'Unspecified';
          acc[condition] = (acc[condition] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // Group items by month for the line chart (fallback to tracking products if no transactions exist)
        const itemsToGraph = transactionsResult.items.length > 0 ? transactionsResult.items : productsResult.items;
        
        const isDailyView = !!selectedMonth;

        const activityMap = itemsToGraph.reduce((acc: { [key: string]: number }, item: any) => {
          // Prefer Transaction/Update Date for recent activity, then fallback to acquisition/creation dates
          const dateStr = item.transactionDate || item.updateDate || item.invoiceDate || item.createdDate || item.createdAt || item.date;
          if (!dateStr) return acc;
          

          const date = new Date(dateStr);
          // Skip invalid dates and C# DateTime.MinValue (Year 1) which break the chart scale
          if (isNaN(date.getTime()) || date.getFullYear() < 1900) return acc; 
          
          if (isDailyView) {
            const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (itemMonth !== selectedMonth) return acc;
            const key = `${itemMonth}-${String(date.getDate()).padStart(2, '0')}`;
            acc[key] = (acc[key] || 0) + 1;
          } else {
            // Group by local YYYY-MM for accurate monthly sorting
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[key] = (acc[key] || 0) + 1;
          }
          return acc;
        }, {} as { [key: string]: number });

        // Ensure we always have a continuous timeline (fill in missing months with 0s)
        // and at least 6 months of context if there's only 1 month of data.
        const activityByDate: { [key: string]: number } = {};
        if (isDailyView) {
          const [year, month] = selectedMonth.split('-');
          const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
          for (let i = 1; i <= daysInMonth; i++) {
            const key = `${selectedMonth}-${String(i).padStart(2, '0')}`;
            activityByDate[key] = activityMap[key] || 0;
          }
        } else {
          const keys = Object.keys(activityMap).sort();
          if (keys.length > 0) {
            const maxDate = new Date(`${keys[keys.length - 1]}-01T12:00:00`);
            // Always enforce a 12-month rolling window ending at the latest activity so the chart never shrinks
            let minDate = new Date(maxDate);
            minDate.setMonth(minDate.getMonth() - 11);
            for (let d = new Date(minDate); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              activityByDate[key] = activityMap[key] || 0;
            }
          }
        }

        setSummary({
          totalProducts: productsResult.totalCount,
          totalUsers: usersResult.totalCount,
          totalRoles: roles.length,
          totalCategories: categories.length,
          productsByCategory,
          productsByCondition,
          activityByMonth: activityByDate,
        });
        
      } catch (err: any) {
        const message = err.response?.data?.title || 'Failed to load dashboard data.';
        setError(message);
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    void fetchDashboardData(); // Call once on mount

    // Setup SignalR WebSockets connection to listen for real-time updates
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${api.BASE_URL}/hubs/dashboard`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    connection.on('DashboardUpdated', () => {
      void fetchDashboardData(true);
    });

    connection.on('ProductStockUpdated', (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
      showToast(message, type);
    });

    connection.on('ActiveUsersUpdated', (count: number) => {
      setActiveUsersCount(count);
      // Optional: showToast(`${count} users currently online`, 'info');
    });

    let isMounted = true;
    
    // Delay the connection slightly to completely bypass React 18 Strict Mode's rapid mount/unmount cycle
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        connection.start().catch((err: any) => {
          if (isMounted) console.error('SignalR Connection Error: ', err);
        });
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      void connection.stop();
    };
  }, [showToast, isAdmin, selectedMonth]); // Dependencies: showToast, isAdmin, selectedMonth


  const handleBarMouseDown = (e: React.MouseEvent) => {
    if (!barScrollRef.current) return;
    if (barMomentumRef.current) cancelAnimationFrame(barMomentumRef.current);
    setIsBarDragging(true);
    setBarStartY(e.pageY - barScrollRef.current.offsetTop);
    setBarScrollTop(barScrollRef.current.scrollTop);
    barLastPosRef.current = e.pageY;
    barLastTimeRef.current = performance.now();
    barVelocityRef.current = 0;
  };
  
  const handleBarMouseUpOrLeave = () => {
    if (!isBarDragging) return;
    setIsBarDragging(false);
    let velocity = barVelocityRef.current;
    const momentumLoop = () => {
      if (!barScrollRef.current || Math.abs(velocity) < 0.1) return;
      barScrollRef.current.scrollTop -= velocity * 15;
      velocity *= 0.95; // Friction multiplier
      barMomentumRef.current = requestAnimationFrame(momentumLoop);
    };
    barMomentumRef.current = requestAnimationFrame(momentumLoop);
  };

  const handleBarMouseMove = (e: React.MouseEvent) => {
    if (!isBarDragging || !barScrollRef.current) return;
    e.preventDefault();
    const y = e.pageY - barScrollRef.current.offsetTop;
    const walk = (y - barStartY) * 1.5; // Drag speed multiplier
    barScrollRef.current.scrollTop = barScrollTop - walk;

    const now = performance.now();
    const dt = now - barLastTimeRef.current;
    if (dt > 0) {
      const dy = e.pageY - barLastPosRef.current;
      barVelocityRef.current = (dy / dt) * 1.5;
    }
    barLastPosRef.current = e.pageY;
    barLastTimeRef.current = now;
  };

  // Fallbacks: If there are 0 categories, show a 'No Data' placeholder bar so the chart doesn't collapse
  const barLabels = summary && Object.keys(summary.productsByCategory).length > 0 ? Object.keys(summary.productsByCategory) : ['No Data'];
  const barData = summary && Object.keys(summary.productsByCategory).length > 0 ? Object.values(summary.productsByCategory) : [0];

  // Map the condition data into the format the PieChart expects
  const pieData = summary && Object.keys(summary.productsByCondition).length > 0
    ? Object.keys(summary.productsByCondition).map((key, index) => ({
        id: index,
        value: summary.productsByCondition[key],
        label: key,
      }))
    : [{ id: 0, value: 1, label: 'No Data' }];

  const totalPieValue = pieData.reduce((sum, item) => sum + item.value, 0);

  // Sort standard YYYY-MM date strings
  const sortedActivityKeys = summary ? Object.keys(summary.activityByMonth).sort() : [];
  
  const isDailyViewActive = sortedActivityKeys.length > 0 && sortedActivityKeys[0].split('-').length === 3;

  // Format labels nicely (e.g., "Oct 2023" or "Oct 12")
  const lineChartLabels = sortedActivityKeys.map(key => {
    if (isDailyViewActive) {
      const [year, month, day] = key.split('-');
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)).toLocaleDateString('default', { month: 'short', day: 'numeric' });
    } else {
      const [year, month] = key.split('-');
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toLocaleDateString('default', { month: 'short', year: 'numeric' });
    }
  });

  // Fallbacks: If there is 0 activity, show a 'No Activity' flat line so the chart remains visible
  const hasActivityData = summary && Object.keys(summary.activityByMonth).length > 0;
  const lineLabels = hasActivityData ? lineChartLabels : ['No Activity'];
  const lineData = hasActivityData ? sortedActivityKeys.map(key => summary.activityByMonth[key]) : [0];

  // Define a set of theme colors to cycle through for the categories
  const themeColors = [
    muiTheme.palette.primary.main,
    muiTheme.palette.secondary.main,
    muiTheme.palette.success.main,
    muiTheme.palette.warning.main,
    muiTheme.palette.info.main,
    muiTheme.palette.error.main,
  ];

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={isAdmin ? 3 : 6}>
          <SummaryCard
            title="Total Products"
            value={summary?.totalProducts ?? 0}
            icon={<InventoryIcon />}
            linkTo="/products"
            loading={loading}
          />
        </Grid>
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title={`Total Users ${activeUsersCount !== null ? `(${activeUsersCount} Online)` : ''}`}
                value={summary?.totalUsers ?? 0}
                icon={<GroupIcon />}
                linkTo="/admin/users"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Total Roles"
                value={summary?.totalRoles ?? 0}
                icon={<SecurityIcon />}
                linkTo="/admin/roles"
                loading={loading}
              />
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6} md={isAdmin ? 3 : 6}>
          <SummaryCard
            title="Total Categories"
            value={summary?.totalCategories ?? 0}
            icon={<CategoryIcon />}
            linkTo="/products"
            loading={loading}
          />
        </Grid>

        {/*  Charts */}
        {(summary || loading) && (
          <>
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 2, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ mb: 0 }}>
                    Transaction Activity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selectedMonth && (
                      <Button size="small" onClick={() => setSelectedMonth('')} color="inherit">Clear</Button>
                    )}
                    {selectedMonth && (
                      <IconButton size="small" onClick={() => handleMonthChange(-1)} title="Previous Month">
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                    )}
                    <TextField 
                      type="month" 
                      size="small" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)} 
                    />
                    {selectedMonth && (
                      <IconButton size="small" onClick={() => handleMonthChange(1)} title="Next Month">
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Box sx={{ position: 'relative', flexGrow: 1, minHeight: '300px', width: '100%' }}>
                {loading ? <Skeleton variant="rounded" width="100%" height="100%" /> : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <LineChart
                      xAxis={[{ data: lineLabels, scaleType: 'point' }]}
                      series={[
                        {
                          data: lineData,
                          label: isDailyViewActive ? 'Activity / Transactions (Daily)' : 'Activity / Transactions (Monthly)',
                          area: false,
                          color: muiTheme.palette.secondary.main,
                          curve: 'monotoneX', // Smoothes the line for a cleaner look
                          valueFormatter: (value) => `${value} transaction${value === 1 ? '' : 's'}`, // Customizes the tooltip
                        },
                      ]}
                      grid={{ horizontal: true }} // Adds horizontal guidelines
                      margin={{ top: 40, bottom: 30, left: 40, right: 20 }}
                    />
                  </Box>
                )}
              </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ p: 2, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Product Conditions
                </Typography>
                <Box sx={{ position: 'relative', flexGrow: 1, minHeight: '300px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {loading ? <Skeleton variant="circular" width={280} height={280} sx={{ mt: 1 }} /> : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center' }}>
                    <PieChart
                      colors={themeColors}
                      series={[
                        {
                          data: pieData,
                          paddingAngle: 2,
                          arcLabel: (item) => item.label === 'No Data' ? '' : `${((item.value / totalPieValue) * 100).toFixed(0)}%`,
                          arcLabelMinAngle: 20, // Hides the label if the slice is too small to fit the text
                          highlightScope: { faded: 'global', highlighted: 'item' },
                        }
                      ]}
                      margin={{ top: 10, bottom: 80, left: 10, right: 10 }}
                      slotProps={{
                        legend: {
                          direction: 'row',
                          position: { vertical: 'bottom', horizontal: 'middle' },
                          padding: 0,
                        },
                      }}
                    />
                  </Box>
                  )}
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ p: 2, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Products by Category
                </Typography>
                <Box 
                  ref={barScrollRef}
                  onMouseDown={handleBarMouseDown}
                  onMouseLeave={handleBarMouseUpOrLeave}
                  onMouseUp={handleBarMouseUpOrLeave}
                  onMouseMove={handleBarMouseMove}
                  sx={{ 
                    position: 'relative', 
                    flexGrow: 1,
                    minHeight: '300px', 
                    width: '100%', 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    cursor: isBarDragging ? 'grabbing' : 'grab',
                    '&::-webkit-scrollbar': { width: 8 },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.400', borderRadius: 4 },
                    '&::-webkit-scrollbar-track': { backgroundColor: 'grey.100', borderRadius: 4 }
                  }}
                >
              <Box sx={{ 
                height: Math.max(300, barLabels.length * 45), 
                width: '100%',
                // Disable pointer events on the chart while dragging so it doesn't swallow mouse movements
                pointerEvents: isBarDragging ? 'none' : 'auto' 
              }}>
                    {loading ? <Skeleton variant="rounded" width="100%" height="100%" /> : (
                    <BarChart
                      layout="horizontal"
                      yAxis={[{ 
                        scaleType: 'band', 
                        data: barLabels,
                        colorMap: {
                          type: 'ordinal',
                          colors: themeColors,
                        }
                      }]}
                      series={[{ data: barData, label: 'Products' }]}
                      margin={{ left: 100, top: 40, bottom: 30, right: 20 }}
                      onItemClick={(event, itemData) => {
                        const category = barLabels[itemData.dataIndex];
                        if (category && category !== 'No Data') {
                          navigate(`/products?category=${encodeURIComponent(category)}`);
                        }
                      }}
                      sx={{ cursor: 'pointer' }}
                      />
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};