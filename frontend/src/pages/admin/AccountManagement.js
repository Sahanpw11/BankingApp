import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Grid, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, InputAdornment, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton,
  Tooltip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import adminService from '../../api/admin';
import { formatCurrency, formatDate, formatAccountNumber } from '../../utils/formatters';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [statsData, setStatsData] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    checkingCount: 0,
    savingsCount: 0,
    totalBalance: 0
  });
  
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await adminService.getAllAccounts();
        setAccounts(response.accounts);
        setFilteredAccounts(response.accounts);
        setLoading(false);
        
        // Calculate stats
        const stats = {
          total: response.accounts.length,
          active: response.accounts.filter(acc => acc.isActive).length,
          inactive: response.accounts.filter(acc => !acc.isActive).length,
          checkingCount: response.accounts.filter(acc => acc.accountType === 'Checking').length,
          savingsCount: response.accounts.filter(acc => acc.accountType === 'Savings').length,
          totalBalance: response.accounts.reduce((sum, acc) => sum + acc.balance, 0)
        };
        setStatsData(stats);
      } catch (err) {
        setError(err.message || 'Failed to load accounts');
        setLoading(false);
      }
    };
    
    fetchAccounts();
  }, []);
  
  useEffect(() => {
    // Filter accounts based on search term and filters
    const filterAccounts = () => {
      let filtered = accounts;
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter(account => 
          account.accountNumber.includes(searchTerm) || 
          (account.ownerName && account.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Apply account type filter
      if (filterType !== 'all') {
        filtered = filtered.filter(account => account.accountType === filterType);
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        const isActive = filterStatus === 'active';
        filtered = filtered.filter(account => account.isActive === isActive);
      }
      
      setFilteredAccounts(filtered);
    };
    
    filterAccounts();
  }, [accounts, searchTerm, filterType, filterStatus]);
  
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
  
  const handleViewAccount = (account) => {
    setSelectedAccount(account);
    setDetailDialogOpen(true);
  };
  
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedAccount(null);
  };
  
  const toggleAccountStatus = async (accountId, currentStatus) => {
    try {
      // In a real app, this would call an API to update the account status
      // For now, we'll just update the local state
      const updatedAccounts = accounts.map(account => {
        if (account.id === accountId) {
          return { ...account, isActive: !currentStatus };
        }
        return account;
      });
      
      setAccounts(updatedAccounts);
      
      // Update stats
      const stats = {
        total: updatedAccounts.length,
        active: updatedAccounts.filter(acc => acc.isActive).length,
        inactive: updatedAccounts.filter(acc => !acc.isActive).length,
        checkingCount: updatedAccounts.filter(acc => acc.accountType === 'Checking').length,
        savingsCount: updatedAccounts.filter(acc => acc.accountType === 'Savings').length,
        totalBalance: updatedAccounts.reduce((sum, acc) => sum + acc.balance, 0)
      };
      setStatsData(stats);
    } catch (error) {
      console.error('Error toggling account status:', error);
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
      <Typography variant="h4" component="h1" gutterBottom>
        Account Management
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Accounts</Typography>
              <Typography variant="h5" component="div">{statsData.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active</Typography>
              <Typography variant="h5" component="div" color="success.main">{statsData.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Inactive</Typography>
              <Typography variant="h5" component="div" color="error.main">{statsData.inactive}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Checking</Typography>
              <Typography variant="h5" component="div">{statsData.checkingCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Savings</Typography>
              <Typography variant="h5" component="div">{statsData.savingsCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Balance</Typography>
              <Typography variant="h5" component="div">{formatCurrency(statsData.totalBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
          <TextField
            label="Search Accounts"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="account-type-filter-label">Account Type</InputLabel>
            <Select
              labelId="account-type-filter-label"
              value={filterType}
              onChange={handleFilterTypeChange}
              label="Account Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="Checking">Checking</MenuItem>
              <MenuItem value="Savings">Savings</MenuItem>
              <MenuItem value="Investment">Investment</MenuItem>
              <MenuItem value="Loan">Loan</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filterStatus}
              onChange={handleFilterStatusChange}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {/* Accounts Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Account Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>
                    <Chip 
                      label={account.accountType} 
                      size="small"
                      color={
                        account.accountType === 'Savings' ? 'primary' : 
                        account.accountType === 'Checking' ? 'secondary' : 
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{account.ownerName || "N/A"}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(account.balance, account.currency || 'USD')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={account.isActive ? 'Active' : 'Inactive'} 
                      color={account.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(account.createdAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewAccount(account)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={account.isActive ? "Deactivate Account" : "Activate Account"}>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleAccountStatus(account.id, account.isActive)}
                        color={account.isActive ? "error" : "success"}
                      >
                        {account.isActive ? 
                          <BlockIcon fontSize="small" /> : 
                          <CheckCircleIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No accounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAccounts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Account Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="md">
        {selectedAccount && (
          <>
            <DialogTitle>
              Account Details
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Account Number</Typography>
                  <Typography variant="body1" gutterBottom>{selectedAccount.accountNumber}</Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Account Type</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedAccount.accountType}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Owner</Typography>
                  <Box display="flex" alignItems="center" mt={0.5} mb={1}>
                    <Typography variant="body1">
                      {selectedAccount.ownerName || "N/A"}
                    </Typography>
                    {selectedAccount.userId && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                        onClick={() => {
                          window.open(`/admin/users/${selectedAccount.userId}`, '_blank');
                        }}
                      >
                        View User
                      </Button>
                    )}
                  </Box>
                  
                  {selectedAccount.ownerEmail && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary">Owner Email</Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedAccount.ownerEmail}
                      </Typography>
                    </>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Current Balance</Typography>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    {formatCurrency(selectedAccount.balance, selectedAccount.currency || 'USD')}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  <Typography variant="body1" gutterBottom>
                    <Chip 
                      label={selectedAccount.isActive ? 'Active' : 'Inactive'} 
                      color={selectedAccount.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </Typography>
                  
                  <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedAccount.createdAt, true)}
                  </Typography>
                </Grid>
                
                {/* Additional fields can be added here */}
                <Grid item xs={12}>
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>Recent Transactions</Typography>
                    {/* This would typically show recent transactions */}
                    <Typography variant="body2" color="textSecondary">
                      Transaction history would be displayed here.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailDialog}>Close</Button>
              <Button 
                variant="outlined" 
                color={selectedAccount.isActive ? "error" : "success"}
                onClick={() => {
                  toggleAccountStatus(selectedAccount.id, selectedAccount.isActive);
                  handleCloseDetailDialog();
                }}
              >
                {selectedAccount.isActive ? "Deactivate Account" : "Activate Account"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default AccountManagement;