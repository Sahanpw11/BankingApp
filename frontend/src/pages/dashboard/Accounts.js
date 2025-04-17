import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Typography, Grid, Paper, Box, Button, Card, CardContent,
  CardHeader, IconButton, Divider, Chip, CircularProgress, Snackbar,
  Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  LinearProgress, Tooltip
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import AccountService from '../../api/account';
import { formatCurrency, formatDate, formatAccountNumber } from '../../utils/formatters';

const Accounts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    action: null,
    accountId: null
  });
  
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accountsData = await AccountService.getUserAccounts();
        setAccounts(accountsData.accounts);
        
        // Calculate total balance
        const total = accountsData.accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
        setTotalBalance(total);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching accounts:", err);
        setError(err.message || "Failed to load accounts");
        setLoading(false);
      }
    };
    
    fetchAccounts();
    
    // Check for notifications from location state
    if (location.state?.message) {
      setNotification({
        open: true,
        message: location.state.message,
        severity: location.state.severity || 'success'
      });
      
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  const handleOpenAccount = () => {
    navigate('/accounts/new');
  };
  
  const handleViewAccount = (accountId) => {
    navigate(`/accounts/${accountId}`);
  };
  
  const handleTransferFromAccount = (accountId) => {
    navigate('/transfer', { state: { defaultSourceAccount: accountId } });
  };
  
  const handleCloseAccount = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    setConfirmDialog({
      open: true,
      title: 'Close Account',
      content: `Are you sure you want to close your ${account.account_type} account (${formatAccountNumber(account.account_number)})? This action cannot be undone.`,
      action: 'close',
      accountId
    });
  };
  
  const handleConfirmAction = async () => {
    const { action, accountId } = confirmDialog;
    
    try {
      if (action === 'close') {
        await AccountService.closeAccount(accountId);
        
        // Update the local state
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        
        setNotification({
          open: true,
          message: 'Account closed successfully',
          severity: 'success'
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: err.message || 'Failed to perform action',
        severity: 'error'
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };
  
  const getAccountBalanceColor = (accountType) => {
    switch (accountType.toLowerCase()) {
      case 'checking':
        return 'primary.main';
      case 'savings':
        return 'success.main';
      case 'investment':
        return 'secondary.main';
      case 'credit':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };
  
  const getAccountPercentage = (balance) => {
    return totalBalance > 0 ? (balance / totalBalance) * 100 : 0;
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Your Accounts
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAccount}
        >
          Open New Account
        </Button>
      </Box>
      
      {/* Total Balance Card */}
      {accounts.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
            color: 'white'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Total Balance
              </Typography>
              <Typography variant="h3" component="div">
                {formatCurrency(totalBalance)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                {accounts.map((account) => (
                  <Box key={account.id} sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">
                        {account.account_type} Account
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(account.balance, account.currency)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getAccountPercentage(account.balance)} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 1, 
                        mt: 0.5, 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'white'
                        }
                      }} 
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Accounts List */}
      <Grid container spacing={3}>
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <Grid item xs={12} md={6} key={account.id}>
              <Card elevation={2}>
                <CardHeader
                  avatar={
                    <AccountBalanceIcon sx={{ color: getAccountBalanceColor(account.account_type) }} />
                  }
                  action={
                    <IconButton onClick={() => handleViewAccount(account.id)}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  title={
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" component="div">
                        {account.account_type} Account
                      </Typography>
                      {!account.is_active && (
                        <Chip 
                          label="Inactive" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                  }
                  subheader={formatAccountNumber(account.account_number)}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Balance
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="div"
                      sx={{ color: getAccountBalanceColor(account.account_type) }}
                    >
                      {formatCurrency(account.balance, account.currency)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Available: {formatCurrency(account.available_balance || account.balance, account.currency)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <ArrowDownwardIcon 
                          fontSize="small" 
                          color="success" 
                          sx={{ mr: 0.5 }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          Income
                        </Typography>
                      </Box>
                      <Typography variant="body1" color="success.main">
                        {formatCurrency(account.monthly_income || 0, account.currency)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center">
                        <ArrowUpwardIcon 
                          fontSize="small" 
                          color="error" 
                          sx={{ mr: 0.5 }} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          Expenses
                        </Typography>
                      </Box>
                      <Typography variant="body1" color="error.main">
                        {formatCurrency(account.monthly_expenses || 0, account.currency)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" gap={1} justifyContent="space-between">
                    <Tooltip title="View Account Details">
                      <Button 
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewAccount(account.id)}
                        sx={{ flexGrow: 1 }}
                      >
                        Details
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Transfer Money">
                      <Button 
                        startIcon={<PaymentIcon />}
                        onClick={() => handleTransferFromAccount(account.id)}
                        variant="outlined"
                        color="primary"
                        sx={{ flexGrow: 1 }}
                      >
                        Transfer
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Close Account">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCloseAccount(account.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                You don't have any accounts yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Open your first account to start managing your finances.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAccount}
                size="large"
              >
                Open New Account
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="error" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Accounts;