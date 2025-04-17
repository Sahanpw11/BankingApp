import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Grid, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Card, CardContent, FormControl, InputLabel,
  Select, MenuItem, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
// Removed date picker imports
import adminService from '../../api/admin';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [statsData, setStatsData] = useState({
    totalCount: 0,
    totalIncoming: 0,
    totalOutgoing: 0,
    pendingCount: 0,
    completedCount: 0,
    failedCount: 0
  });
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await adminService.getAllTransactions();
        setTransactions(response.transactions);
        setFilteredTransactions(response.transactions);
        setLoading(false);
        
        // Calculate stats
        const stats = {
          totalCount: response.transactions.length,
          totalIncoming: response.transactions
            .filter(tx => tx.transaction_type === 'deposit' || tx.transaction_type === 'incoming_transfer')
            .reduce((sum, tx) => sum + tx.amount, 0),
          totalOutgoing: response.transactions
            .filter(tx => tx.transaction_type === 'withdrawal' || tx.transaction_type === 'outgoing_transfer' || tx.transaction_type === 'payment')
            .reduce((sum, tx) => sum + tx.amount, 0),
          pendingCount: response.transactions.filter(tx => tx.status === 'pending').length,
          completedCount: response.transactions.filter(tx => tx.status === 'completed').length,
          failedCount: response.transactions.filter(tx => tx.status === 'failed').length
        };
        setStatsData(stats);
      } catch (err) {
        setError(err.message || 'Failed to load transactions');
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  useEffect(() => {
    // Filter transactions based on search and filters
    const filterTransactions = () => {
      let filtered = transactions;
      
      // Apply search term
      if (searchTerm) {
        filtered = filtered.filter(tx => 
          tx.id.includes(searchTerm) || 
          (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (tx.source_account_id && tx.source_account_id.includes(searchTerm)) || 
          (tx.destination_account_id && tx.destination_account_id.includes(searchTerm))
        );
      }
      
      // Apply transaction type filter
      if (filterType !== 'all') {
        filtered = filtered.filter(tx => tx.transaction_type === filterType);
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        filtered = filtered.filter(tx => tx.status === filterStatus);
      }
      
      // Apply date range filter - Modified for string inputs
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          filtered = filtered.filter(tx => {
            const txDate = new Date(tx.created_at);
            return txDate >= start && txDate <= end;
          });
        }
      } else if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filtered = filtered.filter(tx => new Date(tx.created_at) >= start);
        }
      } else if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          filtered = filtered.filter(tx => new Date(tx.created_at) <= end);
        }
      }
      
      setFilteredTransactions(filtered);
    };
    
    filterTransactions();
  }, [transactions, searchTerm, filterType, filterStatus, startDate, endDate]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
    setPage(0);
  };
  
  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };
  
  // Updated date handlers for text inputs
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
    setPage(0);
  };
  
  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
    setPage(0);
  };
  
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };
  
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedTransaction(null);
  };
  
  const handleExportData = () => {
    // In a real application, this would export the current filtered data
    console.log('Exporting data...');
    alert('This would export the transaction data to CSV or Excel');
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };
  
  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'transfer': return 'Transfer';
      case 'incoming_transfer': return 'Incoming Transfer';
      case 'outgoing_transfer': return 'Outgoing Transfer';
      case 'payment': return 'Payment';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Transaction History
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExportData}
        >
          Export Data
        </Button>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Transactions</Typography>
              <Typography variant="h5" component="div">{statsData.totalCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Completed</Typography>
              <Typography variant="h5" component="div" color="success.main">{statsData.completedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h5" component="div" color="warning.main">{statsData.pendingCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Failed</Typography>
              <Typography variant="h5" component="div" color="error.main">{statsData.failedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Incoming</Typography>
              <Box display="flex" alignItems="center">
                <ArrowUpIcon color="success" />
                <Typography variant="h5" component="div">
                  {formatCurrency(statsData.totalIncoming)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Outgoing</Typography>
              <Box display="flex" alignItems="center">
                <ArrowDownIcon color="error" />
                <Typography variant="h5" component="div">
                  {formatCurrency(statsData.totalOutgoing)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Search Transactions"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="transaction-type-filter-label">Type</InputLabel>
              <Select
                labelId="transaction-type-filter-label"
                value={filterType}
                onChange={handleFilterTypeChange}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="deposit">Deposit</MenuItem>
                <MenuItem value="withdrawal">Withdrawal</MenuItem>
                <MenuItem value="transfer">Transfer</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                onChange={handleFilterStatusChange}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Replaced DatePicker with regular TextField */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} display="flex" justifyContent="flex-end">
            <Button
              variant="text"
              onClick={handleResetFilters}
              sx={{ mr: 1 }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Transactions Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>From / To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    <Chip 
                      label={getTransactionTypeLabel(transaction.transaction_type)} 
                      size="small"
                      color={
                        transaction.transaction_type.includes('deposit') || 
                        transaction.transaction_type.includes('incoming') ? 
                          'primary' : 'secondary'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(transaction.amount, transaction.currency || 'USD')}
                  </TableCell>
                  <TableCell>
                    {transaction.transaction_type === 'transfer' ? (
                      <>
                        <Typography variant="body2">
                          From: {transaction.source_account_id?.substring(0, 8) || 'N/A'}...
                        </Typography>
                        <Typography variant="body2">
                          To: {transaction.destination_account_id?.substring(0, 8) || 'N/A'}...
                        </Typography>
                      </>
                    ) : transaction.transaction_type === 'deposit' || transaction.transaction_type === 'incoming_transfer' ? (
                      <Typography variant="body2">
                        To: {transaction.destination_account_id?.substring(0, 8) || 'N/A'}...
                      </Typography>
                    ) : (
                      <Typography variant="body2">
                        From: {transaction.source_account_id?.substring(0, 8) || 'N/A'}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.status} 
                      color={getStatusColor(transaction.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewTransaction(transaction)}
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Transaction Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="md">
        {selectedTransaction && (
          <>
            <DialogTitle>
              Transaction Details
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Transaction ID</Typography>
                  <Typography variant="body1" gutterBottom>{selectedTransaction.id}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                  <Typography variant="body1" gutterBottom>
                    {getTransactionTypeLabel(selectedTransaction.transaction_type)}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Amount</Typography>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency || 'USD')}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedTransaction.description || "No description"}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Typography variant="body1" gutterBottom>
                    <Chip 
                      label={selectedTransaction.status} 
                      color={getStatusColor(selectedTransaction.status)} 
                      size="small" 
                    />
                  </Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Created Date</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedTransaction.created_at, true)}
                  </Typography>
                  
                  {selectedTransaction.completed_at && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary">Completed Date</Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDate(selectedTransaction.completed_at, true)}
                      </Typography>
                    </>
                  )}
                  
                  {selectedTransaction.source_account_id && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary">Source Account</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedTransaction.source_account_id}
                      </Typography>
                    </>
                  )}
                  
                  {selectedTransaction.destination_account_id && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary">Destination Account</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedTransaction.destination_account_id}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default TransactionHistory;