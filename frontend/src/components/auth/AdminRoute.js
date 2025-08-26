import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import authService from '../../api/auth';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const isLoggedIn = authService.isLoggedIn();
        
        if (!isLoggedIn) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        // Check if user is admin directly from stored user data
        const isAdminUser = authService.isAdmin();
        setIsAdmin(isAdminUser);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAdmin) {
    // Redirect to dashboard if user is not an admin
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default AdminRoute;