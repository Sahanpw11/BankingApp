import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Grid, Box, Switch, FormControlLabel,
  Button, Card, CardContent, CardHeader, Divider, TextField, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, LinearProgress, CircularProgress, IconButton
} from '@mui/material';
import {
  SecurityOutlined as SecurityIcon,
  NotificationsOutlined as NotificationsIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import authService from '../../api/auth';
import securityService from '../../services/securityService';

const Settings = () => {
  // User settings state
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    autoLocktime: 15, // minutes
    securityLevel: 'high',
    lastPasswordChange: null
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        // In a real app, fetch settings from API
        // For now, simulate a delay and use default settings
        setTimeout(() => {
          setSettings({
            twoFactorEnabled: false,
            emailNotifications: true,
            smsNotifications: false,
            autoLocktime: 15,
            securityLevel: 'high',
            lastPasswordChange: '2025-03-15T14:30:00Z'
          });
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setNotification({
          open: true,
          message: 'Failed to load settings',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchUserSettings();
  }, []);
  
  const handleSettingChange = (setting) => (event) => {
    if (setting === 'twoFactorEnabled') {
      // For 2FA, we need to show the verification dialog first
      if (event.target.checked) {
        setTwoFactorDialog(true);
        return;
      }
    }
    
    setSettings({
      ...settings,
      [setting]: event.target.checked !== undefined ? event.target.checked : event.target.value
    });
  };
  
  const handlePasswordChange = (field) => (event) => {
    setPasswordForm({
      ...passwordForm,
      [field]: event.target.value
    });
    
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors({
        ...passwordErrors,
        [field]: ''
      });
    }
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[0-9])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
    } else if (!/(?=.*[A-Z])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[!@#$%^&*])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one special character';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      // In a real app, save settings to API
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotification({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setNotification({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    // Validate form
    const errors = validatePasswordForm();
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setSaving(true);
    
    try {
      // Call API to update password
      // For demo, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setNotification({
        open: true,
        message: 'Password updated successfully',
        severity: 'success'
      });
      
      // Update last password change date
      setSettings({
        ...settings,
        lastPasswordChange: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordErrors({
        ...passwordErrors,
        currentPassword: 'Current password is incorrect'
      });
      
      setNotification({
        open: true,
        message: 'Failed to update password',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleTwoFactorVerify = async () => {
    try {
      // Call API to verify 2FA code
      // For demo, we'll simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update settings with 2FA enabled
      setSettings({
        ...settings,
        twoFactorEnabled: true
      });
      
      setTwoFactorDialog(false);
      setVerificationCode('');
      
      setNotification({
        open: true,
        message: 'Two-factor authentication enabled',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Failed to verify 2FA code:', error);
      setNotification({
        open: true,
        message: 'Invalid verification code',
        severity: 'error'
      });
    }
  };
  
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };
  
  const handleCloseTwoFactorDialog = () => {
    setTwoFactorDialog(false);
    setVerificationCode('');
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains number
    if (/\d/.test(password)) strength += 25;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Contains special char
    if (/[!@#$%^&*]/.test(password)) strength += 10;
    
    return Math.min(100, strength);
  };
  
  const passwordStrength = calculatePasswordStrength(passwordForm.newPassword);
  
  const getStrengthColor = (strength) => {
    if (strength < 30) return 'error';
    if (strength < 70) return 'warning';
    return 'success';
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={4}>
        {/* Security Settings Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <SecurityIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
              <Typography variant="h5" component="h2">
                Security Settings
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.twoFactorEnabled}
                  onChange={handleSettingChange('twoFactorEnabled')}
                  color="primary"
                />
              }
              label="Two-Factor Authentication"
            />
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Add an extra layer of security by requiring a verification code.
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.securityLevel === 'high'}
                  onChange={(e) => setSettings({
                    ...settings,
                    securityLevel: e.target.checked ? 'high' : 'medium'
                  })}
                  color="primary"
                />
              }
              label="Enhanced Security Features"
            />
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Enable additional security measures like login notifications and suspicious activity alerts.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Auto-Lock Timeout (minutes):
              </Typography>
              <TextField
                type="number"
                value={settings.autoLocktime}
                onChange={handleSettingChange('autoLocktime')}
                size="small"
                inputProps={{ min: 1, max: 60 }}
                sx={{ width: 100 }}
              />
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Security Settings'}
            </Button>
          </Paper>
        </Grid>
        
        {/* Password Change Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <LockIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
              <Typography variant="h5" component="h2">
                Change Password
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
              
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange('newPassword')}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
              
              {passwordForm.newPassword && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Password Strength:
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={passwordStrength} 
                    color={getStrengthColor(passwordStrength)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
              
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                margin="normal"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Last password change: {settings.lastPasswordChange ? 
                  new Date(settings.lastPasswordChange).toLocaleDateString() : 'Never'}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdatePassword}
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </Paper>
        </Grid>
        
        {/* Notification Settings Card */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <NotificationsIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
              <Typography variant="h5" component="h2">
                Notification Settings
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange('emailNotifications')}
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 3, mb: 2 }}>
                  Receive notifications about transactions and account activities via email.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={handleSettingChange('smsNotifications')}
                      color="primary"
                    />
                  }
                  label="SMS Notifications"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 3, mb: 2 }}>
                  Receive notifications about transactions and account activities via SMS.
                </Typography>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              disabled={saving}
              sx={{ mt: 2 }}
            >
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Two-Factor Authentication Dialog */}
      <Dialog open={twoFactorDialog} onClose={handleCloseTwoFactorDialog}>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <DialogContentText>
            We've sent a verification code to your email address. Please enter the code to enable two-factor authentication.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Verification Code"
            type="text"
            fullWidth
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTwoFactorDialog}>Cancel</Button>
          <Button 
            onClick={handleTwoFactorVerify} 
            color="primary"
            disabled={!verificationCode || verificationCode.length < 6}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;