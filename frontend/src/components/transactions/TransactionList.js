import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, 
  Typography, Box, Avatar, Chip
} from '@mui/material';
import { 
  ArrowUpward as ArrowUpIcon, 
  ArrowDownward as ArrowDownIcon,
  SwapHoriz as TransferIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionIcon = ({ type }) => {
  const iconStyle = { width: 16, height: 16, color: 'white' };
  let icon;
  let bgColor;
  
  switch (type) {
    case 'deposit':
      icon = <ArrowUpIcon sx={iconStyle} />;
      bgColor = 'success.main';
      break;
    case 'withdrawal':
    case 'payment':
      icon = <ArrowDownIcon sx={iconStyle} />;
      bgColor = 'error.main';
      break;
    case 'transfer':
      icon = <TransferIcon sx={iconStyle} />;
      bgColor = 'info.main';
      break;
    default:
      icon = <ReceiptIcon sx={iconStyle} />;
      bgColor = 'warning.main';
  }
  
  return (
    <Avatar sx={{ bgcolor: bgColor, width: 28, height: 28 }}>
      {icon}
    </Avatar>
  );
};

const getStatusColor = (status) => {
  switch(status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const TransactionList = ({ transactions }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  if (!transactions || transactions.length === 0) {
    return (
      <Box py={4} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No transactions found.
        </Typography>
      </Box>
    );
  }
  
  return (
    <>
      <TableContainer>
        <Table aria-label="transactions table">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((transaction) => (
              <TableRow key={transaction.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <TransactionIcon type={transaction.type} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {transaction.description || 
                    `Transaction #${transaction.id.substring(0, 8).toUpperCase()}`}
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={
                      transaction.type === 'deposit' ? 'success.main' : 
                      (transaction.type === 'withdrawal' || transaction.type === 'payment') ? 'error.main' : 
                      'text.primary'
                    }
                  >
                    {transaction.type === 'deposit' ? '+' : 
                     (transaction.type === 'withdrawal' || transaction.type === 'payment') ? '-' : ''
                    }
                    {formatCurrency(transaction.amount)}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(transaction.createdAt, true)}</TableCell>
                <TableCell>
                  <Chip 
                    label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    color={getStatusColor(transaction.status)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={transactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};

export default TransactionList;