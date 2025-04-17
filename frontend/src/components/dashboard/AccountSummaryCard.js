import React from 'react';
import { 
  Card, CardContent, Typography, Box, 
  LinearProgress, Button, Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { formatCurrency, formatAccountNumber } from '../../utils/formatters';

const AccountSummaryCard = ({ account }) => {
  const getAccountIcon = (type) => {
    switch(type.toLowerCase()) {
      case 'checking':
        return '💳';
      case 'savings':
        return '💰';
      case 'investment':
        return '📈';
      case 'credit':
        return '💳';
      default:
        return '🏦';
    }
  };
  
  const getAccountColor = (type) => {
    switch(type.toLowerCase()) {
      case 'checking':
        return 'primary';
      case 'savings':
        return 'success';
      case 'investment':
        return 'warning';
      case 'credit':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center">
            <Box fontSize="1.5rem" mr={1}>
              {getAccountIcon(account.accountType)}
            </Box>
            <Typography variant="h6">
              {account.accountType} Account
            </Typography>
          </Box>
          <Chip 
            label={account.isActive ? 'Active' : 'Inactive'} 
            color={account.isActive ? 'success' : 'default'} 
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Account Number: {formatAccountNumber(account.accountNumber)}
        </Typography>
        
        <Box my={2}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Current Balance
          </Typography>
          <Typography variant="h5" gutterBottom>
            {formatCurrency(account.balance)}
          </Typography>
        </Box>
        
        {account.accountType.toLowerCase() === 'savings' && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="body2">Savings Goal Progress</Typography>
              <Typography variant="body2">65%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={65} 
              color="success" 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
        
        <Box display="flex" justifyContent="flex-end">
          <Button 
            variant="contained" 
            color={getAccountColor(account.accountType)} 
            component={RouterLink}
            to={`/accounts/${account.id}`}
            size="small"
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AccountSummaryCard;