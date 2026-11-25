import { Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Box, CssBaseline, LinearProgress } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { blue, orange, red, amber, green } from '@mui/material/colors';
import { AdminGuard } from "./auth/AdminGuard";
import { AuthProvider } from './auth/AuthContext';
import { GlobalSpinner } from './components/GlobalSpinner';
import { AppShell } from "./layout/AppShell";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { AuthGuard } from './auth/AuthGuard';
import {
  AdminDashboard,
  Dashboard,
  LoginPage,
  LookupManagement,
  NotFound,
  PermissionManagement,
  Products,
  Profile,
  ReportsCenter,
  RoleManagement,
  SystemSettings,
  Transactions,
  UserManagement,
  WriteOffs,
} from './routes/routeLoaders';

const RouteChunkFallback = () => (
  <Box sx={{ width: '100%', pt: 0.5 }}>
    <LinearProgress sx={{ borderRadius: 999, height: 3 }} />
  </Box>
);

const AppContent = () => {
  const { isDark } = useTheme();

  // Create a memoized MUI theme that responds to our custom theme context
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          ...(isDark
            ? {
              // Palette values for dark mode
              primary: { main: blue[300] },
              secondary: { main: orange[400] },
              background: { default: '#121212', paper: '#1e1e1e' },
            }
            : {
              // Palette values for light mode
              primary: { main: blue[700] },
              secondary: { main: orange[800] },
            }),
          // Common colors
          error: {
            main: red.A400,
          },
          warning: {
            main: amber[700],
          },
          info: {
            main: blue[500],
          },
          success: {
            main: green[600],
          },
        },
      }),
    [isDark]
  );
  return (
    <MuiThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <GlobalSpinner />
        <ToastContainer />
        <Suspense fallback={<RouteChunkFallback />}>
          <Routes>
            <Route
              element={
                <RouteErrorBoundary>
                  <Outlet />
                </RouteErrorBoundary>
              }
            >
              <Route path="/login" element={<LoginPage />} />

              {/* Authenticated Routes */}
              <Route element={<AuthGuard />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/reports" element={<ReportsCenter />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminGuard />}>
                    <Route element={<AdminDashboard />}>
                      <Route index element={<Navigate to="users" replace />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="roles" element={<RoleManagement />} />
                      <Route
                        path="permissions"
                        element={<PermissionManagement />}
                      />
                      <Route path="settings" element={<SystemSettings />} />
                      <Route path="lookups" element={<LookupManagement />} />
                      <Route path="transactions" element={<Transactions />} />
                      <Route path="write-offs" element={<WriteOffs />} />
                    </Route>
                  </Route>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Route>

              {/* Catch-all route for 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
