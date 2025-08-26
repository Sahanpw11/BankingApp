import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../api/auth';
import tokenManager from '../../utils/tokenManager';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const locationState = location.state || {};
  const skipInitialCheck = locationState.skipInitialAuthCheck || false;
  const [loading, setLoading] = useState(!skipInitialCheck);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(skipInitialCheck);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Check for and restore backup tokens
      const tempToken = sessionStorage.getItem('temp_token_backup');
      if (tempToken && !localStorage.getItem('token')) {
        console.log('Restoring token from backup');
        localStorage.setItem('token', tempToken);
      }
      
      // Ensure tokens are stable for this session
      tokenManager.stabilizeSession();
      
      if (!skipInitialCheck) {
        try {
          const isLoggedIn = authService.isLoggedIn();
          setIsAuthenticated(isLoggedIn);
          
          if (isLoggedIn) {
            // Check if the user is an admin - use the method directly
            const isAdminUser = authService.isAdmin();
            setIsAdmin(isAdminUser);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkAuth();
  }, [skipInitialCheck]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Only redirect admin users to admin dashboard if they're accessing specific user routes
  // Check if the path is a regular user route (but not already an admin route)
  const userSpecificRoutes = ['/dashboard', '/accounts', '/transfer', '/pay-bills', '/settings', '/transactions'];
  const isUserSpecificRoute = userSpecificRoutes.some(route => location.pathname.startsWith(route));
  
  if (isAdmin && isUserSpecificRoute) {
    console.log('Admin user accessing regular user routes, redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return children;
}

export default ProtectedRoute;