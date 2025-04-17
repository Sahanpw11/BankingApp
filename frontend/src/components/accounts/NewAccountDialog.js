import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select,
  MenuItem, FormHelperText, Typography, Box,
  InputAdornment, CircularProgress, Alert
} from '@mui/material';
import accountService from '../../api/account';

const accountTypes = [
  { value: 'Checking', label: 'Checking Account', description: 'Everyday transactions with unlimited withdrawals and deposits' },
  { value: 'Savings', label: 'Savings Account', description: 'Higher interest rate to help your money grow' }
];

const NewAccountDialog = ({ open, onClose, onAccountCreated }) => {
  const [formData, setFormData] = useState({
    accountType: '',
    initialDeposit: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.accountType) {
      errors.accountType = 'Please select an account type';
    }
    
    if (!formData.initialDeposit) {
      errors.initialDeposit = 'Please enter an initial deposit amount';
    } else if (isNaN(formData.initialDeposit) || parseFloat(formData.initialDeposit) <= 0) {
      errors.initialDeposit = 'Initial deposit must be greater than 0';
    } else if (formData.accountType === 'Savings' && parseFloat(formData.initialDeposit) < 100) {
      errors.initialDeposit = 'Savings accounts require a minimum deposit of $100';
    }
    
    return errors;
  };
  
  const handleSubmit = async () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await accountService.createAccount({
        accountType: formData.accountType,
        initialDeposit: parseFloat(formData.initialDeposit)
      });
      
      onAccountCreated(response.account);
      
      // Reset form
      setFormData({
        accountType: '',
        initialDeposit: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    // Reset form and errors when closing
    setFormData({
      accountType: '',
      initialDeposit: '',
    });
    setFormErrors({});
    setError(null);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Open a New Account</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <FormControl 
          fullWidth 
          margin="normal" 
          error={!!formErrors.accountType}
        >
          <InputLabel id="account-type-label">Account Type</InputLabel>
          <Select
            labelId="account-type-label"
            id="accountType"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            label="Account Type"
          >
            {accountTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          {formErrors.accountType && (
            <FormHelperText>{formErrors.accountType}</FormHelperText>
          )}
        </FormControl>
        
        {formData.accountType && (
          <Box my={2} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="body2" color="textSecondary">
              {accountTypes.find(type => type.value === formData.accountType)?.description}
            </Typography>
          </Box>
        )}
        
        <TextField
          margin="normal"
          fullWidth
          label="Initial Deposit"
          name="initialDeposit"
          type="number"
          value={formData.initialDeposit}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">$</InputAdornment>
            ),
          }}
          error={!!formErrors.initialDeposit}
          helperText={formErrors.initialDeposit}
        />
        
        {formData.accountType === 'Savings' && (
          <FormHelperText>
            Minimum initial deposit for Savings accounts: $100
          </FormHelperText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Create Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewAccountDialog;