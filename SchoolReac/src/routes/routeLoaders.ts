import { lazy } from 'react';

export const loadLoginPage = () => import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage }));
export const loadDashboard = () => import('../features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard }));
export const loadProducts = () => import('../features/products/Products').then((m) => ({ default: m.Products }));
export const loadReportsCenter = () => import('../features/reports/ReportsCenter').then((m) => ({ default: m.ReportsCenter }));
export const loadProfile = () => import('../features/admin/Profile').then((m) => ({ default: m.Profile }));
export const loadAdminDashboard = () => import('../features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }));
export const loadUserManagement = () => import('../features/admin/UserManagement').then((m) => ({ default: m.UserManagement }));
export const loadRoleManagement = () => import('../features/admin/RoleManagement').then((m) => ({ default: m.RoleManagement }));
export const loadPermissionManagement = () => import('../features/admin/PermissionManagement').then((m) => ({ default: m.PermissionManagement }));
export const loadSystemSettings = () => import('../features/admin/SystemSettings').then((m) => ({ default: m.SystemSettings }));
export const loadLookupManagement = () => import('../features/admin/LookupManagement').then((m) => ({ default: m.LookupManagement }));
export const loadTransactions = () => import('../features/admin/Transactions').then((m) => ({ default: m.Transactions }));
export const loadWriteOffs = () => import('../features/admin/WriteOffs').then((m) => ({ default: m.WriteOffs }));
export const loadNotFound = () => import('../features/error/NotFound').then((m) => ({ default: m.NotFound }));

export const LoginPage = lazy(loadLoginPage);
export const Dashboard = lazy(loadDashboard);
export const Products = lazy(loadProducts);
export const ReportsCenter = lazy(loadReportsCenter);
export const Profile = lazy(loadProfile);
export const AdminDashboard = lazy(loadAdminDashboard);
export const UserManagement = lazy(loadUserManagement);
export const RoleManagement = lazy(loadRoleManagement);
export const PermissionManagement = lazy(loadPermissionManagement);
export const SystemSettings = lazy(loadSystemSettings);
export const LookupManagement = lazy(loadLookupManagement);
export const Transactions = lazy(loadTransactions);
export const WriteOffs = lazy(loadWriteOffs);
export const NotFound = lazy(loadNotFound);

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/dashboard': loadDashboard,
  '/products': loadProducts,
  '/reports': loadReportsCenter,
  '/profile': loadProfile,
  '/admin': () => Promise.all([loadAdminDashboard(), loadUserManagement()]),
  '/admin/users': loadUserManagement,
  '/admin/roles': loadRoleManagement,
  '/admin/permissions': loadPermissionManagement,
  '/admin/settings': loadSystemSettings,
  '/admin/lookups': loadLookupManagement,
  '/admin/transactions': loadTransactions,
  '/admin/write-offs': loadWriteOffs,
};

const prefetchedPaths = new Set<string>();

/**
 * Warms the lazy route chunk on hover/focus so clicking a menu feels instantaneous.
 */
export const prefetchRoute = (path: string) => {
  if (prefetchedPaths.has(path)) return;
  const loader = ROUTE_PREFETCHERS[path];
  if (!loader) return;
  prefetchedPaths.add(path);
  void loader();
};
