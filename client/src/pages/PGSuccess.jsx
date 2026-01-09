import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import Button from '../components/common/Button';

const PGSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState(null);

  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const user = getStoredUser();
        if (user && user.pg_id) {
          // Add retry logic - newly registered PG might need a moment for trial to be set
          let retries = 8; // Increased retries for new PG registration
          let trialData = null;
          
          while (retries > 0) {
            try {
              // Add delay before first check to allow backend to process
              if (retries < 8) {
                await new Promise(resolve => setTimeout(resolve, 800));
              }
              
              // Check subscription/trial status
              const response = await api.get(`/api/subscriptions/pg/${user.pg_id}/active`);
              const data = response.data;
              
              console.log('PGSuccess: Trial check response:', data);
              
              // If we got trial data and it's active, we're good
              if (data.trial && data.trial.isActive) {
                trialData = data;
                console.log('PGSuccess: Trial is active!', data.trial);
                break;
              }
              
              // If we got trial data but it's not active (expired), use it
              if (data.trial && !data.trial.isActive) {
                trialData = data;
                console.log('PGSuccess: Trial found but expired', data.trial);
                break;
              }
              
              // If we have subscription, use it
              if (data.subscription) {
                trialData = data;
                console.log('PGSuccess: Active subscription found', data.subscription);
                break;
              }
              
              // If we got data but no trial yet, wait and retry (for new PG)
              if (!data.trial && retries > 1) {
                console.log(`PGSuccess: No trial data yet, retrying... (${retries} retries left)`);
                retries--;
                continue;
              }
              
              // Last attempt - use whatever data we have
              trialData = data;
              break;
            } catch (error) {
              console.error(`PGSuccess: Trial check attempt ${9 - retries} failed:`, error);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 800));
              }
            }
          }
          
          if (trialData) {
            setTrialInfo(trialData.trial);
            
            // If trial is active OR subscription is active, auto-redirect to dashboard
            if (trialData.hasAccess && (trialData.trial?.isActive || trialData.subscription)) {
              console.log('PGSuccess: Has access, will redirect to dashboard');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 3000);
            } else {
              console.log('PGSuccess: No access, showing plan selection');
            }
          } else {
            // If no trial data found after all retries, assume trial should be active (new PG)
            // This handles edge case where backend hasn't updated yet
            console.warn('PGSuccess: No trial data found, assuming new PG with active trial');
            setTrialInfo({
              isActive: true,
              status: 'TRIAL',
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 3000);
          }
        }
      } catch (error) {
        console.error('PGSuccess: Error checking trial status:', error);
        // On error, assume trial is active for new PG
        setTrialInfo({
          isActive: true,
          status: 'TRIAL',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    checkTrialStatus();
  }, [navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleChoosePlan = () => {
    navigate('/choose-plan', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading...</p>
        </div>
      </div>
    );
  }

  const isTrialActive = trialInfo?.isActive === true;
  const isTrialExpired = trialInfo?.status === 'TRIAL' && !trialInfo?.isActive;
  const daysRemaining = trialInfo?.endDate 
    ? Math.ceil((new Date(trialInfo.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

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
              PG Registered Successfully! 🎉
            </h1>
            <p className="text-[#D1D5DB] text-base sm:text-lg mb-4">
              Your PG has been registered successfully.
            </p>
            
            {isTrialActive ? (
              <>
                <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <p className="text-[#22D3EE] font-semibold text-lg mb-2">
                    🎉 Free Trial Started!
                  </p>
                  <p className="text-[#D1D5DB] text-sm">
                    You have <span className="font-bold text-[#22D3EE]">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> remaining in your free trial.
                  </p>
                  <p className="text-[#9CA3AF] text-xs mt-2">
                    Start managing your PG now. Upgrade anytime during or after the trial.
                  </p>
                </div>
                <p className="text-[#9CA3AF] text-sm mb-6">
                  Redirecting to dashboard in 3 seconds...
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full sm:w-auto px-8 py-3 text-lg"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={handleChoosePlan}
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-3 text-lg"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </>
            ) : isTrialExpired ? (
              <>
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-6">
                  <p className="text-[#FFA500] font-semibold text-lg mb-2">
                    ⛔ Your Free Trial Has Expired
                  </p>
                  <p className="text-[#D1D5DB] text-sm">
                    Your free trial period has ended. Please choose a subscription plan to continue using PG Pilot.
                  </p>
                </div>
                <div className="mt-8">
                  <Button
                    onClick={handleChoosePlan}
                    className="w-full sm:w-auto px-8 py-3 text-lg"
                  >
                    Choose a Plan
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Default case - should not happen for new registrations, but handle gracefully */}
                <p className="text-[#9CA3AF] text-sm sm:text-base mb-6">
                  Please choose a subscription plan to activate your PG and access all features.
                </p>
                <div className="mt-8">
                  <Button
                    onClick={handleChoosePlan}
                    className="w-full sm:w-auto px-8 py-3 text-lg"
                  >
                    Choose a Plan
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGSuccess;

