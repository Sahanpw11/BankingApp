import React from 'react';
import { 
  Paper, Typography, Box, Divider,
  LinearProgress
} from '@mui/material';
import { 
  ArrowUpward as ArrowUpIcon, 
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

const FinancialSummaryCard = ({ summary }) => {
  const { totalBalance, income, expenses } = summary;
  
  // Calculate savings rate
  const savingsRate = income > 0 ? Math.max(0, (income - expenses) / income * 100) : 0;
  
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Monthly Summary
      </Typography>
      
      <Box mb={3}>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Total Balance
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {formatCurrency(totalBalance)}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box mb={3}>
        <Box display="flex" alignItems="center" mb={1}>
          <ArrowUpIcon color="success" sx={{ mr: 1 }} />
          <Typography variant="body1">
            Income
          </Typography>
          <Typography variant="body1" fontWeight="bold" ml="auto">
            {formatCurrency(income)}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" mb={1}>
          <ArrowDownIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="body1">
            Expenses
          </Typography>
          <Typography variant="body1" fontWeight="bold" ml="auto">
            {formatCurrency(expenses)}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body1">
            Savings Rate
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {savingsRate.toFixed(0)}%
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={savingsRate} 
          color={savingsRate >= 20 ? "success" : savingsRate >= 10 ? "warning" : "error"}
          sx={{ height: 8, borderRadius: 5 }}
        />
        
        <Typography variant="body2" color="textSecondary" mt={1}>
          {savingsRate >= 20 ? "Great job saving!" : 
           savingsRate >= 10 ? "You're on the right track!" : 
           "Consider reducing expenses to improve savings."}
        </Typography>
      </Box>
    </Paper>
  );
};

export default FinancialSummaryCard;