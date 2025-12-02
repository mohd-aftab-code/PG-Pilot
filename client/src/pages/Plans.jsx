import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    duration_days: '', 
    max_pgs: 1, 
    max_rooms: 10, 
    max_beds: 50, 
    description: '' 
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/plans');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchPlans();
    }
  }, [user?.role, fetchPlans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/api/plans/${editingPlan.id}`, formData);
      } else {
        await api.post('/api/plans', formData);
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({ name: '', price: '', duration_days: '', max_pgs: 1, max_rooms: 10, max_beds: 50, description: '' });
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving plan');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Price', accessor: 'price', render: (val) => `₹${val}` },
    { header: 'Duration (Days)', accessor: 'duration_days' },
    { header: 'Max PGs', accessor: 'max_pgs' },
    { header: 'Max Rooms', accessor: 'max_rooms' },
    { header: 'Max Beds', accessor: 'max_beds' },
  ];

  if (user?.role !== 'superadmin') {
    return <div className="p-6 text-foreground">Access denied. Superadmin only.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Plans</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Plan</Button>
      </div>
      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        onEdit={(plan) => {
          setEditingPlan(plan);
          setFormData({ 
            name: plan.name, 
            price: plan.price, 
            duration_days: plan.duration_days,
            max_pgs: plan.max_pgs || 1,
            max_rooms: plan.max_rooms || 10,
            max_beds: plan.max_beds || 50,
            description: plan.description || ''
          });
          setIsModalOpen(true);
        }}
        onDelete={async (plan) => {
          if (window.confirm('Delete this plan?')) {
            try {
              await api.delete(`/api/plans/${plan.id}`);
              fetchPlans();
            } catch (error) {
              alert(error.response?.data?.error || 'Error deleting');
            }
          }
        }}
      />
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPlan(null); setFormData({ name: '', price: '', duration_days: '', max_pgs: 1, max_rooms: 10, max_beds: 50, description: '' }); }} title={editingPlan ? 'Edit Plan' : 'Add Plan'}>
        <form onSubmit={handleSubmit}>
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
          <Input label="Duration (Days)" type="number" value={formData.duration_days} onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })} required />
          <Input label="Max PGs" type="number" value={formData.max_pgs} onChange={(e) => setFormData({ ...formData, max_pgs: parseInt(e.target.value) || 1 })} required />
          <Input label="Max Rooms" type="number" value={formData.max_rooms} onChange={(e) => setFormData({ ...formData, max_rooms: parseInt(e.target.value) || 10 })} required />
          <Input label="Max Beds" type="number" value={formData.max_beds} onChange={(e) => setFormData({ ...formData, max_beds: parseInt(e.target.value) || 50 })} required />
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              rows="3"
            />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Plans;

