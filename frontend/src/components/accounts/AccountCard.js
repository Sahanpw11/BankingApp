import React from 'react';
import { 
  Card, CardContent, Typography, Box, 
  Button, Chip, Divider
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const AccountCard = ({ account }) => {
  const getAccountTypeColor = (accountType) => {
    switch(accountType) {
      case 'Checking':
        return 'primary';
      case 'Savings':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 0 }}>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '4px 4px 0 0'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {account.accountType} Account
            </Typography>
            <Chip 
              label={account.isActive ? 'Active' : 'Inactive'} 
              color={account.isActive ? 'success' : 'default'} 
              size="small" 
              sx={{ color: '#fff', bgcolor: account.isActive ? 'success.dark' : 'grey.600' }}
            />
          </Box>
        </Box>
        
        <Box p={2}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Account Number
          </Typography>
          <Typography variant="body1">
            {account.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
          </Typography>
        </Box>
        
        <Divider />
        
        <Box p={2}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Available Balance
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {formatCurrency(account.balance, account.currency)}
          </Typography>
        </Box>
        
        <Divider />
        
        <Box 
          p={2} 
          display="flex" 
          justifyContent="space-between"
        >
          <Button
            component={Link}
            to={`/accounts/${account.id}`}
            endIcon={<ArrowIcon />}
          >
            View Details
          </Button>
          
          <Button
            component={Link}
            to={`/transfer?source=${account.id}`}
            variant="contained"
            color="primary"
            size="small"
          >
            Transfer
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AccountCard;