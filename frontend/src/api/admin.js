import { endpoints, authHeaders } from './config';
import authService from './auth';

/**
 * Admin Service
 * 
 * Handles administrative operations such as user management,
 * account management, and transaction monitoring.
 */
class AdminService {
  /**
   * Get all users
   * @returns {Promise} Response with an array of users
   */
  async getAllUsers() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.adminUsers, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getAllUsers();
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch users error:', error);
      throw error;
    }
  }
  
  /**
   * Get user details
   * @param {string} userId - ID of the user to fetch
   * @returns {Promise} Response with user details
   */
  async getUserDetails(userId) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.adminUserDetail(userId), {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getUserDetails(userId);
      }
      
      if (!response.ok) {
        // Try to parse as JSON, but handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get user details');
        } else {
          const textError = await response.text();
          console.error('Non-JSON error response:', textError);
          throw new Error(`Server error (${response.status}): Failed to get user details`);
        }
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON success response:', textResponse);
        throw new Error('Invalid response format from server');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch user details error:', error);
      throw error;
    }
  }
  
  /**
   * Update user
   * @param {string} userId - ID of the user to update
   * @param {Object} userData - User data to update
   * @returns {Promise} Response with updated user details
   */
  async updateUser(userId, userData) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.adminUserDetail(userId), {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(userData)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.updateUser(userId, userData);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }
  
  /**
   * Get all accounts
   * @returns {Promise} Response with an array of accounts
   */
  async getAllAccounts() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.adminAccounts, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getAllAccounts();
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get accounts');
      }
      
      // Get the accounts data
      const accountsData = await response.json();
      
      // Fetch all users to associate with accounts
      const usersResponse = await this.getAllUsers();
      const users = usersResponse.users;
      
      // Create a user lookup map
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });
      
      // Enrich accounts data with owner information
      const enrichedAccounts = accountsData.accounts.map(account => {
        const owner = userMap[account.user_id];
        return {
          id: account.id,
          accountNumber: account.account_number,
          accountType: account.account_type,
          balance: account.balance,
          currency: account.currency,
          isActive: account.is_active,
          createdAt: account.created_at,
          userId: account.user_id,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown',
          ownerEmail: owner ? owner.email : 'Unknown'
        };
      });
      
      return {
        accounts: enrichedAccounts
      };
    } catch (error) {
      console.error('Fetch accounts error:', error);
      throw error;
    }
  }
  
  /**
   * Get all transactions
   * @returns {Promise} Response with an array of transactions
   */
  async getAllTransactions() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.adminTransactions, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getAllTransactions();
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get transactions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch transactions error:', error);
      throw error;
    }
  }
  
  /**
   * Get admin dashboard data
   * @returns {Promise} Response with dashboard statistics and data
   */
  async getDashboardData() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.adminDashboard, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getDashboardData();
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get dashboard data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
      throw error;
    }
  }
}

// Create an instance and then export
const adminService = new AdminService();
export default adminService;