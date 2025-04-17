import React from 'react';
import { Chip, Box } from '@mui/material';
import {
  Payment as PaymentIcon,
  CompareArrows as TransferIcon,
  ArrowUpward as DepositIcon,
  ArrowDownward as WithdrawalIcon
} from '@mui/icons-material';

const TransactionTypeChip = ({ type, small = false }) => {
  const getChipConfig = () => {
    const lowerType = type?.toLowerCase() || '';
    
    if (lowerType.includes('transfer')) {
      return { 
        label: 'Transfer', 
        color: 'primary',
        icon: <TransferIcon fontSize={small ? 'small' : 'medium'} />
      };
    } else if (lowerType.includes('deposit') || lowerType.includes('income')) {
      return { 
        label: 'Deposit', 
        color: 'success',
        icon: <DepositIcon fontSize={small ? 'small' : 'medium'} />
      };
    } else if (lowerType.includes('withdrawal')) {
      return { 
        label: 'Withdrawal', 
        color: 'error',
        icon: <WithdrawalIcon fontSize={small ? 'small' : 'medium'} />
      };
    } else if (lowerType.includes('payment')) {
      return { 
        label: 'Payment', 
        color: 'warning',
        icon: <PaymentIcon fontSize={small ? 'small' : 'medium'} />
      };
    } else {
      return { 
        label: type || 'Unknown', 
        color: 'default',
        icon: null
      };
    }
  };
  
  const { label, color, icon } = getChipConfig();
  
  // Add sx prop for proper display in secondary text
  return (
    <Box component="span" sx={{ display: 'inline-block' }}>
      <Chip 
        label={label} 
        color={color} 
        icon={icon}
        size={small ? "small" : "medium"} 
        variant="outlined"
        sx={{ height: small ? 20 : 32 }}
      />
    </Box>
  );
};

export default TransactionTypeChip;