import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import sessionStabilizer from './utils/sessionStabilizer';
import globalAuthInterceptor from './utils/globalAuthInterceptor';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Accounts from './pages/dashboard/Accounts';
import AccountDetail from './pages/dashboard/AccountDetail';
import Transfer from './pages/dashboard/Transfer';
import PayBills from './pages/dashboard/PayBills';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import TransactionDetails from './pages/dashboard/TransactionDetails';
import TransactionDetailsPage from './pages/dashboard/TransactionDetailsPage';
import TransactionsPage from './pages/dashboard/TransactionsPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import UserDetails from './pages/admin/UserDetails';
import AccountManagement from './pages/admin/AccountManagement';
import TransactionHistory from './pages/admin/TransactionHistory';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Protected Routes
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Initialize session stability and global auth interceptor at app startup
sessionStabilizer.initSession();
globalAuthInterceptor.initGlobalAuthInterceptor();

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            
            {/* User Dashboard Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/:accountId" element={<AccountDetail />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/pay-bills" element={<PayBills />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/:transactionId" element={<TransactionDetails />} />
              <Route path="/transaction-details" element={<TransactionDetailsPage />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/users/:userId" element={<UserDetails />} />
              <Route path="/admin/accounts" element={<AccountManagement />} />
              <Route path="/admin/transactions" element={<TransactionHistory />} />
            </Route>
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;