import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState({ total: 0, activated: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    fetchReferrals();
    fetchMyReferralCode();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/referrals');
      setReferrals(response.data.referrals || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReferralCode = async () => {
    setCodeLoading(true);
    try {
      const response = await api.get('/api/referrals/my-code');
      setReferralCode(response.data.referral_code);
      setReferralStats(response.data.stats || { total: 0, activated: 0, pending: 0 });
    } catch (error) {
      console.error('Error fetching referral code:', error);
    } finally {
      setCodeLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy');
    });
  };

  const getReferralLink = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/register-pg?ref=${referralCode}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      activated: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Activated' },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'Pending' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    { header: 'Referred PG', accessor: 'referred_pg_name', render: (val, row) => `${val || 'N/A'} (${row.referred_pg_uid || 'N/A'})` },
    { header: 'Referral Code', accessor: 'referral_code', render: (val) => val ? <span className="font-mono text-[#22D3EE]">{val}</span> : '-' },
    { header: 'Reward Days', accessor: 'reward_days' },
    { header: 'Status', accessor: 'status', render: (val) => getStatusBadge(val) },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Referrals</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Share your referral code and earn rewards</p>
      </div>

      {/* Referral Code Card */}
      {codeLoading ? (
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-6 mb-6">
          <div className="animate-pulse">
            <div className="h-4 bg-[#1FB6C1]/20 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-[#1FB6C1]/20 rounded w-1/2"></div>
          </div>
        </div>
      ) : referralCode ? (
        <div className="bg-gradient-to-r from-[#0F1720] to-[#0B0F14] border border-primary/20 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">Your Referral Code</h3>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-[#22D3EE] font-mono">{referralCode}</span>
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(referralCode)}
                  className="text-xs"
                >
                  Copy Code
                </Button>
              </div>
              <div className="bg-[#0B0F14] border border-primary/10 rounded-lg p-3 mb-3">
                <p className="text-xs text-[#9CA3AF] mb-1">Shareable Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getReferralLink()}
                    className="flex-1 px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-sm text-[#E5E7EB] font-mono"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(getReferralLink())}
                    className="text-xs whitespace-nowrap"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Share this code or link with other PG owners. When they register using your code and subscribe, you'll get 1 month (30 days) added to your subscription!
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <div className="bg-[#0B0F14] border border-primary/10 rounded-lg p-4 text-center min-w-[120px]">
                <p className="text-2xl font-bold text-[#22D3EE]">{referralStats.total}</p>
                <p className="text-xs text-[#9CA3AF]">Total Referrals</p>
              </div>
              <div className="bg-[#0B0F14] border border-green-500/20 rounded-lg p-4 text-center min-w-[120px]">
                <p className="text-2xl font-bold text-green-300">{referralStats.activated}</p>
                <p className="text-xs text-[#9CA3AF]">Activated</p>
              </div>
              <div className="bg-[#0B0F14] border border-yellow-500/20 rounded-lg p-4 text-center min-w-[120px]">
                <p className="text-2xl font-bold text-yellow-300">{referralStats.pending}</p>
                <p className="text-xs text-[#9CA3AF]">Pending</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-6 mb-6">
          <p className="text-[#9CA3AF] text-center">No PG found. Please register a PG first to get your referral code.</p>
        </div>
      )}

      {/* Referrals Table */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#E5E7EB] mb-3">Referral History</h2>
      </div>
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable 
          columns={columns} 
          data={referrals.filter(r => r.referred_by_name || user?.role === 'superadmin')} 
          loading={loading} 
        />
      </div>

      {referrals.length === 0 && !loading && (
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-6 mt-4 text-center">
          <p className="text-[#9CA3AF]">No referrals yet. Share your referral code to get started!</p>
        </div>
      )}
    </div>
  );
};

export default Referrals;

