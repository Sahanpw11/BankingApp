import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, Card, CardContent,
  Button, List, ListItem, ListItemText, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, IconButton, Breadcrumbs, Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import adminService from '../../api/admin';
import { formatDate, formatCurrency } from '../../utils/formatters';

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await adminService.getUserDetails(userId);
        setUserData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load user details');
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [userId]);
  
  const handleBack = () => {
    navigate('/admin/users');
  };
  
  const handleEdit = () => {
    navigate(`/admin/users/${userId}/edit`);
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
      <Box mb={4}>
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          <Link 
            component="button" 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </Link>
          <Link 
            component="button" 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/admin/users')}
          >
            Users
          </Link>
          <Typography color="text.primary">User Details</Typography>
        </Breadcrumbs>
      </Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit User
        </Button>
      </Box>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography variant="h3">
                  {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                </Typography>
              </Box>
              <Typography variant="h5" gutterBottom>
                {userData.firstName} {userData.lastName}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <Chip 
                  label={userData.isActive ? 'Active' : 'Inactive'} 
                  color={userData.isActive ? 'success' : 'default'} 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={userData.isAdmin ? 'Admin' : 'User'} 
                  color={userData.isAdmin ? 'primary' : 'default'} 
                  size="small" 
                />
              </Box>
            </Box>
            
            <List>
              <ListItem>
                <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText primary="Username" secondary={userData.username} />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Email" 
                  secondary={
                    <Box display="flex" alignItems="center">
                      {userData.email}
                      {userData.emailVerified && (
                        <Chip 
                          label="Verified" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText primary="Phone" secondary={userData.phoneNumber || 'Not provided'} />
              </ListItem>
              <Divider component="li" />
              {userData.dateOfBirth && (
                <>
                  <ListItem>
                    <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText primary="Date of Birth" secondary={formatDate(userData.dateOfBirth)} />
                  </ListItem>
                  <Divider component="li" />
                </>
              )}
              {userData.address && (
                <>
                  <ListItem>
                    <HomeIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText primary="Address" secondary={userData.address} />
                  </ListItem>
                  <Divider component="li" />
                </>
              )}
              <ListItem>
                <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText primary="Member Since" secondary={formatDate(userData.createdAt)} />
              </ListItem>
              {userData.lastLogin && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText primary="Last Login" secondary={formatDate(userData.lastLogin)} />
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Two-Factor Authentication" 
                  secondary={userData.twoFactorEnabled ? 'Enabled' : 'Disabled'} 
                />
                <Chip 
                  label={userData.twoFactorEnabled ? 'ON' : 'OFF'} 
                  color={userData.twoFactorEnabled ? 'success' : 'default'} 
                  size="small" 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Accounts
            </Typography>
            
            {userData.accounts.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Account Number</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userData.accounts.map((account) => (
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
                        <TableCell align="right">
                          {formatCurrency(account.balance, account.currency)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={account.isActive ? 'Active' : 'Inactive'} 
                            color={account.isActive ? 'success' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{formatDate(account.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box py={2} textAlign="center">
                <Typography variant="body1" color="textSecondary">
                  This user has no accounts.
                </Typography>
              </Box>
            )}
          </Paper>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Activity Summary
                  </Typography>
                  {/* Add activity summary content here - could include recent logins,
                      password changes, settings updates, etc. */}
                  <Typography variant="body2" color="textSecondary">
                    Detailed user activity will be shown here.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>
                  {/* Add recent transactions summary here */}
                  <Typography variant="body2" color="textSecondary">
                    Recent transactions will be shown here.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDetails;