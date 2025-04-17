/**
 * API Configuration
 * 
 * This file contains configuration for backend API interactions,
 * including base URL and security settings.
 */

import CryptoJS from 'crypto-js';

// Base API URL
const API_URL = 'http://localhost:5000';  // Make sure this is correct

// API endpoints
const endpoints = {
  // Auth endpoints
  login: `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  refreshToken: `${API_URL}/api/auth/refresh-token`,
  forgotPassword: `${API_URL}/api/auth/forgot-password`,
  resetPassword: `${API_URL}/api/auth/reset-password`,
  profile: `${API_URL}/api/auth/profile`,
  updateProfile: `${API_URL}/api/auth/profile`,
  
  // Account endpoints
  accounts: `${API_URL}/api/accounts`,
  accountDetail: (id) => `${API_URL}/api/accounts/${id}`,
  createAccount: `${API_URL}/api/accounts`,
  closeAccount: (id) => `${API_URL}/api/accounts/${id}/close`,
  
  // Transaction endpoints
  transactions: `${API_URL}/api/transactions`,
  transactionDetail: (id) => `${API_URL}/api/transactions/${id}`,
  accountTransactions: (accountId) => `${API_URL}/api/accounts/${accountId}/transactions`,
  transfer: `${API_URL}/api/transactions/transfer`,
  payment: `${API_URL}/api/transactions/payment`,
  paymentConfirmation: (id) => `${API_URL}/api/transactions/payment/${id}/confirmation`,
  
  // Admin endpoints
  adminUsers: `${API_URL}/api/admin/users`,
  adminUserDetail: (id) => `${API_URL}/api/admin/users/${id}`,
  adminAccounts: `${API_URL}/api/admin/accounts`,
  adminTransactions: `${API_URL}/api/admin/transactions`,
  adminDashboard: `${API_URL}/api/admin/dashboard`,
  
  // Biller endpoints
  billers: `${API_URL}/api/billers`,
  billerDetail: (id) => `${API_URL}/api/billers/${id}`,
  savedBillers: `${API_URL}/api/billers/saved`,
  savedBillerDetail: (id) => `${API_URL}/api/billers/saved/${id}`,
  savedBillerFavorite: (id) => `${API_URL}/api/billers/saved/${id}/favorite`,
  
  // Security endpoints
  securitySettings: `${API_URL}/api/security/settings`,
  enableTwoFactor: `${API_URL}/api/security/two-factor/enable`,
  verifyTwoFactor: `${API_URL}/api/security/two-factor/verify`,
  disableTwoFactor: `${API_URL}/api/security/two-factor/disable`,
  updatePassword: `${API_URL}/api/security/password/update`
};

// Function to generate auth headers
const authHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Security helper functions
const securityHelpers = {
  // Application-wide default encryption key (for consistency)
  DEFAULT_KEY: 'banking-app-default-key-2025',
  
  // Encrypt data
  encrypt: (data, key) => {
    if (!data) return null;
    
    try {
      // Use provided key or fall back to default key
      const encryptionKey = key || securityHelpers.DEFAULT_KEY;
      
      // Convert data to string if it's not already
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Create WordArray directly from the string data
      const encrypted = CryptoJS.AES.encrypt(dataStr, encryptionKey).toString();
      
      return encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      // On encryption failure, use base64 encoding as a simpler fallback
      try {
        return btoa(JSON.stringify(data));
      } catch (e) {
        console.error("Fallback encryption failed:", e);
        return null;
      }
    }
  },

  // Decrypt data with simplified approach
  decrypt: (encryptedData, key) => {
    if (!encryptedData) return null;
    
    // Try to decrypt with provided key or default
    try {
      const decryptKey = key || securityHelpers.DEFAULT_KEY;
      const bytes = CryptoJS.AES.decrypt(encryptedData, decryptKey);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr || decryptedStr.trim() === '') {
        return null;
      }
      
      try {
        return JSON.parse(decryptedStr);
      } catch (jsonError) {
        return decryptedStr;
      }
    } catch (error) {
      // Silent fail and try base64 decode instead
      try {
        return JSON.parse(atob(encryptedData));
      } catch (e) {
        // If all methods fail, return null
        return null;
      }
    }
  },

  // Hash data (for non-sensitive use cases)
  hash: (data) => {
    if (!data) return null;
    return CryptoJS.SHA256(data).toString();
  },

  // Generate a random token
  generateToken: (length = 32) => {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
};

export { API_URL, endpoints, authHeaders, securityHelpers };