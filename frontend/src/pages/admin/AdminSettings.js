import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Grid, TextField, 
  Button, FormControlLabel, Switch, Alert,
  CircularProgress, IconButton, Breadcrumbs, Link,
  Divider, FormGroup, Stack, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails,
  InputAdornment, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  MailOutline as MailIcon,
  AccountBalance as AccountBalanceIcon,
  NetworkCheck as NetworkCheckIcon
} from '@mui/icons-material';
import adminService from '../../api/admin';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    // System settings
    bankName: 'Banking App',
    supportEmail: 'support@bankingapp.com',
    supportPhone: '1-800-123-4567',
    maintenanceMode: false,
    debugMode: false,
    
    // Security settings
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    passwordExpiryDays: 90,
    twoFactorRequired: false,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    
    // Transaction settings
    dailyTransferLimit: 10000,
    singleTransactionLimit: 5000,
    internationalTransfersEnabled: false,
    transactionApprovalThreshold: 2000,
    
    // Notification settings
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    loginAlertEnabled: true,
    largeTransactionAlertThreshold: 1000,
    
    // API configuration
    apiRateLimitPerMinute: 100,
    externalApiEnabled: true
  });
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // In a real application, you would fetch settings from your backend
        // For now, we'll simulate a loading delay and use the default settings
        setTimeout(() => {
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load system settings. Please try again.');
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      [name]: checked
    });
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: Number(value)
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // In a real application, you would send the settings to your backend
      // For now, we'll simulate a successful save with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('System settings updated successfully');
      setSaving(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings. Please try again.');
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
          <Typography color="text.primary">System Settings</Typography>
        </Breadcrumbs>
      </Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <SettingsIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            System Settings
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
      
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* General Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="general-settings-content"
              id="general-settings-header"
            >
              <SettingsIcon sx={{ mr: 2 }} />
              <Typography variant="h6">General Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Bank Name"
                    name="bankName"
                    value={settings.bankName}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Support Email"
                    name="supportEmail"
                    value={settings.supportEmail}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Support Phone"
                    name="supportPhone"
                    value={settings.supportPhone}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.maintenanceMode} 
                            onChange={handleSwitchChange}
                            name="maintenanceMode"
                            color="warning"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Maintenance Mode</Typography>
                            <Typography variant="body2" color="textSecondary">
                              When enabled, users will see a maintenance notice
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.debugMode} 
                            onChange={handleSwitchChange}
                            name="debugMode"
                            color="info"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Debug Mode</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Enable detailed logging and error messages
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Security Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="security-settings-content"
              id="security-settings-header"
            >
              <SecurityIcon sx={{ mr: 2 }} />
              <Typography variant="h6">Security Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Session Timeout (minutes)"
                    name="sessionTimeoutMinutes"
                    value={settings.sessionTimeoutMinutes}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    inputProps={{ min: 5, max: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Max Login Attempts"
                    name="maxLoginAttempts"
                    value={settings.maxLoginAttempts}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    inputProps={{ min: 3, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password Expiry (days)"
                    name="passwordExpiryDays"
                    value={settings.passwordExpiryDays}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    inputProps={{ min: 30, max: 365 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password Minimum Length"
                    name="passwordMinLength"
                    value={settings.passwordMinLength}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    inputProps={{ min: 8, max: 16 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.twoFactorRequired} 
                            onChange={handleSwitchChange}
                            name="twoFactorRequired"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Require Two-Factor Authentication</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Force all users to set up 2FA
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.passwordRequireSpecialChars} 
                            onChange={handleSwitchChange}
                            name="passwordRequireSpecialChars"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Require Special Characters</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Passwords must include special characters
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Transaction Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="transaction-settings-content"
              id="transaction-settings-header"
            >
              <AccountBalanceIcon sx={{ mr: 2 }} />
              <Typography variant="h6">Transaction Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Daily Transfer Limit"
                    name="dailyTransferLimit"
                    value={settings.dailyTransferLimit}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Single Transaction Limit"
                    name="singleTransactionLimit"
                    value={settings.singleTransactionLimit}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Transaction Approval Threshold"
                    name="transactionApprovalThreshold"
                    value={settings.transactionApprovalThreshold}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Transactions above this amount require approval"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.internationalTransfersEnabled} 
                            onChange={handleSwitchChange}
                            name="internationalTransfersEnabled"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">International Transfers</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Allow users to make international transfers
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Notification Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="notification-settings-content"
              id="notification-settings-header"
            >
              <NotificationsIcon sx={{ mr: 2 }} />
              <Typography variant="h6">Notification Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.emailNotificationsEnabled} 
                            onChange={handleSwitchChange}
                            name="emailNotificationsEnabled"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Email Notifications</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Send notifications via email
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.pushNotificationsEnabled} 
                            onChange={handleSwitchChange}
                            name="pushNotificationsEnabled"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Push Notifications</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Send push notifications to mobile devices
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.loginAlertEnabled} 
                            onChange={handleSwitchChange}
                            name="loginAlertEnabled"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">Login Alerts</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Alert users when their account is accessed
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Large Transaction Alert Threshold"
                    name="largeTransactionAlertThreshold"
                    value={settings.largeTransactionAlertThreshold}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Notify users about transactions larger than this amount"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* API Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="api-settings-content"
              id="api-settings-header"
            >
              <NetworkCheckIcon sx={{ mr: 2 }} />
              <Typography variant="h6">API Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="API Rate Limit (requests per minute)"
                    name="apiRateLimitPerMinute"
                    value={settings.apiRateLimitPerMinute}
                    onChange={handleNumberChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Switch 
                            checked={settings.externalApiEnabled} 
                            onChange={handleSwitchChange}
                            name="externalApiEnabled"
                            color="primary"
                          />
                        } 
                        label={
                          <Box>
                            <Typography variant="subtitle1">External API Access</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Allow external applications to use the API
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Divider />
          
          <Box display="flex" justifyContent="flex-end">
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
              disabled={saving}
              size="large"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Container>
  );
};

export default AdminSettings;