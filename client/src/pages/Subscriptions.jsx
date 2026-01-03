import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), plan_id: '', start_date: '', custom_price: '' });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchSubscriptions();
      fetchPlans();
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

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/plans');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/subscriptions', formData);
      setIsModalOpen(false);
      setFormData({ pg_id: pgId, plan_id: '', start_date: '', custom_price: '' });
      fetchSubscriptions();
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating subscription');
    }
  };

  const columns = [
    { header: 'Plan', accessor: 'plan_name' },
    { header: 'Start Date', accessor: 'start_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Expiry Date', accessor: 'expiry_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Price', accessor: 'custom_price', render: (val) => val ? `₹${val}` : '-' },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Subscriptions</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage your subscription plans</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Subscribe to Plan</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={subscriptions} loading={loading} />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData({ pg_id: pgId, plan_id: '', start_date: '', custom_price: '' }); }} title="Subscribe to Plan">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Plan *</label>
            <select value={formData.plan_id} onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm" required>
              <option value="" className="bg-[#0B0F14] text-[#E5E7EB]">Select Plan</option>
              {plans.map((plan) => <option key={plan.id} value={plan.id} className="bg-[#0B0F14] text-[#E5E7EB]">{plan.name} - ₹{plan.price}</option>)}
            </select>
          </div>
          <Input label="Start Date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
          <Input label="Custom Price (Optional)" type="number" value={formData.custom_price} onChange={(e) => setFormData({ ...formData, custom_price: e.target.value })} />
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Subscribe</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;

