import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    tenant_id: '',
    pg_id: getStoredPgId(),
    amount: '',
    month_for: '',
    mode: 'cash',
    status: 'received',
  });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchPayments();
      fetchTenants();
    }
  }, [pgId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/payments/pg/${pgId}`);
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
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
      if (editingPayment) {
        await api.put(`/api/payments/${editingPayment.id}`, formData);
      } else {
        await api.post('/api/payments', formData);
      }
      setIsModalOpen(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert(error.response?.data?.error || 'Error saving payment');
    }
  };

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      pg_id: pgId,
      amount: '',
      month_for: '',
      mode: 'cash',
      status: 'received',
    });
  };

  const columns = [
    { header: 'Tenant', accessor: 'tenant_name' },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val}` },
    { header: 'Month For', accessor: 'month_for', render: (val) => formatDateDDMMYY(val) },
    { header: 'Mode', accessor: 'mode', render: (val) => val.toUpperCase() },
    { header: 'Status', accessor: 'status', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Payment</Button>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        onEdit={(payment) => {
          setEditingPayment(payment);
          setFormData({
            tenant_id: payment.tenant_id,
            pg_id: payment.pg_id,
            amount: payment.amount,
            month_for: formatDateForInput(payment.month_for),
            mode: payment.mode,
            status: payment.status,
          });
          setIsModalOpen(true);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPayment(null);
          resetForm();
        }}
        title={editingPayment ? 'Edit Payment' : 'Add Payment'}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Tenant *</label>
            <select
              value={formData.tenant_id}
              onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            >
              <option value="">Select Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <Input
            label="Month For"
            type="date"
            value={formData.month_for}
            onChange={(e) => setFormData({ ...formData, month_for: e.target.value })}
            required
          />
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Mode *</label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            >
              <option value="cash">Cash</option>
              <option value="qr">QR</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
            >
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;

