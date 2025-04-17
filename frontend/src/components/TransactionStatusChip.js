import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

/**
 * A component that displays a transaction status as a colored chip
 * @param {Object} props - Component props
 * @param {string} props.status - Transaction status ('completed', 'pending', 'failed', 'scheduled')
 * @param {boolean} props.small - Whether to use a small chip size (optional)
 */
const TransactionStatusChip = ({ status, small = false }) => {
  const getStatusProps = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />
        };
      case 'pending':
        return { 
          label: 'Pending', 
          color: 'warning',
          icon: <PendingIcon fontSize="small" />
        };
      case 'failed':
        return { 
          label: 'Failed', 
          color: 'error',
          icon: <ErrorIcon fontSize="small" />
        };
      case 'scheduled':
        return { 
          label: 'Scheduled', 
          color: 'info',
          icon: <ScheduleIcon fontSize="small" />
        };
      default:
        return { 
          label: status || 'Unknown', 
          color: 'default',
          icon: null
        };
    }
  };
  
  const { label, color, icon } = getStatusProps();
  
  return (
    <Chip 
      label={label}
      color={color}
      size={small ? 'small' : 'medium'}
      icon={icon}
      variant="outlined"
    />
  );
};

export default TransactionStatusChip;