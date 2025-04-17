import React, { createContext, useState, useContext, useEffect } from 'react';
import tokenManager from '../utils/tokenManager';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const hasToken = !!tokenManager.getToken();
      setIsAuthenticated(hasToken);
    };
    
    checkAuth();
    
    // Listen for storage events (in case tokens change in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Provide a safe navigation method
  const safeNavigate = (navigate, path, options = {}) => {
    tokenManager.stabilizeSession();
    navigate(path, { 
      ...options, 
      state: { 
        ...options.state,
        skipInitialAuthCheck: true 
      } 
    });
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, safeNavigate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);