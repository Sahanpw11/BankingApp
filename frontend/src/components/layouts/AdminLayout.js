import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItem, 
  ListItemIcon, ListItemText, Toolbar, Typography, Menu, MenuItem, Avatar, 
  Tooltip, Badge, Container, useTheme, useMediaQuery, Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import authService from '../../api/auth';
import { alpha } from '@mui/material/styles';

const drawerWidth = 240;

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsEl, setNotificationsEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationsEl);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsEl(null);
  };
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  const adminMenu = [
    { name: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { name: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
    { name: 'Account Management', icon: <AccountBalanceIcon />, path: '/admin/accounts' },
    { name: 'Transaction History', icon: <ReceiptIcon />, path: '/admin/transactions' },
    { name: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' }
  ];

  const drawer = (
    <div>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: [1],
          bgcolor: 'primary.main', 
          color: 'white'
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Admin Portal
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {adminMenu.map((item) => (
          <ListItem 
            button 
            key={item.name} 
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              },
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? 'primary.main' : 'inherit' 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.name} 
              primaryTypographyProps={{ 
                fontWeight: location.pathname === item.path ? 'medium' : 'regular' 
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => { handleMenuClose(); navigate('/admin/profile'); }}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>
      <MenuItem onClick={() => { handleMenuClose(); navigate('/admin/settings'); }}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = (
    <Menu
      anchorEl={notificationsEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isNotificationsOpen}
      onClose={handleNotificationsClose}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 400,
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Notifications
        </Typography>
      </Box>
      <Divider />
      <MenuItem onClick={handleNotificationsClose}>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            New user registered
          </Typography>
          <Typography variant="caption" color="text.secondary">
            A new user has registered in the system
          </Typography>
        </Box>
      </MenuItem>
      <MenuItem onClick={handleNotificationsClose}>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Large transaction flagged
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Transaction ID #23584 requires review
          </Typography>
        </Box>
      </MenuItem>
      <Divider />
      <Box textAlign="center" p={1}>
        <Button 
          component={RouterLink} 
          to="/admin/notifications" 
          color="primary" 
          size="small"
          onClick={handleNotificationsClose}
        >
          View All
        </Button>
      </Box>
    </Menu>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {adminMenu.find(item => item.path === location.pathname)?.name || 'Admin Portal'}
          </Typography>
          
          {/* Notifications icon */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={2} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Profile menu */}
          <Tooltip title="Account">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>A</Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      {renderMenu}
      {renderNotificationsMenu}
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="admin menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar /> {/* This empty Toolbar creates space at the top */}
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;