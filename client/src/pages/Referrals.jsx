import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser, getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ referred_by: getStoredPgId(), referred_pg: '', reward_days: 7 });
  const user = getStoredUser();

  useEffect(() => {
    fetchReferrals();
    fetchPGs();
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

  const fetchPGs = async () => {
    try {
      const response = await api.get('/api/pgs');
      setPGs(response.data.pgs || []);
    } catch (error) {
      console.error('Error fetching PGs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/referrals', formData);
      setIsModalOpen(false);
      setFormData({ referred_by: getStoredPgId(), referred_pg: '', reward_days: 7 });
      fetchReferrals();
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating referral');
    }
  };

  const handleActivate = async (referral) => {
    if (user?.role !== 'superadmin') {
      alert('Only superadmin can activate referrals');
      return;
    }
    if (window.confirm('Activate this referral?')) {
      try {
        await api.put(`/api/referrals/${referral.id}/activate`);
        fetchReferrals();
      } catch (error) {
        alert(error.response?.data?.error || 'Error activating referral');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Active' },
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
    { header: 'Referred By', accessor: 'referred_by_name', render: (val, row) => `${val} (${row.referred_by_uid})` },
    { header: 'Referred PG', accessor: 'referred_pg_name', render: (val, row) => `${val} (${row.referred_pg_uid})` },
    { header: 'Reward Days', accessor: 'reward_days' },
    { header: 'Status', accessor: 'status', render: (val) => getStatusBadge(val) },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Referrals</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage PG referrals</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Referral</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={referrals} loading={loading} onEdit={user?.role === 'superadmin' ? (ref) => handleActivate(ref) : null} />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData({ referred_by: getStoredPgId(), referred_pg: '', reward_days: 7 }); }} title="Add Referral">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Referred PG *</label>
            <select value={formData.referred_pg} onChange={(e) => setFormData({ ...formData, referred_pg: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm" required>
              <option value="" className="bg-[#0B0F14] text-[#E5E7EB]">Select PG</option>
              {pgs.filter(pg => pg.id != formData.referred_by).map((pg) => <option key={pg.id} value={pg.id} className="bg-[#0B0F14] text-[#E5E7EB]">{pg.name} ({pg.pg_uid})</option>)}
            </select>
          </div>
          <Input label="Reward Days" type="number" value={formData.reward_days} onChange={(e) => setFormData({ ...formData, reward_days: parseInt(e.target.value) })} />
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Referrals;

