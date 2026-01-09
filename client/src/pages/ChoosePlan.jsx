import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import { useSubscription } from '../context/SubscriptionContext';
import { SkeletonCard } from '../components/common/Skeleton';
import Button from '../components/common/Button';

const ChoosePlan = () => {
  const navigate = useNavigate();
  const { subscriptionStatus, trialInfo, isTrialExpired, hasActiveSubscription } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptionInfo();
    api.get('/api/subscription-payment/razorpay-key')
      .then(res => setRazorpayKey(res.data.key))
      .catch(err => console.error('Error loading Razorpay key:', err));
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const user = getStoredUser();
      if (user && user.pg_id) {
        const response = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
        setSubscriptionInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  // Get expired subscription info
  const expiredSubscription = subscriptionInfo?.expiredSubscription || null;

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/plans/public');
      const fetchedPlans = response.data.plans || [];
      
      const formattedPlans = fetchedPlans.map(plan => ({
        ...plan,
        features: [
          `Up to ${plan.max_pgs || 1} PG${plan.max_pgs > 1 ? 's' : ''}`,
          `${plan.max_tenants || 'Unlimited'} tenants`,
          `${plan.max_rooms || 'Unlimited'} rooms`,
          plan.features || 'All basic features',
        ],
      }));
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (planId) => {
    try {
      setPaymentLoading(true);
      
      const response = await api.post('/api/subscription-payment/create-order', {
        plan_id: planId,
      });

      const { order_id, plan } = response.data;

      const options = {
        key: razorpayKey,
        amount: response.data.amount,
        currency: response.data.currency,
        name: 'PG Pilot',
        description: `Subscription: ${plan.name}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post('/api/subscription-payment/verify', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan_id: planId,
            });

            // Redirect to payment success page
            navigate('/payment-success', { 
              replace: true,
              state: {
                plan: verifyResponse.data?.plan || plan,
                subscription: verifyResponse.data?.subscription,
              }
            });
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: getStoredUser()?.name || '',
          email: getStoredUser()?.email || '',
          contact: getStoredUser()?.phone || '',
        },
        theme: {
          color: '#14B8A6',
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

  const handleSubscribe = async (planId) => {
    const user = getStoredUser();
    
    if (!user || !user.pg_id) {
      alert('Please register your PG first.');
      navigate('/register-pg', { replace: true });
      return;
    }

    if (!razorpayKey) {
      alert('Payment gateway is loading. Please wait a moment and try again.');
      return;
    }

    if (!window.Razorpay) {
      alert('Razorpay is not loaded. Please refresh the page and try again.');
      return;
    }

    await initiatePayment(planId);
  };

  const IconCheck = () => (
    <svg className="w-5 h-5 text-[#22D3EE] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#E5E7EB] mb-4">
            Choose Your Plan
          </h1>
          
          {/* Show expired subscription/trial message */}
          {(isTrialExpired || expiredSubscription) && (
            <div className="max-w-3xl mx-auto mb-6">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-2xl">⛔</span>
                  <p className="text-[#FFA500] font-semibold text-lg sm:text-xl">
                    {isTrialExpired ? 'Trial Expired' : 'Subscription Expired'}
                  </p>
                </div>
                <p className="text-[#D1D5DB] text-sm sm:text-base mb-2">
                  {isTrialExpired 
                    ? 'Your free plan has expired. Please choose a subscription plan to continue using PG Pilot.'
                    : expiredSubscription 
                      ? `Your ${expiredSubscription.plan_name || 'subscription'} expired on ${new Date(expiredSubscription.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Please renew to continue.`
                      : 'Select a subscription plan to activate your PG and access all features.'}
                </p>
              </div>
            </div>
          )}
          
          {!isTrialExpired && hasActiveSubscription && (
            <p className="text-[#D1D5DB] text-base sm:text-lg max-w-3xl mx-auto">
              Select a subscription plan to activate your PG and access all features.
            </p>
          )}
          
          {!isTrialExpired && !hasActiveSubscription && !subscriptionStatus && (
            <p className="text-[#D1D5DB] text-base sm:text-lg max-w-3xl mx-auto">
              Select a subscription plan to activate your PG and access all features.
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonCard key={idx} showHeader={true} lines={6} showButton={true} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className={`bg-[#0F1720] border rounded-lg p-6 sm:p-8 hover:shadow-xl transition-all duration-300 ${
                  idx === 1 ? 'border-accent border-2 shadow-lg md:scale-105' : 'border-primary/10'
                }`}
              >
                {idx === 1 && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg inline-block mb-4 uppercase">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-primary mb-3">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl md:text-5xl font-black text-primary">₹{plan.price}</span>
                  <span className="text-[#E5E7EB] text-lg ml-1">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-[#E5E7EB] text-sm">
                      <IconCheck />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={paymentLoading}
                  className={`w-full ${
                    idx === 1
                      ? 'bg-[#14B8A6] text-white hover:bg-[#2DD4BF]'
                      : 'bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720]'
                  }`}
                >
                  {paymentLoading ? 'Processing...' : 'Subscribe Now'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoosePlan;

