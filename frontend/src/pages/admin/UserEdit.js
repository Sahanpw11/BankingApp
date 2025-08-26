import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, TextField,
  Button, FormControlLabel, Switch, Alert,
  CircularProgress, IconButton, Breadcrumbs, Link,
  Divider, FormGroup, Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import adminService from '../../api/admin';
import { formatDate } from '../../utils/formatters';

const UserEdit = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    isActive: false,
    isAdmin: false,
    emailVerified: false
  });
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await adminService.getUserDetails(userId);
        
        setUserData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          isActive: data.isActive || false,
          isAdmin: data.isAdmin || false,
          emailVerified: data.emailVerified || false
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [userId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setUserData({
      ...userData,
      [name]: checked
    });
  };
  
  const handleBack = () => {
    navigate(`/admin/users/${userId}`);
  };
  
  const handleCancel = () => {
    navigate(`/admin/users/${userId}`);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // Prepare data for update
      const updateData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: userData.phoneNumber,
        is_active: userData.isActive,
        is_admin: userData.isAdmin,
        email_verified: userData.emailVerified
      };
      
      await adminService.updateUser(userId, updateData);
      
      setSuccess('User updated successfully');
      setSaving(false);
      
      // Navigate back to user details after a short delay
      setTimeout(() => {
        navigate(`/admin/users/${userId}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please try again.');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
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
          <Link 
            component="button" 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate(`/admin/users/${userId}`)}
          >
            User Details
          </Link>
          <Typography color="text.primary">Edit User</Typography>
        </Breadcrumbs>
      </Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Edit User
          </Typography>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Basic Information
              </Typography>
              
              <Stack spacing={3}>
                <TextField
                  label="First Name"
                  name="firstName"
                  value={userData.firstName}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
                
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={userData.lastName}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
                
                <TextField
                  label="Email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Email cannot be changed"
                />
                
                <TextField
                  label="Phone Number"
                  name="phoneNumber"
                  value={userData.phoneNumber}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Account Status & Permissions
              </Typography>
              
              <FormGroup>
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={userData.isActive} 
                      onChange={handleSwitchChange}
                      name="isActive"
                      color="success"
                    />
                  } 
                  label={
                    <Box>
                      <Typography variant="subtitle1">Active Account</Typography>
                      <Typography variant="body2" color="textSecondary">
                        User can log in and perform transactions
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={userData.isAdmin} 
                      onChange={handleSwitchChange}
                      name="isAdmin"
                      color="primary"
                    />
                  } 
                  label={
                    <Box>
                      <Typography variant="subtitle1">Administrator</Typography>
                      <Typography variant="body2" color="textSecondary">
                        User has admin privileges
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />
                
                <FormControlLabel 
                  control={
                    <Switch 
                      checked={userData.emailVerified} 
                      onChange={handleSwitchChange}
                      name="emailVerified"
                      color="info"
                    />
                  } 
                  label={
                    <Box>
                      <Typography variant="subtitle1">Email Verified</Typography>
                      <Typography variant="body2" color="textSecondary">
                        User has verified their email address
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button 
                  variant="outlined" 
                  onClick={handleCancel}
                  startIcon={<CancelIcon />}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit"
                  variant="contained" 
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default UserEdit;