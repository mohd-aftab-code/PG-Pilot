import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { SkeletonCard } from '../components/common/Skeleton';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(null);

  // Handle Google Authentication (for both login and signup)
  const handleGoogleAuth = async (response) => {
    const isLoginFlow = showLoginModal;
    if (isLoginFlow) {
      setGoogleLoginLoading(true);
    } else {
      setGoogleSignupLoading(true);
    }
    setLoginError('');
    setSignupError('');

    try {
      const result = await api.post('/api/auth/google', {
        credential: response.credential,
      });

      if (result.data && result.data.user) {
        setStoredUser(result.data.user);
        const user = result.data.user;

        // Close modals
        setShowLoginModal(false);
        setShowSignupModal(false);
        setLoginData({ phone: '', password: '' });
        setSignupData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'pg_admin',
        });

        setTimeout(async () => {
          // Refresh user data to get latest state
          try {
            const currentUserResponse = await api.get('/api/auth/me');
            const currentUser = currentUserResponse.data.user;
            setStoredUser(currentUser);
            
            // Role-based redirect
            if (currentUser.role === 'superadmin') {
              navigate('/pgs', { replace: true });
              return;
            }
            
            // For PG Admin: Redirect based on onboarding state
            if (currentUser.pg_id) {
              // Has PG, check subscription
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                // Check hasAccess (includes both trial and subscription)
                if (subResponse.data.hasAccess === true) {
                  // Has active subscription OR active trial - go to dashboard
                  navigate('/dashboard', { replace: true });
                } else {
                  // No subscription/trial - go to choose plan
                  navigate('/choose-plan', { replace: true });
                }
              } catch (error) {
                // No subscription found - go to choose plan
                navigate('/choose-plan', { replace: true });
              }
            } else {
              // No PG - redirect to register PG
              navigate('/register-pg', { replace: true });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Default: redirect to register PG
            navigate('/register-pg', { replace: true });
          }
        }, 100);
      }
    } catch (err) {
      console.error('Google auth error:', err);
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Google authentication failed. Please try again.';
      if (isLoginFlow) {
        setLoginError(errorMessage);
      } else {
        setSignupError(errorMessage);
      }
    } finally {
      if (isLoginFlow) {
        setGoogleLoginLoading(false);
      } else {
        setGoogleSignupLoading(false);
      }
    }
  };

  const triggerGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const currentOrigin = window.location.origin;
    console.log('LandingPage: Triggering Google Sign-In, Client ID:', clientId ? 'Set' : 'Not Set');
    console.log('LandingPage: Current Origin:', currentOrigin);
    
    if (!clientId) {
      setLoginError('Google Client ID is not configured. Please contact support.');
      console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables');
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      setLoginError('Google sign-in is not available. Please refresh the page.');
      console.error('Google OAuth not loaded. window.google:', !!window.google, 'window.google.accounts:', !!(window.google && window.google.accounts));
      return;
    }

    setGoogleLoginLoading(true);
    setLoginError('');

    try {
      // Re-initialize to ensure proper setup
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleAuth,
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
              console.log('LandingPage: Google sign-in button clicked');
            } catch (clickError) {
              console.error('Error clicking button:', clickError);
              // Fallback to prompt
              window.google.accounts.id.prompt();
            }
          } else if (attempts > 20) {
            clearInterval(tryClickButton);
            // Fallback: use prompt method
            console.log('LandingPage: Button not found after 2 seconds, trying prompt method');
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
                const errorMsg = `Google sign-in is not available. This usually means:\n\n1. Your origin (${currentOrigin}) is not registered in Google Cloud Console\n2. Go to: https://console.cloud.google.com/apis/credentials\n3. Select your OAuth 2.0 Client ID\n4. Add "${currentOrigin}" to "Authorized JavaScript origins"\n5. Save and wait 5-10 minutes for changes to propagate`;
                setLoginError(errorMsg);
                setGoogleLoginLoading(false);
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
            setLoginError(errorMsg);
            setGoogleLoginLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('Error triggering Google sign-in:', error);
      const errorMsg = `Failed to open Google sign-in: ${error.message}\n\nPlease ensure:\n1. Origin "${currentOrigin}" is registered in Google Cloud Console\n2. Go to: https://console.cloud.google.com/apis/credentials\n3. Add "${currentOrigin}" to Authorized JavaScript origins`;
      setLoginError(errorMsg);
      setGoogleLoginLoading(false);
    }
  };

  const triggerGoogleSignUp = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const currentOrigin = window.location.origin;
    console.log('LandingPage: Triggering Google Sign-Up, Client ID:', clientId ? 'Set' : 'Not Set');
    console.log('LandingPage: Current Origin:', currentOrigin);
    
    if (!clientId) {
      setSignupError('Google Client ID is not configured. Please contact support.');
      console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables');
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      setSignupError('Google sign-up is not available. Please refresh the page.');
      console.error('Google OAuth not loaded. window.google:', !!window.google, 'window.google.accounts:', !!(window.google && window.google.accounts));
      return;
    }

    setGoogleSignupLoading(true);
    setSignupError('');

    try {
      // Re-initialize to ensure proper setup
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleAuth,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Create or get container for Google button (visible but off-screen)
      let googleButtonContainer = document.getElementById('google-signup-hidden-container');
      if (!googleButtonContainer) {
        googleButtonContainer = document.createElement('div');
        googleButtonContainer.id = 'google-signup-hidden-container';
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
          text: 'signup_with',
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
              console.log('LandingPage: Google sign-up button clicked');
            } catch (clickError) {
              console.error('Error clicking button:', clickError);
              // Fallback to prompt
              window.google.accounts.id.prompt();
            }
          } else if (attempts > 20) {
            clearInterval(tryClickButton);
            // Fallback: use prompt method
            console.log('LandingPage: Button not found after 2 seconds, trying prompt method');
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
                const errorMsg = `Google sign-up is not available. This usually means:\n\n1. Your origin (${currentOrigin}) is not registered in Google Cloud Console\n2. Go to: https://console.cloud.google.com/apis/credentials\n3. Select your OAuth 2.0 Client ID\n4. Add "${currentOrigin}" to "Authorized JavaScript origins"\n5. Save and wait 5-10 minutes for changes to propagate`;
                setSignupError(errorMsg);
                setGoogleSignupLoading(false);
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
            const errorMsg = `Google sign-up failed. Please ensure:\n\n1. Origin "${currentOrigin}" is registered in Google Cloud Console\n2. OAuth consent screen is properly configured\n3. Client ID matches in both frontend and backend`;
            setSignupError(errorMsg);
            setGoogleSignupLoading(false);
          }
        });
      }
    } catch (error) {
      console.error('Error triggering Google sign-up:', error);
      const errorMsg = `Failed to open Google sign-up: ${error.message}\n\nPlease ensure:\n1. Origin "${currentOrigin}" is registered in Google Cloud Console\n2. Go to: https://console.cloud.google.com/apis/credentials\n3. Add "${currentOrigin}" to Authorized JavaScript origins`;
      setSignupError(errorMsg);
      setGoogleSignupLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    
    // Preload Razorpay script and key
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    
    // Preload Razorpay key
    api.get('/api/subscription-payment/razorpay-key')
      .then(response => {
        setRazorpayKey(response.data.key);
      })
      .catch(err => console.error('Error loading Razorpay key:', err));
    
    // Load Google OAuth script
    const loadGoogleScript = () => {
      // Check if already loaded
      if (window.google && window.google.accounts && window.google.accounts.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (clientId) {
          try {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleAuth,
            });
            console.log('LandingPage: Google OAuth initialized with Client ID:', clientId.substring(0, 20) + '...');
          } catch (error) {
            console.error('Error initializing Google OAuth:', error);
          }
        } else {
          console.warn('LandingPage: VITE_GOOGLE_CLIENT_ID is not set');
        }
        return;
      }
      
      // Check if script already exists
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        // Script exists but not loaded yet, wait for it
        const checkInterval = setInterval(() => {
          if (window.google && window.google.accounts && window.google.accounts.id) {
            clearInterval(checkInterval);
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (clientId) {
              window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleAuth,
              });
              console.log('LandingPage: Google OAuth initialized after script load with Client ID:', clientId.substring(0, 20) + '...');
            }
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
          if (clientId) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleAuth,
            });
            console.log('LandingPage: Google OAuth initialized with Client ID:', clientId.substring(0, 20) + '...');
          } else {
            console.warn('LandingPage: VITE_GOOGLE_CLIENT_ID is not set');
          }
        }
      };

      script.onerror = () => {
        console.error('LandingPage: Failed to load Google OAuth script');
      };
    };

    loadGoogleScript();
    
    // Check if modal should be opened from route pathname or state
    if (location.pathname === '/login' || location.state?.modal === 'login') {
      setShowLoginModal(true);
      // Replace URL to remove /login from path
      if (location.pathname === '/login') {
        navigate('/', { replace: true });
      }
    } else if (location.pathname === '/signup' || location.state?.modal === 'signup') {
      setShowSignupModal(true);
      // Replace URL to remove /signup from path
      if (location.pathname === '/signup') {
        navigate('/', { replace: true });
      }
    }
    
    // Show message if redirected from login/signup
    if (location.state?.message) {
      setTimeout(() => {
        alert(location.state.message);
      }, 500);
    }
  }, [location, navigate]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/plans/public');
      const fetchedPlans = response.data.plans || [];
      
      // Format plans with features based on limits
      const formattedPlans = fetchedPlans.map(plan => ({
        ...plan,
        features: [
          `Up to ${plan.max_pgs || 1} PG${plan.max_pgs > 1 ? 's' : ''}`,
          `Up to ${plan.max_rooms || 10} Rooms`,
          `Up to ${plan.max_beds || 50} Beds`,
          `${plan.duration_days} days validity`,
          plan.description || 'Full access to all features'
        ]
      }));
      
      setPlans(formattedPlans);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Check if user is logged in
    const user = getStoredUser();
    const hasToken = document.cookie.includes('token=');
    
    if (!user || !hasToken) {
      // User not logged in - show signup modal
      setShowSignupModal(true);
      return;
    }
    
    // User is logged in - redirect to choose plan page
    navigate('/choose-plan', { replace: true });
  };

  // Login form state
  const [loginData, setLoginData] = useState({
    phone: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoginLoading, setGoogleLoginLoading] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await api.post('/api/auth/login', loginData);
      
      if (response.data && response.data.user) {
        setStoredUser(response.data.user);
        const user = response.data.user;
        
        // Close login modal
        setShowLoginModal(false);
        setLoginData({ phone: '', password: '' });
        
        // Small delay to ensure state is saved
        setTimeout(async () => {
          // Refresh user data to get latest state
          try {
            const currentUserResponse = await api.get('/api/auth/me');
            const currentUser = currentUserResponse.data.user;
            setStoredUser(currentUser);
            
            // Role-based redirect
            if (currentUser.role === 'superadmin') {
              navigate('/pgs', { replace: true });
              return;
            }
            
            // For PG Admin: Redirect based on onboarding state
            if (currentUser.pg_id) {
              // Has PG, check subscription
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                // Check hasAccess (includes both trial and subscription)
                if (subResponse.data.hasAccess === true) {
                  // Has active subscription OR active trial - go to dashboard
                  navigate('/dashboard', { replace: true });
                } else {
                  // No subscription/trial - go to choose plan
                  navigate('/choose-plan', { replace: true });
                }
              } catch (error) {
                // No subscription found - go to choose plan
                navigate('/choose-plan', { replace: true });
              }
            } else {
              // No PG - redirect to register PG
              navigate('/register-pg', { replace: true });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Default: redirect to register PG
            navigate('/register-pg', { replace: true });
          }
        }, 100);
      } else {
        setLoginError(response.data?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Login failed. Please try again.';
      setLoginError(errorMessage);
    }
    
    setLoginLoading(false);
  };

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'pg_admin',
  });
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleSignupLoading, setGoogleSignupLoading] = useState(false);


  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      setSignupLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setSignupError('Password must be at least 6 characters');
      setSignupLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...signupPayload } = signupData;
      
      // First create user account
      const response = await api.post('/api/auth/signup', signupPayload);
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        setStoredUser(user);
        
        // Close signup modal
        setShowSignupModal(false);
        setSignupData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'pg_admin',
        });
        
        // After successful registration:
        // Step 1: User is now logged in (token set)
        // Step 2: Redirect based on user state
        
        setTimeout(async () => {
          // Refresh user data
          try {
            const currentUserResponse = await api.get('/api/auth/me');
            const currentUser = currentUserResponse.data.user;
            setStoredUser(currentUser);
            
            if (currentUser.role === 'superadmin') {
              navigate('/pgs', { replace: true });
              return;
            }
            
            // For PG Admin: Redirect to onboarding flow
            if (currentUser.pg_id) {
              // Has PG, check subscription
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                // Check hasAccess (includes both trial and subscription)
                if (subResponse.data.hasAccess === true) {
                  // Has active subscription OR active trial - go to dashboard
                  navigate('/dashboard', { replace: true });
                } else {
                  // No subscription/trial - go to choose plan
                  navigate('/choose-plan', { replace: true });
                }
              } catch (subError) {
                // No subscription found - go to choose plan
                navigate('/choose-plan', { replace: true });
              }
            } else {
              // No PG - redirect to register PG
              navigate('/register-pg', { replace: true });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Default: redirect to register PG
            navigate('/register-pg', { replace: true });
          }
        }, 100);
      } else {
        setSignupError(response.data?.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Signup failed. Please try again.';
      setSignupError(errorMessage);
    }
    
    setSignupLoading(false);
  };

  // Icon Components
  const IconUsers = () => (
    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const IconDollar = () => (
    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const IconAlert = () => (
    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const IconHome = () => (
    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const IconCoffee = () => (
    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14M5 11a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6m-9 4h6" />
    </svg>
  );

  const IconChart = () => (
    <svg className="w-12 h-12 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const IconCheck = () => (
    <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const IconArrowRight = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  const IconMail = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const IconPhone = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );

  const IconMapPin = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const IconFacebook = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const IconTwitter = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  );

  const IconLinkedin = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );

  const IconInstagram = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );

  const features = [
    { icon: IconUsers, title: 'Tenant Management', description: 'Excel sheets aur WhatsApp lists ki jhanjhat khatam. Saare tenants ek hi jagah with documents and complete history tracking.' },
    { icon: IconDollar, title: 'Payment Tracking', description: 'Rent miss hone ka tension khatam. Automated reminders, multiple payment modes, aur detailed financial reports — sab kuch seedha aapke dashboard pe.' },
    { icon: IconAlert, title: 'Complaint Management', description: 'Complaints ko track karna abhi easy hai. Status tracking aur resolution management se sab kuch organized rahega.' },
    { icon: IconHome, title: 'Room & Bed Management', description: 'Real-time mein dekho kaunsi room khali hai aur kaunsi occupied. Room allocation aur bed status — sab kuch ek click pe.' },
    { icon: IconCoffee, title: 'Mess Management', description: 'Mess plans create karo, tenants ko assign karo, aur automated bills generate karo. Mess ki tension abhi zero.' },
    { icon: IconChart, title: 'Analytics & Reports', description: 'Apne PG ki complete analytics dekho. Revenue, occupancy, payments — sab kuch detailed reports mein, seedha dashboard pe.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14]">
      {/* Header */}
      <header className="bg-[#0F1720]/95 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex justify-between items-center min-h-[56px] sm:min-h-[64px]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm sm:text-base">PG</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#E5E7EB]">Pilot</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link
              to="/for-tenants"
              className="px-4 sm:px-5 py-2 sm:py-2.5 text-[#E5E7EB] hover:text-[#22D3EE] transition-colors font-semibold text-sm sm:text-base"
            >
              I'm a Tenant
            </Link>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 text-[#E5E7EB] hover:text-[#22D3EE] transition-colors font-semibold text-sm sm:text-base"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#14B8A6] text-white rounded-lg hover:bg-[#2DD4BF] transition-colors font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 lg:py-32 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 md:mb-8 leading-[1.1] sm:leading-tight">
            <span className="text-[#E5E7EB] block mb-1 sm:mb-2">Run Your Entire PG on</span>
            <span className="text-[#22D3EE] block">Autopilot</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#D1D5DB] mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
            Reduce manual work, never miss rent, track every bed in real time. 
            Simplify rent, tenants & mess in one place — built specifically for Indian PG owners.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8">
            <button
              onClick={() => setShowSignupModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 bg-[#14B8A6] text-white rounded-lg hover:bg-[#2DD4BF] transition-all text-sm sm:text-base md:text-lg font-semibold shadow-lg hover:shadow-xl active:scale-95"
            >
              Get Started Free
              <IconArrowRight />
            </button>
            <button
              onClick={() => {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 border-2 border-[#22D3EE] text-[#22D3EE] rounded-lg hover:bg-[#22D3EE] hover:text-[#0B0F14] transition-all text-sm sm:text-base md:text-lg font-semibold active:scale-95"
            >
              View Features
            </button>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-[#9CA3AF]">
            No credit card required · Setup in 10 minutes · Free trial available
          </p>
        </div>
      </section>

      {/* Social Proof Stats Strip */}
      <section className="relative w-full py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 text-center">
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">150+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">PG Owners</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">trust PG Pilot to manage their properties.</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">2000+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Rooms Managed</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">across all properties on the platform.</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">₹50L+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Revenue Tracked</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">processed through our platform monthly.</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">25+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Cities</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">across India where we operate.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PG Pilot Section */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">Why Choose PG Pilot</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight px-2">
              Everything You Need to Run Your PG Smoothly
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2">
              Built specifically for Indian PG owners. Manage everything from one powerful dashboard.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
            <div className="bg-[#0F1720] p-6 sm:p-8 md:p-10 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#22D3EE]/10 rounded-xl flex items-center justify-center">
                  <IconHome className="w-6 h-6 sm:w-7 sm:h-7 text-[#22D3EE]" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#E5E7EB]">Complete PG Management</h3>
              </div>
              <p className="text-[#D1D5DB] text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                Run your entire PG on autopilot. Manage tenants, track payments, handle complaints, and automate everything — all in one powerful dashboard.
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Complete tenant management with documents & history</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Automated payment tracking & reminders</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Real-time room & bed availability tracking</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Mess management & automated billing</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>List your PG on marketplace for free</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#0F1720] p-6 sm:p-8 md:p-10 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#22D3EE]/10 rounded-xl flex items-center justify-center">
                  <IconChart className="w-6 h-6 sm:w-7 sm:h-7 text-[#22D3EE]" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#E5E7EB]">Powerful Analytics</h3>
              </div>
              <p className="text-[#D1D5DB] text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                Get insights into your PG business. Track revenue, occupancy rates, payment trends, and more with detailed analytics and reports.
              </p>
              <ul className="space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Revenue tracking & financial reports</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Occupancy rate analytics</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Payment history & trends</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Tenant retention insights</span>
                </li>
                <li className="flex items-start gap-3 text-[#E5E7EB] text-sm sm:text-base">
                  <IconCheck className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                  <span>Export reports in multiple formats</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">How It Works</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight px-2">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2">
              From registration to accessing your dashboard — we've made it simple and fast.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Connection Line - Desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#22D3EE]/20 via-[#22D3EE]/40 to-[#22D3EE]/20 transform -translate-y-1/2 z-0"></div>
              
              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 relative z-10">
                {/* Step 1: Register */}
                <div className="relative">
                  <div className="bg-[#0F1720] p-6 sm:p-8 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl group relative z-10">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#22D3EE]/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#22D3EE]/20 transition-all group-hover:scale-110">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="absolute -top-3 -right-3 md:top-auto md:right-auto md:-top-4 md:left-1/2 md:-translate-x-1/2 w-8 h-8 bg-[#22D3EE] rounded-full flex items-center justify-center text-[#0B0F14] font-black text-sm sm:text-base z-20">
                        1
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-2 sm:mb-3">Register</h3>
                      <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed mb-4">
                        Create your account with basic details. Enter your PG name and location. Takes less than 2 minutes.
                      </p>
                      <ul className="text-left w-full space-y-2 text-sm text-[#E5E7EB]">
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Sign up with phone or Google</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Add PG details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Account created instantly</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 2: Payment */}
                <div className="relative">
                  <div className="bg-[#0F1720] p-6 sm:p-8 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl group relative z-10">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#22D3EE]/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#22D3EE]/20 transition-all group-hover:scale-110">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-6 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="absolute -top-3 -right-3 md:top-auto md:right-auto md:-top-4 md:left-1/2 md:-translate-x-1/2 w-8 h-8 bg-[#22D3EE] rounded-full flex items-center justify-center text-[#0B0F14] font-black text-sm sm:text-base z-20">
                        2
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-2 sm:mb-3">Choose Plan & Pay</h3>
                      <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed mb-4">
                        Select a subscription plan that fits your needs. Secure payment via Razorpay. Multiple payment options available.
                      </p>
                      <ul className="text-left w-full space-y-2 text-sm text-[#E5E7EB]">
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Choose from flexible plans</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Secure Razorpay payment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Instant activation</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 3: Access Dashboard */}
                <div className="relative">
                  <div className="bg-[#0F1720] p-6 sm:p-8 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl group relative z-10">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#22D3EE]/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#22D3EE]/20 transition-all group-hover:scale-110">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="absolute -top-3 -right-3 md:top-auto md:right-auto md:-top-4 md:left-1/2 md:-translate-x-1/2 w-8 h-8 bg-[#22D3EE] rounded-full flex items-center justify-center text-[#0B0F14] font-black text-sm sm:text-base z-20">
                        3
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-2 sm:mb-3">Access Dashboard</h3>
                      <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed mb-4">
                        Start managing your PG immediately. Access all features, manage tenants, track payments, and more — all from one dashboard.
                      </p>
                      <ul className="text-left w-full space-y-2 text-sm text-[#E5E7EB]">
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Full dashboard access</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>All features unlocked</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-[#22D3EE] flex-shrink-0 mt-0.5" />
                          <span>Start managing right away</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Connection Lines */}
              <div className="md:hidden flex flex-col items-center gap-4 mt-6">
                <div className="w-0.5 h-8 bg-gradient-to-b from-[#22D3EE]/40 to-[#22D3EE]/20"></div>
                <div className="w-0.5 h-8 bg-gradient-to-b from-[#22D3EE]/40 to-[#22D3EE]/20"></div>
              </div>

              {/* CTA Button */}
              <div className="text-center mt-8 sm:mt-10 md:mt-12">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="px-8 sm:px-10 md:px-12 py-3.5 sm:py-4 bg-[#14B8A6] text-white rounded-lg hover:bg-[#2DD4BF] transition-all font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 mx-auto"
                >
                  Get Started Now
                  <IconArrowRight />
                </button>
                <p className="text-xs sm:text-sm text-[#9CA3AF] mt-3">
                  No credit card required for signup · Setup in 10 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">Key Features</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight px-2">
              Powerful Features for PG Owners
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2 mt-4">
              Everything you need to manage your PG efficiently and grow your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-[#0F1720] p-5 sm:p-6 md:p-7 rounded-lg shadow-[0_1px_4px_0_rgba(0,0,0,0.3)] hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-l-4 border-accent relative overflow-hidden group border border-primary/10"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 text-accent mb-3 sm:mb-4 flex items-center justify-center">
                    <IconComponent />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2 sm:mb-3 leading-tight">{feature.title}</h3>
                  <p className="text-[#E5E7EB] text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section id="pricing-plans" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">Simple Pricing</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight px-2">
              Choose Your Plan
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2">
              Plans designed for Indian PG owners. Start with free trial, upgrade as your business grows.
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonCard 
                  key={idx} 
                  showHeader={true} 
                  lines={6} 
                  showButton={true}
                  className="p-5 sm:p-6 md:p-8"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`bg-[#0F1720] border rounded-lg p-5 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300 ${
                    idx === 1 ? 'border-accent border-2 shadow-lg md:scale-105' : 'border-primary/10 shadow-[0_1px_4px_0_rgba(0,0,0,0.3)]'
                  }`}
                >
                  {idx === 1 && (
                    <div className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 rounded-lg inline-block mb-3 sm:mb-4 uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2 sm:mb-3">{plan.name}</h3>
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary">₹{plan.price}</span>
                    <span className="text-[#E5E7EB] text-sm sm:text-base md:text-lg ml-1">/month</span>
                  </div>
                  <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6 sm:mb-7 md:mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 sm:gap-3 text-[#E5E7EB] text-sm sm:text-base">
                        <IconCheck />
                        <span className="flex-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleSubscribe}
                    className={`w-full py-3 sm:py-3.5 md:py-4 rounded-lg font-semibold transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 ${
                      idx === 1
                        ? 'bg-[#14B8A6] text-white hover:bg-[#2DD4BF] shadow-lg'
                        : 'bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720]'
                    }`}
                  >
                    Subscribe Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative w-full border-t border-primary/10 py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">PG Pilot – PG Management System</h3>
              <p className="text-[#D1D5DB] text-xs md:text-sm leading-relaxed mb-3 md:mb-0">
                The complete platform for PG management. Manage your entire property on autopilot — tenants, payments, rooms, mess, and more. 
                Built specifically for Indian PG owners.
              </p>
              <div className="flex gap-2 md:gap-3 mt-3 md:mt-4">
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconFacebook />
                </a>
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconTwitter />
                </a>
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconLinkedin />
                </a>
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-primary/20 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconInstagram />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-3 md:mb-4 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs md:text-sm text-[#D1D5DB]">
                <li><Link to="/for-tenants" className="hover:text-accent transition-colors">For Tenants</Link></li>
                <li><a href="#features" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#pricing-plans" className="hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-accent transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="font-bold text-[#E5E7EB] mb-3 md:mb-4 text-sm md:text-base">Contact</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-[#D1D5DB]">
                <li>
                  <b className="block text-[#E5E7EB] mb-1">Address</b>
                  <hr className="border-primary/20 mb-1 md:mb-2" />
                  <p className="text-[#D1D5DB]">Noida, Uttar Pradesh, India</p>
                </li>
                <li>
                  <b className="block text-[#E5E7EB] mb-1">Email</b>
                  <hr className="border-primary/20 mb-1 md:mb-2" />
                  <a href="mailto:support@pgpilot.com" className="text-[#D1D5DB] hover:text-accent transition-colors break-all">support@pgpilot.com</a>
                </li>
                <li>
                  <b className="block text-[#E5E7EB] mb-1">Phone</b>
                  <hr className="border-primary/20 mb-1 md:mb-2" />
                  <p className="text-[#D1D5DB]">Phone support available between 10 AM – 7 PM IST</p>
                </li>
                <li>
                  <b className="block text-[#E5E7EB] mb-1">Support</b>
                  <hr className="border-primary/20 mb-1 md:mb-2" />
                  <p className="text-[#D1D5DB] mb-1">Available 24/7</p>
                  <p className="text-[#D1D5DB]">WhatsApp onboarding and training available</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary/20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-xs md:text-sm text-[#D1D5DB] text-center md:text-left">
              © 2024 PG Pilot – Complete PG Management Platform for Owners
            </p>
            <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-[#D1D5DB]">
              <a href="#" className="hover:text-accent transition-colors">Contact us</a>
              <span>|</span>
              <a href="#" className="hover:text-accent transition-colors">Privacy policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Modal
        isOpen={showLoginModal}
        position="center"
        onClose={() => {
          setShowLoginModal(false);
          setLoginData({ phone: '', password: '' });
          setLoginError('');
        }}
        title="Sign In"
        size="sm"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleLogin}>
          {loginError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
              {loginError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={loginData.phone}
              onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
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
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loginLoading || googleLoginLoading}
            className="w-full bg-[#14B8A6] text-white py-2.5 px-4 rounded hover:bg-[#2DD4BF] disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerGoogleSignIn}
            disabled={loginLoading || googleLoginLoading}
            className="w-full flex items-center justify-center gap-3 border border-input bg-background text-foreground py-2.5 px-4 rounded hover:bg-accent/10 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {googleLoginLoading ? (
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
            <span className="text-muted-foreground text-sm">Don't have an account? </span>
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(false);
                setShowSignupModal(true);
                setLoginData({ phone: '', password: '' });
                setLoginError('');
              }}
              className="text-primary hover:text-accent font-medium"
            >
              Sign Up
            </button>
          </div>
        </form>
      </Modal>

      {/* Signup Modal */}
      <Modal
        isOpen={showSignupModal}
        position="center"
        onClose={() => {
          setShowSignupModal(false);
          setSignupData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            role: 'pg_admin',
          });
          setSignupError('');
        }}
        title="Create Account"
        size="md"
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleSignup}>
          {signupError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
              {signupError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
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
              value={signupData.phone}
              onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
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
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              Password *
            </label>
            <input
              type="password"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
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
              value={signupData.confirmPassword}
              onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={signupLoading || googleSignupLoading}
            className="w-full bg-[#14B8A6] text-white py-2.5 px-4 rounded hover:bg-[#2DD4BF] disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {signupLoading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerGoogleSignUp}
            disabled={signupLoading || googleSignupLoading}
            className="w-full flex items-center justify-center gap-3 border border-input bg-background text-foreground py-2.5 px-4 rounded hover:bg-accent/10 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
          >
            {googleSignupLoading ? (
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
            <span className="text-muted-foreground text-sm">Already have an account? </span>
            <button
              type="button"
              onClick={() => {
                setShowSignupModal(false);
                setShowLoginModal(true);
                setSignupData({
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                  role: 'pg_admin',
                });
                setSignupError('');
              }}
              className="text-primary hover:text-accent font-medium"
            >
              Sign In
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default LandingPage;
