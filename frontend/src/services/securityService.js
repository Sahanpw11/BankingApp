import CryptoJS from 'crypto-js';
import { authHeaders, endpoints } from '../api/config';

// Local storage keys
const STORAGE_KEYS = {
  SESSION_KEY: 'banking_session_key',
  DEVICE_ID: 'banking_device_id'
};

/**
 * Security Service
 * 
 * Handles security operations such as encryption, decryption,
 * two-factor authentication, and secure storage.
 */
class SecurityService {
  constructor() {
    // Generate or retrieve device ID
    this.deviceId = this.getDeviceId();
    
    // Session encryption key (regenerated on login)
    this.sessionKey = this.getSessionKey();
  }
  
  /**
   * Get or generate a device ID
   * @returns {string} Device ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = CryptoJS.lib.WordArray.random(16).toString();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  }
  
  /**
   * Get or generate a session key
   * @returns {string} Session key
   */
  getSessionKey() {
    let sessionKey = sessionStorage.getItem(STORAGE_KEYS.SESSION_KEY);
    
    if (!sessionKey) {
      sessionKey = CryptoJS.lib.WordArray.random(32).toString();
      sessionStorage.setItem(STORAGE_KEYS.SESSION_KEY, sessionKey);
    }
    
    return sessionKey;
  }
  
  /**
   * Regenerate session key
   */
  regenerateSessionKey() {
    const sessionKey = CryptoJS.lib.WordArray.random(32).toString();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_KEY, sessionKey);
    this.sessionKey = sessionKey;
  }
  
  /**
   * Encrypt data with session key
   * @param {any} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  encrypt(data) {
    if (!data) return null;
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.sessionKey).toString();
  }
  
  /**
   * Decrypt data with session key
   * @param {string} encryptedData - Encrypted data
   * @returns {any} Decrypted data
   */
  decrypt(encryptedData) {
    if (!encryptedData) return null;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.sessionKey).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }
  
  /**
   * Store sensitive data securely in session storage
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   */
  secureStore(key, data) {
    const encrypted = this.encrypt(data);
    sessionStorage.setItem(key, encrypted);
  }
  
  /**
   * Retrieve securely stored data from session storage
   * @param {string} key - Storage key
   * @returns {any} Decrypted data
   */
  secureRetrieve(key) {
    const encrypted = sessionStorage.getItem(key);
    return this.decrypt(encrypted);
  }
  
  /**
   * Hash data (for non-sensitive use cases)
   * @param {string} data - Data to hash
   * @returns {string} Hashed data
   */
  hash(data) {
    if (!data) return null;
    return CryptoJS.SHA256(data).toString();
  }
  
  /**
   * Hash data with salt (for sensitive use cases)
   * @param {string} data - Data to hash
   * @param {string} salt - Salt to use
   * @returns {string} Hashed data
   */
  hashWithSalt(data, salt) {
    if (!data) return null;
    const salted = data + salt;
    return CryptoJS.SHA256(salted).toString();
  }
  
  /**
   * Generate a random token
   * @param {number} length - Length of token in bytes
   * @returns {string} Random token
   */
  generateToken(length = 32) {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
  
  /**
   * Verify token integrity
   * @param {string} token - Token to verify
   * @param {string} hash - Hash to verify against
   * @returns {boolean} Whether token is valid
   */
  verifyToken(token, hash) {
    const tokenHash = this.hash(token);
    return tokenHash === hash;
  }
  
  /**
   * Get security settings
   * @returns {Promise<Object>} Security settings
   */
  async getSecuritySettings() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(endpoints.securitySettings, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get security settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get security settings error:', error);
      throw error;
    }
  }
  
  /**
   * Update security settings
   * @param {Object} settings - Security settings to update
   * @returns {Promise<Object>} Updated security settings
   */
  async updateSecuritySettings(settings) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(endpoints.securitySettings, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update security settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update security settings error:', error);
      throw error;
    }
  }
  
  /**
   * Enable two-factor authentication
   * @returns {Promise<Object>} 2FA setup data
   */
  async enableTwoFactor() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(endpoints.enableTwoFactor, {
        method: 'POST',
        headers: authHeaders(token)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enable two-factor authentication');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Enable two-factor error:', error);
      throw error;
    }
  }
  
  /**
   * Verify two-factor authentication code
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Verification result
   */
  async verifyTwoFactor(code) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(endpoints.verifyTwoFactor, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify two-factor authentication');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Verify two-factor error:', error);
      throw error;
    }
  }
  
  /**
   * Disable two-factor authentication
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Disable result
   */
  async disableTwoFactor(code) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(endpoints.disableTwoFactor, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable two-factor authentication');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Disable two-factor error:', error);
      throw error;
    }
  }
  
  /**
   * Change password
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Change result
   */
  async changePassword(passwordData) {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(endpoints.updatePassword, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });
      
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
   * Clear security data on logout
   */
  clearSecurityData() {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_KEY);
    this.sessionKey = null;
  }
}

const securityService = new SecurityService();
export default securityService;