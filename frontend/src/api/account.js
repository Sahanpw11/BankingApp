import { endpoints, authHeaders } from './config';
import authService from './auth';

/**
 * Account Service
 * 
 * Handles account operations such as fetching accounts, getting account details,
 * opening new accounts, and closing accounts.
 */
class AccountService {
  constructor() {
    // Initialize in-memory cache
    this.cache = {
      userAccounts: { data: null, timestamp: 0, ttl: 30000 }, // 30 second TTL
      accountDetails: {}, // Keyed by accountId
      accountStatements: {} // Keyed by accountId + queryParams
    };
  }

  /**
   * Get all accounts for the user
   * @param {boolean} forceRefresh - Force a cache refresh
   * @returns {Promise} Response with an array of accounts
   */
  async getUserAccounts(forceRefresh = false) {
    console.log('[ACCOUNT API] Getting user accounts, force refresh:', forceRefresh);
    
    // Check cache first if not forcing refresh
    if (!forceRefresh && 
        this.cache.userAccounts.data && 
        Date.now() - this.cache.userAccounts.timestamp < this.cache.userAccounts.ttl) {
      console.log('[ACCOUNT API] Using cached accounts data');
      return this.cache.userAccounts.data;
    }
    
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.accounts, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getUserAccounts(forceRefresh);
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get accounts');
        } else {
          // Not JSON, log the text response for debugging
          const textResponse = await response.text();
          console.error('Non-JSON error response:', textResponse);
          throw new Error(`Server error (${response.status}): Not a valid JSON response`);
        }
      }
      
      // Make sure we're receiving JSON before parsing
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON success response:', textResponse);
        throw new Error('Invalid response format from server');
      }
      
      const data = await response.json();
      console.log('[ACCOUNT API] Accounts fetched successfully:', data.accounts.length);
      
      // Update cache
      this.cache.userAccounts = {
        data,
        timestamp: Date.now(),
        ttl: 30000
      };
      
      return data;
    } catch (error) {
      console.error('[ACCOUNT API] Fetch accounts error:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.userAccounts.data) {
        console.log('[ACCOUNT API] Returning stale cached data after error');
        return this.cache.userAccounts.data;
      }
      
      throw error;
    }
  }
  
  /**
   * Get details for a specific account
   * @param {string} accountId - ID of the account to fetch
   * @param {boolean} forceRefresh - Force a cache refresh
   * @returns {Promise} Response with account details
   */
  async getAccountDetails(accountId, forceRefresh = false) {
    console.log('[ACCOUNT API] Getting account details for ID:', accountId);
    
    // Check cache first if not forcing refresh
    if (!forceRefresh && 
        this.cache.accountDetails[accountId] && 
        Date.now() - this.cache.accountDetails[accountId].timestamp < 30000) {
      console.log('[ACCOUNT API] Using cached account details');
      return this.cache.accountDetails[accountId].data;
    }
    
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.accountDetail(accountId), {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getAccountDetails(accountId, forceRefresh);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get account details');
      }
      
      const data = await response.json();
      console.log('[ACCOUNT API] Account details fetched successfully');
      
      // Update cache
      this.cache.accountDetails[accountId] = {
        data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (error) {
      console.error('[ACCOUNT API] Fetch account details error:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.accountDetails[accountId]) {
        console.log('[ACCOUNT API] Returning stale cached data after error');
        return this.cache.accountDetails[accountId].data;
      }
      
      throw error;
    }
  }
  
  /**
   * Open a new account
   * @param {Object} accountData - New account data
   * @returns {Promise} Response with new account details
   */
  async openAccount(accountData) {
    console.log('[ACCOUNT API] Opening new account with data:', accountData);
    
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.accounts, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(accountData)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.openAccount(accountData);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to open account');
      }
      
      const result = await response.json();
      console.log('[ACCOUNT API] Account opened successfully');
      
      // Invalidate the accounts cache since we added a new account
      this.cache.userAccounts.data = null;
      
      return result;
    } catch (error) {
      console.error('[ACCOUNT API] Open account error:', error);
      throw error;
    }
  }
  
  /**
   * Close an account
   * @param {string} accountId - ID of the account to close
   * @returns {Promise} Response with success status
   */
  async closeAccount(accountId) {
    console.log('[ACCOUNT API] Closing account with ID:', accountId);
    
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${endpoints.accountDetail(accountId)}/close`, {
        method: 'POST',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.closeAccount(accountId);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close account');
      }
      
      const result = await response.json();
      console.log('[ACCOUNT API] Account closed successfully');
      
      // Invalidate both account caches
      this.cache.userAccounts.data = null;
      delete this.cache.accountDetails[accountId];
      
      return result;
    } catch (error) {
      console.error('[ACCOUNT API] Close account error:', error);
      throw error;
    }
  }
  
  /**
   * Get account statements
   * @param {string} accountId - ID of the account
   * @param {Object} params - Query parameters (dateFrom, dateTo, etc.)
   * @param {boolean} forceRefresh - Force a cache refresh
   * @returns {Promise} Response with statements
   */
  async getAccountStatements(accountId, params = {}, forceRefresh = false) {
    console.log('[ACCOUNT API] Getting account statements for ID:', accountId, 'with params:', params);
    
    // Create cache key based on accountId and params
    const cacheKey = `${accountId}-${JSON.stringify(params)}`;
    
    // Check cache first if not forcing refresh
    if (!forceRefresh && 
        this.cache.accountStatements[cacheKey] && 
        Date.now() - this.cache.accountStatements[cacheKey].timestamp < 60000) {
      console.log('[ACCOUNT API] Using cached account statements');
      return this.cache.accountStatements[cacheKey].data;
    }
    
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const url = `${endpoints.accountDetail(accountId)}/statements?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getAccountStatements(accountId, params, forceRefresh);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get account statements');
      }
      
      const data = await response.json();
      console.log('[ACCOUNT API] Account statements fetched successfully');
      
      // Update cache
      this.cache.accountStatements[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (error) {
      console.error('[ACCOUNT API] Fetch account statements error:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.accountStatements[cacheKey]) {
        console.log('[ACCOUNT API] Returning stale cached data after error');
        return this.cache.accountStatements[cacheKey].data;
      }
      
      throw error;
    }
  }
  
  /**
   * Update account settings
   * @param {string} accountId - ID of the account to update
   * @param {Object} settingsData - New settings data
   * @returns {Promise} Response with updated account details
   */
  async updateAccountSettings(accountId, settingsData) {
    console.log('[ACCOUNT API] Updating account settings for ID:', accountId);
    
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.accountDetail(accountId), {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(settingsData)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.updateAccountSettings(accountId, settingsData);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update account settings');
      }
      
      const result = await response.json();
      console.log('[ACCOUNT API] Account settings updated successfully');
      
      // Invalidate both account caches
      this.cache.userAccounts.data = null;
      delete this.cache.accountDetails[accountId];
      
      return result;
    } catch (error) {
      console.error('[ACCOUNT API] Update account settings error:', error);
      throw error;
    }
  }
}

// Create an instance then export
const accountService = new AccountService();
export default accountService;