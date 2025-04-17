import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Grid, Box, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Card, CardContent, Divider, CircularProgress, IconButton, Alert, Tooltip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  FileCopy as FileCopyIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  ListAlt as ListAltIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import AccountService from '../../api/account';
import * as transactionAPI from '../../api/transaction';
import { formatCurrency, formatDate, formatAccountNumber } from '../../utils/formatters';
import TransactionStatusChip from '../../components/TransactionStatusChip';
import TransactionTypeChip from '../../components/TransactionTypeChip';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';

const AccountDetail = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmClose, setConfirmClose] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [chartView, setChartView] = useState('balance'); // 'balance' or 'spending'
  
  // Analytics and statistics
  const [monthlyBalance, setMonthlyBalance] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [totalIncoming, setTotalIncoming] = useState(0);
  const [totalOutgoing, setTotalOutgoing] = useState(0);
  
  const calculateStatistics = useCallback((transactions, account) => {
    if (!transactions || transactions.length === 0) return;
    
    // Calculate incoming and outgoing totals
    let incoming = 0;
    let outgoing = 0;
    
    transactions.forEach(transaction => {
      if (transaction.destination_account_id === accountId) {
        incoming += parseFloat(transaction.amount);
      } else if (transaction.source_account_id === accountId) {
        outgoing += parseFloat(transaction.amount);
      }
    });
    
    setTotalIncoming(incoming);
    setTotalOutgoing(outgoing);
    
    // Prepare monthly balance data (last 6 months)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const balanceData = [];
    let currentDate = new Date(sixMonthsAgo);
    let runningBalance = account.opening_balance || 0;
    
    while (currentDate <= today) {
      const monthYear = `${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
      
      // Calculate balance for this month
      const monthlyTransactions = transactions.filter(transaction => {
        const transDate = new Date(transaction.created_at);
        return transDate.getMonth() === currentDate.getMonth() && 
               transDate.getFullYear() === currentDate.getFullYear();
      });
      
      // Calculate the balance change for this month
      let monthlyBalance = 0;
      monthlyTransactions.forEach(transaction => {
        if (transaction.destination_account_id === accountId) {
          monthlyBalance += parseFloat(transaction.amount);
        } else if (transaction.source_account_id === accountId) {
          monthlyBalance -= parseFloat(transaction.amount);
        }
      });
      
      // Add the monthly balance to running balance
      runningBalance += monthlyBalance;
      
      balanceData.push({
        name: monthYear,
        balance: runningBalance
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    setMonthlyBalance(balanceData);
    
    // Calculate spending by category
    const categories = {};
    transactions.forEach(transaction => {
      if (transaction.source_account_id === accountId && transaction.category) {
        if (!categories[transaction.category]) {
          categories[transaction.category] = 0;
        }
        categories[transaction.category] += parseFloat(transaction.amount);
      }
    });
    
    const categoryData = Object.keys(categories).map(category => ({
      name: category,
      value: categories[category]
    }));
    
    setSpendingByCategory(categoryData);
  }, [accountId]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch account details
        const accountData = await AccountService.getAccountDetails(accountId);
        setAccount(accountData);
        setLoading(false);
        
        // Fetch account transactions
        const transactionsData = await transactionAPI.getAccountTransactions(accountId);
        
        // Check if the data is already an array or has a transactions property
        const transactionsArray = Array.isArray(transactionsData) ? 
          transactionsData : 
          (transactionsData.transactions || []);
          
        setTransactions(transactionsArray);
        setTransactionsLoading(false);
        
        // Calculate statistics
        calculateStatistics(transactionsArray, accountData);
      } catch (err) {
        console.error("Error fetching account details:", err);
        setError(err.message || "Failed to load account details");
        setLoading(false);
        setTransactionsLoading(false);
      }
    };
    
    fetchData();
  }, [accountId, calculateStatistics]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleTransferClick = () => {
    navigate('/transfer', { state: { defaultSourceAccount: accountId } });
  };
  
  const handlePaymentClick = () => {
    navigate('/pay-bills', { state: { defaultSourceAccount: accountId } });
  };
  
  const handleStatementClick = () => {
    navigate(`/accounts/${accountId}/statements`);
  };
  
  const handleCloseAccount = () => {
    setConfirmClose(true);
  };
  
  const confirmCloseAccount = async () => {
    try {
      // Close account logic
      await AccountService.closeAccount(accountId);
      navigate('/accounts', { state: { message: 'Account closed successfully' } });
    } catch (err) {
      setError(err.message || 'Failed to close account');
      setConfirmClose(false);
    }
  };
  
  const copyAccountNumber = () => {
    if (account && account.account_number) {
      navigator.clipboard.writeText(account.account_number);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Account Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/accounts')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {account.account_type} Account
        </Typography>
      </Box>
      
      {/* Account Summary */}
      <Paper 
        elevation={3} 
        sx={{ p: 3, mb: 4, position: 'relative', overflow: 'hidden' }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -15, 
            right: -15, 
            width: 110, 
            height: 110, 
            borderRadius: '50%', 
            bgcolor: 'primary.light', 
            opacity: 0.15 
          }} 
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Account Number
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">
                  {formatAccountNumber(account.account_number)}
                </Typography>
                <Tooltip title="Copy account number">
                  <IconButton size="small" onClick={copyAccountNumber}>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {copySuccess && (
                  <Chip 
                    label="Copied!" 
                    color="success" 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Box>
            </Box>
            
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={account.is_active ? "Active" : "Inactive"} 
                color={account.is_active ? "success" : "default"} 
                size="small"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box textAlign={{ xs: 'left', md: 'right' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Balance
              </Typography>
              <Typography variant="h3" color="primary.main">
                {formatCurrency(account.balance, account.currency)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" mt={1}>
                Available: {formatCurrency(account.available_balance || account.balance, account.currency)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handleTransferClick}
            >
              Transfer Money
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<AccountBalanceIcon />}
              onClick={handlePaymentClick}
            >
              Pay Bills
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ListAltIcon />}
              onClick={handleStatementClick}
            >
              Statements
            </Button>
          </Grid>
          <Grid item xs>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="text"
                color="error"
                startIcon={<BlockIcon />}
                onClick={handleCloseAccount}
              >
                Close Account
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Account Analytics */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {chartView === 'balance' ? 'Balance History' : 'Spending Analysis'}
              </Typography>
              <Box>
                <Button 
                  variant={chartView === 'balance' ? 'contained' : 'outlined'} 
                  size="small" 
                  onClick={() => setChartView('balance')}
                  sx={{ mr: 1 }}
                >
                  Balance
                </Button>
                <Button 
                  variant={chartView === 'spending' ? 'contained' : 'outlined'} 
                  size="small" 
                  onClick={() => setChartView('spending')}
                >
                  Spending
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ height: 300 }}>
              {chartView === 'balance' ? (
                monthlyBalance.length > 0 ? (
                  <LineChart 
                    data={monthlyBalance} 
                    xKey="name" 
                    yKey="balance" 
                    color="#3f51b5" 
                  />
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="text.secondary">
                      No balance history available
                    </Typography>
                  </Box>
                )
              ) : (
                spendingByCategory.length > 0 ? (
                  <PieChart 
                    data={spendingByCategory} 
                    dataKey="value" 
                    nameKey="name" 
                  />
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="text.secondary">
                      No spending data available
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Account Summary
            </Typography>
            
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Account Opened
              </Typography>
              <Typography variant="body1">
                {formatDate(account.created_at)}
              </Typography>
            </Box>
            
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Account Type
              </Typography>
              <Typography variant="body1">
                {account.account_type}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Incoming
              </Typography>
              <Typography variant="body1" color="success.main">
                +{formatCurrency(totalIncoming, account.currency)}
              </Typography>
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Outgoing
              </Typography>
              <Typography variant="body1" color="error.main">
                -{formatCurrency(totalOutgoing, account.currency)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Transactions */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box p={3} pb={0}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
        </Box>
        
        <TableContainer sx={{ maxHeight: 440 }}>
          {transactionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <CircularProgress />
            </Box>
          ) : transactions.length > 0 ? (
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((transaction) => {
                    const isCredit = transaction.destination_account_id === accountId;
                    
                    return (
                      <TableRow 
                        key={transaction.id} 
                        hover 
                        onClick={() => navigate(`/transactions/${transaction.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          {transaction.description || (isCredit ? 'Deposit' : 'Withdrawal')}
                        </TableCell>
                        <TableCell>
                          <TransactionTypeChip type={transaction.transaction_type} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={isCredit ? 'success.main' : 'error.main'}
                            fontWeight="500"
                          >
                            {isCredit ? '+' : '-'}
                            {formatCurrency(transaction.amount, account.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TransactionStatusChip status={transaction.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <Typography color="text.secondary">
                No transactions found for this account.
              </Typography>
            </Box>
          )}
        </TableContainer>
        
        {transactions.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={transactions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>
      
      {/* Close Account Confirmation Dialog */}
      <Dialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Close this account?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to close this account? This action cannot be undone.
            If the account has any remaining balance, it will be transferred to your default account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmCloseAccount} color="error" variant="contained" autoFocus>
            Close Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountDetail;