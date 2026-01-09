import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';

const ProtectedRoute = ({ children, requireRole, requirePG, requirePlan }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(null);
  const [hasPG, setHasPG] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const user = getStoredUser();
  
  // Routes that don't require subscription
  const publicRoutes = ['/pgs', '/plans'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
  
  // Onboarding routes that have their own guards
  const onboardingRoutes = ['/register-pg', '/pg-success', '/choose-plan', '/payment-success'];
  const isOnboardingRoute = onboardingRoutes.some(route => location.pathname === route);
  
  // Check if we're coming from payment-success (check location state or sessionStorage)
  const fromPaymentSuccess = location.state?.fromPaymentSuccess === true || sessionStorage.getItem('fromPaymentSuccess') === 'true';
  const subscriptionVerified = location.state?.subscriptionVerified === true;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check cookie first
        const hasToken = document.cookie.includes('token=');
        
        if (!hasToken && !user) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Always refresh user data from API to get latest state (especially after payment)
        try {
          const response = await api.get('/api/auth/me');
          if (response.data && response.data.user) {
            const currentUser = response.data.user;
            setStoredUser(currentUser);
            setIsAuthenticated(true);
            
            // Check PG and subscription for pg_admin
            if (currentUser.role === 'pg_admin') {
              setHasPG(!!currentUser.pg_id);
              
              if (!isPublicRoute && currentUser.pg_id) {
                try {
                  // Add retry logic for subscription check (in case payment just completed)
                  let subscriptionFound = false;
                  // If coming from payment-success, retry more times
                  let retries = fromPaymentSuccess ? 8 : 5;
                  let delay = fromPaymentSuccess ? 1500 : 1000;
                  
                  while (retries > 0 && !subscriptionFound) {
                    try {
                      // Add delay before each check
                      if (retries < (fromPaymentSuccess ? 8 : 5)) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                      }
                      
                      const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                      // Check for either active subscription OR active trial
                      // hasAccess already includes both trial and subscription
                      subscriptionFound = subResponse.data.hasAccess === true;
                      
                      console.log(`ProtectedRoute: Subscription check (${(fromPaymentSuccess ? 9 : 6) - retries}/${fromPaymentSuccess ? 8 : 5}) - Found: ${subscriptionFound}, PG ID: ${currentUser.pg_id}`, {
                        hasAccess: subResponse.data.hasAccess,
                        hasAccessType: typeof subResponse.data.hasAccess,
                        hasAccessValue: subResponse.data.hasAccess,
                        subscription: subResponse.data.subscription,
                        trial: subResponse.data.trial,
                        trialIsActive: subResponse.data.trial?.isActive,
                        trialStatus: subResponse.data.trial?.status,
                        trialEndDate: subResponse.data.trial?.endDate,
                        fullResponse: subResponse.data
                      });
                      
                      // Double check: if hasAccess is false but trial is active, log warning
                      if (!subscriptionFound && subResponse.data.trial?.isActive === true) {
                        console.error('ProtectedRoute: WARNING - hasAccess is false but trial.isActive is true! This is a backend bug.');
                      }
                      
                      setHasSubscription(subscriptionFound);
                      
                      // If coming from payment-success and subscription found, clear the flag
                      if (subscriptionFound && fromPaymentSuccess) {
                        sessionStorage.removeItem('fromPaymentSuccess');
                      }
                      
                      break;
                    } catch (subError) {
                      console.log(`ProtectedRoute: Subscription check attempt ${(fromPaymentSuccess ? 9 : 6) - retries}/${fromPaymentSuccess ? 8 : 5} failed, retrying...`, subError.response?.data || subError.message);
                      retries--;
                      if (retries === 0) {
                        console.error('ProtectedRoute: All subscription check retries failed');
                        setHasSubscription(false);
                        // Clear flag if all retries failed
                        if (fromPaymentSuccess) {
                          sessionStorage.removeItem('fromPaymentSuccess');
                        }
                      }
                    }
                  }
                } catch (subError) {
                  console.error('Subscription check error:', subError);
                  setHasSubscription(false);
                }
              } else {
                setHasSubscription(false);
              }
            } else {
              // Superadmin doesn't need PG or subscription
              setHasPG(true);
              setHasSubscription(true);
            }
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error('Auth API error:', apiError);
          // If API fails but we have token and user, try to use cached data
          if (hasToken && user) {
            setIsAuthenticated(true);
            setHasPG(!!user.pg_id);
            // Try to check subscription if we have pg_id
            if (user.pg_id && !isPublicRoute) {
              try {
                // Add retry logic for subscription check
                let subscriptionFound = false;
                let retries = 3;
                
                while (retries > 0 && !subscriptionFound) {
                  try {
                    const subResponse = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
                    // Check for either active subscription OR active trial
                    // hasAccess already includes both trial and subscription
                    subscriptionFound = subResponse.data.hasAccess === true;
                    setHasSubscription(subscriptionFound);
                    break;
                  } catch (subError) {
                    retries--;
                    if (retries > 0) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                      setHasSubscription(false);
                    }
                  }
                }
              } catch (subError) {
                setHasSubscription(false);
              }
            } else {
              setHasSubscription(false);
            }
            setLoading(false);
            return;
          }
        }

        // If no user found and no token, not authenticated
        setIsAuthenticated(false);
        setHasSubscription(false);
      } catch (error) {
        console.error('Auth check error:', error);
        // If we have stored user and cookie, allow access
        if (user && document.cookie.includes('token=')) {
          setIsAuthenticated(true);
          setHasPG(!!user.pg_id);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-foreground mb-2">Loading...</div>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/for-owners" replace state={{ modal: 'login' }} />;
  }

  // Check role requirement if specified
  if (requireRole && user && user.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // For PG Admin: Check onboarding state
  if (user && user.role === 'pg_admin' && !isPublicRoute && !isOnboardingRoute) {
    // Require PG if specified
    if (requirePG !== false && hasPG === false) {
      console.log('ProtectedRoute: No PG found, redirecting to register-pg');
      return <Navigate to="/register-pg" replace />;
    }
    
    // If subscription check is still loading (null), wait a bit more
    if (requirePlan !== false && hasSubscription === null && hasPG === true) {
      console.log('ProtectedRoute: Subscription check still loading, showing loading screen');
      // Don't redirect yet, let it load
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="text-foreground mb-2">Verifying subscription...</div>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      );
    }
    
    // Require plan if specified - only redirect if we're sure subscription is false (not null/loading)
    // BUT: If coming from payment-success and subscription was verified there, don't redirect
    // hasSubscription already includes trial check (via hasAccess), so if false, means both trial and subscription expired
    if (requirePlan !== false && hasSubscription === false && hasSubscription !== null && !subscriptionVerified) {
      console.log('ProtectedRoute: No subscription/trial found, redirecting to choose-plan. PG ID:', user.pg_id);
      // If has PG but no plan/trial, go to choose plan
      if (hasPG === true) {
        return <Navigate to="/choose-plan" replace />;
      }
      // If no PG, go to register PG first
      return <Navigate to="/register-pg" replace />;
    }
    
    // If coming from payment-success with verified subscription, allow access even if check is still pending
    if (requirePlan !== false && fromPaymentSuccess && subscriptionVerified && hasSubscription === null) {
      console.log('ProtectedRoute: Coming from payment-success with verified subscription, allowing access');
      // Don't redirect, allow access
    }
  }

  // Check subscription for pg_admin (except superadmin and public routes)
  // Only redirect if we're sure subscription is false (not null/loading) AND not coming from payment-success with verification
  if (user && user.role === 'pg_admin' && !isPublicRoute && !isOnboardingRoute && hasSubscription === false && hasSubscription !== null && !subscriptionVerified) {
    console.log('ProtectedRoute: No subscription found (fallback check), redirecting to choose-plan');
    // If has PG, redirect to choose plan
    if (hasPG === true) {
      return <Navigate to="/choose-plan" replace />;
    }
    // If no PG, redirect to register PG
    return <Navigate to="/register-pg" replace />;
  }
  
  // If we reach here and subscription is true, allow access
  if (user && user.role === 'pg_admin' && hasSubscription === true) {
    console.log('ProtectedRoute: Subscription verified, allowing access to dashboard');
  }

  return children;
};

export default ProtectedRoute;

