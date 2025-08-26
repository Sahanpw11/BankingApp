// Transaction API module for fetching transaction data
import apiClient from './apiClient';

// Local request cache for transaction API
const transactionCache = {
  transactions: { data: null, timestamp: 0, ttl: 30000 }, // 30 second TTL
  accountTransactions: {}, // Keyed by accountId
  transactionDetails: {}, // Keyed by transactionId
  payees: { data: null, timestamp: 0, ttl: 60000 }, // 60 second TTL
};

/**
 * Get all transactions for the user with local caching
 * @param {Object} params - Query parameters for filtering transactions
 * @param {boolean} forceRefresh - Force a cache refresh
 * @returns {Promise} Transactions data
 */
export const getTransactions = async (params = {}, forceRefresh = false) => {
  console.log('[TRANSACTION API] Getting transactions with params:', params);
  
  // Create cache key based on params
  const cacheKey = JSON.stringify(params);
  
  // Check cache if we're not forcing a refresh
  if (!forceRefresh && 
      transactionCache.transactions.data && 
      transactionCache.transactions.cacheKey === cacheKey && 
      Date.now() - transactionCache.transactions.timestamp < transactionCache.transactions.ttl) {
    console.log('[TRANSACTION API] Using cached transactions data');
    return transactionCache.transactions.data;
  }
  
  try {
    const response = await apiClient.get('/transactions', { params });
    const transactions = response.data.transactions;
    console.log('[TRANSACTION API] Transactions fetched successfully:', transactions.length);
    
    // Update cache
    transactionCache.transactions = {
      data: transactions,
      timestamp: Date.now(),
      ttl: 30000,
      cacheKey
    };
    
    return transactions;
  } catch (error) {
    console.error('[TRANSACTION API] Error fetching transactions:', error);
    // Return cached data if available, even if expired
    if (transactionCache.transactions.data) {
      console.log('[TRANSACTION API] Returning stale cached data after error');
      return transactionCache.transactions.data;
    }
    throw error;
  }
};

/**
 * Get transactions for a specific account with local caching
 * @param {string} accountId - Account ID to get transactions for
 * @param {Object} params - Additional query parameters
 * @param {boolean} forceRefresh - Force a cache refresh
 * @returns {Promise} Account transactions data
 */
export const getAccountTransactions = async (accountId, params = {}, forceRefresh = false) => {
  console.log('[TRANSACTION API] Getting transactions for account:', accountId);
  
  // Create cache key based on params
  const cacheKey = `${accountId}-${JSON.stringify(params)}`;
  
  // Check cache if we're not forcing a refresh
  if (!forceRefresh && 
      transactionCache.accountTransactions[cacheKey] && 
      Date.now() - transactionCache.accountTransactions[cacheKey].timestamp < 30000) {
    console.log('[TRANSACTION API] Using cached account transactions data');
    return transactionCache.accountTransactions[cacheKey].data;
  }
  
  try {
    const response = await apiClient.get(`/transactions/account/${accountId}`, { params });
    const transactions = response.data.transactions;
    console.log('[TRANSACTION API] Account transactions fetched:', transactions.length);
    
    // Update cache
    transactionCache.accountTransactions[cacheKey] = {
      data: transactions,
      timestamp: Date.now()
    };
    
    return transactions;
  } catch (error) {
    console.error('[TRANSACTION API] Error fetching account transactions:', error);
    
    // Return cached data if available, even if expired
    if (transactionCache.accountTransactions[cacheKey]) {
      console.log('[TRANSACTION API] Returning stale cached data after error');
      return transactionCache.accountTransactions[cacheKey].data;
    }
    throw error;
  }
};

/**
 * Get details for a specific transaction with local caching
 * @param {string} transactionId - Transaction ID to get details for
 * @param {boolean} forceRefresh - Force a cache refresh
 * @returns {Promise} Transaction details
 */
export const getTransactionById = async (transactionId, forceRefresh = false) => {
  console.log('[TRANSACTION API] Getting transaction details for ID:', transactionId);
  
  // Check cache if we're not forcing a refresh
  if (!forceRefresh && 
      transactionCache.transactionDetails[transactionId] && 
      Date.now() - transactionCache.transactionDetails[transactionId].timestamp < 60000) {
    console.log('[TRANSACTION API] Using cached transaction details');
    return transactionCache.transactionDetails[transactionId].data;
  }
  
  try {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    const transaction = response.data;
    console.log('[TRANSACTION API] Transaction details fetched successfully');
    
    // Update cache
    transactionCache.transactionDetails[transactionId] = {
      data: transaction,
      timestamp: Date.now()
    };
    
    return transaction;
  } catch (error) {
    console.error('[TRANSACTION API] Error fetching transaction details:', {
      transactionId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Return cached data if available, even if expired
    if (transactionCache.transactionDetails[transactionId]) {
      console.log('[TRANSACTION API] Returning stale cached data after error');
      return transactionCache.transactionDetails[transactionId].data;
    }
    
    throw error;
  }
};

/**
 * Create a new transaction (transfer between accounts)
 * @param {Object} transactionData - Transaction data for the transfer
 * @returns {Promise} Created transaction data
 */
export const createTransfer = async (transactionData) => {
  console.log('[TRANSACTION API] Creating transfer with data:', transactionData);
  try {
    // Convert camelCase to snake_case for backend API
    const apiData = {
      ...transactionData,
      // Map to backend expected field names
      source_account_id: transactionData.source_account_id || transactionData.sourceAccountId,
      destination_account_id: transactionData.destination_account_id || transactionData.destinationAccountId,
    };
    
    console.log('[TRANSACTION API] Transformed transfer data:', apiData);
    const response = await apiClient.post('/transactions/transfer', apiData);
    console.log('[TRANSACTION API] Transfer created successfully:', response.data);
    
    // Invalidate transactions cache after creating a transfer
    transactionCache.transactions.data = null;
    // Invalidate account transactions caches
    if (transactionData.sourceAccountId || transactionData.source_account_id) {
      const sourceId = transactionData.source_account_id || transactionData.sourceAccountId;
      Object.keys(transactionCache.accountTransactions)
        .filter(key => key.startsWith(sourceId))
        .forEach(key => delete transactionCache.accountTransactions[key]);
    }
    if (transactionData.destinationAccountId || transactionData.destination_account_id) {
      const destId = transactionData.destination_account_id || transactionData.destinationAccountId;
      Object.keys(transactionCache.accountTransactions)
        .filter(key => key.startsWith(destId))
        .forEach(key => delete transactionCache.accountTransactions[key]);
    }
    
    return response.data;  } catch (error) {
    console.error('[TRANSACTION API] Error creating transfer:', error);
    // Enhance error message with details if available
    if (error.response?.data?.message) {
      const enhancedError = new Error(`Transfer failed: ${error.response.data.message}`);
      enhancedError.originalError = error;
      throw enhancedError;
    }
    throw error;
  }
};

/**
 * Create a payment to an external payee
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Created payment transaction data
 */
export const createPayment = async (paymentData) => {
  console.log('[TRANSACTION API] Creating payment with data:', paymentData);
  try {
    const response = await apiClient.post('/transactions/payment', paymentData);
    console.log('[TRANSACTION API] Payment created successfully:', response.data);
    
    // Invalidate transactions cache after creating a payment
    transactionCache.transactions.data = null;
    // Invalidate account transactions cache for the source account
    if (paymentData.sourceAccountId) {
      Object.keys(transactionCache.accountTransactions)
        .filter(key => key.startsWith(paymentData.sourceAccountId))
        .forEach(key => delete transactionCache.accountTransactions[key]);
    }
    
    return response.data;
  } catch (error) {
    console.error('[TRANSACTION API] Error creating payment:', error);
    throw error;
  }
};

/**
 * Get list of saved payees for the user with local caching
 * @param {boolean} forceRefresh - Force a cache refresh
 * @returns {Promise} Payees list
 */
export const getPayees = async (forceRefresh = false) => {
  console.log('[TRANSACTION API] Getting payees');
  
  // Check cache if we're not forcing a refresh
  if (!forceRefresh && 
      transactionCache.payees.data && 
      Date.now() - transactionCache.payees.timestamp < transactionCache.payees.ttl) {
    console.log('[TRANSACTION API] Using cached payees data');
    return transactionCache.payees.data;
  }
  
  try {
    const response = await apiClient.get('/transactions/payees');
    const payees = response.data.payees;
    console.log('[TRANSACTION API] Payees fetched successfully:', payees.length);
    
    // Update cache
    transactionCache.payees = {
      data: payees,
      timestamp: Date.now(),
      ttl: 60000
    };
    
    return payees;
  } catch (error) {
    console.error('[TRANSACTION API] Error fetching payees:', error);
    
    // Return cached data if available, even if expired
    if (transactionCache.payees.data) {
      console.log('[TRANSACTION API] Returning stale cached data after error');
      return transactionCache.payees.data;
    }
    
    throw error;
  }
};

/**
 * Add a new payee
 * @param {Object} payeeData - Payee data
 * @returns {Promise} Created payee data
 */
export const addPayee = async (payeeData) => {
  console.log('[TRANSACTION API] Adding payee with data:', payeeData);
  try {
    const response = await apiClient.post('/transactions/payees', payeeData);
    console.log('[TRANSACTION API] Payee added successfully:', response.data);
    
    // Invalidate payees cache after adding a new payee
    transactionCache.payees.data = null;
    
    return response.data;
  } catch (error) {
    console.error('[TRANSACTION API] Error adding payee:', error);
    throw error;
  }
};