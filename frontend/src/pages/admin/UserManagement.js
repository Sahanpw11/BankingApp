import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Box, IconButton,
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Switch, TextField, TablePagination,
  Chip, CircularProgress, Snackbar, Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import adminService from '../../api/admin';
import { formatDate } from '../../utils/formatters';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    isActive: true,
    isAdmin: false
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminService.getAllUsers();
        setUsers(response.users);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load users');
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleViewUser = (userId) => {
    navigate(`/admin/users/${userId}`);
  };
  
  const handleEditClick = (user) => {
    setCurrentUser(user);
    setEditUserData({
      isActive: user.isActive,
      isAdmin: user.isAdmin
    });
    setEditDialogOpen(true);
  };
  
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setCurrentUser(null);
  };
  
  const handleEditUserSubmit = async () => {
    try {
      await adminService.updateUser(currentUser.id, editUserData);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === currentUser.id 
          ? { ...user, ...editUserData } 
          : user
      ));
      
      setNotification({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
      
      handleEditDialogClose();
    } catch (err) {
      setNotification({
        open: true,
        message: err.message || 'Failed to update user',
        severity: 'error'
      });
    }
  };
  
  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Active' : 'Inactive'} 
                      color={user.isActive ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isAdmin ? 'Admin' : 'User'} 
                      color={user.isAdmin ? 'primary' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewUser(user.id)}
                      title="View User Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditClick(user)}
                      title="Edit User"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {currentUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1">
                {currentUser.firstName} {currentUser.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {currentUser.email}
              </Typography>
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={editUserData.isActive} 
                    onChange={(e) => setEditUserData({ ...editUserData, isActive: e.target.checked })}
                    color="primary"
                  />
                } 
                label="Active Account" 
                sx={{ display: 'block', mt: 2 }}
              />
              
              <FormControlLabel 
                control={
                  <Switch 
                    checked={editUserData.isAdmin} 
                    onChange={(e) => setEditUserData({ ...editUserData, isAdmin: e.target.checked })}
                    color="primary"
                  />
                } 
                label="Admin Privileges" 
                sx={{ display: 'block', mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleEditUserSubmit} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement;