import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Link, Paper } from '@mui/material';
import { AccountBalance as BankIcon } from '@mui/icons-material';

const AuthLayout = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 4 
            }}
          >
            <BankIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
            <Typography component="h1" variant="h4" color="primary">
              SecureBank
            </Typography>
          </Box>
          
          <Outlet />
          
          <Box mt={5}>
            <Copyright />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link component={RouterLink} to="/" color="inherit">
        SecureBank
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

export default AuthLayout;