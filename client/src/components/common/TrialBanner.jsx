import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';
import Button from './Button';

const TrialBanner = () => {
  const navigate = useNavigate();
  const { 
    isTrialActive, 
    isTrialExpired, 
    hasActiveSubscription, 
    daysRemaining,
    isReadOnly 
  } = useSubscription();

  // Don't show banner if user has active paid subscription
  if (hasActiveSubscription && !isTrialActive) {
    return null;
  }

  // Trial active banner
  if (isTrialActive) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 shadow-md">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">Free Trial Active</p>
              <p className="text-sm text-blue-100">
                {daysRemaining > 0 
                  ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your free trial`
                  : 'Your trial ends today'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/choose-plan')}
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md font-medium text-sm"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  // Trial expired / Read-only banner
  if (isTrialExpired || isReadOnly) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-md">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛔</span>
            <div>
              <p className="font-semibold">Trial Expired - Read-Only Mode</p>
              <p className="text-sm text-orange-100">
                Your free trial has ended. Upgrade to a plan to continue managing your PG.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/choose-plan')}
            className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-md font-medium text-sm"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default TrialBanner;

