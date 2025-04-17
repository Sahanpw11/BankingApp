import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import * as transactionAPI from '../../api/transaction';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import tokenManager from '../../utils/tokenManager';

const TransactionDetails = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Handle navigation back to dashboard directly, avoiding auth issues
  const handleBack = () => {
    // Use direct navigation to avoid authentication issues
    window.location.href = '/dashboard';
  };
  
  useEffect(() => {
    // First thing on page load: restore token from session storage if available
    const tempToken = sessionStorage.getItem('temp_token_backup');
    if (tempToken) {
      // Restore the token if it's not already in localStorage
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', tempToken);
      }
    }
    
    // Ensure we have tokens for API calls
    tokenManager.stabilizeSession();
    
    // Check for transaction ID either from route params or sessionStorage
    const transId = transactionId || sessionStorage.getItem('viewingTransaction');
    
    if (!transId) {
      setError("Transaction ID not found");
      setLoading(false);
      return;
    }
    
    // Try to get transaction data from session storage first (faster)
    const cachedTransactionData = sessionStorage.getItem('viewingTransactionData');
    if (cachedTransactionData) {
      try {
        const parsedTransaction = JSON.parse(cachedTransactionData);
        if (parsedTransaction && parsedTransaction.id === transId) {
          // Use the cached data immediately
          setTransaction(parsedTransaction);
          setLoading(false);
          
          // Still fetch the latest data in the background
          fetchTransactionData(transId);
          return;
        }
      } catch (e) {
        console.error("Error parsing cached transaction:", e);
        // Continue to fetch from API
      }
    }
    
    // Fallback: fetch from API
    fetchTransactionData(transId);
    
    // Clean up session storage when component unmounts
    return () => {
      sessionStorage.removeItem('viewingTransaction');
    };
  }, [transactionId]);
  
  const fetchTransactionData = async (transId) => {
    try {
      // Ensure token is available before API call
      tokenManager.stabilizeSession();
      
      // Use the transaction API
      const response = await transactionAPI.getTransactionById(transId);
      setTransaction(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setError('Could not load transaction details. Please try again.');
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button 
          onClick={handleBack}
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    );
  }
  
  if (!transaction) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Transaction not found</Typography>
        <Button 
          onClick={handleBack}
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    );
  }
  
  // Rest of your component rendering with transaction details
  return (
    <Paper sx={{ p: 3 }}>
      <Button 
        onClick={handleBack}
        variant="outlined" 
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Back
      </Button>
      
      <Typography variant="h5" gutterBottom>
        Transaction Details
      </Typography>
      
      {/* Render transaction details here */}
      {transaction && (
        <Box sx={{ mt: 2 }}>
          <Typography><strong>ID:</strong> {transaction.id}</Typography>
          <Typography><strong>Amount:</strong> ${parseFloat(transaction.amount).toFixed(2)}</Typography>
          <Typography><strong>Type:</strong> {transaction.transaction_type || transaction.type}</Typography>
          <Typography><strong>Status:</strong> {transaction.status}</Typography>
          <Typography><strong>Date:</strong> {new Date(transaction.date || transaction.created_at || transaction.createdAt).toLocaleDateString()}</Typography>
          <Typography><strong>Description:</strong> {transaction.description}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TransactionDetails;