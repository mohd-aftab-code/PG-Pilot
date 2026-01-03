import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({ code: '', discount_percent: '', max_uses: '', expires_on: '' });
  const user = getStoredUser();

  useEffect(() => {
    if (user?.role === 'superadmin') fetchCoupons();
  }, [user]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/coupons');
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await api.put(`/api/coupons/${editingCoupon.id}`, formData);
      } else {
        await api.post('/api/coupons', formData);
      }
      setIsModalOpen(false);
      setEditingCoupon(null);
      setFormData({ code: '', discount_percent: '', max_uses: '', expires_on: '' });
      fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving coupon');
    }
  };

  const columns = [
    { header: 'Code', accessor: 'code' },
    { header: 'Discount %', accessor: 'discount_percent', render: (val) => `${val}%` },
    { header: 'Max Uses', accessor: 'max_uses', render: (val) => val || 'Unlimited' },
    { header: 'Expires On', accessor: 'expires_on', render: (val) => val ? formatDateDDMMYY(val) : 'Never' },
  ];

  if (user?.role !== 'superadmin') {
    return <div className="p-6 text-[#E5E7EB]">Access denied. Superadmin only.</div>;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Coupons</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage discount coupons</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Coupon</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={coupons} loading={loading} onEdit={(c) => { setEditingCoupon(c); setFormData({ code: c.code, discount_percent: c.discount_percent, max_uses: c.max_uses || '', expires_on: formatDateForInput(c.expires_on) }); setIsModalOpen(true); }} onDelete={async (c) => { if (window.confirm('Delete coupon?')) { try { await api.delete(`/api/coupons/${c.id}`); fetchCoupons(); } catch (error) { alert(error.response?.data?.error || 'Error'); } } }} />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCoupon(null); }} title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}>
        <form onSubmit={handleSubmit}>
          <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          <Input label="Discount %" type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })} required />
          <Input label="Max Uses" type="number" value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} />
          <Input label="Expires On" type="date" value={formData.expires_on} onChange={(e) => setFormData({ ...formData, expires_on: e.target.value })} />
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Coupons;

