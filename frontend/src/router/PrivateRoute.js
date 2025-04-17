// (or wherever you define your protected routes)

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };
  
  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    // Store the location they were trying to access for redirect after login
    sessionStorage.setItem('redirectPath', location.pathname);
    
    // Redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the protected component
  return children;
};