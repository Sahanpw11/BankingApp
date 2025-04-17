/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === undefined || amount === null) {
    return '-';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a date string to include time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

/**
 * Format an account number (mask all but last 4 digits)
 * @param {string} accountNumber - Account number
 * @returns {string} Masked account number
 */
export const formatAccountNumber = (accountNumber) => {
  if (!accountNumber) return '-';
  
  const visibleDigits = 4;
  const maskedPortion = accountNumber.slice(0, -visibleDigits).replace(/./g, '*');
  const visiblePortion = accountNumber.slice(-visibleDigits);
  
  return `${maskedPortion}${visiblePortion}`;
};

/**
 * Truncate a string if it's longer than maxLength
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export const truncateString = (str, maxLength = 30) => {
  if (!str) return '';
  
  if (str.length <= maxLength) return str;
  
  return `${str.substring(0, maxLength)}...`;
};