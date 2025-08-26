import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Switch, FormControlLabel,
  Button, Tabs, Tab, Divider, TextField, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Snackbar, CircularProgress, IconButton, InputAdornment,
  Paper, useTheme, alpha, styled
} from '@mui/material';
import {
  SecurityOutlined as SecurityIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Tune as TuneIcon,
  Notifications as NotificationsBellIcon,
  DevicesOutlined as DevicesIcon
} from '@mui/icons-material';
// These services would be used in a real application with backend integration
// import authService from '../../api/auth';
// import securityService from '../../services/securityService';

// Custom styled components for a more modern look
const SettingsCard = styled(Paper)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'visible',
  position: 'relative',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  padding: theme.spacing(3),
  '&:hover': {
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-4px)'
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minWidth: 0,
  fontWeight: 500,
  marginRight: theme.spacing(4),
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 700,
  },
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  [theme.breakpoints.up('sm')]: {
    minWidth: 0,
  },
}));

const InputField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    }
  }
}));

const SettingsButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '10px 24px',
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  fontWeight: 600,
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
  },
}));

const SettingsHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: theme.palette.common.white,
  padding: theme.spacing(4, 3),
  borderRadius: '16px',
  marginBottom: theme.spacing(4),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
}));

// TabPanel component to handle tab content display
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const theme = useTheme();
  
  // User settings state
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    autoLocktime: 15, // minutes
    securityLevel: 'high',
    lastPasswordChange: null,
    language: 'english',
    darkMode: false,
    currency: 'USD',
    timeFormat: '12h'
  });
  
  // UI state
  const [tabValue, setTabValue] = useState(0);
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
        setLoading(true);
        // In a real app, fetch settings from API using securityService.getSecuritySettings()
        // For now, simulate a delay and use default settings
        setTimeout(() => {
          setSettings({
            twoFactorEnabled: false,
            emailNotifications: true,
            smsNotifications: false,
            autoLocktime: 15,
            securityLevel: 'high',
            lastPasswordChange: '2023-03-15T14:30:00Z',
            language: 'english',
            darkMode: false,
            currency: 'USD',
            timeFormat: '12h'
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
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
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
  };
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // In a real app, save settings using securityService.updateSecuritySettings(settings)
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
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
      setSaving(false);
    }
  };
  
  const handleChangePassword = async () => {
    // Validate form
    const errors = {
      currentPassword: !passwordForm.currentPassword ? 'Current password is required' : '',
      newPassword: !passwordForm.newPassword ? 'New password is required' : 
        passwordForm.newPassword.length < 8 ? 'Password must be at least 8 characters' : '',
      confirmPassword: passwordForm.newPassword !== passwordForm.confirmPassword ? 
        'Passwords do not match' : ''
    };
    
    setPasswordErrors(errors);
    
    if (Object.values(errors).some(e => e)) {
      return;
    }
    
    try {
      setSaving(true);
      // In a real app, change password using authService
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setNotification({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
      setSaving(false);
    } catch (error) {
      console.error('Failed to change password:', error);
      setNotification({
        open: true,
        message: 'Failed to change password',
        severity: 'error'
      });
      setSaving(false);
    }
  };
  
  const handleVerifyTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }
    
    try {
      setSaving(true);
      // In a real app, verify 2FA code using securityService
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
      setSaving(false);
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      setNotification({
        open: true,
        message: 'Failed to enable two-factor authentication',
        severity: 'error'
      });
      setSaving(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  const formatDateString = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your settings...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Settings Header */}
      <SettingsHeader>
        <Box display="flex" alignItems="center" mb={1}>
          <SettingsIcon sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="700">
            Account Settings
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
          Manage your account preferences and security options
        </Typography>
      </SettingsHeader>
      
      <SettingsCard>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            textColor="primary"
            indicatorColor="primary"
            sx={{ mb: 1 }}
          >
            <StyledTab icon={<SecurityIcon />} iconPosition="start" label="Security & Privacy" />
            <StyledTab icon={<NotificationsBellIcon />} iconPosition="start" label="Notifications" />
            <StyledTab icon={<TuneIcon />} iconPosition="start" label="Preferences" />
            <StyledTab icon={<DevicesIcon />} iconPosition="start" label="Devices" />
          </Tabs>
        </Box>
        
        {/* Security & Privacy Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Security Options
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onChange={handleSettingChange('twoFactorEnabled')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Two-factor authentication</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add an extra layer of security to your account
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', mb: 2 }}
                />
                
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
                  label={
                    <Box>
                      <Typography fontWeight="medium">Enhanced security checks</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Enable additional security verification for sensitive operations
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Auto-lock timeout (minutes)
                  </Typography>
                  <TextField
                    type="number"
                    value={settings.autoLocktime}
                    onChange={handleSettingChange('autoLocktime')}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Your account will automatically lock after this period of inactivity
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Last password change:
                  </Typography>
                  <Typography fontWeight="medium">
                    {formatDateString(settings.lastPasswordChange)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, mb: 4 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <InputField
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange('currentPassword')}
                    error={Boolean(passwordErrors.currentPassword)}
                    helperText={passwordErrors.currentPassword}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <InputField
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    error={Boolean(passwordErrors.newPassword)}
                    helperText={passwordErrors.newPassword}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    error={Boolean(passwordErrors.confirmPassword)}
                    helperText={passwordErrors.confirmPassword}
                    fullWidth
                    required
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <SettingsButton
                  variant="contained"
                  color="primary"
                  onClick={handleChangePassword}
                  disabled={saving}
                  startIcon={<LockIcon />}
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </SettingsButton>
              </Box>
            </Box>
          </Box>
        </TabPanel>
        
        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Notification Preferences
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange('emailNotifications')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Email notifications</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receive important account updates via email
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={handleSettingChange('smsNotifications')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">SMS notifications</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receive alerts and codes via text message
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Transaction notifications are always enabled for security reasons.
                </Alert>
                
                <Typography variant="body2" color="text.secondary">
                  We're working on enhanced notification settings to give you more control over your alerts.
                  Stay tuned for updates!
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Display & Regional Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InputField
                  select
                  label="Language"
                  value={settings.language}
                  onChange={handleSettingChange('language')}
                  fullWidth
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                  <option value="chinese">Chinese</option>
                </InputField>
                
                <InputField
                  select
                  label="Currency"
                  value={settings.currency}
                  onChange={handleSettingChange('currency')}
                  fullWidth
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </InputField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <InputField
                  select
                  label="Time Format"
                  value={settings.timeFormat}
                  onChange={handleSettingChange('timeFormat')}
                  fullWidth
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </InputField>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSettingChange('darkMode')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Dark Mode</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use dark theme for the application
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', mt: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Devices Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Connected Devices
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              This section shows devices that have accessed your account. For security, you can review and manage this list.
            </Alert>
            
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.light, 0.05), borderRadius: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">Current Device</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chrome on Windows • Last accessed: Today, {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ 
                  bgcolor: 'success.light', 
                  color: 'success.dark',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 10,
                  fontWeight: 'medium'
                }}>
                  Active Now
                </Typography>
              </Box>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.5)}`, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">iPhone 13</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Safari on iOS • Last accessed: Yesterday, 14:32
                  </Typography>
                </Box>
                <Button color="error" size="small">
                  Remove
                </Button>
              </Box>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">MacBook Pro</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chrome on macOS • Last accessed: 3 days ago
                  </Typography>
                </Box>
                <Button color="error" size="small">
                  Remove
                </Button>
              </Box>
            </Paper>
          </Box>
        </TabPanel>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <SettingsButton
            variant="outlined"
            color="inherit"
            sx={{ mr: 2 }}
          >
            Cancel
          </SettingsButton>
          <SettingsButton
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
            disabled={saving}
            startIcon={<SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </SettingsButton>
        </Box>
      </SettingsCard>
      
      {/* Two-factor authentication dialog */}
      <Dialog open={twoFactorDialog} onClose={() => setTwoFactorDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the 6-digit verification code sent to your email to enable two-factor authentication.
          </DialogContentText>
          <TextField
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            fullWidth
            variant="outlined"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFactorDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleVerifyTwoFactor}
            variant="contained" 
            color="primary"
            disabled={!verificationCode || verificationCode.length !== 6 || saving}
          >
            {saving ? 'Verifying...' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;