import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  IconButton, Container, Avatar, Menu, MenuItem, Badge, Tooltip, CssBaseline, ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import authService from '../../api/auth';

// Styled components
const drawerWidth = 240;

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  const menuItems = [
    { path: '/dashboard', text: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/accounts', text: 'Accounts', icon: <AccountBalanceIcon /> },
    { path: '/transfer', text: 'Transfer', icon: <PaymentIcon /> },
    { path: '/pay-bills', text: 'Pay Bills', icon: <PaymentIcon /> },
    { path: '/profile', text: 'Profile', icon: <PersonIcon /> },
    { path: '/settings', text: 'Settings', icon: <SettingsIcon /> },
  ];
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <StyledAppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px',
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            SecureBank
          </Typography>
          
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {authService.getCurrentUser()?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleNavigate('/profile')}>
              <Avatar /> Profile
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>
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
        </Toolbar>
      </StyledAppBar>
      
      <StyledDrawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {menuItems.map((item) => {
            const isItemActive = isActive(item.path);
            return (
              <Box 
                key={item.text} 
                sx={{ 
                  px: open ? 2 : 0, 
                  py: 0.5
                }}
              >
                <Box
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'flex-start' : 'center',
                    py: 1.5,
                    px: open ? 2 : 0,
                    width: '100%',
                    backgroundColor: isItemActive ? '#0a2472' : 'transparent',
                    color: isItemActive ? 'white' : 'text.primary',
                    borderRadius: open ? 1 : 0,
                    '&:hover': {
                      backgroundColor: isItemActive ? '#051850' : 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'background-color 0.2s ease-in-out',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    color: isItemActive ? 'white' : 'primary.main',
                    mr: open ? 2 : 0 
                  }}>
                    {item.icon}
                  </Box>
                  {open && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isItemActive ? 600 : 400,
                        color: isItemActive ? 'white' : 'inherit',
                      }}
                    >
                      {item.text}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: open ? 2 : 0, py: 0.5 }}>
            <Box
              onClick={handleLogout}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: open ? 'flex-start' : 'center',
                py: 1.5,
                px: open ? 2 : 0,
                width: '100%',
                borderRadius: open ? 1 : 0,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                color: 'text.secondary',
                mr: open ? 2 : 0 
              }}>
                <LogoutIcon />
              </Box>
              {open && (
                <Typography variant="body2">
                  Logout
                </Typography>
              )}
            </Box>
          </Box>
        </List>
      </StyledDrawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardLayout;