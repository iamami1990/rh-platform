import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    People,
    AccessTime,
    BeachAccess,
    MonetizationOn,
    Psychology,
    Logout,
    AccountCircle,
    Analytics,
    Notifications,
} from '@mui/icons-material';
import { logout } from '../store/authSlice';
import { sentimentAPI } from '../services/api';

const DRAWER_WIDTH = 280;

const MainLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifAnchor, setNotifAnchor] = useState(null);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await sentimentAPI.getAlerts({ limit: 5 });
                setAlerts(response.data.alerts || []);
            } catch (error) {
                console.error('Failed to fetch alerts:', error);
            }
        };
        fetchAlerts();
    }, []);

    const menuItems = [
        { text: 'Tableau de Bord', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Employés', icon: <People />, path: '/employees' },
        { text: 'Présence', icon: <AccessTime />, path: '/attendance' },
        { text: 'Congés', icon: <BeachAccess />, path: '/leaves' },
        { text: 'Paie', icon: <MonetizationOn />, path: '/payroll' },
        { text: 'Sentiment IA', icon: <Psychology />, path: '/sentiment' },
        { text: 'Statistiques', icon: <Analytics />, path: '/analytics' },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box
                sx={{
                    p: 3,
                    mb: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: 'white',
                    borderRadius: '0 0 20px 20px',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                }}
            >
                <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
                    ScanStaff
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                    MANAGEMENT INTELLIGENT
                </Typography>
            </Box>

            {/* Navigation Menu */}
            <List sx={{ px: 2, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = window.location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: '12px',
                                    color: isActive ? 'primary.main' : 'text.secondary',
                                    bgcolor: isActive ? 'primary.light' : 'transparent',
                                    '&:hover': {
                                        bgcolor: isActive ? 'primary.light' : 'rgba(99, 102, 241, 0.04)',
                                        color: 'primary.main',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ mx: 2, mb: 2 }} />

            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled">
                    v1.0.0 © 2025 Antigravity
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" fontWeight="700" color="primary">
                        {menuItems.find(item => item.path === window.location.pathname)?.text || 'Dashboard'}
                    </Typography>

                    {/* Right Side Icons */}
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                            color="inherit"
                            onClick={(e) => setNotifAnchor(e.currentTarget)}
                            sx={{ bgcolor: 'rgba(99, 102, 241, 0.04)', mr: 1 }}
                        >
                            <Box sx={{ position: 'relative' }}>
                                <Notifications />
                                {alerts.length > 0 && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'error.main',
                                        borderRadius: '50%',
                                        border: '2px solid white'
                                    }} />
                                )}
                            </Box>
                        </IconButton>

                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="body2" fontWeight="700">
                                {user?.firstName} {user?.lastName || 'Admin'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {user?.role || 'Administrateur'}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleMenuClick} sx={{ p: 0.5, border: '2px solid', borderColor: 'primary.light' }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                                {user?.email?.charAt(0).toUpperCase() || 'A'}
                            </Avatar>
                        </IconButton>
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                minWidth: 180,
                            }
                        }}
                    >
                        <MenuItem disabled sx={{ py: 1.5 }}>
                            <AccountCircle sx={{ mr: 1.5, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight="600">{user?.email}</Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                            <Logout sx={{ mr: 1.5, fontSize: 20 }} />
                            <Typography variant="body2" fontWeight="600">Déconnexion</Typography>
                        </MenuItem>
                    </Menu>

                    {/* Notifications Menu */}
                    <Menu
                        anchorEl={notifAnchor}
                        open={Boolean(notifAnchor)}
                        onClose={() => setNotifAnchor(null)}
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                width: 320,
                                maxHeight: 400,
                            }
                        }}
                    >
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="800">Alertes IA</Typography>
                            <Typography variant="caption" color="text.secondary">{alerts.length} nouvelles</Typography>
                        </Box>
                        <Divider />
                        {alerts.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Aucune alerte pour le moment</Typography>
                            </Box>
                        ) : (
                            alerts.map((alert, idx) => (
                                <MenuItem key={idx} sx={{ py: 1.5, whiteSpace: 'normal', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="700" color="error.main">
                                            Risque Turnover Détecté
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Collaborateur ID: {alert.employee_id} - Score: {alert.overall_score}%
                                        </Typography>
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'primary.main', fontWeight: 600 }}>
                                            Action recommandée: {alert.recommendations}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        )}
                        <Divider />
                        <MenuItem onClick={() => { setNotifAnchor(null); navigate('/sentiment'); }} sx={{ justifyContent: 'center', py: 1.5 }}>
                            <Typography variant="caption" fontWeight="700" color="primary">Voir toutes les analyses</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            border: 'none',
                            boxShadow: '10px 0 30px rgba(0,0,0,0.05)'
                        },
                    }}
                >
                    {drawer}
                </Drawer>

                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            border: 'none',
                            bgcolor: 'transparent'
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 4 },
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: 8,
                    bgcolor: '#f8fafc',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};


export default MainLayout;
