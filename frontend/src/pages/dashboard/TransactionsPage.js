import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Paper, Box, 
  CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination,
  IconButton, TextField, InputAdornment, Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  ArrowDownward as SortDownIcon,
  ArrowUpward as SortUpIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import * as transactionAPI from '../../api/transaction';
import { formatCurrency, formatDate } from '../../utils/formatters';
import TransactionTypeChip from '../../components/TransactionTypeChip';
import tokenManager from '../../utils/tokenManager';

const TransactionsPage = () => {
  // State for transactions list
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    type: null,
    dateFrom: null,
    dateTo: null,
    amountMin: null,
    amountMax: null
  });

  // Restore authentication tokens on component mount
  useEffect(() => {
    // Restore tokens from session storage backup
    const restoreAuthTokens = () => {
      const token = sessionStorage.getItem('auth_token_backup');
      const refreshToken = sessionStorage.getItem('refresh_token_backup');
      
      if (token) {
        console.log('Restoring auth token from backup');
        localStorage.setItem('token', token);
        
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }
      
      // Ensure token stability
      tokenManager.stabilizeSession();
    };
    
    restoreAuthTokens();
  }, []);

  // Fetch transactions with search, sort, and pagination
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    
    try {
      // Ensure token stability before API call
      tokenManager.stabilizeSession();
      
      // Prepare query parameters
      const queryParams = {
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        sortBy,
        sortDirection,
        ...filters
      };
      
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      
      const data = await transactionAPI.getTransactions(queryParams);
      
      if (Array.isArray(data)) {
        setTransactions(data);
        setTotalTransactions(data.length > 0 ? data[0].total_count || data.length : 0);
      } else {
        setTransactions([]);
        setTotalTransactions(0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortDirection, filters, searchTerm]);

  // Initial data load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(0); // Reset to first page
    fetchTransactions();
  };

  // Handle sort column click
  const handleSortClick = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
    setPage(0); // Reset to first page
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle view transaction details
  const handleViewTransaction = (transaction) => {
    // Store transaction in session storage for retrieval
    sessionStorage.setItem('currentTransaction', JSON.stringify(transaction));
    
    // Back up auth tokens to session storage before navigation
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
    
    // Use direct navigation to avoid auth issues
    window.location.href = `/transaction-details?id=${transaction.id}`;
  };

  // Render sort icon
  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    
    return sortDirection === 'asc' 
      ? <SortUpIcon fontSize="small" sx={{ ml: 0.5 }} /> 
      : <SortDownIcon fontSize="small" sx={{ ml: 0.5 }} />;
  };

  // Render loading state
  if (loading && page === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Transaction History
          </Typography>
          
          {/* Search bar */}
          <Box component="form" onSubmit={handleSearchSubmit}>
            <TextField
              size="small"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      aria-label="filter" 
                      title="Advanced filters"
                      onClick={() => {/* Show filter dialog */}}
                    >
                      <FilterIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ width: 300 }}
            />
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <Button 
              size="small" 
              onClick={fetchTransactions} 
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        )}
        
        {/* Transactions table */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSortClick('date')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Box display="flex" alignItems="center">
                    Date {renderSortIcon('date')}
                  </Box>
                </TableCell>
                <TableCell>Transaction Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell
                  onClick={() => handleSortClick('amount')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="right"
                >
                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                    Amount {renderSortIcon('amount')}
                  </Box>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      {formatDate(transaction.created_at || transaction.date, true)}
                    </TableCell>
                    <TableCell>
                      <TransactionTypeChip type={transaction.transaction_type || transaction.type} />
                    </TableCell>
                    <TableCell>
                      {transaction.description || 
                        (transaction.transaction_type === 'transfer' ? 'Transfer' : 
                         transaction.transaction_type === 'payment' ? 'Payment' : 
                         transaction.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        color={
                          transaction.transaction_type === 'deposit' ? 'success.main' : 
                          transaction.transaction_type === 'withdrawal' ? 'error.main' : 
                          'text.primary'
                        }
                        fontWeight="medium"
                      >
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status || 'completed'}
                        size="small"
                        color={
                          transaction.status === 'completed' ? 'success' :
                          transaction.status === 'pending' ? 'warning' :
                          transaction.status === 'failed' ? 'error' : 'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small"
                        onClick={() => handleViewTransaction(transaction)}
                        title="View details"
                        aria-label="view transaction details"
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalTransactions}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Container>
  );
};

export default TransactionsPage;