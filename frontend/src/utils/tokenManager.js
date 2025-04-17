// Create this new file

/**
 * Token management utility to handle token operations
 * independently of the auth service to avoid circular dependencies
 */
const tokenManager = {
  /**
   * Get the authentication token
   * @returns {string|null} The token or null
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get the refresh token
   * @returns {string|null} The refresh token or null
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Store authentication token
   * @param {string} token - The auth token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    }
  },

  /**
   * Store refresh token
   * @param {string} refreshToken - The refresh token
   */
  setRefreshToken(refreshToken) {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  /**
   * Clear tokens (used during logout)
   */
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Check if user is authenticated (has valid token)
   * @returns {boolean} True if token exists
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Create a temporary refresh token if missing
   */
  ensureRefreshToken() {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (token && !refreshToken) {
      this.setRefreshToken(token);
      return true;
    }
    return false;
  },

  /**
   * FAILSAFE MODE: Call this before any navigation that's experiencing auth issues
   * This creates a temporary session that will last until the next API call 
   * requiring a proper token refresh
   * @returns {boolean} True if tokens are available
   */
  stabilizeSession() {
    // Get current tokens
    const token = localStorage.getItem('token');
    
    if (token) {
      // Create a backup copy in case the session is being cleared unexpectedly
      sessionStorage.setItem('backup_token', token);
      
      // Ensure we have a refresh token (even if artificial)
      if (!localStorage.getItem('refreshToken')) {
        localStorage.setItem('refreshToken', token);
        console.log('Created failsafe refresh token');
      }
      
      return true;
    } else {
      // Try to recover from backup if main token is missing
      const backupToken = sessionStorage.getItem('backup_token');
      if (backupToken) {
        localStorage.setItem('token', backupToken);
        localStorage.setItem('refreshToken', backupToken);
        console.log('Recovered from token backup');
        return true;
      }
    }
    
    return false;
  }
};

export default tokenManager;