import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { setStoredUser, getStoredUser } from '../../utils/auth';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const planId = location.state?.planId;

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = getStoredUser();
      const hasToken = document.cookie.includes('token=');
      
      if (user && hasToken) {
        try {
          // Verify token is still valid
          const response = await api.get('/api/auth/me');
          if (response.data && response.data.user) {
            // Already logged in, redirect based on role
            const currentUser = response.data.user;
            if (currentUser.role === 'superadmin') {
              navigate('/pgs', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          // Token invalid, stay on login page
          console.log('Token invalid, showing login page');
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', { phone, password });
      
      console.log('Login response:', response.data);

      if (response.data && response.data.user) {
        setStoredUser(response.data.user);
        const user = response.data.user;
        
        // Small delay to ensure state is saved
        setTimeout(async () => {
          // If user came from subscription flow, redirect back to landing page
          if (planId && location.state?.redirectTo === 'subscription') {
            navigate('/', { state: { planId } });
            return;
          }
          
          // Role-based redirect
          if (user.role === 'superadmin') {
            navigate('/pgs'); // Superadmin goes to PG management
          } else {
            // For PG Admin, check subscription before allowing access
            if (user.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
                if (subResponse.data.subscription) {
                  // Has active subscription, allow dashboard access
                  navigate('/dashboard');
                } else {
                  // No subscription, redirect to landing page with message
                  navigate('/', { 
                    state: { 
                      message: 'Please subscribe to a plan to access the dashboard. Subscription is required to use PG Pilot services.' 
                    } 
                  });
                }
              } catch (error) {
                // Error checking subscription, redirect to landing page
                navigate('/', { 
                  state: { 
                    message: 'Please subscribe to a plan to access the dashboard. Subscription is required to use PG Pilot services.' 
                  } 
                });
              }
            } else {
              // No PG created yet, redirect to landing page
              navigate('/', { 
                state: { 
                  message: 'Please create a PG and subscribe to a plan to access the dashboard.' 
                } 
              });
            }
          }
        }, 100);
      } else {
        setError(response.data?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Login failed. Please try again.';
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="bg-card p-8 rounded shadow-lg w-full max-w-md border border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">PG</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">PG Pilot</h1>
          <h2 className="text-lg font-medium text-muted-foreground">Sign In to your account</h2>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-foreground text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded hover:bg-accent disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:text-accent">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

