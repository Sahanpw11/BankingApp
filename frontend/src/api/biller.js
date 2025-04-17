import { endpoints, authHeaders } from './config';
import authService from './auth';

/**
 * Biller Service
 * 
 * Handles operations related to bill payments and saved billers.
 */
class BillerService {
  /**
   * Get list of available billers
   * @returns {Promise} Response with list of billers
   */
  async getBillers() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.billers, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getBillers();
      }
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to get billers';
        
        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error response was not valid JSON:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      // First get the raw text
      const text = await response.text();
      console.log('Raw billers response:', text);
      
      if (!text || !text.trim()) {
        console.log('Empty billers response, returning empty array');
        return { billers: [] };
      }
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed billers data:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          console.log('Data is an array, wrapping in billers object');
          return { billers: data };
        } else if (data && typeof data === 'object') {
          if (data.billers && Array.isArray(data.billers)) {
            console.log('Data has billers array property');
            return data;
          } else {
            // If we get an object that's not in the expected format,
            // try to determine if it's a single biller or something else
            if (data.id && data.name) {
              console.log('Data appears to be a single biller, wrapping in array');
              return { billers: [data] };
            }
          }
        }
        
        // Fallback for unknown format
        console.log('Unknown data format, using as is');
        return data;
      } catch (parseError) {
        console.error('Billers response parsing error:', parseError);
        // Return a default structure if parsing fails
        return { billers: [] };
      }
    } catch (error) {
      console.error('Fetch billers error:', error);
      // Return a default response instead of throwing to avoid app crashes
      return { billers: [] };
    }
  }
  
  /**
   * Get user's saved billers
   * @returns {Promise} Response with saved billers
   */
  async getSavedBillers() {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.savedBillers, {
        method: 'GET',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.getSavedBillers();
      }
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to get saved billers';
        
        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error response was not valid JSON:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      // First get the raw text
      const text = await response.text();
      console.log('Raw saved billers response:', text);
      
      if (!text || !text.trim()) {
        console.log('Empty saved billers response, returning empty array');
        return { billers: [] };
      }
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed saved billers data:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          console.log('Saved billers data is an array, wrapping in billers object');
          return { billers: data };
        } else if (data && typeof data === 'object') {
          if (data.billers && Array.isArray(data.billers)) {
            console.log('Saved billers data has billers array property');
            return data;
          } else {
            // If we get an object that's not in the expected format,
            // try to determine if it's a single biller or something else
            if (data.id && (data.biller_id || data.account_number)) {
              console.log('Data appears to be a single saved biller, wrapping in array');
              return { billers: [data] };
            }
          }
        }
        
        // Fallback for unknown format
        console.log('Unknown saved billers data format, using as is');
        return data;
      } catch (parseError) {
        console.error('Saved billers response parsing error:', parseError);
        // Return a default structure if parsing fails
        return { billers: [] };
      }
    } catch (error) {
      console.error('Fetch saved billers error:', error);
      // Return a default response instead of throwing to avoid app crashes
      return { billers: [] };
    }
  }
  
  /**
   * Save a biller for future use
   * @param {Object} billerData - Biller data to save
   * @returns {Promise} Response with saved biller
   */
  async saveBiller(billerData) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.savedBillers, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(billerData)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.saveBiller(billerData);
      }
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to save biller';
        
        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error response was not valid JSON:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      const text = await response.text();
      try {
        // Handle empty responses
        if (!text.trim()) {
          return { biller: billerData };
        }
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Response parsing error:', parseError, 'Response text:', text);
        // Return a default structure if parsing fails
        return { biller: billerData, success: true };
      }
    } catch (error) {
      console.error('Save biller error:', error);
      throw error;
    }
  }
  
  /**
   * Add a new biller to the system
   * @param {Object} billerData - Biller data
   * @returns {Promise} Response with new biller
   */
  async addBiller(billerData) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.billers, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(billerData)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.addBiller(billerData);
      }
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to add biller';
        
        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error response was not valid JSON:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      const text = await response.text();
      try {
        // Handle empty responses
        if (!text.trim()) {
          // Generate a fake ID for the biller
          const fakeId = `temp-${Date.now()}`;
          return { 
            biller: { 
              ...billerData, 
              id: fakeId 
            } 
          };
        }
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Response parsing error:', parseError, 'Response text:', text);
        // Return a default structure if parsing fails
        const fakeId = `temp-${Date.now()}`;
        return { 
          biller: { 
            ...billerData, 
            id: fakeId 
          },
          success: true 
        };
      }
    } catch (error) {
      console.error('Add biller error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a saved biller
   * @param {string} billerId - ID of saved biller to delete
   * @returns {Promise} Response with success status
   */
  async deleteSavedBiller(billerId) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.savedBillerDetail(billerId), {
        method: 'DELETE',
        headers: authHeaders(token)
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.deleteSavedBiller(billerId);
      }
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to delete biller';
        
        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error response was not valid JSON:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      const text = await response.text();
      try {
        // Handle empty responses
        if (!text.trim()) {
          return { success: true };
        }
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Response parsing error:', parseError, 'Response text:', text);
        // Return a default structure if parsing fails
        return { success: true };
      }
    } catch (error) {
      console.error('Delete biller error:', error);
      throw error;
    }
  }
  
  /**
   * Toggle favorite status of a saved biller
   * @param {string} billerId - ID of saved biller
   * @param {boolean} isFavorite - New favorite status
   * @returns {Promise} Response with updated biller
   */
  async toggleFavoriteBiller(billerId, isFavorite) {
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(endpoints.savedBillerFavorite(billerId), {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ is_favorite: isFavorite })
      });
      
      // If token is expired, try refreshing it
      if (response.status === 401) {
        await authService.refreshToken();
        return this.toggleFavoriteBiller(billerId, isFavorite);
      }
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Failed to update favorite status';
        
        try {
          // Try to parse as JSON, but don't fail if it's not valid JSON
          const errorData = JSON.parse(text);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error response was not valid JSON:', text);
        }
        
        throw new Error(errorMessage);
      }
      
      const text = await response.text();
      try {
        // Handle empty responses
        if (!text.trim()) {
          return { success: true, is_favorite: isFavorite };
        }
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Response parsing error:', parseError, 'Response text:', text);
        // Return a default structure if parsing fails
        return { success: true, is_favorite: isFavorite };
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw error;
    }
  }
}

// Create an instance and then export
const billerService = new BillerService();
export default billerService;