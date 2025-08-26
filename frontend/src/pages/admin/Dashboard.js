import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, 
  Card, CardContent, CardHeader, List, 
  ListItem, ListItemText, Divider, CircularProgress,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import adminService from '../../api/admin';
import { formatCurrency, formatDate } from '../../utils/formatters';

const StatCard = ({ title, value, icon, color = "primary" }) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        {React.cloneElement(icon, { color: color, fontSize: "large" })}
        <Typography variant="h6" component="div" ml={1}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" color={`${color}.main`}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    userCount: 0,
    accountCount: 0,
    transactionCount: 0,
    totalBalance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [flaggedItems, setFlaggedItems] = useState([
    {
      id: '1',
      type: 'large-transaction', 
      title: 'Large Transaction',
      description: 'Transaction for $25,000.00 requires review',
      severity: 'high',
      timestamp: '2025-04-16T14:23:00Z'
    },
    {
      id: '2',
      type: 'suspicious-login',
      title: 'Suspicious Login Attempt', 
      description: 'Multiple failed login attempts for user michael@example.com',
      severity: 'medium',
      timestamp: '2025-04-16T16:45:00Z'
    },
    {
      id: '3',
      type: 'account-inactive',
      title: 'Account Inactivity',
      description: 'User linda@example.com has not completed verification',
      severity: 'low',
      timestamp: '2025-04-15T09:12:00Z'
    }
  ]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminService.getDashboardData();
        
        setStatistics({
          userCount: data.statistics.userCount,
          accountCount: data.statistics.accountCount,
          transactionCount: data.statistics.transactionCount,
          totalBalance: data.statistics.totalBalance
        });
        
        setRecentTransactions(data.recentTransactions);
        setNewUsers(data.newUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const handleUserClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };
  
  const handleTransactionClick = (transactionId) => {
    navigate(`/admin/transactions/${transactionId}`);
  };
  
  const handleViewAllUsers = () => {
    navigate('/admin/users');
  };
  
  const handleViewAllAccounts = () => {
    navigate('/admin/accounts');
  };
  
  const handleViewAllTransactions = () => {
    navigate('/admin/transactions');
  };
  
  const handleActionItem = (id) => {
    // Remove the item from the list (in a real app, this would update the status in the backend)
    setFlaggedItems(flaggedItems.filter(item => item.id !== id));
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Key Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Users" 
            value={statistics.userCount} 
            icon={<PeopleIcon />} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Accounts" 
            value={statistics.accountCount} 
            icon={<AccountBalanceIcon />} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Transactions" 
            value={statistics.transactionCount} 
            icon={<ReceiptIcon />} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Balance" 
            value={formatCurrency(statistics.totalBalance)} 
            icon={<MoneyIcon />} 
            color="success"
          />
        </Grid>
      </Grid>
      
      {/* Action Items */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Requires Attention</Typography>
        </Box>
        
        {flaggedItems.length > 0 ? (
          <List>
            {flaggedItems.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem 
                  sx={{ 
                    bgcolor: 
                      item.severity === 'high' ? 'error.lighter' : 
                      item.severity === 'medium' ? 'warning.lighter' : 
                      'info.lighter',
                    borderRadius: 1,
                    mb: 1 
                  }}
                >
                  <Box width="100%">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <WarningIcon 
                          color={
                            item.severity === 'high' ? 'error' : 
                            item.severity === 'medium' ? 'warning' : 
                            'info'
                          } 
                          sx={{ mr: 1 }} 
                        />
                        <Typography variant="subtitle1" fontWeight="medium">
                          {item.title}
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<CheckIcon />}
                        onClick={() => handleActionItem(item.id)}
                      >
                        Resolve
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {item.description}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatDate(item.timestamp)}
                    </Typography>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box py={2} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              No items require attention at this time.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Recent Data */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Recent Transactions
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={handleViewAllTransactions}
              >
                View All
              </Button>
            </Box>
            
            <List>
              {recentTransactions.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem sx={{ px: 0, cursor: 'pointer' }} onClick={() => handleTransactionClick(transaction.id)}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {transaction.type} - {formatCurrency(transaction.amount, transaction.currency)}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            Status: <span style={{ color: transaction.status === 'completed' ? 'green' : 'orange' }}>
                              {transaction.status}
                            </span>
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(transaction.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recentTransactions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                New Users
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={handleViewAllUsers}
              >
                View All
              </Button>
            </Box>
            
            <List>
              {newUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem sx={{ px: 0, cursor: 'pointer' }} onClick={() => handleUserClick(user.id)}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {user.firstName} {user.lastName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Joined: {formatDate(user.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < newUsers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;