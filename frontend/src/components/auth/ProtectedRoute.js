import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../api/auth';
import tokenManager from '../../utils/tokenManager';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const locationState = location.state || {};
  const skipInitialCheck = locationState.skipInitialAuthCheck || false;
  
  // This effect runs on mount to ensure token stability
  useEffect(() => {
    // Check for and restore backup tokens
    const tempToken = sessionStorage.getItem('temp_token_backup');
    if (tempToken && !localStorage.getItem('token')) {
      console.log('Restoring token from backup');
      localStorage.setItem('token', tempToken);
    }
    
    // Ensure tokens are stable for this session
    tokenManager.stabilizeSession();
    
    // Clean up backup when component unmounts
    return () => {
      // Don't clean up too aggressively to allow navigation
    };
  }, []);
  
  // Skip auth check if coming from internal navigation with skipInitialAuthCheck flag
  if (skipInitialCheck) {
    console.log('Skipping initial auth check due to internal navigation');
    return children;
  }
  
  // Otherwise perform normal authentication check
  const isAuthenticated = authService.isLoggedIn();
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;