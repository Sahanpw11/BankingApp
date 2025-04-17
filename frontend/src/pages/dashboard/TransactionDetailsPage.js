import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Button, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as transactionAPI from '../../api/transaction';
import tokenManager from '../../utils/tokenManager';
import { formatCurrency, formatDate } from '../../utils/formatters';
import TransactionTypeChip from '../../components/TransactionTypeChip';

const TransactionDetailsPage = () => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Parse transaction ID from URL query parameters
  const getTransactionId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  };
  
  // Handle navigation back to dashboard safely
  const handleBackToDashboard = () => {
    window.location.href = '/dashboard';
  };
  
  useEffect(() => {
    // CRITICAL: Restore authentication tokens first thing
    const restoreAuthState = () => {
      // Check for backup tokens in session storage
      const tokenBackup = sessionStorage.getItem('auth_token_backup');
      const refreshTokenBackup = sessionStorage.getItem('refresh_token_backup');
      
      if (tokenBackup) {
        console.log('Restoring authentication token from backup');
        localStorage.setItem('token', tokenBackup);
        
        if (refreshTokenBackup) {
          localStorage.setItem('refreshToken', refreshTokenBackup);
        }
      }
      
      // Ensure tokens are stable
      tokenManager.stabilizeSession();
    };
    
    // Execute token restoration
    restoreAuthState();
    
    const loadTransaction = async () => {
      try {
        // First try to get transaction from session storage
        const storedTransaction = sessionStorage.getItem('currentTransaction');
        if (storedTransaction) {
          try {
            const parsedTransaction = JSON.parse(storedTransaction);
            setTransaction(parsedTransaction);
            setLoading(false);
            return; // Exit early if we have the transaction
          } catch (parseError) {
            console.error('Error parsing stored transaction:', parseError);
            // Continue to API fetch if parsing fails
          }
        }
        
        // If we don't have a stored transaction, try to fetch it from API
        const transactionId = getTransactionId();
        if (!transactionId) {
          setError('Transaction ID not found');
          setLoading(false);
          return;
        }
        
        // Ensure tokens again before API call
        tokenManager.stabilizeSession();
        
        const response = await transactionAPI.getTransactionById(transactionId);
        setTransaction(response);
        setLoading(false);
      } catch (err) {
        console.error('Error loading transaction:', err);
        setError('Could not load transaction details');
        setLoading(false);
      }
    };
    
    loadTransaction();
    
    // Clean up session storage when component unmounts
    return () => {
      // Keep the backups until we're sure navigation is complete
    };
  }, []);
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6" gutterBottom>
            {error}
          </Typography>
          <Button 
            onClick={handleBackToDashboard}
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  if (!transaction) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Transaction not found</Typography>
          <Button 
            onClick={handleBackToDashboard}
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Format the transaction amount with the correct sign
  const formatTransactionAmount = () => {
    const isCredit = transaction.transaction_type === 'deposit' || 
                    (transaction.transaction_type === 'transfer' && transaction.is_recipient);
    
    const prefix = isCredit ? '+' : '-';
    return `${prefix}${formatCurrency(transaction.amount, transaction.currency)}`;
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button 
            onClick={handleBackToDashboard}
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5">
            Transaction Details
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h4" gutterBottom align="center" 
              color={transaction.transaction_type === 'deposit' ? 'success.main' : 
                     transaction.transaction_type === 'withdrawal' ? 'error.main' : 'primary.main'}>
              {formatTransactionAmount()}
            </Typography>
            
            <Box display="flex" justifyContent="center" mb={3}>
              <TransactionTypeChip type={transaction.transaction_type || transaction.type} />
            </Box>
            
            <Typography variant="subtitle1" gutterBottom align="center">
              {transaction.description || 
               (transaction.transaction_type === 'transfer' ? 'Transfer' : 
                transaction.transaction_type === 'payment' ? 'Payment' : 
                transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal')}
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transaction Information
          </Typography>
          
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
              <Typography variant="body1" gutterBottom>{transaction.id}</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body1" gutterBottom>
                {formatDate(transaction.created_at || transaction.date || transaction.createdAt, true)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Typography variant="body1" gutterBottom 
                color={transaction.status === 'completed' ? 'success.main' : 
                      transaction.status === 'pending' ? 'warning.main' : 
                      transaction.status === 'failed' ? 'error.main' : 'text.primary'}>
                {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1) || 'N/A'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Amount</Typography>
              <Typography variant="body1" gutterBottom>{formatCurrency(transaction.amount, transaction.currency)}</Typography>
            </Box>
            
            {transaction.source_account_id && (
              <Box>
                <Typography variant="body2" color="text.secondary">From Account</Typography>
                <Typography variant="body1" gutterBottom>{transaction.source_account_id}</Typography>
              </Box>
            )}
            
            {transaction.destination_account_id && (
              <Box>
                <Typography variant="body2" color="text.secondary">To Account</Typography>
                <Typography variant="body1" gutterBottom>{transaction.destination_account_id}</Typography>
              </Box>
            )}
            
            {transaction.reference && (
              <Box>
                <Typography variant="body2" color="text.secondary">Reference</Typography>
                <Typography variant="body1" gutterBottom>{transaction.reference}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TransactionDetailsPage;