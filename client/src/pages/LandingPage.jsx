import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPGModal, setShowPGModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [pgFormData, setPgFormData] = useState({
    name: '',
    address: '',
    food_enabled: false,
    default_due_day: 5,
  });

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
          pg_name: '',
          pg_location: '',
        });

        setTimeout(async () => {
          // If user came from subscription flow, handle it
          if (pendingPlanId) {
            if (!user.pg_id) {
              setPendingPlanId(pendingPlanId);
              setShowPGModal(true);
              return;
            }
            // Proceed with payment
            await initiatePayment(pendingPlanId);
            return;
          }

          // Role-based redirect
          if (user.role === 'superadmin') {
            navigate('/pgs');
          } else {
            // For PG Admin, check subscription before allowing access
            if (user.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
                if (subResponse.data.subscription) {
                  navigate('/dashboard');
                } else {
                  // No subscription, stay on landing page
                  alert('Please subscribe to a plan to access the dashboard.');
                }
              } catch (error) {
                alert('Please subscribe to a plan to access the dashboard.');
              }
            } else {
              // No PG created yet
              alert('Please create a PG and subscribe to a plan to access the dashboard.');
            }
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

  const handleSubscribe = async (planId) => {
    try {
      // First check if user is logged in via API
      let user;
      try {
        const response = await api.get('/api/auth/me');
        user = response.data?.user;
      } catch (error) {
        // If API call fails, try localStorage
        user = getStoredUser();
        if (!user) {
          // User not logged in - show signup modal first with planId
          setPendingPlanId(planId);
          setShowSignupModal(true);
          return;
        }
      }

      // Check if user is logged in
      if (!user) {
        // User not logged in - show signup modal first with planId
        setPendingPlanId(planId);
        setShowSignupModal(true);
        return;
      }

      // Check if user is PG Admin
      if (user.role !== 'pg_admin') {
        alert(`Only PG Admins can subscribe to plans. Your current role is: ${user.role || 'not set'}. Please register as a PG Admin.`);
        setPendingPlanId(planId);
        setShowSignupModal(true);
        return;
      }

      // If user doesn't have PG, show creation modal
      if (!user.pg_id) {
        setPendingPlanId(planId);
        setShowPGModal(true);
        return;
      }

      // Proceed with payment
      setPaymentLoading(true);
      
      // Wait for Razorpay script if not loaded
      if (!window.Razorpay) {
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(checkRazorpay);
            initiatePayment(planId);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkRazorpay);
          if (!window.Razorpay) {
            setPaymentLoading(false);
            alert('Razorpay is taking too long to load. Please refresh the page and try again.');
            return;
          }
        }, 5000);
      } else {
        initiatePayment(planId);
      }
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      alert('Failed to initiate subscription. Please try again.');
    }
  };

  const initiatePayment = async (planId) => {
    try {
      // Use cached key or fetch it
      let finalRazorpayKey = razorpayKey;
      if (!finalRazorpayKey) {
        const keyResponse = await api.get('/api/subscription-payment/razorpay-key');
        finalRazorpayKey = keyResponse.data.key;
        setRazorpayKey(finalRazorpayKey);
      }

      // Create order
      const orderResponse = await api.post('/api/subscription-payment/create-order', { plan_id: planId });
      const { order_id, amount, plan } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: finalRazorpayKey,
        amount: amount,
        currency: 'INR',
        name: 'PG Pilot',
        description: `Subscription for ${plan.name}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await api.post('/api/subscription-payment/verify', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan_id: planId,
            });

            // Get plan details for success message
            const planDetails = verifyResponse.data?.plan || plan;
            
            // Show success message with plan details
            alert(`🎉 Payment Successful!\n\nYour subscription to "${planDetails.name}" has been activated.\n\nAmount: ₹${planDetails.price}\nExpiry Date: ${verifyResponse.data?.expiry_date || 'N/A'}\n\nA confirmation email has been sent to your registered email address.\n\nYou can now access your dashboard!`);
            
            // Clear pending plan
            setPendingPlanId(null);
            
            // Redirect to dashboard
            navigate('/dashboard');
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: getStoredUser()?.name || '',
          email: getStoredUser()?.email || '',
          contact: getStoredUser()?.phone || '',
        },
        theme: {
          color: '#004767',
        },
      };

      const razorpay = new window.Razorpay(options);
      setPaymentLoading(false);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentLoading(false);
      alert(error.response?.data?.error || 'Failed to initiate payment. Please try again.');
    }
  };

  const handleCreatePG = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/pgs', pgFormData);
      const newPG = response.data.pg;
      
      // Wait a bit for backend to update user
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh user data from API to get updated pg_id
      let userUpdated = false;
      try {
        const userResponse = await api.get('/api/auth/me');
        if (userResponse.data?.user) {
          const updatedUser = userResponse.data.user;
          setStoredUser(updatedUser);
          userUpdated = true;
          
          // Verify pg_id is set
          if (!updatedUser.pg_id) {
            // If still not set, update manually
            const manualUser = { ...updatedUser, pg_id: newPG.id };
            setStoredUser(manualUser);
          }
        }
      } catch (err) {
        console.error('Error refreshing user:', err);
        // Fallback: update manually
        const currentUser = getStoredUser();
        const updatedUser = { ...currentUser, pg_id: newPG.id };
        setStoredUser(updatedUser);
        userUpdated = true;
      }
      
      // Close modal
      setShowPGModal(false);
      setPgFormData({ name: '', address: '', food_enabled: false, default_due_day: 5 });
      
      // Proceed with payment if plan was selected
      if (pendingPlanId) {
        // Double check user has pg_id before proceeding
        const finalUser = getStoredUser();
        if (finalUser && finalUser.pg_id) {
          await initiatePayment(pendingPlanId);
        } else {
          alert('PG created but user update failed. Please refresh the page and try again.');
        }
      }
      setPendingPlanId(null);
    } catch (error) {
      console.error('Error creating PG:', error);
      alert(error.response?.data?.error || 'Failed to create PG. Please try again.');
    }
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
          // If user came from subscription flow, handle it
          if (pendingPlanId) {
            if (!user.pg_id) {
              setPendingPlanId(pendingPlanId);
              setShowPGModal(true);
              return;
            }
            // Proceed with payment
            await initiatePayment(pendingPlanId);
            return;
          }
          
          // Role-based redirect
          if (user.role === 'superadmin') {
            navigate('/pgs');
          } else {
            // For PG Admin, check subscription before allowing access
            if (user.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
                if (subResponse.data.subscription) {
                  navigate('/dashboard');
                } else {
                  // No subscription, stay on landing page
                  alert('Please subscribe to a plan to access the dashboard.');
                }
              } catch (error) {
                alert('Please subscribe to a plan to access the dashboard.');
              }
            } else {
              // No PG created yet
              alert('Please create a PG and subscribe to a plan to access the dashboard.');
            }
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
    pg_name: '',
    pg_location: '',
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

    if (!signupData.pg_name || !signupData.pg_location) {
      setSignupError('PG Name and Location are required');
      setSignupLoading(false);
      return;
    }

    try {
      const { confirmPassword, pg_name, pg_location, ...signupPayload } = signupData;
      
      // First create user account
      const response = await api.post('/api/auth/signup', signupPayload);
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        setStoredUser(user);
        
        // If user is pg_admin, create PG with provided details
        if (user.role === 'pg_admin') {
          try {
            const pgResponse = await api.post('/api/pgs', {
              name: pg_name,
              address: pg_location,
              food_enabled: false,
              default_due_day: 5,
            });
            
            // Update user with pg_id
            const updatedUser = { ...user, pg_id: pgResponse.data.pg.id };
            setStoredUser(updatedUser);
            
            // Wait a bit for backend to update
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (pgError) {
            console.error('Error creating PG:', pgError);
            setSignupError('Account created but failed to create PG. Please try again.');
            setSignupLoading(false);
            return;
          }
        }
        
        // Close signup modal
        setShowSignupModal(false);
        setSignupData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: 'pg_admin',
          pg_name: '',
          pg_location: '',
        });
        
        // If there's a pending plan, show login modal, otherwise show success
        if (pendingPlanId) {
          // Show login modal to proceed with subscription
          setTimeout(() => {
            setShowLoginModal(true);
          }, 300);
        } else {
          // Role-based redirect
          if (user.role === 'superadmin') {
            navigate('/pgs');
          } else {
            alert('Account created successfully! Please login and subscribe to a plan to continue.');
            setShowLoginModal(true);
          }
        }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 md:px-8 py-3 md:py-4 flex justify-between items-center min-h-[60px] md:h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs md:text-sm">PG</span>
            </div>
            <span className="text-lg md:text-xl font-bold text-primary-foreground">Pilot</span>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-3 md:px-5 py-1.5 md:py-2 text-primary-foreground hover:text-accent transition-colors font-semibold text-xs md:text-sm uppercase tracking-wide"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="px-4 md:px-6 py-1.5 md:py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors font-semibold text-xs md:text-sm uppercase tracking-wide"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-8 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-4 md:mb-6 leading-tight px-2">
            Run Your Entire PG on
            <span className="text-accent"> Autopilot</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-foreground mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            Reduce manual work, never miss rent, track every bed in real time. 
            Simplify rent, tenants & mess in one place — built specifically for Indian PG owners.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center flex-wrap px-2 mb-4">
            <button
              onClick={() => setShowSignupModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-all text-sm md:text-lg font-semibold shadow-lg hover:shadow-xl uppercase tracking-wide"
            >
              Get Started Free
              <IconArrowRight />
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 border-2 border-primary text-primary rounded-sm hover:bg-primary hover:text-primary-foreground transition-all text-sm md:text-lg font-semibold uppercase tracking-wide"
            >
              Learn More
            </button>
          </div>
          <p className="text-xs md:text-sm text-foreground/70 px-2">
            No credit card required · Setup in 10 minutes
          </p>
        </div>
      </section>

      {/* Social Proof Stats Strip */}
      <section className="bg-white py-8 md:py-12 border-b border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 md:mb-2">150+</div>
              <div className="text-foreground font-semibold text-xs md:text-sm mb-1">PG Owners</div>
              <div className="text-foreground/70 text-xs">trust PG Pilot to run their properties.</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 md:mb-2">2000+</div>
              <div className="text-foreground font-semibold text-xs md:text-sm mb-1">Rooms Managed</div>
              <div className="text-foreground/70 text-xs">across India with real-time tracking.</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 md:mb-2">5000+</div>
              <div className="text-foreground font-semibold text-xs md:text-sm mb-1">Tenants Tracked</div>
              <div className="text-foreground/70 text-xs">with complete profiles and history.</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-primary mb-1 md:mb-2">25+</div>
              <div className="text-foreground font-semibold text-xs md:text-sm mb-1">Cities</div>
              <div className="text-foreground/70 text-xs">where PG owners rely on PG Pilot.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#E4EDF3] py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs md:text-sm font-bold text-accent uppercase tracking-wider mb-2">Key Features</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-4 px-2">
              Everything You Need to Run Your PG Smoothly
            </h2>
          </div>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white p-4 md:p-6 rounded-sm shadow-[0_1px_4px_0_rgba(0,0,0,0.15)] hover:shadow-xl transition-all duration-500 border-l-4 border-accent relative overflow-hidden group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 text-accent mb-3 md:mb-4 flex items-center justify-center">
                    <IconComponent />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-primary mb-2 md:mb-3 leading-tight">{feature.title}</h3>
                  <p className="text-foreground text-xs md:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-xs md:text-sm font-bold text-accent uppercase tracking-wider mb-2">Simple Pricing</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-4 px-2">
              Choose Your Plan
            </h2>
            <p className="text-sm md:text-lg text-foreground max-w-2xl mx-auto px-2">
              Plans designed for Indian PG owners. Start with free trial, upgrade as your business grows.
            </p>
          </div>
          {loading ? (
            <div className="text-center text-foreground text-sm md:text-base">Loading plans...</div>
          ) : (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`bg-white border rounded-sm p-5 md:p-8 hover:shadow-xl transition-all duration-500 ${
                    idx === 1 ? 'border-accent border-2 shadow-lg md:scale-105' : 'border-border shadow-[0_1px_4px_0_rgba(0,0,0,0.15)]'
                  }`}
                >
                  {idx === 1 && (
                    <div className="bg-primary text-primary-foreground text-xs font-bold px-2 md:px-3 py-1 rounded-sm inline-block mb-3 md:mb-4 uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl md:text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                  <div className="mb-4 md:mb-6">
                    <span className="text-3xl md:text-5xl font-black text-primary">₹{plan.price}</span>
                    <span className="text-foreground text-sm md:text-base">/month</span>
                  </div>
                  <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-foreground text-xs md:text-sm">
                        <IconCheck />
                        <span className="flex-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={paymentLoading}
                    className={`w-full py-2.5 md:py-3 rounded-sm font-semibold transition-all uppercase tracking-wide text-xs md:text-sm flex items-center justify-center gap-2 ${
                      idx === 1
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {paymentLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Opening Payment...</span>
                      </>
                    ) : (
                      'Subscribe Now'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">PG Pilot – PG Management System</h3>
              <p className="text-primary-foreground/80 text-xs md:text-sm leading-relaxed mb-3 md:mb-0">
                Built specially for Indian PG and hostel owners. Manage rent, tenants and payments — all in one place.
              </p>
              <div className="flex gap-2 md:gap-3 mt-3 md:mt-4">
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconFacebook />
                </a>
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconTwitter />
                </a>
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconLinkedin />
                </a>
                <a href="#" className="w-7 h-7 md:w-8 md:h-8 bg-white/10 rounded flex items-center justify-center hover:bg-accent transition-colors">
                  <IconInstagram />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-3 md:mb-4 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs md:text-sm text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Free Trial</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="font-bold text-primary-foreground mb-3 md:mb-4 text-sm md:text-base">Contact</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-primary-foreground/80">
                <li>
                  <b className="block text-primary-foreground mb-1">Address</b>
                  <hr className="border-primary-foreground/20 mb-1 md:mb-2" />
                  <p className="text-primary-foreground/80">Noida, Uttar Pradesh, India</p>
                </li>
                <li>
                  <b className="block text-primary-foreground mb-1">Email</b>
                  <hr className="border-primary-foreground/20 mb-1 md:mb-2" />
                  <a href="mailto:support@pgpilot.com" className="text-primary-foreground/80 hover:text-accent transition-colors break-all">support@pgpilot.com</a>
                </li>
                <li>
                  <b className="block text-primary-foreground mb-1">Phone</b>
                  <hr className="border-primary-foreground/20 mb-1 md:mb-2" />
                  <p className="text-primary-foreground/80">Phone support available between 10 AM – 7 PM IST</p>
                </li>
                <li>
                  <b className="block text-primary-foreground mb-1">Support</b>
                  <hr className="border-primary-foreground/20 mb-1 md:mb-2" />
                  <p className="text-primary-foreground/80 mb-1">Available 24/7</p>
                  <p className="text-primary-foreground/80">WhatsApp onboarding and training available</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-xs md:text-sm text-primary-foreground/80 text-center md:text-left">
              © 2024 PG Pilot – Built for Indian PG Owners
            </p>
            <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-primary-foreground/80">
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
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded hover:bg-accent disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
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
        onClose={() => {
          setShowSignupModal(false);
          setSignupData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            role: 'pg_admin',
            pg_name: '',
            pg_location: '',
          });
          setSignupError('');
          setPendingPlanId(null);
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
              PG Name *
            </label>
            <input
              type="text"
              value={signupData.pg_name}
              onChange={(e) => setSignupData({ ...signupData, pg_name: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Enter your PG name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-foreground text-sm font-bold mb-2">
              PG Location/Address *
            </label>
            <textarea
              value={signupData.pg_location}
              onChange={(e) => setSignupData({ ...signupData, pg_location: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              placeholder="Enter your PG location/address"
              rows="3"
              required
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
            className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded hover:bg-accent disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow"
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
                  pg_name: '',
                  pg_location: '',
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

      {/* PG Creation Modal */}
      <Modal
        isOpen={showPGModal}
        onClose={() => {
          setShowPGModal(false);
          setPendingPlanId(null);
          setPgFormData({ name: '', address: '', food_enabled: false, default_due_day: 5 });
        }}
        title="Create Your PG"
      >
        <form onSubmit={handleCreatePG}>
          <p className="text-sm text-muted-foreground mb-4">
            You need to create a PG before subscribing to a plan. Please fill in the details below.
          </p>
          <Input
            label="PG Name"
            value={pgFormData.name}
            onChange={(e) => setPgFormData({ ...pgFormData, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={pgFormData.address}
            onChange={(e) => setPgFormData({ ...pgFormData, address: e.target.value })}
            type="textarea"
          />
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={pgFormData.food_enabled}
                onChange={(e) => setPgFormData({ ...pgFormData, food_enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-foreground">Food Enabled</span>
            </label>
          </div>
          <Input
            label="Default Due Day"
            type="number"
            value={pgFormData.default_due_day}
            onChange={(e) => setPgFormData({ ...pgFormData, default_due_day: parseInt(e.target.value) || 5 })}
            required
          />
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPGModal(false);
                setPendingPlanId(null);
                setPgFormData({ name: '', address: '', food_enabled: false, default_due_day: 5 });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create PG & Continue</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LandingPage;
