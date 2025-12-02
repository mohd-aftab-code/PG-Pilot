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
  const [formData, setFormData] = useState({ tenant_id: '', pg_id: getStoredPgId(), month_for: '', amount: '', status: 'pending' });
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
      setFormData({ tenant_id: '', pg_id: pgId, month_for: '', amount: '', status: 'pending' });
      fetchBills();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving mess bill');
    }
  };

  const columns = [
    { header: 'Tenant', accessor: 'tenant_name' },
    { header: 'Month', accessor: 'month_for', render: (val) => formatDateDDMMYY(val) },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val}` },
    { header: 'Status', accessor: 'status', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Mess Bills</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Mess Bill</Button>
      </div>
      <DataTable columns={columns} data={bills} loading={loading} onEdit={(bill) => { setEditingBill(bill); setFormData({ tenant_id: bill.tenant_id, pg_id: bill.pg_id, month_for: formatDateForInput(bill.month_for), amount: bill.amount, status: bill.status }); setIsModalOpen(true); }} />
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBill(null); }} title={editingBill ? 'Edit Mess Bill' : 'Add Mess Bill'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Tenant *</label>
            <select value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })} className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required>
              <option value="">Select Tenant</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Input label="Month For" type="date" value={formData.month_for} onChange={(e) => setFormData({ ...formData, month_for: e.target.value })} required />
          <Input label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Status *</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" required>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
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

export default MessBills;

