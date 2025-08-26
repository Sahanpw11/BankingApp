import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Grid, Box, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  InputAdornment, Divider, Alert, CircularProgress, Stepper,
  Step, StepLabel, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Autocomplete
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import AccountService from '../../api/account';
import * as transactionAPI from '../../api/transaction';
import { formatCurrency, formatAccountNumber } from '../../utils/formatters';

// Steps in the transfer process
const steps = ['Select Accounts', 'Enter Amount', 'Review & Confirm'];

const Transfer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultSourceAccount = location.state?.defaultSourceAccount;
  
  // State variables
  const [activeStep, setActiveStep] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [transferData, setTransferData] = useState({
    sourceAccountId: defaultSourceAccount || '',
    destinationType: 'internal', // 'internal', 'external', 'beneficiary'
    destinationAccountId: '',
    destinationAccountNumber: '',
    beneficiaryId: '',
    amount: '',
    description: '',
    currency: 'USD',
    reference: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [transferResult, setTransferResult] = useState(null);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch user accounts
        const accountsData = await AccountService.getUserAccounts();
        setAccounts(accountsData.accounts);
        
        // If we have a default source account from navigation, select it
        if (defaultSourceAccount) {
          setTransferData(prev => ({
            ...prev,
            sourceAccountId: defaultSourceAccount
          }));
        } else if (accountsData.accounts.length > 0) {
          // Otherwise select the first account by default
          setTransferData(prev => ({
            ...prev,
            sourceAccountId: accountsData.accounts[0].id
          }));
        }
        
        // Fetch beneficiaries (saved external accounts)
        // In a real app, this would come from an API
        setBeneficiaries([
          { id: '1', name: 'John Doe', accountNumber: '9876543210', bankName: 'Chase' },
          { id: '2', name: 'Jane Smith', accountNumber: '5678901234', bankName: 'Bank of America' }
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError('Failed to load accounts. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [defaultSourceAccount]);
  
  // Handle field changes
  const handleChange = (field) => (event) => {
    // Clear field-specific error when user changes the value
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: null });
    }
    
    setTransferData({
      ...transferData,
      [field]: event.target.value
    });
    
    // If changing destination type, reset the related fields
    if (field === 'destinationType') {
      setTransferData(prev => ({
        ...prev,
        destinationAccountId: '',
        destinationAccountNumber: '',
        beneficiaryId: '',
        [field]: event.target.value
      }));
    }
    
    // If source account changes, update the currency
    if (field === 'sourceAccountId') {
      const selectedAccount = accounts.find(acc => acc.id === event.target.value);
      if (selectedAccount) {
        setTransferData(prev => ({
          ...prev,
          currency: selectedAccount.currency,
          [field]: event.target.value
        }));
      }
    }
  };
  
  // Validate the current step
  const validateCurrentStep = () => {
    const errors = {};
    
    switch (activeStep) {
      case 0: // Select Accounts
        if (!transferData.sourceAccountId) {
          errors.sourceAccountId = 'Please select a source account';
        }
        
        if (transferData.destinationType === 'internal' && !transferData.destinationAccountId) {
          errors.destinationAccountId = 'Please select a destination account';
        } else if (transferData.destinationType === 'external' && !transferData.destinationAccountNumber) {
          errors.destinationAccountNumber = 'Please enter a destination account number';
        } else if (transferData.destinationType === 'beneficiary' && !transferData.beneficiaryId) {
          errors.beneficiaryId = 'Please select a beneficiary';
        }
        
        // Check if source and destination are the same for internal transfers
        if (transferData.destinationType === 'internal' && 
            transferData.sourceAccountId === transferData.destinationAccountId) {
          errors.destinationAccountId = 'Source and destination accounts cannot be the same';
        }
        break;
        
      case 1: // Amount
        if (!transferData.amount) {
          errors.amount = 'Please enter an amount';
        } else if (isNaN(parseFloat(transferData.amount)) || parseFloat(transferData.amount) <= 0) {
          errors.amount = 'Please enter a valid amount greater than 0';
        } else {
          // Check if amount exceeds available balance
          const sourceAccount = accounts.find(acc => acc.id === transferData.sourceAccountId);
          if (sourceAccount && parseFloat(transferData.amount) > sourceAccount.available_balance) {
            errors.amount = `Amount exceeds available balance of ${formatCurrency(sourceAccount.available_balance, sourceAccount.currency)}`;
          }
        }
        break;
        
      case 2: // Review - no validation needed
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
    // Handle transfer submission
  const handleSubmit = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      let transferRequest = {};
      
      if (transferData.destinationType === 'internal') {
        // Internal transfer
        transferRequest = {
          source_account_id: transferData.sourceAccountId,
          destination_account_id: transferData.destinationAccountId, // Ensure we use the correct field name
          amount: parseFloat(transferData.amount),
          currency: transferData.currency,
          description: transferData.description || 'Transfer',
          transaction_type: 'transfer'
        };
      } else if (transferData.destinationType === 'external') {
        // External transfer
        transferRequest = {
          source_account_id: transferData.sourceAccountId,
          destination_account_number: transferData.destinationAccountNumber,
          amount: parseFloat(transferData.amount),
          currency: transferData.currency,
          description: transferData.description || 'External Transfer',
          transaction_type: 'external_transfer',
          reference: transferData.reference
        };
      } else {
        // Beneficiary transfer
        const beneficiary = beneficiaries.find(b => b.id === transferData.beneficiaryId);
        transferRequest = {
          source_account_id: transferData.sourceAccountId,
          destination_account_number: beneficiary.accountNumber,
          beneficiary_id: transferData.beneficiaryId,
          amount: parseFloat(transferData.amount),
          currency: transferData.currency,
          description: transferData.description || `Transfer to ${beneficiary.name}`,
          transaction_type: 'external_transfer',
          reference: transferData.reference
        };
      }
      
      // Call API to create transfer
      const result = await transactionAPI.createTransfer(transferRequest);
      
      setTransferResult(result);
      setSuccessDialogOpen(true);
      setProcessing(false);
        } catch (err) {
      console.error("Transfer error:", err);
      // Provide a more detailed error message to help troubleshoot
      let errorMessage = 'Failed to process transfer. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Check for specific errors that might need clearer messages
      if (err.response?.data?.error && err.response.data.error.includes('destination_account_id')) {
        errorMessage = 'The destination account could not be found. Please check and try again.';
      }
      
      setError(errorMessage);
      setProcessing(false);
    }
  };
  
  // Handle success dialog close
  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate('/accounts');
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.sourceAccountId}>
                  <InputLabel id="source-account-label">From Account</InputLabel>
                  <Select
                    labelId="source-account-label"
                    value={transferData.sourceAccountId}
                    onChange={handleChange('sourceAccountId')}
                    label="From Account"
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        <Box>
                          <Typography variant="subtitle2">
                            {account.account_type} Account - {formatAccountNumber(account.account_number)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Balance: {formatCurrency(account.balance, account.currency)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.sourceAccountId && (
                    <FormHelperText>{formErrors.sourceAccountId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="destination-type-label">Destination Type</InputLabel>
                  <Select
                    labelId="destination-type-label"
                    value={transferData.destinationType}
                    onChange={handleChange('destinationType')}
                    label="Destination Type"
                  >
                    <MenuItem value="internal">My Accounts</MenuItem>
                    <MenuItem value="external">External Account</MenuItem>
                    <MenuItem value="beneficiary">Saved Beneficiary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {transferData.destinationType === 'internal' && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.destinationAccountId}>
                    <InputLabel id="destination-account-label">To Account</InputLabel>
                    <Select
                      labelId="destination-account-label"
                      value={transferData.destinationAccountId}
                      onChange={handleChange('destinationAccountId')}
                      label="To Account"
                    >
                      {accounts
                        .filter(account => account.id !== transferData.sourceAccountId)
                        .map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            <Box>
                              <Typography variant="subtitle2">
                                {account.account_type} Account - {formatAccountNumber(account.account_number)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Balance: {formatCurrency(account.balance, account.currency)}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                    {formErrors.destinationAccountId && (
                      <FormHelperText>{formErrors.destinationAccountId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
              
              {transferData.destinationType === 'external' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={transferData.destinationAccountNumber}
                    onChange={handleChange('destinationAccountNumber')}
                    error={!!formErrors.destinationAccountNumber}
                    helperText={formErrors.destinationAccountNumber}
                  />
                </Grid>
              )}
              
              {transferData.destinationType === 'beneficiary' && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.beneficiaryId}>
                    <InputLabel id="beneficiary-label">Beneficiary</InputLabel>
                    <Select
                      labelId="beneficiary-label"
                      value={transferData.beneficiaryId}
                      onChange={handleChange('beneficiaryId')}
                      label="Beneficiary"
                    >
                      {beneficiaries.map((beneficiary) => (
                        <MenuItem key={beneficiary.id} value={beneficiary.id}>
                          <Box>
                            <Typography variant="subtitle2">
                              {beneficiary.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {beneficiary.bankName} - {formatAccountNumber(beneficiary.accountNumber)}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.beneficiaryId && (
                      <FormHelperText>{formErrors.beneficiaryId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  value={transferData.amount}
                  onChange={handleChange('amount')}
                  error={!!formErrors.amount}
                  helperText={formErrors.amount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={transferData.description}
                  onChange={handleChange('description')}
                  placeholder="What's this transfer for?"
                />
              </Grid>
              
              {(transferData.destinationType === 'external' || transferData.destinationType === 'beneficiary') && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reference (Optional)"
                    value={transferData.reference}
                    onChange={handleChange('reference')}
                    placeholder="Reference for the recipient"
                  />
                </Grid>
              )}
              
              {transferData.sourceAccountId && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Available Balance: {formatCurrency(
                      accounts.find(acc => acc.id === transferData.sourceAccountId)?.available_balance || 0,
                      accounts.find(acc => acc.id === transferData.sourceAccountId)?.currency || 'USD'
                    )}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 2:
        const sourceAccount = accounts.find(acc => acc.id === transferData.sourceAccountId);
        let destinationInfo = "Unknown";
        
        if (transferData.destinationType === 'internal') {
          const destAccount = accounts.find(acc => acc.id === transferData.destinationAccountId);
          destinationInfo = destAccount ? `${destAccount.account_type} Account - ${formatAccountNumber(destAccount.account_number)}` : "Unknown";
        } else if (transferData.destinationType === 'external') {
          destinationInfo = `External Account - ${formatAccountNumber(transferData.destinationAccountNumber)}`;
        } else if (transferData.destinationType === 'beneficiary') {
          const beneficiary = beneficiaries.find(b => b.id === transferData.beneficiaryId);
          destinationInfo = beneficiary ? `${beneficiary.name} - ${formatAccountNumber(beneficiary.accountNumber)}` : "Unknown";
        }
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Transfer Details
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    From Account
                  </Typography>
                  <Typography variant="body1">
                    {sourceAccount ? `${sourceAccount.account_type} Account - ${formatAccountNumber(sourceAccount.account_number)}` : "Unknown"}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    To Account
                  </Typography>
                  <Typography variant="body1">
                    {destinationInfo}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(transferData.amount, transferData.currency)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {transferData.description || 'N/A'}
                  </Typography>
                </Grid>
                
                {(transferData.destinationType === 'external' || transferData.destinationType === 'beneficiary') && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reference
                    </Typography>
                    <Typography variant="body1">
                      {transferData.reference || 'N/A'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              Please review the transfer details carefully. Once submitted, this transaction cannot be reversed.
            </Alert>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SendIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Transfer Money
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || processing}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <div>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {processing ? 'Processing...' : 'Confirm Transfer'}
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
          </div>
        </Box>
      </Paper>
      
      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          <Box display="flex" alignItems="center">
            <CheckIcon color="success" sx={{ mr: 1 }} />
            Transfer Successful
          </Box>
        </DialogTitle>        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Your transfer of {transferResult && transferResult.transaction && formatCurrency(transferResult.transaction.amount, transferResult.transaction.currency)} has been processed successfully. The transaction reference number is {transferResult && transferResult.transaction && transferResult.transaction.id}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessDialogClose} color="primary" autoFocus>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Transfer;