import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Avatar, Grid, 
  TextField, Button, Alert, Snackbar,
  CircularProgress, Card, IconButton, Tabs, Tab, Dialog, 
  DialogActions, DialogContent, DialogTitle, InputAdornment,
  Fade, useTheme, alpha, styled
} from '@mui/material';
import { 
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockOutlined as LockIcon,
  Save as SaveIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../../api/auth';

// Custom styled components for a more modern look
const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'visible',
  position: 'relative',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-4px)'
  }
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  margin: '0 auto',
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: '60px',
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600
  }
}));

const InputField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500
  }
}));

const SaveButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    background: theme.palette.primary.dark
  }
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ pt: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const Profile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    occupation: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if token exists
        if (!localStorage.getItem('token')) {
          console.log("No token found, redirecting to login");
          setNotification({
            open: true,
            message: 'Your session has expired. Please log in again.',
            severity: 'error'
          });
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        
        try {
          const userData = await authService.getProfile();
          setProfile({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone_number || '',
            address: userData.address || '',
            dateOfBirth: userData.date_of_birth || '',
            occupation: userData.occupation || '',
            securityQuestion: userData.security_question || '',
            securityAnswer: userData.security_answer || ''
          });
        } catch (apiError) {
          console.error('API error fetching profile:', apiError);
          throw apiError;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        
        if (error.message && (error.message.includes('401') || error.message.includes('unauthorized') || 
            error.message.includes('expired') || error.message.includes('Authentication'))) {
          setNotification({
            open: true,
            message: 'Your session has expired. Please log in again.',
            severity: 'error'
          });
          
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setNotification({
            open: true,
            message: 'Failed to load profile data',
            severity: 'error'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);
  
  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
    
    // Clear field-specific error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!profile.firstName) newErrors.firstName = 'First name is required';
    if (!profile.lastName) newErrors.lastName = 'Last name is required';
    if (!profile.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setUpdating(true);
    
    try {
      const response = await authService.updateProfile({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        address: profile.address,
        date_of_birth: profile.dateOfBirth,
        occupation: profile.occupation,
        security_question: profile.securityQuestion,
        security_answer: profile.securityAnswer
      });
      
      setNotification({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      
      // Update local data if the server returned updated user data
      if (response && response.user) {
        setProfile({
          firstName: response.user.first_name || '',
          lastName: response.user.last_name || '',
          email: response.user.email || '',
          phone: response.user.phone_number || '',
          address: response.user.address || '',
          dateOfBirth: response.user.date_of_birth || '',
          occupation: response.user.occupation || '',
          securityQuestion: response.user.security_question || '',
          securityAnswer: response.user.security_answer || ''
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleToggleShowPassword = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    
    if (passwordErrors[e.target.name]) {
      setPasswordErrors({
        ...passwordErrors,
        [e.target.name]: ''
      });
    }
  };
  
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'Please confirm your new password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Password strength check
    if (passwordData.newPassword && passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setUpdating(true);
    
    try {
      await authService.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      setNotification({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
      
      // Close dialog and reset form
      setChangePasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to change password',
        severity: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }
  
  // Get initials for avatar
  const getInitials = () => {
    return `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box mb={4}>
        <Fade in={true} timeout={800}>
          <Typography 
            variant="h3" 
            component="h1" 
            fontWeight="600" 
            color="primary.main"
            sx={{ mb: 1 }}
          >
            My Profile
          </Typography>
        </Fade>
        <Fade in={true} timeout={1000}>
          <Typography variant="body1" color="text.secondary">
            Manage your personal information and account settings
          </Typography>
        </Fade>
      </Box>

      {/* Profile header with avatar */}
      <Fade in={true} timeout={1200}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 4
          }}
        >
          <ProfileAvatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              fontSize: '2.5rem',
              fontWeight: 600
            }}
          >
            {getInitials()}
          </ProfileAvatar>
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
            {profile.firstName} {profile.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.email}
          </Typography>
          <Box 
            sx={{
              mt: 1, 
              backgroundColor: 'success.light', 
              color: 'success.dark',
              px: 2, 
              py: 0.5, 
              borderRadius: 10,
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            Active
          </Box>
        </Box>
      </Fade>

      {/* Tabs navigation */}
      <Fade in={true} timeout={1400}>
        <ProfileCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{ 
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <StyledTab 
                icon={<PersonIcon />} 
                iconPosition="start" 
                label="Personal Information" 
                id="profile-tab-0" 
              />
              <StyledTab 
                icon={<SecurityIcon />} 
                iconPosition="start" 
                label="Security Settings" 
                id="profile-tab-1" 
              />
              <StyledTab 
                icon={<NotificationsIcon />} 
                iconPosition="start" 
                label="Notifications" 
                id="profile-tab-2" 
              />
            </Tabs>
          </Box>

          {/* Personal Information Tab */}
          <Box sx={{ p: 4 }}>
            <TabPanel value={activeTab} index={0}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      fullWidth
                      label="Email Address"
                      name="email"
                      value={profile.email}
                      disabled
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      error={!!errors.phone}
                      helperText={errors.phone || ""}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      fullWidth
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InputField
                      fullWidth
                      label="Occupation"
                      name="occupation"
                      value={profile.occupation}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InputField
                      fullWidth
                      label="Address"
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <HomeIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
                    <SaveButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={updating}
                      startIcon={<SaveIcon />}
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </SaveButton>
                  </Grid>
                </Grid>
              </form>
            </TabPanel>

            {/* Security Settings Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Password Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We recommend changing your password regularly to maintain account security
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<LockIcon />}
                  onClick={() => setChangePasswordDialog(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1 }}
                >
                  Change Password
                </Button>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Security Question
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your security question helps us verify your identity if you forget your password
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <InputField
                      fullWidth
                      label="Security Question"
                      name="securityQuestion"
                      value={profile.securityQuestion}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QuestionIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InputField
                      fullWidth
                      label="Security Answer"
                      name="securityAnswer"
                      value={profile.securityAnswer}
                      onChange={handleChange}
                      type="password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
                    <SaveButton
                      type="button"
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleSubmit}
                      disabled={updating}
                      startIcon={<SaveIcon />}
                    >
                      {updating ? 'Saving...' : 'Save Security Settings'}
                    </SaveButton>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={activeTab} index={2}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Notification Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                This feature will be available soon. You will be able to customize your notification preferences.
              </Typography>
              
              <Box 
                sx={{
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  borderRadius: 2,
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <NotificationsIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="info.main">
                    Coming Soon
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We're working on enhanced notification settings to give you more control over your alerts.
                  </Typography>
                </Box>
              </Box>
            </TabPanel>
          </Box>
        </ProfileCard>
      </Fade>
      
      {/* Password Change Dialog */}
      <Dialog 
        open={changePasswordDialog} 
        onClose={() => !updating && setChangePasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          <LockIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Change Your Password
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <form id="password-form" onSubmit={handleSubmitPasswordChange}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <InputField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword}
                    disabled={updating}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleToggleShowPassword('current')}
                            edge="end"
                          >
                            {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                    disabled={updating}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleToggleShowPassword('new')}
                            edge="end"
                          >
                            {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    disabled={updating}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleToggleShowPassword('confirm')}
                            edge="end"
                          >
                            {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </form>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setChangePasswordDialog(false)} 
            disabled={updating}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="password-form"
            variant="contained" 
            color="primary"
            disabled={updating}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 3
            }}
          >
            {updating ? 'Changing Password...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;