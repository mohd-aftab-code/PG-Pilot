import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const fetchSubscriptionStatus = async () => {
    try {
      const user = getStoredUser();
      if (!user || !user.pg_id) {
        setSubscriptionStatus(null);
        setTrialInfo(null);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
      const data = response.data;

      console.log('SubscriptionContext: Fetched subscription data:', {
        hasAccess: data.hasAccess,
        trial: data.trial,
        subscription: data.subscription,
        pg_id: user.pg_id
      });

      setSubscriptionStatus(data.subscription);
      setTrialInfo(data.trial);
      setHasAccess(data.hasAccess || false);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus(null);
      setTrialInfo(null);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Trial is active if: status is TRIAL AND isActive is true
  const isTrialActive = trialInfo?.status === 'TRIAL' && trialInfo?.isActive === true;
  
  // Trial is expired if: status is TRIAL BUT isActive is false (or not set)
  // OR if trial exists but endDate has passed
  const isTrialExpired = trialInfo?.status === 'TRIAL' && (
    trialInfo?.isActive === false || 
    (trialInfo?.endDate && new Date(trialInfo.endDate) < new Date())
  );
  
  const hasActiveSubscription = subscriptionStatus !== null;
  const isReadOnly = !hasAccess;

  // Debug logging
  console.log('SubscriptionContext: Calculated states:', {
    isTrialActive,
    isTrialExpired,
    hasActiveSubscription,
    hasAccess,
    trialInfo,
    subscriptionStatus
  });

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (isTrialActive && trialInfo?.endDate) {
      const endDate = new Date(trialInfo.endDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    if (hasActiveSubscription && subscriptionStatus?.expiry_date) {
      const endDate = new Date(subscriptionStatus.expiry_date);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const value = {
    subscriptionStatus,
    trialInfo,
    loading,
    hasAccess,
    isTrialActive,
    isTrialExpired,
    hasActiveSubscription,
    isReadOnly,
    daysRemaining: getDaysRemaining(),
    refreshSubscription: fetchSubscriptionStatus
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

