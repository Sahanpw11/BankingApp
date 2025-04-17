import React from 'react';
import { 
  Paper, Typography, List, ListItem, ListItemText, 
  Box, Divider, Chip, Link, Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowUpward, ArrowDownward, Sync, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import tokenManager from '../../utils/tokenManager';

const RecentTransactionsCard = ({ transactions = [], accountId, title = "Recent Transactions" }) => {
  const navigate = useNavigate();
  
  // Handle View All button click
  const handleViewAllClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use stabilizeSession instead of ensureRefreshToken
    tokenManager.stabilizeSession();
    
    // Use direct navigation with state to indicate this is an internal navigation
    // that should not trigger authentication checks initially
    if (accountId) {
      navigate(`/accounts/${accountId}/transactions`, { 
        state: { skipInitialAuthCheck: true }
      });
    } else {
      navigate('/transactions', { 
        state: { skipInitialAuthCheck: true }
      });
    }
  };
  
  // Handle click on individual transaction
  const handleTransactionClick = (transactionId) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use stabilizeSession
    tokenManager.stabilizeSession();
    
    // Use direct navigation with state
    navigate(`/transactions/${transactionId}`, { 
      state: { skipInitialAuthCheck: true }
    });
  };
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{title}</Typography>
        <Button 
          onClick={handleViewAllClick} 
          variant="text" 
          color="primary" 
          size="small"
          endIcon={<ArrowForwardIcon />}
        >
          View All
        </Button>
      </Box>
      
      <List disablePadding>
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <ListItem 
              key={transaction.id}
              onClick={handleTransactionClick(transaction.id)}
              button
              divider
              sx={{ 
                borderLeft: `4px solid ${getStatusColor(transaction)}`,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ mr: 2 }}>{getTransactionIcon(transaction)}</Box>
                <ListItemText
                  primary={transaction.description || `Transaction ${transaction.id}`}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box component="span" sx={{ mr: 1 }}>
                        {formatDate(transaction.date || transaction.createdAt)}
                      </Box>
                      <TransactionTypeChip type={transaction.transaction_type} small />
                    </Box>
                  }
                />
                <Box sx={{ 
                  textAlign: 'right', 
                  ml: 'auto',
                  color: getAmountColor(transaction)
                }}>
                  <Typography variant="body2" fontWeight="500">
                    {formatCurrency(transaction.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {transaction.status || 'Processing'}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))
        ) : (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">No recent transactions</Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

// Helper functions to determine colors and icons
const getTransactionIcon = (transaction) => {
  const type = transaction.transactionType?.toLowerCase();
  
  if (type === 'deposit' || type === 'income') {
    return <ArrowDownward color="success" />;
  } else if (type === 'withdrawal' || type === 'payment') {
    return <ArrowUpward color="error" />;
  } else {
    return <Sync color="primary" />;
  }
};

const getAmountColor = (transaction) => {
  const type = transaction.transactionType?.toLowerCase();
  
  if (type === 'deposit' || type === 'income') {
    return 'success.main';
  } else if (type === 'withdrawal' || type === 'payment') {
    return 'error.main';
  }
  return 'text.primary';
};

const getStatusColor = (transaction) => {
  const status = transaction.status?.toLowerCase();
  
  if (status === 'completed' || status === 'success') {
    return '#4caf50';
  } else if (status === 'pending' || status === 'processing') {
    return '#ff9800';
  } else if (status === 'failed' || status === 'rejected') {
    return '#f44336';
  }
  return '#9e9e9e';
};

export default RecentTransactionsCard;