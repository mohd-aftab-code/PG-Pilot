import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), bill_type: '', amount: '', bill_month: '', description: '', allocations: [] });

  useEffect(() => {
    if (formData.pg_id) {
      fetchBills();
      fetchTenants();
    }
  }, [formData.pg_id]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/bills/pg/${formData.pg_id}`);
      setBills(response.data.bills || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get(`/api/tenants/pg/${formData.pg_id}`);
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBill) {
        await api.put(`/api/bills/${editingBill.id}`, formData);
      } else {
        await api.post('/api/bills', formData);
      }
      setIsModalOpen(false);
      setEditingBill(null);
      setFormData({ pg_id: formData.pg_id, bill_type: '', amount: '', bill_month: '', description: '', allocations: [] });
      fetchBills();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving bill');
    }
  };

  const columns = [
    { header: 'Type', accessor: 'bill_type', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val}` },
    { header: 'Month', accessor: 'bill_month', render: (val) => formatDateDDMMYY(val) },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Utility Bills</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage utility bills</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Bill</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable columns={columns} data={bills} loading={loading} onEdit={(bill) => { setEditingBill(bill); setFormData({ pg_id: bill.pg_id, bill_type: bill.bill_type, amount: bill.amount, bill_month: formatDateForInput(bill.bill_month), description: bill.description || '', allocations: [] }); setIsModalOpen(true); }} />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBill(null); }} title={editingBill ? 'Edit Bill' : 'Add Bill'} size="lg">
        <form onSubmit={handleSubmit}>
          <Input label="Bill Type" type="text" value={formData.bill_type} onChange={(e) => setFormData({ ...formData, bill_type: e.target.value })} required />
          <Input label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <Input label="Bill Month" type="date" value={formData.bill_month} onChange={(e) => setFormData({ ...formData, bill_month: e.target.value })} required />
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
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bills;

