import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { setStoredUser, getStoredUser } from '../../utils/auth';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const planId = location.state?.planId;

  // Handle Google Sign-In
  const handleGoogleSignIn = async (response) => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await api.post('/api/auth/google', {
        credential: response.credential,
      });

      if (result.data && result.data.user) {
        setStoredUser(result.data.user);
        const user = result.data.user;

        setTimeout(async () => {
          if (planId && location.state?.redirectTo === 'subscription') {
            navigate('/', { state: { planId } });
            return;
          }

          if (user.role === 'superadmin') {
            navigate('/pgs');
          } else {
            if (user.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
                console.log('Login: Subscription check response:', {
                  hasAccess: subResponse.data.hasAccess,
                  trial: subResponse.data.trial,
                  subscription: subResponse.data.subscription,
                  pg_id: user.pg_id
                });
                
                // Check hasAccess (includes both trial and subscription)
                if (subResponse.data.hasAccess === true) {
                  console.log('Login: Has access, redirecting to dashboard');
                  // Has active subscription OR active trial - go to dashboard
                  navigate('/dashboard', { replace: true });
                } else {
                  console.log('Login: No access, redirecting to choose-plan. Response:', subResponse.data);
                  // No subscription/trial - go to choose plan
                  navigate('/choose-plan', { replace: true });
                }
              } catch (error) {
                console.error('Login: Error checking subscription/trial:', error);
                console.error('Login: Error details:', error.response?.data || error.message);
                // Error checking - go to choose plan
                navigate('/choose-plan', { replace: true });
              }
            } else {
              // No PG - redirect to register PG
              navigate('/register-pg', { replace: true });
            }
          }
        }, 100);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Google sign-in failed. Please try again.';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const currentOrigin = window.location.origin;
    console.log('Triggering Google Sign-In, Client ID:', clientId ? 'Set' : 'Not Set');
    console.log('Current Origin:', currentOrigin);
    
    if (!clientId) {
      setError('Google Client ID is not configured. Please contact support.');
      console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables');
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      setError('Google sign-in is not available. Please refresh the page.');
      console.error('Google OAuth not loaded. window.google:', !!window.google, 'window.google.accounts:', !!(window.google && window.google.accounts));
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      // Re-initialize to ensure proper setup
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Create or get container for Google button (visible but off-screen)
      let googleButtonContainer = document.getElementById('google-signin-hidden-container');
      if (!googleButtonContainer) {
        googleButtonContainer = document.createElement('div');
        googleButtonContainer.id = 'google-signin-hidden-container';
        googleButtonContainer.style.position = 'fixed';
        googleButtonContainer.style.top = '-1000px';
        googleButtonContainer.style.left = '-1000px';
        googleButtonContainer.style.width = '250px';
        googleButtonContainer.style.height = '50px';
        googleButtonContainer.style.zIndex = '9999';
        document.body.appendChild(googleButtonContainer);
      }

      // Clear previous button if exists
      googleButtonContainer.innerHTML = '';

      // Render Google button
      try {
        window.google.accounts.id.renderButton(googleButtonContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 250,
        });

        // Wait for button to render, then click it
        let attempts = 0;
        const tryClickButton = setInterval(() => {
          attempts++;
          const googleButton = googleButtonContainer.querySelector('div[role="button"]') || 
                              googleButtonContainer.querySelector('iframe');
          
          if (googleButton) {
            clearInterval(tryClickButton);
            try {
              // Try clicking the button element
              if (googleButton.click) {
                googleButton.click();
              } else {
                // If it's an iframe, try to access its content
                const buttonElement = googleButtonContainer.querySelector('div[role="button"]');
                if (buttonElement && buttonElement.click) {
                  buttonElement.click();
                } else {
                  // Fallback to prompt
                  window.google.accounts.id.prompt();
                }
              }
              console.log('Google sign-in button clicked');
            } catch (clickError) {
              console.error('Error clicking button:', clickError);
              // Fallback to prompt
              window.google.accounts.id.prompt();
            }
          } else if (attempts > 20) {
            clearInterval(tryClickButton);
            // Fallback: use prompt method
            console.log('Button not found after 2 seconds, trying prompt method');
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
                const errorMsg = `Google sign-in is not available. This usually means:\n\n1. Your origin (${currentOrigin}) is not registered in Google Cloud Console\n2. Go to: https://console.cloud.google.com/apis/credentials\n3. Select your OAuth 2.0 Client ID\n4. Add "${currentOrigin}" to "Authorized JavaScript origins"\n5. Save and wait 5-10 minutes for changes to propagate`;
                setError(errorMsg);
                setGoogleLoading(false);
                console.error('Google One Tap not available:', notification);
              }
            });
          }
        }, 100);
      } catch (renderError) {
        console.error('Error rendering Google button:', renderError);
        // Fallback to prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const errorMsg = `Google sign-in failed. Please ensure:\n\n1. Origin "${currentOrigin}" is registered in Google Cloud Console\n2. OAuth consent screen is properly configured\n3. Client ID matches in both frontend and backend`;
            setError(errorMsg);
            setGoogleLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('Error triggering Google sign-in:', error);
      const errorMsg = `Failed to open Google sign-in: ${error.message}\n\nPlease ensure:\n1. Origin "${currentOrigin}" is registered in Google Cloud Console\n2. Go to: https://console.cloud.google.com/apis/credentials\n3. Add "${currentOrigin}" to Authorized JavaScript origins`;
      setError(errorMsg);
      setGoogleLoading(false);
    }
  };

  // Load Google OAuth script
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('Login Page: Checking Google OAuth setup...');
    console.log('Login Page: VITE_GOOGLE_CLIENT_ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET');
    
    const loadGoogleScript = () => {
      // Check if already loaded
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('Login Page: Google OAuth already loaded');
        if (clientId) {
          try {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleSignIn,
            });
            console.log('Login Page: Google OAuth initialized successfully');
          } catch (error) {
            console.error('Login Page: Error initializing Google OAuth:', error);
            setError('Failed to initialize Google sign-in. Please refresh the page.');
          }
        } else {
          console.warn('Login Page: VITE_GOOGLE_CLIENT_ID is not set');
          setError('Google Client ID is not configured. Please check environment variables.');
        }
        return;
      }
      
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        console.log('Login Page: Google script tag exists, waiting for load...');
        // Script exists but not loaded yet, wait for it
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.google && window.google.accounts && window.google.accounts.id) {
            clearInterval(checkInterval);
            console.log('Login Page: Google OAuth loaded after', attempts * 100, 'ms');
            if (clientId) {
              try {
                window.google.accounts.id.initialize({
                  client_id: clientId,
                  callback: handleGoogleSignIn,
                });
                console.log('Login Page: Google OAuth initialized after script load');
              } catch (error) {
                console.error('Login Page: Error initializing:', error);
              }
            }
          } else if (attempts > 50) {
            clearInterval(checkInterval);
            console.error('Login Page: Google OAuth failed to load after 5 seconds');
            setError('Google sign-in is taking too long to load. Please refresh the page.');
          }
        }, 100);
        return;
      }
      
      console.log('Login Page: Loading Google OAuth script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        console.log('Login Page: Google script loaded');
        if (window.google && window.google.accounts && window.google.accounts.id) {
          if (clientId) {
            try {
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleSignIn,
              });
              console.log('Login Page: Google OAuth initialized successfully');
            } catch (error) {
              console.error('Login Page: Error initializing Google OAuth:', error);
              setError('Failed to initialize Google sign-in.');
            }
          } else {
            console.warn('Login Page: VITE_GOOGLE_CLIENT_ID is not set');
            setError('Google Client ID is not configured.');
          }
        } else {
          console.error('Login Page: Google OAuth API not available after script load');
          setError('Google sign-in API not available. Please refresh the page.');
        }
      };

      script.onerror = () => {
        console.error('Login Page: Failed to load Google OAuth script');
        setError('Failed to load Google sign-in. Please check your internet connection and refresh the page.');
      };
    };

    loadGoogleScript();
  }, []);

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
            // For PG Admin, check subscription/trial before allowing access
            if (user.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
                // Check hasAccess (includes both trial and subscription)
                if (subResponse.data.hasAccess === true) {
                  // Has active subscription OR active trial, allow dashboard access
                  navigate('/dashboard', { replace: true });
                } else {
                  // No subscription/trial, redirect to choose plan
                  navigate('/choose-plan', { replace: true });
                }
              } catch (error) {
                console.error('Error checking subscription/trial:', error);
                // Error checking subscription, redirect to choose plan
                navigate('/choose-plan', { replace: true });
              }
            } else {
              // No PG created yet, redirect to register PG
              navigate('/register-pg', { replace: true });
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
            disabled={isLoading || googleLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded hover:bg-accent disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
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
            onClick={triggerGoogleSignIn}
            disabled={isLoading || googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-input bg-background text-foreground py-2.5 px-4 rounded hover:bg-accent/10 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {googleLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
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

