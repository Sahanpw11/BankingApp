import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Grid, Box, TextField, Button,
  MenuItem, FormControl, InputLabel, Select, Divider,
  InputAdornment, Chip, Card, CardContent, Avatar,
  Stepper, Step, StepLabel, CircularProgress, Alert, Snackbar,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  List, ListItem, ListItemText, ListItemAvatar, IconButton, Tooltip,
  Switch, FormControlLabel
} from '@mui/material';
// Removed date picker imports
import {
  Payment as PaymentIcon,
  AddCircleOutline as AddIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  AccountBalance as AccountIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Event as EventIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import AccountService from '../../api/account';
import * as transactionAPI from '../../api/transaction';
import BillerService from '../../api/biller';
import { formatCurrency } from '../../utils/formatters';

// Utility function to generate a reference number
const generateReferenceNumber = () => {
  return `PAY-${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
};

// Utility to ensure we always have an array of billers
const normalizeBillerData = (data) => {
  console.log("Normalizing biller data:", data);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.billers && Array.isArray(data.billers)) return data.billers;
  if (data.id) return [data]; // Single object with id property
  return [];
};

const PayBills = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultSourceAccount = location.state?.defaultSourceAccount || '';
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Biller', 'Enter Details', 'Review & Pay'];
  
  // Form state
  const [formData, setFormData] = useState({
    sourceAccountId: defaultSourceAccount,
    billerId: '',
    billerAccountNumber: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
    description: '',
    saveAsBiller: false,
    isRecurring: false,
    frequency: 'monthly',
    endDate: null,
    referenceNumber: generateReferenceNumber()
  });
  
  // UI state
  const [accounts, setAccounts] = useState([]);
  const [billers, setBillers] = useState([]);
  const [savedBillers, setSavedBillers] = useState([]);
  const [newBillerName, setNewBillerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [showAddBillerDialog, setShowAddBillerDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch user accounts
        const accountsData = await AccountService.getUserAccounts();
        console.log("Accounts data:", accountsData);
        
        const accountsArray = accountsData?.accounts || [];
        setAccounts(accountsArray);
        
        // If there's no default account set and we have accounts, set the first active account
        if (!defaultSourceAccount && accountsArray.length > 0) {
          const activeAccount = accountsArray.find(acc => acc.is_active) || accountsArray[0];
          setFormData(prev => ({ ...prev, sourceAccountId: activeAccount.id }));
        }
        
        // Fetch billers with additional debugging
        console.log("Fetching billers from API");
        const billersData = await BillerService.getBillers();
        console.log("Billers API response:", billersData);
        
        // Normalize billers data
        const billersArray = normalizeBillerData(billersData);
        console.log("Normalized billers array:", billersArray);
        setBillers(billersArray);
        
        // Fetch saved billers with additional debugging
        console.log("Fetching saved billers from API");
        const savedBillersData = await BillerService.getSavedBillers();
        console.log("Saved billers API response:", savedBillersData);
        
        // Normalize saved billers data
        const savedBillersArray = normalizeBillerData(savedBillersData);
        console.log("Normalized saved billers array:", savedBillersArray);
        setSavedBillers(savedBillersArray);
        
        // Set initial biller ID if we have saved billers
        if (savedBillersArray.length > 0 && !formData.billerId) {
          const firstBiller = savedBillersArray[0];
          setFormData(prev => ({
            ...prev,
            billerId: firstBiller.biller_id
          }));
        }
        
        console.log("Finished loading initial data");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setNotification({
          open: true,
          message: error.message || "Failed to load data",
          severity: "error"
        });
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [defaultSourceAccount]);
  
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field if any
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  // Updated to work with standard date inputs
  const handleDateChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    
    // Clear error for this field if any
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  const handleSwitchChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.checked
    });
  };
  
  const handleAddBiller = () => {
    setShowAddBillerDialog(true);
  };
  
  const handleSaveBiller = async () => {
    try {
      if (!newBillerName.trim()) {
        return;
      }
      
      const newBiller = {
        name: newBillerName,
        category: 'Other',
        required_fields: ['account_number']
      };
      
      // Call API to add new biller
      const response = await BillerService.addBiller(newBiller);
      
      // Add new biller to the list
      setBillers([...billers, response.biller]);
      
      // Select the new biller
      setFormData({
        ...formData,
        billerId: response.biller.id
      });
      
      setNewBillerName('');
      setShowAddBillerDialog(false);
      
      setNotification({
        open: true,
        message: "Biller added successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error adding biller:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to add biller",
        severity: "error"
      });
    }
  };
  
  const handleSavedBillerSelect = (biller) => {
    setFormData({
      ...formData,
      billerId: biller.biller_id,
      billerAccountNumber: biller.account_number,
      description: biller.nickname || biller.description || ''
    });
    
    setActiveStep(1); // Move to next step after selecting saved biller
  };
  
  const handleToggleFavorite = async (billerId, isFavorite) => {
    try {
      await BillerService.toggleFavoriteBiller(billerId, !isFavorite);
      
      // Update saved billers list
      setSavedBillers(savedBillers.map(biller => 
        biller.id === billerId 
          ? { ...biller, is_favorite: !isFavorite } 
          : biller
      ));
      
      setNotification({
        open: true,
        message: !isFavorite 
          ? "Biller added to favorites" 
          : "Biller removed from favorites",
        severity: "success"
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to update favorite status",
        severity: "error"
      });
    }
  };
  
  const validateStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      // Validate biller selection
      if (!formData.billerId) {
        newErrors.billerId = 'Please select a biller';
      }
    } else if (activeStep === 1) {
      // Validate payment details
      if (!formData.sourceAccountId) {
        newErrors.sourceAccountId = 'Please select an account';
      }
      
      if (!formData.billerAccountNumber) {
        newErrors.billerAccountNumber = 'Please enter the biller account number';
      }
      
      if (!formData.amount) {
        newErrors.amount = 'Please enter an amount';
      } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
      
      if (!formData.paymentDate) {
        newErrors.paymentDate = 'Please select a payment date';
      }
      
      if (formData.isRecurring && !formData.frequency) {
        newErrors.frequency = 'Please select a frequency';
      }
      
      // Check if payment date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDate = new Date(formData.paymentDate);
      paymentDate.setHours(0, 0, 0, 0);
      
      if (paymentDate < today) {
        newErrors.paymentDate = 'Payment date cannot be in the past';
      }
      
      // Check if the account has sufficient funds
      const selectedAccount = accounts.find(acc => acc.id === formData.sourceAccountId);
      if (selectedAccount && parseFloat(formData.amount) > parseFloat(selectedAccount.balance)) {
        newErrors.amount = 'Insufficient funds in the selected account';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };
  
  const confirmPayment = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);
    
    try {
      // Prepare payment data
      const paymentData = {
        source_account_id: formData.sourceAccountId,
        biller_id: formData.billerId,
        biller_account_number: formData.billerAccountNumber,
        amount: parseFloat(formData.amount),
        description: formData.description || "Bill Payment",
        payment_date: new Date(formData.paymentDate).toISOString(),
        reference_number: formData.referenceNumber,
        is_recurring: formData.isRecurring,
        frequency: formData.isRecurring ? formData.frequency : null,
        end_date: formData.isRecurring && formData.endDate ? new Date(formData.endDate).toISOString() : null
      };
      
      // Create payment
      const result = await transactionAPI.createPayment(paymentData);
      
      // Save biller if requested
      if (formData.saveAsBiller) {
        const selectedBiller = billers.find(b => b.id === formData.billerId);
        
        const savedBillerData = {
          biller_id: formData.billerId,
          account_number: formData.billerAccountNumber,
          nickname: formData.description || selectedBiller?.name || 'Saved Biller',
          is_favorite: false
        };
        
        await BillerService.saveBiller(savedBillerData);
      }
      
      // Show success notification
      setNotification({
        open: true,
        message: "Payment scheduled successfully",
        severity: "success"
      });
      
      // Navigate to confirmation page or back to accounts
      navigate(`/payment-confirmation/${result.transaction.id}`);
    } catch (error) {
      console.error("Payment error:", error);
      setSubmitting(false);
      setNotification({
        open: true,
        message: error.message || "Failed to process payment",
        severity: "error"
      });
    }
  };
  
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };
  
  const getSelectedBiller = () => {
    return billers.find(b => b.id === formData.billerId);
  };
  
  const getSelectedAccount = () => {
    return accounts.find(acc => acc.id === formData.sourceAccountId);
  };
  
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderBillerSelection();
      case 1:
        return renderPaymentDetails();
      case 2:
        return renderReviewPayment();
      default:
        return null;
    }
  };
  
  const renderBillerSelection = () => {
    return (
      <Box>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Biller
          </Typography>
          
          <FormControl fullWidth margin="normal" error={!!errors.billerId}>
            <InputLabel id="biller-select-label">Biller</InputLabel>
            <Select
              labelId="biller-select-label"
              id="biller-select"
              value={formData.billerId}
              onChange={handleInputChange('billerId')}
              label="Biller"
            >
              {billers.map(biller => (
                <MenuItem key={biller.id} value={biller.id}>
                  {biller.name}
                </MenuItem>
              ))}
            </Select>
            {errors.billerId && (
              <Typography color="error" variant="caption">
                {errors.billerId}
              </Typography>
            )}
          </FormControl>
          
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleAddBiller}
            >
              Add New Biller
            </Button>
          </Box>
        </Paper>
        
        {savedBillers.length > 0 && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Saved Billers
            </Typography>
            
            <List sx={{ width: '100%' }}>
              {savedBillers.map(biller => {
                const billerDetails = billers.find(b => b.id === biller.biller_id);
                
                return (
                  <ListItem
                    key={biller.id}
                    alignItems="flex-start"
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    secondaryAction={
                      <Tooltip title={biller.is_favorite ? "Remove from favorites" : "Add to favorites"}>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleToggleFavorite(biller.id, biller.is_favorite)}
                        >
                          {biller.is_favorite ? 
                            <StarIcon color="warning" /> : 
                            <StarBorderIcon />
                          }
                        </IconButton>
                      </Tooltip>
                    }
                    button
                    onClick={() => handleSavedBillerSelect(biller)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ReceiptIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography variant="subtitle1" component="span">
                            {biller.nickname || billerDetails?.name || "Saved Biller"}
                          </Typography>
                          {biller.is_favorite && (
                            <StarIcon fontSize="small" color="warning" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            Acc: {biller.account_number}
                          </Typography>
                          {billerDetails && (
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              ({billerDetails.name})
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>
    );
  };
  
  const renderPaymentDetails = () => {
    const selectedBiller = getSelectedBiller();
    
    return (
      <Box>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Details
          </Typography>
          
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Paying To:
            </Typography>
            <Chip
              icon={<ReceiptIcon />}
              label={selectedBiller?.name || "Selected Biller"}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" error={!!errors.sourceAccountId}>
                <InputLabel id="source-account-select-label">From Account</InputLabel>
                <Select
                  labelId="source-account-select-label"
                  id="source-account-select"
                  value={formData.sourceAccountId}
                  onChange={handleInputChange('sourceAccountId')}
                  label="From Account"
                >
                  {accounts.map(account => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.account_type} - {formatCurrency(account.balance, account.currency)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.sourceAccountId && (
                  <Typography color="error" variant="caption">
                    {errors.sourceAccountId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Biller Account Number"
                fullWidth
                value={formData.billerAccountNumber}
                onChange={handleInputChange('billerAccountNumber')}
                error={!!errors.billerAccountNumber}
                helperText={errors.billerAccountNumber}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Amount"
                fullWidth
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              {/* Replaced DatePicker with standard TextField type="date" */}
              <TextField
                label="Payment Date"
                type="date"
                fullWidth
                margin="normal"
                value={formData.paymentDate}
                onChange={handleDateChange('paymentDate')}
                error={!!errors.paymentDate}
                helperText={errors.paymentDate}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0] // Today's date
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description (Optional)"
                fullWidth
                value={formData.description}
                onChange={handleInputChange('description')}
                margin="normal"
                placeholder="e.g., Monthly utility bill"
              />
            </Grid>
          </Grid>
          
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRecurring}
                  onChange={handleSwitchChange('isRecurring')}
                  color="primary"
                />
              }
              label="Set up recurring payment"
            />
          </Box>
          
          {formData.isRecurring && (
            <Box sx={{ pl: 3, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={!!errors.frequency}>
                    <InputLabel id="frequency-select-label">Frequency</InputLabel>
                    <Select
                      labelId="frequency-select-label"
                      id="frequency-select"
                      value={formData.frequency}
                      onChange={handleInputChange('frequency')}
                      label="Frequency"
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="biweekly">Bi-weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                      <MenuItem value="annually">Annually</MenuItem>
                    </Select>
                    {errors.frequency && (
                      <Typography color="error" variant="caption">
                        {errors.frequency}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {/* Replaced DatePicker with standard TextField type="date" */}
                  <TextField
                    label="End Date (Optional)"
                    type="date"
                    fullWidth
                    margin="normal"
                    value={formData.endDate || ''}
                    onChange={handleDateChange('endDate')}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0] // Today's date
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.saveAsBiller}
                  onChange={handleSwitchChange('saveAsBiller')}
                  color="primary"
                />
              }
              label="Save this biller for future payments"
            />
          </Box>
        </Paper>
      </Box>
    );
  };
  
  const renderReviewPayment = () => {
    const selectedBiller = getSelectedBiller();
    const selectedAccount = getSelectedAccount();
    
    return (
      <Box>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Review Payment
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Please review the payment details before confirming.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    From Account
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedAccount?.account_type} Account
                  </Typography>
                  <Typography variant="subtitle2">
                    {formatCurrency(selectedAccount?.balance, selectedAccount?.currency)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Account Number: {selectedAccount?.account_number}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    To Biller
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedBiller?.name}
                  </Typography>
                  <Typography variant="subtitle2">
                    Account: {formData.billerAccountNumber}
                  </Typography>
                  {formData.description && (
                    <Typography variant="caption" color="text.secondary">
                      Reference: {formData.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Payment Amount
              </Typography>
              <Typography variant="h4" color="primary.main">
                {formatCurrency(parseFloat(formData.amount) || 0, selectedAccount?.currency)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Date
                </Typography>
                <Typography variant="body1">
                  {new Date(formData.paymentDate).toLocaleDateString()}
                </Typography>
              </Box>
              
              {formData.isRecurring && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Recurring Payment
                  </Typography>
                  <Typography variant="body1">
                    {formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)}
                    {formData.endDate && ` until ${new Date(formData.endDate).toLocaleDateString()}`}
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Payment Reference
              </Typography>
              <Typography variant="body1">
                {formData.referenceNumber}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
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
      <Box display="flex" alignItems="center" mb={4}>
        <PaymentIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Pay Bills
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {renderStepContent()}
      
      <Box mt={4} display="flex" justifyContent="space-between">
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Confirm Payment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Add New Biller Dialog */}
      <Dialog open={showAddBillerDialog} onClose={() => setShowAddBillerDialog(false)}>
        <DialogTitle>Add New Biller</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the name of the biller you want to add.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Biller Name"
            fullWidth
            value={newBillerName}
            onChange={(e) => setNewBillerName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddBillerDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveBiller} 
            color="primary"
            disabled={!newBillerName.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to make this payment?
            {formData.isRecurring && " This will set up a recurring payment."}
          </DialogContentText>
          <Box mt={2}>
            <Typography variant="subtitle2">
              Amount: {formatCurrency(parseFloat(formData.amount) || 0)}
            </Typography>
            <Typography variant="subtitle2">
              Biller: {getSelectedBiller()?.name}
            </Typography>
            <Typography variant="subtitle2">
              Account: {getSelectedAccount()?.account_type} ({getSelectedAccount()?.account_number})
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmPayment} 
            color="primary"
            variant="contained"
          >
            Confirm
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

export default PayBills;