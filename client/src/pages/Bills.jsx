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
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), bill_type: 'electricity', amount: '', bill_month: '', allocations: [] });

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
      setFormData({ pg_id: formData.pg_id, bill_type: 'electricity', amount: '', bill_month: '', allocations: [] });
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#E5E7EB]">Utility Bills</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Bill</Button>
      </div>
      <DataTable columns={columns} data={bills} loading={loading} onEdit={(bill) => { setEditingBill(bill); setFormData({ pg_id: bill.pg_id, bill_type: bill.bill_type, amount: bill.amount, bill_month: formatDateForInput(bill.bill_month), allocations: [] }); setIsModalOpen(true); }} />
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBill(null); }} title={editingBill ? 'Edit Bill' : 'Add Bill'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Bill Type *</label>
            <select value={formData.bill_type} onChange={(e) => setFormData({ ...formData, bill_type: e.target.value })} className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]" required>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
            </select>
          </div>
          <Input label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <Input label="Bill Month" type="date" value={formData.bill_month} onChange={(e) => setFormData({ ...formData, bill_month: e.target.value })} required />
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

