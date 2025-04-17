import axios from 'axios';
import tokenManager from '../utils/tokenManager';

// Add request caching to prevent duplicate requests
const requestCache = new Map();
const pendingRequests = new Map();

// Create the API client with correct baseURL and timeout settings
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to handle token and caching
apiClient.interceptors.request.use(
  async (config) => {
    // Add token to request if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Skip caching for non-GET requests
    if (config.method !== 'get') {
      return config;
    }
    
    try {
      // Generate cache key
      const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
      
      // Return from cache if valid
      const cachedData = requestCache.get(cacheKey);
      if (cachedData && Date.now() < cachedData.expiry) {
        console.log('Using cached response for:', config.url);
        return Promise.resolve({
          ...cachedData.data,
          status: 200,
          statusText: 'OK',
          headers: cachedData.headers,
          config,
          cached: true
        });
      }
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
      // Continue with request if cache fails
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Cache GET responses
    if (response.config.method === 'get' && !response.cached) {
      try {
        const cacheKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params || {})}`;
        requestCache.set(cacheKey, {
          data: response.data,
          headers: response.headers,
          expiry: Date.now() + 30000 // 30 seconds cache
        });
      } catch (cacheError) {
        console.error('Response cache error:', cacheError);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Don't attempt to refresh if:
    // 1. It's not a 401 error
    // 2. We've already tried refreshing
    // 3. The request was specifically marked to skip refresh
    if (!error.response || 
        error.response.status !== 401 || 
        originalRequest._retry || 
        originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }
    
    try {
      // Mark as retried
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.error('No refresh token available');
        // No refresh token - redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      console.log('Attempting to refresh auth token');
      
      // Try to refresh the token
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
        { refreshToken },
        { skipAuthRefresh: true } // Prevent infinite loop
      );
      
      if (response.data && response.data.token) {
        console.log('Token refreshed successfully');
        // Store new tokens
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Update and retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
        return axios(originalRequest);
      } else {
        console.error('Invalid response from refresh token endpoint:', response.data);
        
        // Don't immediately redirect - Check if this was a payment transaction
        if (originalRequest.url.includes('/transactions/payment')) {
          console.log('Payment already completed - not redirecting to login');
          // For payments, we won't redirect to login since the payment may have already been processed
          // Instead, we'll return a modified error that the UI can handle specially
          return Promise.reject({
            ...error,
            isAfterPayment: true,
            message: 'Your payment was processed, but there was an authentication issue. Please refresh the page or log in again.'
          });
        }
        
        // For other requests, redirect to login
        window.location.href = '/login';
        return Promise.reject(new Error('Failed to refresh token'));
      }
    } catch (refreshError) {
      console.error('Error refreshing token:', refreshError);
      
      // Don't immediately redirect if this was a payment transaction
      if (originalRequest.url.includes('/transactions/payment')) {
        console.log('Payment already completed - not redirecting to login');
        // For payments, we won't redirect to login since the payment may have already been processed
        return Promise.reject({
          ...error,
          isAfterPayment: true,
          message: 'Your payment was processed, but there was an authentication issue. Please refresh the page or log in again.'
        });
      }
      
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;