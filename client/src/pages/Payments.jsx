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
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    mode: 'all',
  });
  
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

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      received: {
        label: 'Received',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-300',
        border: 'border-green-500/30',
      },
      pending: {
        label: 'Pending',
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-300',
        border: 'border-yellow-500/30',
      },
      failed: {
        label: 'Failed',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-300',
        border: 'border-red-500/30',
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    // Search filter
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      payment.tenant_name?.toLowerCase().includes(searchTerm) ||
      payment.amount?.toString().includes(searchTerm);

    // Status filter
    const matchesStatus = filters.status === 'all' || 
      payment.status?.toLowerCase() === filters.status.toLowerCase();

    // Mode filter
    const matchesMode = filters.mode === 'all' || 
      payment.mode?.toLowerCase() === filters.mode.toLowerCase();

    return matchesSearch && matchesStatus && matchesMode;
  });

  const columns = [
    { header: 'Tenant', accessor: 'tenant_name' },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val}` },
    { header: 'Month For', accessor: 'month_for', render: (val) => formatDateDDMMYY(val) },
    { header: 'Mode', accessor: 'mode', render: (val) => val.toUpperCase() },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Payments</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage all payment records</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Payment</Button>
      </div>

      {/* Filters */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
          <input
            type="text"
            placeholder="Search by tenant name, amount..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 w-full sm:min-w-[200px] px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
          >
            <option value="all" className="bg-[#0B0F14] text-[#E5E7EB]">All Status</option>
            <option value="received" className="bg-[#0B0F14] text-[#E5E7EB]">Received</option>
            <option value="pending" className="bg-[#0B0F14] text-[#E5E7EB]">Pending</option>
            <option value="failed" className="bg-[#0B0F14] text-[#E5E7EB]">Failed</option>
          </select>
          <select
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
          >
            <option value="all" className="bg-[#0B0F14] text-[#E5E7EB]">All Modes</option>
            <option value="cash" className="bg-[#0B0F14] text-[#E5E7EB]">Cash</option>
            <option value="qr" className="bg-[#0B0F14] text-[#E5E7EB]">QR</option>
            <option value="manual" className="bg-[#0B0F14] text-[#E5E7EB]">Manual</option>
          </select>
          {(filters.search || filters.status !== 'all' || filters.mode !== 'all') && (
            <button
              onClick={() => setFilters({ search: '', status: 'all', mode: 'all' })}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 text-sm text-[#22D3EE] hover:text-[#1FB6C1] font-semibold transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredPayments}
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
      </div>

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
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Tenant *</label>
            <select
              value={formData.tenant_id}
              onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            >
              <option value="" className="bg-[#0B0F14] text-[#E5E7EB]">Select Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id} className="bg-[#0B0F14] text-[#E5E7EB]">{tenant.name}</option>
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
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Mode *</label>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            >
              <option value="cash" className="bg-[#0B0F14] text-[#E5E7EB]">Cash</option>
              <option value="qr" className="bg-[#0B0F14] text-[#E5E7EB]">QR</option>
              <option value="manual" className="bg-[#0B0F14] text-[#E5E7EB]">Manual</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            >
              <option value="pending" className="bg-[#0B0F14] text-[#E5E7EB]">Pending</option>
              <option value="received" className="bg-[#0B0F14] text-[#E5E7EB]">Received</option>
              <option value="failed" className="bg-[#0B0F14] text-[#E5E7EB]">Failed</option>
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

