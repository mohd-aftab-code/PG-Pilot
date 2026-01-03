import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
                  // No subscription - stay on landing page, scroll to plans
                  setTimeout(() => {
                    const plansSection = document.getElementById('pricing-plans');
                    if (plansSection) {
                      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 300);
                }
              } catch (error) {
                // No subscription - stay on landing page, scroll to plans
                setTimeout(() => {
                  const plansSection = document.getElementById('pricing-plans');
                  if (plansSection) {
                    plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 300);
              }
            } else {
              // No PG created yet - should not happen in normal flow
              alert('Please create a PG first, then subscribe to a plan.');
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
                  // Has active subscription - go to dashboard
                  navigate('/dashboard');
                } else {
                  // No subscription - stay on landing page to subscribe
                  alert('Welcome back! Please subscribe to a plan to access your dashboard.');
                  // User stays on landing page - can select a plan
                }
              } catch (error) {
                // No subscription found
                alert('Welcome back! Please subscribe to a plan to access your dashboard.');
                // User stays on landing page - can select a plan
              }
            } else {
              // No PG created yet - should not happen if flow is correct
              alert('Please create a PG first, then subscribe to a plan.');
              // Could redirect to PG creation page or show PG creation modal
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

  // Marketplace search state
  const [searchParams, setSearchParams] = useState({
    city: '',
    area: '',
    budget_min: '',
    budget_max: '',
    gender: '',
    has_food: false,
    has_wifi: false,
    has_ac: false,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const searchLimit = 10;

  // Autocomplete suggestions state
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Fetch search suggestions
  const fetchSuggestions = async (query, type = 'both') => {
    if (!query || query.trim().length < 2) {
      if (type === 'city' || type === 'both') setCitySuggestions([]);
      if (type === 'area' || type === 'both') setAreaSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await api.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        if (type === 'city' || type === 'both') {
          setCitySuggestions(response.data.suggestions.cities || []);
        }
        if (type === 'area' || type === 'both') {
          setAreaSuggestions(response.data.suggestions.areas || []);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Handle city input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchParams.city && searchParams.city.length >= 2) {
        fetchSuggestions(searchParams.city, 'city');
        setShowCitySuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParams.city]);

  // Handle area input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchParams.area && searchParams.area.length >= 2) {
        fetchSuggestions(searchParams.area, 'area');
        setShowAreaSuggestions(true);
      } else {
        setAreaSuggestions([]);
        setShowAreaSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchParams.area]);

  // Marketplace search function
  const handleMarketplaceSearch = async (pageNum = 1) => {
    if (!searchParams.city) {
      alert('Please enter a city');
      return;
    }

    setSearchLoading(true);
    setShowCitySuggestions(false);
    setShowAreaSuggestions(false);
    try {
      const params = new URLSearchParams({
        city: searchParams.city,
        page: pageNum.toString(),
        limit: searchLimit.toString(),
      });

      if (searchParams.area) params.append('area', searchParams.area);
      if (searchParams.budget_min) params.append('budget_min', searchParams.budget_min);
      if (searchParams.budget_max) params.append('budget_max', searchParams.budget_max);
      if (searchParams.gender) params.append('gender', searchParams.gender);
      if (searchParams.has_food) params.append('has_food', 'true');
      if (searchParams.has_wifi) params.append('has_wifi', 'true');
      if (searchParams.has_ac) params.append('has_ac', 'true');

      console.log('Searching with params:', params.toString());
      const response = await api.get(`/api/search/pgs?${params.toString()}`);
      
      console.log('=== SEARCH RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Success:', response.data?.success);
      console.log('Data array:', response.data?.data);
      console.log('Data length:', response.data?.data?.length);
      console.log('Total:', response.data?.total);
      
      if (response.data && response.data.success) {
        const results = response.data.data || [];
        const total = response.data.total || 0;
        
        console.log('Setting search results:', results);
        console.log('Results count:', results.length);
        console.log('Setting total:', total);
        console.log('First result sample:', results[0]);
        
        setSearchResults(results);
        setSearchTotal(total);
        setSearchPage(pageNum);
        setHasSearched(true);
        
        // Additional debug
        console.log('State updated - searchResults length:', results.length);
        console.log('State updated - hasSearched:', true);
        
        // Scroll to results
        setTimeout(() => {
          const resultsElement = document.getElementById('search-results');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        console.error('Search failed:', response.data);
        setSearchResults([]);
        setSearchTotal(0);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchTotal(0);
      setHasSearched(true);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to search PGs. Please try again.';
      alert(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleMarketplaceSearch(1);
  };

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
        
        // After successful registration and PG creation:
        // Step 1: User is now logged in (token set)
        // Step 2: If PG created, check subscription
        // Step 3: If no subscription, prompt for subscription
        
        setTimeout(async () => {
          // Refresh user data to get updated pg_id
          try {
            const currentUserResponse = await api.get('/api/auth/me');
            const currentUser = currentUserResponse.data.user;
            setStoredUser(currentUser);
            
            if (currentUser.role === 'superadmin') {
              navigate('/pgs');
              return;
            }
            
            // For PG Admin: Check if they have subscription
            if (currentUser.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                if (subResponse.data.subscription) {
                  // Has subscription - go to dashboard
                  navigate('/dashboard');
                } else {
                  // No subscription - show success message and scroll to plans
                  alert('✅ Registration Successful!\n\nYour account and PG have been created.\n\nPlease subscribe to a plan below to access your dashboard.');
                  // Scroll to plans section
                  setTimeout(() => {
                    const plansSection = document.getElementById('pricing-plans');
                    if (plansSection) {
                      plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 500);
                }
              } catch (subError) {
                // No subscription found - show success and scroll to plans
                alert('✅ Registration Successful!\n\nYour account and PG have been created.\n\nPlease subscribe to a plan below to access your dashboard.');
                // Scroll to plans section
                setTimeout(() => {
                  const plansSection = document.getElementById('pricing-plans');
                  if (plansSection) {
                    plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 500);
              }
            } else {
              // PG creation failed or pending
              alert('✅ Account created successfully!\n\nPlease create your PG first, then subscribe to a plan.');
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            alert('✅ Registration Successful!\n\nPlease login and subscribe to a plan to continue.');
            setShowLoginModal(true);
          }
        }, 500);
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
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 border-2 border-[#22D3EE] text-[#22D3EE] rounded-lg hover:bg-[#22D3EE] hover:text-[#0B0F14] transition-all text-sm sm:text-base md:text-lg font-semibold active:scale-95"
            >
              Learn More
            </button>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-[#9CA3AF]">
            No credit card required · Setup in 10 minutes
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
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">trust PG Pilot to run their properties.</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">2000+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Rooms Managed</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">across India with real-time tracking.</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">5000+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Tenants Tracked</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">with complete profiles and history.</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">25+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Cities</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">where PG owners rely on PG Pilot.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section - For Tenants */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">For Tenants</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight">
                Find Your Perfect PG
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2">
                Search from verified PGs with real-time availability. Filter by location, budget, facilities, and more.
              </p>
            </div>

            {/* Compact Search Form */}
            <div className="bg-[#0F1720] rounded-xl shadow-xl border border-primary/10 p-4 sm:p-5 md:p-6 mb-8 sm:mb-10">
              <form onSubmit={handleSearchSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">City *</label>
                    <input
                      type="text"
                      value={searchParams.city}
                      onChange={(e) => {
                        setSearchParams({ ...searchParams, city: e.target.value });
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => {
                        if (citySuggestions.length > 0) setShowCitySuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowCitySuggestions(false), 200);
                      }}
                      className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="e.g., Noida"
                      required
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {citySuggestions.map((city, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchParams({ ...searchParams, city });
                              setShowCitySuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#E5E7EB] hover:bg-[#0F1720] focus:bg-[#0F1720] focus:outline-none border-b border-primary/20 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{city}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestionsLoading && showCitySuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-2">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                          <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">Area</label>
                    <input
                      type="text"
                      value={searchParams.area}
                      onChange={(e) => {
                        setSearchParams({ ...searchParams, area: e.target.value });
                        setShowAreaSuggestions(true);
                      }}
                      onFocus={() => {
                        if (areaSuggestions.length > 0) setShowAreaSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAreaSuggestions(false), 200);
                      }}
                      className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="e.g., Sector 44"
                    />
                    {showAreaSuggestions && areaSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {areaSuggestions.map((area, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchParams({ ...searchParams, area });
                              setShowAreaSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#E5E7EB] hover:bg-[#0F1720] focus:bg-[#0F1720] focus:outline-none border-b border-primary/20 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{area}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestionsLoading && showAreaSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-2">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                          <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">Budget (₹)</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <input
                        type="number"
                        value={searchParams.budget_min}
                        onChange={(e) => setSearchParams({ ...searchParams, budget_min: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={searchParams.budget_max}
                        onChange={(e) => setSearchParams({ ...searchParams, budget_max: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">Gender</label>
                    <select
                      value={searchParams.gender}
                      onChange={(e) => setSearchParams({ ...searchParams, gender: e.target.value })}
                      className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center text-sm text-[#E5E7EB] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_food}
                        onChange={(e) => setSearchParams({ ...searchParams, has_food: e.target.checked })}
                        className="mr-2 w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span>Food</span>
                    </label>
                    <label className="flex items-center text-sm text-[#E5E7EB] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_wifi}
                        onChange={(e) => setSearchParams({ ...searchParams, has_wifi: e.target.checked })}
                        className="mr-2 w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span>WiFi</span>
                    </label>
                    <label className="flex items-center text-sm text-[#E5E7EB] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_ac}
                        onChange={(e) => setSearchParams({ ...searchParams, has_ac: e.target.checked })}
                        className="mr-2 w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span>AC</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="w-full sm:w-auto sm:ml-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#14B8A6] text-white rounded-lg hover:bg-[#2DD4BF] disabled:opacity-50 font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
                  >
                    {searchLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search PGs
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Search Results */}
            <div id="search-results">
              {searchLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
                  <p className="mt-4 text-[#D1D5DB]">Searching for PGs...</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && !hasSearched && (
                <div className="bg-[#0F1720] rounded-lg shadow-md border border-primary/20 p-8 md:p-12 text-center">
                  <div className="w-16 h-16 bg-[#0B0F14] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">Start Your Search</h3>
                  <p className="text-[#D1D5DB]">Enter a city above and click "Search PGs" to find available PGs.</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && hasSearched && (
                <div className="bg-[#0F1720] rounded-lg shadow-md border border-primary/20 p-8 md:p-12 text-center">
                  <div className="w-16 h-16 bg-[#0B0F14] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">No PGs Found</h3>
                  <p className="text-[#D1D5DB] mb-4">Try adjusting your search filters or search in a different city/area.</p>
                  <button
                    onClick={() => {
                      setSearchParams({
                        city: '',
                        area: '',
                        budget_min: '',
                        budget_max: '',
                        gender: '',
                        has_food: false,
                        has_wifi: false,
                        has_ac: false,
                      });
                      setSearchResults([]);
                      setHasSearched(false);
                      setSearchTotal(0);
                    }}
                    className="text-accent hover:text-accent/80 font-medium text-sm"
                  >
                    Clear Filters & Search Again
                  </button>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm md:text-base text-[#E5E7EB]">
                      Found <span className="font-bold text-primary">{searchTotal}</span> PG{searchTotal !== 1 ? 's' : ''} matching your search
                    </p>
                  </div>
                  <div className="space-y-4">
                    {searchResults.map((pg) => (
                      <div
                        key={pg.pg_id}
                        className="bg-[#0F1720] rounded-lg shadow-md border border-primary/20 p-5 md:p-6 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                      >
                        {/* PG Images */}
                        {pg.images && Array.isArray(pg.images) && pg.images.length > 0 && (
                          <div className="mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {pg.images.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                                  <img
                                    src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                                    alt={`${pg.pg_name} - Image ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-primary mb-1">{pg.pg_name || 'PG Name'}</h3>
                            <p className="text-sm text-[#D1D5DB] flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {pg.area && `${pg.area}, `}{pg.city || 'City not specified'}
                            </p>
                          </div>
                          {pg.address && (
                            <button
                              onClick={() => {
                                const address = encodeURIComponent(`${pg.address}, ${pg.area || ''}, ${pg.city || ''}`);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                              }}
                              className="text-accent hover:text-accent/80 text-sm font-medium flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View on Map
                            </button>
                          )}
                        </div>

                        {pg.address && (
                          <p className="text-[#E5E7EB] mb-3 text-sm">{pg.address}</p>
                        )}

                        {pg.facilities && Array.isArray(pg.facilities) && pg.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {pg.facilities.map((facility, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-teal-accent/20 text-teal-accent text-xs font-medium rounded-full"
                              >
                                {facility}
                              </span>
                            ))}
                          </div>
                        )}

                        {pg.rooms && Array.isArray(pg.rooms) && pg.rooms.length > 0 ? (
                          <div className="mt-4 mb-4">
                            <h4 className="text-sm font-semibold mb-2 text-[#E5E7EB]">Available Rooms:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {pg.rooms.map((room) => (
                                <div
                                  key={room.room_id || Math.random()}
                                  className="flex justify-between items-center p-2.5 bg-[#0B0F14] rounded border border-primary/20"
                                >
                                  <div>
                                    <span className="font-medium text-sm text-[#E5E7EB]">{room.room_name || 'Room'}</span>
                                    {room.gender_type && (
                                      <span className="text-xs text-[#9CA3AF] ml-2">
                                        ({room.gender_type})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-primary">₹{room.rent_per_bed || 0}/bed</div>
                                    <div className="text-xs text-[#9CA3AF]">
                                      {room.available_beds || 0} bed{(room.available_beds || 0) !== 1 ? 's' : ''} available
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 mb-4 p-3 bg-[#0B0F14] border border-primary/20 rounded text-sm text-[#D1D5DB]">
                            No rooms available at the moment. Please contact the PG owner for availability.
                          </div>
                        )}

                        <button
                          onClick={() => navigate(`/marketplace/pg/${pg.pg_id}`)}
                          className="w-full bg-[#14B8A6] text-white py-2.5 rounded-md hover:bg-[#2DD4BF] font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                        >
                          View Details & Send Inquiry
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {searchTotal > searchLimit && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={() => handleMarketplaceSearch(searchPage - 1)}
                        disabled={searchPage === 1}
                        className="px-4 py-2 border border-primary/20 bg-[#0F1720] text-[#E5E7EB] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0B0F14] transition-colors font-medium text-sm"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#E5E7EB]">
                          Page <span className="font-semibold">{searchPage}</span> of <span className="font-semibold">{Math.ceil(searchTotal / searchLimit)}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => handleMarketplaceSearch(searchPage + 1)}
                        disabled={searchPage >= Math.ceil(searchTotal / searchLimit)}
                        className="px-4 py-2 border border-primary/20 bg-[#0F1720] text-[#E5E7EB] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0B0F14] transition-colors font-medium text-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
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
              Everything You Need to Run Your PG Smoothly
            </h2>
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
            <div className="text-center text-[#E5E7EB] text-sm sm:text-base">Loading plans...</div>
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
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={paymentLoading}
                    className={`w-full py-3 sm:py-3.5 md:py-4 rounded-lg font-semibold transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 ${
                      idx === 1
                        ? 'bg-[#14B8A6] text-white hover:bg-[#2DD4BF] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720] disabled:opacity-50 disabled:cursor-not-allowed'
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
      <footer className="relative w-full border-t border-primary/10 py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">PG Pilot – PG Management System</h3>
              <p className="text-[#D1D5DB] text-xs md:text-sm leading-relaxed mb-3 md:mb-0">
                Built specially for Indian PG and hostel owners. Manage rent, tenants and payments — all in one place.
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
                <li><Link to="/marketplace/search" className="hover:text-accent transition-colors">Find PG</Link></li>
                <li><a href="#features" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Free Trial</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
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
              © 2024 PG Pilot – Built for Indian PG Owners
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
