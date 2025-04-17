// or wherever your routing is defined

// Make sure your authentication check doesn't trigger logout unnecessarily
const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isLoggedIn();
  
  console.log('Private route check, authenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Don't call logout here
  return children;
};