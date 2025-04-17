import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent,
  Button, Divider, List, ListItem, ListItemText, ListItemIcon,
  Avatar, IconButton, CircularProgress, Alert
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  More as MoreIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AddCircleOutline as AddIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import AccountService from '../../api/account';
import * as transactionAPI from '../../api/transaction';
import authService from '../../api/auth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import TransactionTypeChip from '../../components/TransactionTypeChip';
import tokenManager from '../../utils/tokenManager';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // State variables
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [backendOnline, setBackendOnline] = useState(true);
  const [backendChecked, setBackendChecked] = useState(false);
  
  // Dashboard statistics
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState([]);

  // Generate demo data for charts immediately on component init - not in a callback
  const generateChartData = () => {
    console.log("Generating chart data");
    const today = new Date();
    const balanceData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      
      balanceData.push({
        name: date.toLocaleDateString('default', { month: 'short' }),
        balance: Math.floor(10000 + Math.random() * 5000)
      });
    }
    
    setBalanceHistory(balanceData);
    
    setSpendingByCategory([
      { name: 'Groceries', value: 450 },
      { name: 'Utilities', value: 300 },
      { name: 'Entertainment', value: 200 },
      { name: 'Dining', value: 250 },
      { name: 'Transportation', value: 180 }
    ]);
  };

  // Create mock data function that doesn't depend on other state
  const createMockData = useCallback(() => {
    console.log("Creating mock data");
    return [
      {
        id: 'mock-1',
        amount: 1250.00,
        description: 'Salary Deposit',
        transaction_type: 'deposit',
        status: 'completed',
        created_at: new Date().toISOString(),
        currency: 'USD',
      },
      {
        id: 'mock-2',
        amount: 85.75,
        description: 'Grocery Shopping',
        transaction_type: 'payment',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        currency: 'USD'
      },
      {
        id: 'mock-3',
        amount: 500.00,
        description: 'Savings Transfer',
        transaction_type: 'transfer',
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        currency: 'USD'
      }
    ];
  }, []);

  // Use useCallback for functions used in useEffect dependencies
  const checkBackendConnection = useCallback(async () => {
    try {
      // First try checking if we can get transactions
      console.log('Checking backend connection via transactions endpoint');
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Try getting transactions as a reliable way to check connectivity
          const transactionsResponse = await fetch(`http://localhost:5000/api/transactions`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            signal: AbortSignal.timeout(3000)
          });
          
          if (transactionsResponse.ok) {
            console.log('Backend connection confirmed via transactions endpoint');
            return true;
          }
        } catch (transactionsError) {
          console.log('Transactions endpoint check failed, trying health endpoint');
        }
      }
      
      // Then try the health endpoint
      const url = `http://localhost:5000/health`;
      console.log('Checking backend connection at:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        console.log('Backend connection confirmed via health endpoint');
        return true;
      }
      
      console.log('Health endpoint returned status:', response.status);
      
      try {
        const altUrl = `http://localhost:5000/api/health`;
        console.log('Checking alternate backend connection at:', altUrl);
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
        
        if (altResponse.ok) {
          console.log('Backend connection confirmed via alternate health endpoint');
          return true;
        }
      } catch (altError) {
        console.error("Alternate health check failed:", altError);
      }
      
      if (transactions.length > 0 && !transactions[0].id?.startsWith('mock-')) {
        console.log('Backend considered online based on loaded transaction data');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Backend health check failed:", error);
      
      if (transactions.length > 0 && !transactions[0].id?.startsWith('mock-')) {
        console.log('Backend considered online based on loaded transaction data despite check failure');
        return true;
      }
      
      return false;
    }
  }, [transactions]);

  // Simplified fetch dashboard data with better error handling
  const fetchDashboardData = useCallback(async () => {
    console.log("Starting data fetch");
    
    // Ensure the component will eventually stop loading, even if all requests fail
    setTimeout(() => {
      if (loading) {
        console.log("Timeout - forcing loading to false after 8 seconds");
        setLoading(false);
        
        // If no data was loaded, show fallback data
        if (transactions.length === 0) {
          console.log("No transactions loaded - using mock data");
          setTransactions(createMockData());
          generateChartData();
        }
      }
    }, 8000);
    
    try {
      console.log("Fetching user profile");
      // Fetch user profile
      try {
        const userProfile = await authService.getProfile();
        console.log("User profile loaded:", !!userProfile);
        setUser(userProfile);
      } catch (profileError) {
        console.error("Error fetching profile:", profileError);
        // Continue with other requests even if profile fails
      }
      
      console.log("Fetching accounts");
      // Fetch accounts
      try {
        const accountsData = await AccountService.getUserAccounts();
        console.log("Accounts loaded:", accountsData?.accounts?.length || 0);
        
        if (accountsData && Array.isArray(accountsData.accounts)) {
          setAccounts(accountsData.accounts);
          
          // Calculate total balance
          const total = accountsData.accounts.reduce((sum, account) => {
            return sum + parseFloat(account.balance || 0);
          }, 0);
          
          setAccountsTotal(total);
        } else {
          setAccounts([]);
          setAccountsTotal(0);
        }
      } catch (accountsError) {
        console.error("Error fetching accounts:", accountsError);
      }
      
      console.log("Fetching transactions");
      // Fetch transactions
      try {
        const transactionsData = await transactionAPI.getTransactions({ limit: 10 });
        console.log("Transactions loaded:", transactionsData?.length || 0);
        
        if (transactionsData && Array.isArray(transactionsData)) {
          setTransactions(transactionsData);
        } else {
          // Use mock data if API returned invalid format
          setTransactions(createMockData());
        }
      } catch (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        // Use mock transactions if API call failed
        setTransactions(createMockData());
      }
      
      // Generate chart data regardless of API call success
      generateChartData();
      
      // Set loading to false only if we got here without errors
      console.log("Data fetch completed successfully");
      setLoading(false);
    } catch (err) {
      console.error("Error in fetchDashboardData:", err);
      setError("Some data couldn't be loaded. Please try refreshing.");
      
      // Even on error, set loading to false so user is not stuck
      setLoading(false);
      
      // Set some fallback data
      if (transactions.length === 0) {
        setTransactions(createMockData());
      }
      
      // Ensure chart data is generated
      generateChartData();
    }
  }, [createMockData]);

  // Use a simpler useEffect with improved error handling
  useEffect(() => {
    console.log("Dashboard mount - fetching data");
    
    // Fetch data and handle any uncaught Promise rejections
    fetchDashboardData().catch(err => {
      console.error("Uncaught error in data fetching:", err);
      setLoading(false);
      setError("Failed to load dashboard data. Please try again later.");
      
      // Set fallback data
      setTransactions(createMockData());
      generateChartData();
    });
    
    // Check backend connection
    checkBackendConnection().then(isOnline => {
      setBackendOnline(isOnline);
      setBackendChecked(true);
    }).catch(err => {
      console.error("Error checking backend connection:", err);
      setBackendOnline(false);
      setBackendChecked(true);
    });
    
    // Cleanup function
    return () => {
      console.log("Dashboard unmounting");
    };
  }, [fetchDashboardData, checkBackendConnection, createMockData]);
  
  const handleTransferClick = () => {
    tokenManager.stabilizeSession();
    navigate('/transfer');
  };
  
  const handlePayBillsClick = () => {
    tokenManager.stabilizeSession();
    navigate('/pay-bills');
  };
  
  const handleViewAccountClick = (accountId) => {
    tokenManager.stabilizeSession();
    navigate(`/accounts/${accountId}`);
  };
  
  const handleAddAccountClick = () => {
    tokenManager.stabilizeSession();
    navigate('/accounts/new');
  };

  const handleViewAllTransactions = () => {
    // Store authentication tokens in sessionStorage before navigation
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token) {
      sessionStorage.setItem('auth_token_backup', token);
      
      if (refreshToken) {
        sessionStorage.setItem('refresh_token_backup', refreshToken);
      } else {
        sessionStorage.setItem('refresh_token_backup', token);
      }
    }
    
    // Use direct window location navigation instead of React Router to avoid logout issues
    window.location.href = '/transactions';
  };

  const handleTransactionClick = (transaction) => {
    sessionStorage.setItem('currentTransaction', JSON.stringify(transaction));
    
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token) {
      sessionStorage.setItem('auth_token_backup', token);
      
      if (refreshToken) {
        sessionStorage.setItem('refresh_token_backup', refreshToken);
      } else {
        sessionStorage.setItem('refresh_token_backup', token);
      }
    }
    
    window.location.href = `/transaction-details?id=${transaction.id}`;
  };
  
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {backendChecked && !backendOnline && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          The server appears to be offline. You're viewing demo data.
          <Button 
            size="small" 
            sx={{ ml: 2 }}
            onClick={() => {
              setBackendChecked(false);
              checkBackendConnection().then(isOnline => {
                setBackendOnline(isOnline);
                setBackendChecked(true);
                if (isOnline) {
                  window.location.reload();
                }
              });
            }}
          >
            Retry Connection
          </Button>
        </Alert>
      )}
      
      {/* Welcome Section */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome back, {user?.firstName}!
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Here's your financial summary for today
            </Typography>
            
            <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h3" component="div">
                {formatCurrency(accountsTotal)}
              </Typography>
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                Total Balance
              </Typography>
            </Box>
            
            <Box display="flex" gap={2}>
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<PaymentIcon />}
                onClick={handleTransferClick}
              >
                Transfer
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                startIcon={<ReceiptIcon />}
                onClick={handlePayBillsClick}
              >
                Pay Bills
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ height: 180 }}>
              <LineChart 
                data={balanceHistory} 
                xKey="name" 
                yKey="balance" 
                color="#ffffff"
                showGrid={false}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Main Dashboard Content */}
      <Grid container spacing={4}>
        {/* Accounts Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Your Accounts</Typography>
              </Box>
              <Button 
                startIcon={<AddIcon />}
                onClick={handleAddAccountClick}
                size="small"
              >
                Add Account
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {accounts.length > 0 ? (
              <Grid container spacing={2}>
                {accounts.map((account) => (
                  <Grid item xs={12} key={account.id}>
                    <Card variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Grid container alignItems="center">
                          <Grid item xs={7}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {account.account_type} Account
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {account.account_number.slice(-4).padStart(account.account_number.length, '*')}
                            </Typography>
                          </Grid>
                          <Grid item xs={3} textAlign="right">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {formatCurrency(account.balance, account.currency)}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} textAlign="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewAccountClick(account.id)}
                              aria-label="View account details"
                            >
                              <MoreIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">
                  You don't have any accounts yet.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddAccountClick}
                  sx={{ mt: 2 }}
                >
                  Open Your First Account
                </Button>
              </Box>
            )}
          </Paper>
          
          {/* Financial Insights Section */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Financial Insights</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Spending by Category
                </Typography>
                <Box sx={{ height: 250 }}>
                  <PieChart 
                    data={spendingByCategory} 
                    dataKey="value" 
                    nameKey="name" 
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly Summary
                </Typography>
                
                <Box p={2} bgcolor="background.paper" borderRadius={1}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Income:
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <ArrowUpwardIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="body1" color="success.main" fontWeight="medium">
                        {formatCurrency(5230)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Expenses:
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <ArrowDownwardIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                      <Typography variant="body1" color="error.main" fontWeight="medium">
                        {formatCurrency(3650)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="medium">
                      Net Savings:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(1580)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Right Column - Recent Transactions */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, mb: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recent Transactions</Typography>
              </Box>
              <Button 
                onClick={handleViewAllTransactions}
                variant="text" 
                color="primary" 
                size="small"
                endIcon={<ArrowForwardIcon />}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {transactions.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {transactions.map((transaction) => {
                  const isCredit = transaction.transaction_type === 'deposit' || 
                                 (transaction.transaction_type === 'transfer' && 
                                  transaction.destination_account_id === accounts[0]?.id);
                                  
                  return (
                    <React.Fragment key={transaction.id}>
                      <ListItem 
                        alignItems="flex-start"
                        sx={{ 
                          px: 1, 
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderRadius: 1
                          }
                        }}
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: isCredit ? 'success.light' : 'error.light',
                              width: 36,
                              height: 36
                            }}
                          >
                            {isCredit ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" component="span">
                                {transaction.description || 
                                  (transaction.transaction_type === 'transfer' ? 'Transfer' : 
                                   transaction.transaction_type === 'payment' ? 'Payment' : 
                                   transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                component="span"
                                color={isCredit ? 'success.main' : 'error.main'}
                                fontWeight="medium"
                              >
                                {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatDate(transaction.created_at)}
                              </Typography>
                              <TransactionTypeChip type={transaction.transaction_type} small />
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" variant="inset" />
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  No recent transactions
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;