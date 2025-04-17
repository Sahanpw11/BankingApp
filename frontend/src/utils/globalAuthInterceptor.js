// Global Authentication Interceptor

/**
 * This file contains a global authentication interceptor that ensures 
 * token persistence across the entire application including during 
 * navigation between pages.
 */

// Initialization function - called at app startup
const initGlobalAuthInterceptor = () => {
  // Keep track of the last known good token
  let lastKnownGoodToken = localStorage.getItem('token');
  let lastKnownGoodRefreshToken = localStorage.getItem('refreshToken');
  
  // Store initial tokens in session storage as a backup
  if (lastKnownGoodToken) {
    sessionStorage.setItem('token_backup', lastKnownGoodToken);
    console.log('Global Auth Interceptor: Initial token backed up');
  }
  
  if (lastKnownGoodRefreshToken) {
    sessionStorage.setItem('refresh_token_backup', lastKnownGoodRefreshToken);
  }
  
  // Set up storage event listener to detect token changes across tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'token' && event.newValue) {
      console.log('Global Auth Interceptor: Token updated in another tab');
      sessionStorage.setItem('token_backup', event.newValue);
    }
    if (event.key === 'refreshToken' && event.newValue) {
      sessionStorage.setItem('refresh_token_backup', event.newValue);
    }
  });
  
  // Set up periodic checks to ensure token persistence
  setInterval(() => {
    const currentToken = localStorage.getItem('token');
    
    // If token disappeared but we have a backup, restore it
    if (!currentToken && sessionStorage.getItem('token_backup')) {
      console.log('Global Auth Interceptor: Restoring token from backup');
      localStorage.setItem('token', sessionStorage.getItem('token_backup'));
      
      // Also ensure refresh token exists
      if (!localStorage.getItem('refreshToken') && sessionStorage.getItem('refresh_token_backup')) {
        localStorage.setItem('refreshToken', sessionStorage.getItem('refresh_token_backup'));
      }
    }
    
    // Update our backup if we have a new valid token
    if (currentToken && currentToken !== lastKnownGoodToken) {
      sessionStorage.setItem('token_backup', currentToken);
      lastKnownGoodToken = currentToken;
    }
    
    // Same for refresh token
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (currentRefreshToken && currentRefreshToken !== lastKnownGoodRefreshToken) {
      sessionStorage.setItem('refresh_token_backup', currentRefreshToken);
      lastKnownGoodRefreshToken = currentRefreshToken;
    }
  }, 2000); // Check every 2 seconds
  
  // Add before unload handler to ensure tokens are backed up before page navigation
  window.addEventListener('beforeunload', () => {
    const token = localStorage.getItem('token');
    if (token) {
      sessionStorage.setItem('token_backup', token);
      sessionStorage.setItem('last_activity', Date.now().toString());
    }
  });
  
  console.log('Global Auth Interceptor: Initialized');
  return true;
};

// Create a named export object
const globalAuthInterceptor = {
  initGlobalAuthInterceptor
};

export default globalAuthInterceptor;