import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../context/ThemeContext';
import {
    AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List,
    ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
    Menu, MenuItem, Avatar, Tooltip, useMediaQuery
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Home as HomeIcon,
    Inventory as InventoryIcon,
    Security as SecurityIcon,
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon,
    Person as PersonIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';

const drawerWidth = 280;
const compactDrawerWidth = 88;

const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <HomeIcon />, description: 'Summary and quick access', exact: true },
    { label: 'Products', path: '/products', icon: <InventoryIcon />, description: 'Inventory items' },
    { label: 'Admin', path: '/admin', icon: <SecurityIcon />, description: 'User, role, and permission management' }
];

const pageMetadata: Record<string, { title: string; description: string }> = {
    '/profile': { title: 'Profile', description: 'Review and update your account details' },
    '/settings': { title: 'Settings', description: 'Customize preferences and appearance' },
};

export const AppShell: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const muiTheme = useMuiTheme();
    const isLargeScreen = useMediaQuery(muiTheme.breakpoints.up('lg'));
    const { toggleDarkMode, isDark } = useTheme();

    // Component state
    const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebarOpen', window.innerWidth >= 1024);
    const [isCompact, setIsCompact] = useLocalStorage('sidebarCompact', false);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
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

    const initials = user?.fullName?.charAt(0).toUpperCase() || user?.userName?.charAt(0).toUpperCase() || 'U';
    const currentDrawerWidth = isCompact && isLargeScreen ? compactDrawerWidth : drawerWidth;

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: isCompact && isLargeScreen ? 'center' : 'flex-start', px: 2.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, mr: isCompact && isLargeScreen ? 0 : 2, fontWeight: 'bold' }}>S</Avatar>
                {!(isCompact && isLargeScreen) && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>School REST UI</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>React Version</Typography>
                    </Box>
                )}
            </Toolbar>
            <Divider />
            <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
                {navigationItems.map((item) => {
                    if (item.path.startsWith('/admin') && !isAdmin) return null;

                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                end={item.exact}
                                onClick={() => !isLargeScreen && setSidebarOpen(false)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: isCompact && isLargeScreen ? 'center' : 'initial',
                                    px: 2.5,
                                    borderRadius: 2,
                                    ...(isActive && {
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        '& .MuiListItemIcon-root': { color: 'inherit' }
                                    })
                                }}
                            >
                                <ListItemIcon sx={{
                                    minWidth: 0,
                                    mr: isCompact && isLargeScreen ? 0 : 2,
                                    justifyContent: 'center',
                                    color: isActive ? 'inherit' : 'primary.main'
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                {!(isCompact && isLargeScreen) && (
                                    <ListItemText 
                                        primary={item.label} 
                                        secondary={item.description} 
                                        primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium', fontSize: '0.875rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.7rem', color: isActive ? 'inherit' : 'text.secondary' }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Divider />
            <Box sx={{ p: 2, display: { xs: 'none', lg: 'block' } }}>
                <ListItemButton onClick={() => setIsCompact(!isCompact)} sx={{ borderRadius: 2, justifyContent: isCompact ? 'center' : 'initial' }}>
                    <ListItemIcon sx={{ minWidth: 0, mr: isCompact ? 0 : 2 }}>
                        {isCompact ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </ListItemIcon>
                    {!isCompact && <ListItemText primary="Collapse Sidebar" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 'medium' }} />}
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
                        <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                            <IconButton onClick={toggleDarkMode} color="inherit">
                                {isDark ? <Brightness7Icon sx={{ color: 'warning.main' }} /> : <Brightness4Icon sx={{ color: 'info.main' }} />}
                            </IconButton>
                        </Tooltip>
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
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                <Typography textAlign="center" color="error">Sign out</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { lg: sidebarOpen ? currentDrawerWidth : 0 }, flexShrink: { lg: 0 }, transition: 'width 0.3s' }}>
                <Drawer
                    variant={isLargeScreen ? 'persistent' : 'temporary'}
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    ModalProps={{ keepMounted: true }} // Better open performance on mobile
                    sx={{
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
                    {drawerContent}
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
                    <Outlet />
                </Box>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    @By : IT Mloptapang (React Version - MUI)
                </Typography>
            </Box>
        </Box>
    );
};