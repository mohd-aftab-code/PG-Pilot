import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';

const ProtectedRoute = ({ children, requireRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const user = getStoredUser();
  
  // Routes that don't require subscription
  const publicRoutes = ['/pgs', '/plans'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

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

        // If we have stored user and token, allow access immediately
        if (user && hasToken) {
          setIsAuthenticated(true);
          setLoading(false);
          
          // Verify in background (non-blocking)
          try {
            const response = await api.get('/api/auth/me');
            if (response.data && response.data.user) {
              setStoredUser(response.data.user);
            }
          } catch (apiError) {
            // Silent fail - user already authenticated
            console.log('Background auth check failed:', apiError);
          }
          return;
        }

        // Try to get user from backend to verify token
        try {
          const response = await api.get('/api/auth/me');
          if (response.data && response.data.user) {
            const currentUser = response.data.user;
            setStoredUser(currentUser);
            setIsAuthenticated(true);
            
            // Check subscription for pg_admin (except for public routes)
            if (currentUser.role === 'pg_admin' && !isPublicRoute && currentUser.pg_id) {
              try {
                const subResponse = await api.get(`/api/subscriptions/pg/${currentUser.pg_id}/active`);
                setHasSubscription(subResponse.data.subscription !== null);
              } catch (subError) {
                // If no subscription found, set to false
                setHasSubscription(false);
              }
            } else {
              // Superadmin or public routes don't need subscription
              setHasSubscription(true);
            }
          } else {
            setIsAuthenticated(false);
            setHasSubscription(false);
          }
        } catch (apiError) {
          // If API call fails, check if we have token
          if (hasToken) {
            // Allow access if token exists (might be network issue)
            setIsAuthenticated(true);
            setHasSubscription(true); // Assume has subscription on network error
          } else {
            setIsAuthenticated(false);
            setHasSubscription(false);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If we have stored user and cookie, allow access
        if (user && document.cookie.includes('token=')) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user]);

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
    return <Navigate to="/" replace state={{ modal: 'login' }} />;
  }

  // Check role requirement if specified
  if (requireRole && user && user.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check subscription for pg_admin (except superadmin and public routes)
  if (user && user.role === 'pg_admin' && !isPublicRoute && hasSubscription === false) {
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ message: 'Please subscribe to a plan to access the dashboard' }} 
      />
    );
  }

  return children;
};

export default ProtectedRoute;

