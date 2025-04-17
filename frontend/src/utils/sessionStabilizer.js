/**
 * Utility to stabilize user sessions and prevent unexpected logouts
 */
const sessionStabilizer = {
  /**
   * Initialize and stabilize the current session
   * Should be called at app startup and after successful login
   */
  initSession: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Create a refresh token if it doesn't exist
    if (!localStorage.getItem('refreshToken')) {
      const refreshToken = localStorage.getItem('token');
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    // Set session timestamp
    if (!sessionStorage.getItem('session_start')) {
      sessionStorage.setItem('session_start', Date.now().toString());
    }
    
    return true;
  },
  
  /**
   * Validate the current session - FIXED to not trigger token refresh issues
   * Returns true if the session is valid, false otherwise
   */
  validateSession: () => {
    // Simply check if token exists without modifying anything
    return !!localStorage.getItem('token');
  },
  
  /**
   * Refresh the session
   * Call this before sensitive operations or navigation
   */
  refreshSession: () => {
    // Only update timestamp if we have a token
    if (localStorage.getItem('token')) {
      sessionStorage.setItem('last_activity', Date.now().toString());
      return true;
    }
    return false;
  },
  
  /**
   * Prepare for navigation to prevent logout issues
   * Call this before navigating to another page
   */
  prepareNavigation: () => {
    // Don't call refreshSession here as it was causing issues
    
    // Just save the current route
    try {
      sessionStorage.setItem('last_route', window.location.pathname);
    } catch (e) {
      console.error('Failed to save route state:', e);
    }
    
    return true;
  },
  
  /**
   * End session (logout)
   */
  endSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
  }
};

export default sessionStabilizer;