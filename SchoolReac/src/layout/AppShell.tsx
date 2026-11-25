import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { LoadingProvider, useLoading } from '../context/LoadingContext';
import * as api from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme, THEME_ANIMATION_OPTIONS } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { PageTransition, RouteLoadingBar } from '../components/PageTransition';
import { prefetchRoute } from '../routes/routeLoaders';
import {
    AppBar, Box, Chip, CssBaseline, Divider, Drawer, IconButton, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography,
    Menu, MenuItem, Avatar, Tooltip, useMediaQuery
} from '@mui/material';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import { LayoutGroup, motion } from 'framer-motion';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Home as HomeIcon,
    Inventory as InventoryIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';

const drawerWidth = 280;
const compactDrawerWidth = 88;

const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <HomeIcon />, description: 'Summary and quick access', exact: true },
    { label: 'Products', path: '/products', icon: <InventoryIcon />, description: 'Inventory items' },
    { label: 'Reports', path: '/reports', icon: <AssessmentIcon />, description: 'Custom Excel, PDF & Assessment forms' },
    { label: 'Admin', path: '/admin', icon: <SecurityIcon />, description: 'User, role, and permission management' }
];

const pageMetadata: Record<string, { title: string; description: string }> = {
    '/profile': { title: 'Profile', description: 'Review and update your account details' },
    '/settings': { title: 'Settings', description: 'Customize preferences and appearance' },
};

const AppLoadingBar: React.FC = () => {
    const { isLoading } = useLoading();
    return <RouteLoadingBar loading={isLoading} />;
};

const AppShellComponent: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const muiTheme = useMuiTheme();
    const isLargeScreen = useMediaQuery(muiTheme.breakpoints.up('lg'));
    const { animationPreset, setAnimationPreset, toggleDarkMode } = useTheme();

    // Component state
    const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', window.innerWidth >= 1024);
    const [isCompact, setIsCompact] = useLocalStorage('sidebarCompact', false);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const [appLogo, setAppLogo] = useState<string | null>(null);
    const { incrementLoading, decrementLoading } = useLoading();
    const isAdmin = user?.roles?.includes('Admin');

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleCloseUserMenu = () => setAnchorElUser(null);
    const handleLogout = () => { handleCloseUserMenu(); logout({ navigate: true }); };

    const activePage = useMemo(() => {
        const currentPath = location.pathname;
        const current = navigationItems.find(item => currentPath.startsWith(item.path) && item.path !== '/');
        if (current) return { title: current.label, description: current.description };

        const meta = pageMetadata[currentPath];
        if (meta) return meta;

        return { title: 'Dashboard', description: 'Summary and quick access' };
    }, [location.pathname]);

  useEffect(() => {
    // This effect synchronizes the sidebar's open state with the screen size.
    // It's driven by the `isLargeScreen` value from MUI's `useMediaQuery` hook.
    setSidebarOpen(isLargeScreen);
    
    // Also, ensure compact mode is disabled on small screens.
    if (!isLargeScreen) {
      setIsCompact(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLargeScreen]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const settings = await api.getSystemSettings();
        setAppLogo(settings.logoBase64 || null);
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.warn("Failed to load branding", err);
        }
      }
    };

    fetchLogo();
    
    const handleBrandingUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.logoBase64 !== undefined) {
        setAppLogo(customEvent.detail.logoBase64 || null);
      } else {
        fetchLogo();
      }
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdated);
    return () => window.removeEventListener('brandingUpdated', handleBrandingUpdated);
  }, []);

  useEffect(() => {
    // Set the loading callbacks for the API service
    api.setLoadingCallbacks(incrementLoading, decrementLoading);
  }, [incrementLoading, decrementLoading]);

    const initials = user?.fullName?.charAt(0).toUpperCase() || user?.userName?.charAt(0).toUpperCase() || 'U';
    const currentDrawerWidth = isCompact && isLargeScreen ? compactDrawerWidth : drawerWidth;

    const renderDrawerContent = (variant: 'mobile' | 'desktop') => (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              isCompact && isLargeScreen ? "center" : "flex-start",
            px: 2.5,
          }}
        >
          <Avatar
            src={appLogo ? (appLogo.startsWith('data:') ? appLogo : `data:image/png;base64,${appLogo}`) : "/logo-color.png"}
            alt="App Logo"
            sx={{
              bgcolor: "transparent",
              width: 36,
              height: 36,
              mr: isCompact && isLargeScreen ? 0 : 2,
            }}
          />
          {!(isCompact && isLargeScreen) && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                }}
              >
                IMS
              </Typography>
            </Box>
          )}
        </Toolbar>
        <Divider />
        <LayoutGroup id={`sidebar-nav-${variant}`}>
          <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
            {navigationItems.map((item) => {
              if (item.path.startsWith("/admin") && !isAdmin) return null;

              const isActive = location.pathname.startsWith(item.path);
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    end={item.exact}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    onClick={() => !isLargeScreen && setSidebarOpen(false)}
                    sx={{
                      position: "relative",
                      overflow: "visible",
                      minHeight: 48,
                      justifyContent:
                        isCompact && isLargeScreen ? "center" : "initial",
                      px: 2.5,
                      borderRadius: 2,
                      color: isActive ? "primary.contrastText" : "text.primary",
                      transition: "color 200ms ease, background-color 200ms ease",
                      "& .MuiListItemIcon-root": {
                        transition: "transform 180ms ease, color 200ms ease",
                      },
                      "&:hover": {
                        bgcolor: isActive ? "transparent" : "action.hover",
                        "& .MuiListItemIcon-root": {
                          transform: "translateX(2px) scale(1.08)",
                        },
                      },
                    }}
                  >
                    {isActive && (
                      <Box
                        component={motion.span}
                        layoutId={`sidebar-active-pill-${variant}`}
                        transition={{ type: "spring", stiffness: 600, damping: 38, mass: 0.65 }}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 2,
                          bgcolor: "primary.main",
                          boxShadow: `0 4px 14px ${alpha(muiTheme.palette.primary.main, 0.34)}`,
                          zIndex: 0,
                        }}
                      />
                    )}
                    <ListItemIcon
                      sx={{
                        position: "relative",
                        zIndex: 1,
                        minWidth: 0,
                        mr: isCompact && isLargeScreen ? 0 : 2,
                        justifyContent: "center",
                        color: isActive ? "inherit" : "primary.main",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!(isCompact && isLargeScreen) && (
                      <ListItemText
                        primary={item.label}
                        secondary={item.description}
                        sx={{ position: "relative", zIndex: 1 }}
                        primaryTypographyProps={{
                          fontWeight: isActive ? "bold" : "medium",
                          fontSize: "0.875rem",
                        }}
                        secondaryTypographyProps={{
                          fontSize: "0.7rem",
                          color: isActive ? "inherit" : "text.secondary",
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </LayoutGroup>
        <Divider />
        <Box sx={{ p: 2, display: { xs: "none", lg: "block" } }}>
          <ListItemButton
            onClick={() => setIsCompact(!isCompact)}
            sx={{
              borderRadius: 2,
              justifyContent: isCompact ? "center" : "initial",
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: isCompact ? 0 : 2 }}>
              <motion.span
                animate={{ rotate: isCompact ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                style={{ display: "inline-flex" }}
              >
                <ChevronLeftIcon />
              </motion.span>
            </ListItemIcon>
            {!isCompact && (
              <ListItemText
                primary="Collapse Sidebar"
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: "medium",
                }}
              />
            )}
          </ListItemButton>
        </Box>
      </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <CssBaseline />
            {/* Header */}
            <AppBar 
                position="fixed" 
                elevation={1}
                sx={{ 
                    bgcolor: 'background.paper', 
                    color: 'text.primary',
                    width: { lg: `calc(100% - ${sidebarOpen ? currentDrawerWidth : 0}px)` },
                    ml: { lg: sidebarOpen ? `${currentDrawerWidth}px` : 0 },
                    transition: muiTheme.transitions.create(['width', 'margin'], {
                        easing: muiTheme.transitions.easing.sharp,
                        duration: muiTheme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        sx={{ mr: 2, display: { lg: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h1" fontWeight="bold">
                            {activePage.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {activePage.description}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThemeToggle />
                        <Tooltip title="Open settings">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                                <Avatar src={user?.imageUrl} sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                                    {initials}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                                <ListItemIcon><PersonIcon fontSize="small" color="primary" /></ListItemIcon>
                                <Typography textAlign="center">Profile</Typography>
                            </MenuItem>
                            <Divider />
                            <Box sx={{ px: 2, py: 1.25, maxWidth: 250 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>
                                    Theme Transition Effect
                                </Typography>
                                <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                                    {THEME_ANIMATION_OPTIONS.map((opt) => (
                                        <Chip
                                            key={opt.id}
                                            size="small"
                                            label={opt.label}
                                            color={animationPreset === opt.id ? 'primary' : 'default'}
                                            variant={animationPreset === opt.id ? 'filled' : 'outlined'}
                                            onClick={(e) => {
                                                setAnimationPreset(opt.id);
                                                toggleDarkMode(e, opt.id);
                                            }}
                                            sx={{ fontSize: '0.72rem', height: 24 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                <Typography textAlign="center" color="error">Sign out</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
                <AppLoadingBar />
            </AppBar>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { lg: sidebarOpen ? currentDrawerWidth : 0 }, flexShrink: { lg: 0 }, transition: 'width 0.3s' }}>
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={!isLargeScreen ? sidebarOpen : false}
                    onClose={() => setSidebarOpen(false)}
                    ModalProps={{ keepMounted: true }} // Better open performance on mobile
                    sx={{
                        display: { xs: 'block', lg: 'none' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: currentDrawerWidth,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        },
                    }}
                >
                    {renderDrawerContent('mobile')}
                </Drawer>

                {/* Desktop Drawer */}
                <Drawer
                    variant="persistent"
                    open={isLargeScreen ? sidebarOpen : false}
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: currentDrawerWidth,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            transition: muiTheme.transitions.create('width', {
                                easing: muiTheme.transitions.easing.sharp,
                                duration: muiTheme.transitions.duration.enteringScreen,
                            }),
                        },
                    }}
                >
                    {renderDrawerContent('desktop')}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: { xs: 2, sm: 3, md: 4 }, 
                    width: { lg: `calc(100% - ${sidebarOpen ? currentDrawerWidth : 0}px)` }, 
                    mt: 8,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ maxWidth: 1520, width: '100%', mx: 'auto', flexGrow: 1 }}>
                    <PageTransition pageKey={location.pathname.startsWith('/admin') ? '/admin' : location.pathname}>
                        <Outlet />
                    </PageTransition>
                </Box>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    @By : IT Mloptapang (React - MUI)
                </Typography>
            </Box>
        </Box>
    );
};

export const AppShell: React.FC = () => {
    return (
        <LoadingProvider>
            <AppShellComponent />
        </LoadingProvider>
    );
};