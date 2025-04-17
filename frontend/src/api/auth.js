import { endpoints, authHeaders, securityHelpers } from './config';
import axios from 'axios';

/**
 * Authentication Service
 * 
 * Handles user authentication operations such as login, register,
 * refreshing tokens, and managing user sessions.
 */
class AuthService {
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
        password: securityHelpers.hash(userData.password), // Hash the password
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
   * @returns {Promise} Response with new auth token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Use axios directly (which is now properly imported)
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/auth/refresh-token`,
        { refreshToken }
      );
      
      // Store the new tokens
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data.token;
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
   * Get user profile
   * @returns {Promise} Response with user profile
   */
  async getProfile() {
    try {
      const token = this.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.profile, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await this.refreshToken();
        return this.getProfile();
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
      
      const response = await fetch(endpoints.updateProfile, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(profileData)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await this.refreshToken();
        return this.updateProfile(profileData);
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
        
        const encryptedUser = securityHelpers.encrypt(updatedUser, 'update-profile');
        sessionStorage.setItem('user', encryptedUser);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
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
      
      // Try with a consistent app key first
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