import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { blue, orange, red, amber, green } from '@mui/material/colors';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { UserManagement } from './features/admin/UserManagement';
import { Profile } from './features/admin/Profile';
import { AdminGuard } from "./auth/AdminGuard";
import { SystemSettings } from './features/admin/SystemSettings';
import { AuthProvider } from './auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { Products } from './features/products/Products';
import { GlobalSpinner } from './components/GlobalSpinner';
import { AppShell } from "./layout/AppShell";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RoleManagement } from './features/admin/RoleManagement';
import { Dashboard } from './features/dashboard/Dashboard';
import { PermissionManagement } from './features/admin/PermissionManagement';
import { NotFound } from './features/error/NotFound';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { AuthGuard } from './auth/AuthGuard';

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
      <CssBaseline />
      <GlobalSpinner />
      <ToastContainer />
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
                </Route>
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;