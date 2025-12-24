import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { setStoredUser } from '../../utils/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'pg_admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Load Google OAuth script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return;
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            callback: handleGoogleSignUp,
          });
        }
      };
    };

    loadGoogleScript();
  }, []);

  // Handle Google Sign-Up
  const handleGoogleSignUp = async (response) => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await api.post('/api/auth/google', {
        credential: response.credential,
      });

      if (result.data && result.data.user) {
        setStoredUser(result.data.user);
        const user = result.data.user;

        setTimeout(() => {
          if (user.role === 'superadmin') {
            navigate('/pgs');
          } else {
            navigate('/', { state: { message: 'Please subscribe to a plan to continue' } });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Google sign-up failed. Please try again.';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleSignUp = () => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google sign-up is not available. Please refresh the page.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await api.post('/api/auth/signup', signupData);
      
      console.log('Signup response:', response.data);

      if (response.data && response.data.user) {
        setStoredUser(response.data.user);
        const user = response.data.user;
        
        // Small delay to ensure state is saved
        setTimeout(() => {
          // Role-based redirect
          if (user.role === 'superadmin') {
            navigate('/pgs'); // Superadmin goes to PG management
          } else {
            // PG Admin must subscribe first - redirect to landing page
            navigate('/', { state: { message: 'Please subscribe to a plan to continue' } });
          }
        }, 100);
      } else {
        setError(response.data?.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Signup failed. Please try again.';
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="bg-card p-8 rounded shadow-lg w-full max-w-md border border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">PG</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">PG Pilot</h1>
          <h2 className="text-lg font-medium text-muted-foreground">Create your account</h2>
        </div>
        
        <form onSubmit={handleSignup}>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-foreground text-sm font-bold mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || googleLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded hover:bg-accent disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerGoogleSignUp}
            disabled={isLoading || googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-input bg-background text-foreground py-2.5 px-4 rounded hover:bg-accent/10 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {googleLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign up with Google</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:text-accent">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

