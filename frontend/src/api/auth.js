import { endpoints, authHeaders, securityHelpers } from './config';

/**
 * Authentication Service
 * 
 * Handles user authentication operations such as login, register,
 * refreshing tokens, and managing user sessions.
 */
class AuthService {
  /**
   * Ensure we have a valid token - refresh if needed
   * @returns {Promise<string>} Valid access token
   */
  async ensureValidToken() {
    try {
      const token = this.getAccessToken();
      if (!token) {
        // No token available, user needs to log in
        throw new Error('No authentication token available');
      }

      // We'll just return the token and handle 401s in the actual API calls
      return token;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email 
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to persist login
   * @returns {Promise} Response with auth token and user
   */
  async login(email, password, rememberMe = false) {
    try {
      // Send the login request with plain password (backend will hash it)
      const response = await fetch(endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email,
          password,  // Send plain password - backend will hash and compare
          device_id: securityHelpers.hash(navigator.userAgent)
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }
        
        // Better error handling for non-JSON responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        } else {
          // Not JSON, log the text response for debugging
          const textResponse = await response.text();
          console.error('Non-JSON response:', textResponse);
          throw new Error(`Server error (${response.status}): Not a valid JSON response`);
        }
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Not JSON, log the text response
        const textResponse = await response.text();
        console.error('Non-JSON response on success:', textResponse);
        throw new Error('Invalid response format from server');
      }
      
      const data = await response.json();
      console.log('Login response data:', data); // Log the response data
      
      // Standardize token storage - always use localStorage for consistency
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        // If refresh token is available in response
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        // Store refresh token if available
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      } else {
        console.error('No token found in response:', data);
        throw new Error('No authentication token received from server');
      }
      
      // Store user data with the default key instead of password fragment
      const userData = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        isAdmin: data.user.is_admin || false
      };
      
      // Use the DEFAULT_KEY for encryption instead of password substring
      const encryptedUser = securityHelpers.encrypt(userData, securityHelpers.DEFAULT_KEY);
      sessionStorage.setItem('user', encryptedUser);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Registration response
   */
  async register(userData) {
    try {
      // Make sure userData contains all required fields
      if (!userData.username) {
        throw new Error('Username is required');
      }
      
      // Create a well-formed registration payload
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password, // Server will hash it
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        phone_number: userData.phoneNumber || ''
      };
      
      const response = await fetch(endpoints.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Refresh the authentication token
   * @returns {Promise<string>} New access token
   */  
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(endpoints.refreshToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      // Store the new tokens
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      } else {
        throw new Error('No token in refresh response');
      }
      
      return this.getAccessToken();
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Don't logout here, let the calling function decide
      throw error;
    }
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} Response with success status
   */
  async forgotPassword(email) {
    try {
      const response = await fetch(endpoints.forgotPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset instructions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }
  
  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} Response with success status
   */
  async resetPassword(token, password) {
    try {
      const response = await fetch(endpoints.resetPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token, 
          password,
          device_id: securityHelpers.hash(navigator.userAgent)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
  
  /**
   * Get user profile with automatic token refresh on 401
   * @returns {Promise} Response with user profile
   */
  async getProfile() {
    try {
      // First try with current token
      const token = this.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      let response = await fetch(endpoints.profile, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If unauthorized, try refreshing token once
      if (response.status === 401) {
        try {
          console.log('Token expired, attempting refresh...');
          await this.refreshToken();
          const newToken = this.getAccessToken();
          
          // Try again with new token
          response = await fetch(endpoints.profile, {
            method: 'GET',
            headers: authHeaders(newToken)
          });
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // Clear tokens on refresh failure
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          throw new Error('Authentication session expired. Please log in again.');
        }
      }
      
      // If still unauthorized after refresh, we have a more serious problem
      if (response.status === 401) {
        console.error('Still unauthorized after token refresh');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw new Error('Authentication expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response with updated profile
   */
  async updateProfile(profileData) {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      let response = await fetch(endpoints.updateProfile, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(profileData)
      });
      
      // If unauthorized, try refreshing token once
      if (response.status === 401) {
        try {
          await this.refreshToken();
          const newToken = this.getAccessToken();
          
          // Try again with new token
          response = await fetch(endpoints.updateProfile, {
            method: 'PUT',
            headers: authHeaders(newToken),
            body: JSON.stringify(profileData)
          });
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Authentication session expired. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      // Update stored user data
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          firstName: profileData.first_name || currentUser.firstName,
          lastName: profileData.last_name || currentUser.lastName
        };
        
        const encryptedUser = securityHelpers.encrypt(updatedUser, securityHelpers.DEFAULT_KEY);
        sessionStorage.setItem('user', encryptedUser);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  /**
   * Change user password
   * @param {Object} passwordData - Password data with current_password and new_password
   * @returns {Promise} Response data
   */
  async changePassword(passwordData) {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      let response = await fetch(endpoints.changePassword, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(passwordData)
      });
      
      // If unauthorized, try refreshing token once
      if (response.status === 401) {
        try {
          await this.refreshToken();
          const newToken = this.getAccessToken();
          
          // Try again with new token
          response = await fetch(endpoints.changePassword, {
            method: 'POST',
            headers: authHeaders(newToken),
            body: JSON.stringify(passwordData)
          });
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Authentication session expired. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get the current access token
   * @returns {string|null} Current access token or null
   */
  getAccessToken() {
    return localStorage.getItem('token');
  }
  
  /**
   * Get the current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    const encryptedUser = sessionStorage.getItem('user');
    if (!encryptedUser) return null;
    
    try {
      // Try multiple fallback keys since the original encryption key
      // (password substring) is not available after page refresh
      let user = null;
      
      // Try with the default key first
      user = securityHelpers.decrypt(encryptedUser, securityHelpers.DEFAULT_KEY);
      if (user) return user;
      
      // Try with a consistent app key 
      user = securityHelpers.decrypt(encryptedUser, 'current-user');
      if (user) return user;
      
      // Try with the update-profile key used in updateProfile method
      user = securityHelpers.decrypt(encryptedUser, 'update-profile');
      if (user) return user;
      
      // As a last resort, try with an empty key
      user = securityHelpers.decrypt(encryptedUser, '');
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
  
  /**
   * Check if a user is logged in
   * @returns {boolean} Whether a user is logged in
   */
  isLoggedIn() {
    return !!this.getAccessToken();
  }
  
  /**
   * Check if current user is an admin
   * @returns {boolean} Whether current user is an admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user ? user.isAdmin : false;
  }
  
  /**
   * Logout the current user
   */
  logout() {
    console.log('LOGOUT CALLED FROM:', new Error().stack);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  }
}

// Create an instance and then export
const authService = new AuthService();
export default authService;