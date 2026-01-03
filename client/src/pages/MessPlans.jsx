import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const MessPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), name: '', price: '' });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) fetchPlans();
  }, [pgId]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/mess-plans/pg/${pgId}`);
      setPlans(response.data.mess_plans || []);
    } catch (error) {
      console.error('Error fetching mess plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/api/mess-plans/${editingPlan.id}`, formData);
      } else {
        await api.post('/api/mess-plans', formData);
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({ pg_id: pgId, name: '', price: '' });
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving mess plan');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Price', accessor: 'price', render: (val) => `₹${val}` },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Mess Plans</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage mess meal plans</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Mess Plan</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        onEdit={(plan) => {
          setEditingPlan(plan);
          setFormData({ pg_id: pgId, name: plan.name, price: plan.price });
          setIsModalOpen(true);
        }}
        onDelete={async (plan) => {
          if (window.confirm('Delete this mess plan?')) {
            try {
              await api.delete(`/api/mess-plans/${plan.id}`);
              fetchPlans();
            } catch (error) {
              alert(error.response?.data?.error || 'Error deleting');
            }
          }
        }}
      />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPlan(null); }} title={editingPlan ? 'Edit Mess Plan' : 'Add Mess Plan'}>
        <form onSubmit={handleSubmit}>
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MessPlans;

