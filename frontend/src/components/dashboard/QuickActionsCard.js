import React from 'react';
import { 
  Paper, Typography, Box, Button, Alert,
  Grid
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CreditCard as CardIcon,
  MonetizationOn as LoanIcon,
  Savings as SavingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tokenManager from '../../utils/tokenManager';

// Define actions array for maintainability
const QUICK_ACTIONS = [
  { path: '/transfer', label: 'Send Money', icon: <WalletIcon />, primary: true },
  { path: '/pay-bills', label: 'Pay Bills', icon: <PaymentIcon /> },
  { path: '/statements', label: 'Statements', icon: <ReceiptIcon /> },
  { path: '/cards', label: 'Cards', icon: <CardIcon /> },
  { path: '/loans', label: 'Loans', icon: <LoanIcon /> },
  { path: '/savings', label: 'Savings', icon: <SavingsIcon /> }
];

const QuickActionsCard = ({ isOffline = false }) => {
  const navigate = useNavigate();
  
  // Improved safe navigation function
  const navigateSafely = (path, options = {}) => {
    // Ensure token stability before navigation
    tokenManager.stabilizeSession();
    
    // Navigate with proper state to skip initial auth check
    navigate(path, { 
      state: { skipInitialAuthCheck: true, ...options },
      // If offline and not a core feature, prevent navigation
      ...(isOffline && !['transfer', 'statements'].includes(path.replace('/', '')) && {
        replace: true
      })
    });
  };
  
  // Handler for button click
  const handleActionClick = (path) => {
    if (isOffline && !['transfer', 'statements'].includes(path.replace('/', ''))) {
      // For offline mode, you might want to show an alert or disable some actions
      console.log('This feature is unavailable in offline mode');
      return;
    }
    
    navigateSafely(path);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Quick Actions
      </Typography>
      
      {isOffline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You're in offline mode. Some features may be limited.
        </Alert>
      )}
      
      <Box sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          {QUICK_ACTIONS.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Button
                onClick={() => handleActionClick(action.path)}
                variant={action.primary ? "contained" : "outlined"}
                color="primary"
                startIcon={action.icon}
                fullWidth
                disabled={isOffline && !['transfer', 'statements'].includes(action.path.replace('/', ''))}
                sx={{ 
                  py: 1.5, 
                  textAlign: 'left', 
                  justifyContent: 'flex-start',
                  opacity: isOffline && !['transfer', 'statements'].includes(action.path.replace('/', '')) ? 0.7 : 1
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default QuickActionsCard;