import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { setStoredUser } from '../utils/auth';
import Button from '../components/common/Button';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, subscription } = location.state || {};
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer = null;
    
    // Set flag in sessionStorage to indicate we're coming from payment-success
    sessionStorage.setItem('fromPaymentSuccess', 'true');
    
    // Refresh user data and verify subscription before redirecting
    const refreshUserDataAndVerify = async () => {
      try {
        // Refresh user data
        const userResponse = await api.get('/api/auth/me');
        if (userResponse.data?.user) {
          const currentUser = userResponse.data.user;
          setStoredUser(currentUser);
          
          // Verify subscription exists before redirecting
          if (currentUser.pg_id) {
            try {
              // Add delay and retry logic to ensure subscription is saved in database
              let subscriptionFound = false;
              let retries = 5;
              
              while (retries > 0 && !subscriptionFound) {
                await new Promise(resolve => setTimeout(resolve, 800));
                
                try {
                  const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                  console.log(`PaymentSuccess: Subscription check attempt ${6 - retries}/5 - Response:`, subResponse.data);
                  if (subResponse.data.subscription) {
                    subscriptionFound = true;
                    console.log('PaymentSuccess: Subscription found!', subResponse.data.subscription);
                    break;
                  } else {
                    console.log(`PaymentSuccess: Subscription not found in attempt ${6 - retries}, retrying...`);
                  }
                } catch (subError) {
                  console.log(`PaymentSuccess: Subscription check attempt ${6 - retries} failed, retrying...`, subError);
                }
                
                retries--;
              }
              
              if (subscriptionFound) {
                // Subscription verified - refresh user data one more time and start countdown
                console.log('PaymentSuccess: Subscription verified, refreshing user data before redirect...');
                try {
                  const finalUserResponse = await api.get('/api/auth/me');
                  if (finalUserResponse.data?.user) {
                    setStoredUser(finalUserResponse.data.user);
                  }
                } catch (e) {
                  console.error('Error refreshing user data:', e);
                }
                
                // Start countdown - pass state to ProtectedRoute
                timer = setInterval(() => {
                  setCountdown((prev) => {
                    if (prev <= 1) {
                      clearInterval(timer);
                      console.log('PaymentSuccess: Redirecting to dashboard with payment-success flag...');
                      // Pass state to indicate we're coming from payment-success
                      navigate('/dashboard', { 
                        replace: true,
                        state: { fromPaymentSuccess: true, subscriptionVerified: true }
                      });
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              } else {
                // Subscription not found after retries - still try dashboard
                // ProtectedRoute will handle verification with its own retry logic
                console.warn('PaymentSuccess: Subscription not found after retries, redirecting to dashboard (ProtectedRoute will verify)');
                timer = setInterval(() => {
                  setCountdown((prev) => {
                    if (prev <= 1) {
                      clearInterval(timer);
                      navigate('/dashboard', { 
                        replace: true,
                        state: { fromPaymentSuccess: true }
                      });
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              }
            } catch (subError) {
              console.error('Error verifying subscription:', subError);
              // If subscription check fails, still try to go to dashboard
              // ProtectedRoute will handle it
              timer = setInterval(() => {
                setCountdown((prev) => {
                  if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/dashboard', { 
                      replace: true,
                      state: { fromPaymentSuccess: true }
                    });
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
          } else {
            // No PG ID - redirect to register PG
            navigate('/register-pg', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        // On error, still try to redirect after delay
        setTimeout(() => {
          navigate('/dashboard', { 
            replace: true,
            state: { fromPaymentSuccess: true }
          });
        }, 2000);
      }
    };

    refreshUserDataAndVerify();

    // Prevent back navigation to plan page
    const handlePopState = () => {
      navigate('/dashboard', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleGoToDashboard = async () => {
    // Verify subscription before navigating
    try {
      const userResponse = await api.get('/api/auth/me');
      if (userResponse.data?.user) {
        const currentUser = userResponse.data.user;
        setStoredUser(currentUser);
        
        if (currentUser.pg_id) {
          try {
            // Add delay and retry logic to ensure subscription is saved
            let subscriptionFound = false;
            let retries = 5;
            
            while (retries > 0 && !subscriptionFound) {
              await new Promise(resolve => setTimeout(resolve, 800));
              
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                if (subResponse.data.subscription) {
                  subscriptionFound = true;
                  break;
                }
              } catch (subError) {
                console.log(`Subscription check attempt ${6 - retries} failed, retrying...`);
              }
              
              retries--;
            }
            
            if (subscriptionFound) {
              navigate('/dashboard', { 
                replace: true,
                state: { fromPaymentSuccess: true, subscriptionVerified: true }
              });
            } else {
              alert('Subscription verification is taking longer than expected. Redirecting to dashboard...');
              navigate('/dashboard', { 
                replace: true,
                state: { fromPaymentSuccess: true }
              });
            }
          } catch (error) {
            console.error('Error verifying subscription:', error);
            // Still try to navigate - ProtectedRoute will handle it
            navigate('/dashboard', { replace: true });
          }
        } else {
          navigate('/register-pg', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      navigate('/dashboard', { 
        replace: true,
        state: { fromPaymentSuccess: true }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-[#0F1720] rounded-xl shadow-xl border border-primary/10 p-8 sm:p-10 md:p-12 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-[#22D3EE]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#E5E7EB] mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-[#D1D5DB] text-base sm:text-lg mb-2">
              Your subscription to <span className="font-semibold text-primary">{plan?.name || 'the plan'}</span> has been activated.
            </p>
            {subscription?.expiry_date && (
              <p className="text-[#9CA3AF] text-sm">
                Your subscription is active until {new Date(subscription.expiry_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mt-8">
            <Button
              onClick={handleGoToDashboard}
              className="w-full sm:w-auto px-8 py-3 text-lg"
            >
              Go to Dashboard {countdown > 0 && `(${countdown}s)`}
            </Button>
            {countdown > 0 && (
              <p className="text-[#9CA3AF] text-sm mt-3">
                Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

