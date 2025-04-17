import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, 
  Card, CardContent, CardHeader, List, 
  ListItem, ListItemText, Divider, CircularProgress 
} from '@mui/material';
import { 
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import adminService from '../../api/admin';
import { formatCurrency, formatDate } from '../../utils/formatters';

const StatCard = ({ title, value, icon }) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        {icon}
        <Typography variant="h6" component="div" ml={1}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminService.getDashboardData();
        setDashboardData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
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
  
  const { statistics, recentTransactions, newUsers } = dashboardData;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Users" 
            value={statistics.userCount} 
            icon={<PeopleIcon fontSize="large" color="primary" />} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Accounts" 
            value={statistics.accountCount} 
            icon={<AccountBalanceIcon fontSize="large" color="primary" />} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Transactions" 
            value={statistics.transactionCount} 
            icon={<ReceiptIcon fontSize="large" color="primary" />} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Balance" 
            value={formatCurrency(statistics.totalBalance)} 
            icon={<MoneyIcon fontSize="large" color="primary" />} 
          />
        </Grid>
      </Grid>
      
      {/* Recent Data */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Transactions
            </Typography>
            <List>
              {recentTransactions.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem>
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
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              New Users
            </Typography>
            <List>
              {newUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem>
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