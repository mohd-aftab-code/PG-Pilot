import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Subscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchSubscriptions();
    }
  }, [pgId]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/subscriptions/pg/${pgId}`);
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    if (expiry >= today) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-green-500/20 text-green-300 border-green-500/30">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-red-500/20 text-red-300 border-red-500/30">
          Expired
        </span>
      );
    }
  };

  const columns = [
    { header: 'Plan', accessor: 'plan_name' },
    { header: 'Start Date', accessor: 'start_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Expiry Date', accessor: 'expiry_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Price', accessor: 'custom_price', render: (val) => val ? `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-' },
    { header: 'Status', accessor: 'expiry_date', render: (val) => getStatusBadge(val) },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Subscriptions</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">View your subscription history</p>
        </div>
        <Button onClick={() => navigate('/choose-plan')} className="w-full sm:w-auto">
          Choose Plan
        </Button>
      </div>

      {/* Info Message */}
      {subscriptions.length === 0 && !loading && (
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-[#9CA3AF] mb-4">No subscriptions found. Subscribe to a plan to get started.</p>
            <Button onClick={() => navigate('/choose-plan')}>
              Choose a Plan
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={subscriptions} loading={loading} />
      </div>
    </div>
  );
};

export default Subscriptions;

