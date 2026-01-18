import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const MessBills = () => {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({ tenant_id: '', pg_id: getStoredPgId(), month_for: '', amount: '', description: '', status: 'pending' });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchBills();
      fetchTenants();
    }
  }, [pgId]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/mess-bills/pg/${pgId}`);
      setBills(response.data.mess_bills || []);
    } catch (error) {
      console.error('Error fetching mess bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get(`/api/tenants/pg/${pgId}`);
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBill) {
        await api.put(`/api/mess-bills/${editingBill.id}`, formData);
      } else {
        await api.post('/api/mess-bills', formData);
      }
      setIsModalOpen(false);
      setEditingBill(null);
      setFormData({ tenant_id: '', pg_id: pgId, month_for: '', amount: '', description: '', status: 'pending' });
      fetchBills();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving mess bill');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Paid' },
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
    { header: 'Month', accessor: 'month_for', render: (val) => formatDateDDMMYY(val) },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val}` },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Mess Bills</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage mess meal bills</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Mess Bill</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable 
          columns={columns} 
          data={bills} 
          loading={loading} 
          onEdit={(bill) => { 
            setEditingBill(bill); 
            setFormData({ 
              tenant_id: bill.tenant_id, 
              pg_id: bill.pg_id, 
              month_for: formatDateForInput(bill.month_for), 
              amount: bill.amount, 
              description: bill.description || '',
              status: bill.status 
            }); 
            setIsModalOpen(true); 
          }} 
        />
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingBill(null); 
          setFormData({ tenant_id: '', pg_id: pgId, month_for: '', amount: '', description: '', status: 'pending' });
        }} 
        title={editingBill ? 'Edit Mess Bill' : 'Add Mess Bill'}
        position="right"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Picker */}
          <Input 
            label="Date *" 
            type="date" 
            value={formData.month_for} 
            onChange={(e) => setFormData({ ...formData, month_for: e.target.value })} 
            required 
          />

          {/* Description */}
          <div>
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter bill description or notes..."
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm resize-none"
              rows="3"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Amount *</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
            <Button type="button" variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingBill(null);
              setFormData({ tenant_id: '', pg_id: pgId, month_for: '', amount: '', description: '', status: 'pending' });
            }}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MessBills;

