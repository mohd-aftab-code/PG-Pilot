import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), amount: '', invoice_date: '', due_date: '', status: 'unpaid' });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) fetchInvoices();
  }, [pgId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/invoices/pg/${pgId}`);
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/invoices', formData);
      setIsModalOpen(false);
      setEditingInvoice(null);
      setFormData({ pg_id: pgId, amount: '', invoice_date: '', due_date: '', status: 'unpaid' });
      fetchInvoices();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving invoice');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Paid' },
      unpaid: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'Unpaid' },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    { header: 'Invoice ID', accessor: 'id', render: (val) => `#INV-${String(val).padStart(6, '0')}` },
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { header: 'Invoice Date', accessor: 'invoice_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Due Date', accessor: 'due_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Status', accessor: 'status', render: (val) => getStatusBadge(val) },
    { 
      header: 'Payment Info', 
      accessor: 'razorpay_payment_id', 
      render: (val, row) => {
        if (row.status === 'paid' && val) {
          return (
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[#22D3EE]">Payment ID: {val.substring(0, 12)}...</span>
              {row.razorpay_order_id && (
                <span className="text-[#9CA3AF]">Order: {row.razorpay_order_id.substring(0, 12)}...</span>
              )}
            </div>
          );
        }
        return <span className="text-[#9CA3AF] text-xs">-</span>;
      }
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Invoices</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage invoices</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Invoice</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable 
          columns={columns} 
          data={invoices} 
          loading={loading} 
          onView={(inv) => {
            setEditingInvoice(inv);
            setIsModalOpen(true);
          }}
        />
      </div>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }} 
        title={editingInvoice ? 'Invoice Details' : 'Add Invoice'}
        size="lg"
      >
        {editingInvoice ? (
          // View mode for all invoices
          <div className="space-y-4">
            <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-primary/10">
                <h3 className="text-lg font-semibold text-[#E5E7EB]">Invoice #{String(editingInvoice.id).padStart(6, '0')}</h3>
                {getStatusBadge(editingInvoice.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Amount</p>
                  <p className="text-lg font-semibold text-[#E5E7EB]">₹{parseFloat(editingInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Invoice Date</p>
                  <p className="text-sm text-[#E5E7EB]">{formatDateDDMMYY(editingInvoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Due Date</p>
                  <p className="text-sm text-[#E5E7EB]">{formatDateDDMMYY(editingInvoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Created At</p>
                  <p className="text-sm text-[#E5E7EB]">{formatDateDDMMYY(editingInvoice.created_at)}</p>
                </div>
              </div>

              {editingInvoice.status === 'paid' && (editingInvoice.razorpay_payment_id || editingInvoice.razorpay_order_id || editingInvoice.transaction_id) && (
                <div className="pt-3 border-t border-primary/10">
                  <h4 className="text-sm font-semibold text-[#22D3EE] mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    {editingInvoice.razorpay_order_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Razorpay Order ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{editingInvoice.razorpay_order_id}</span>
                      </div>
                    )}
                    {editingInvoice.razorpay_payment_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Razorpay Payment ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{editingInvoice.razorpay_payment_id}</span>
                      </div>
                    )}
                    {editingInvoice.transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Transaction ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{editingInvoice.transaction_id}</span>
                      </div>
                    )}
                    {editingInvoice.order_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Order ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{editingInvoice.order_id}</span>
                      </div>
                    )}
                    {editingInvoice.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">Payment ID:</span>
                        <span className="text-xs text-[#E5E7EB] font-mono">{editingInvoice.payment_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        ) : (
          // Add mode only
          <form onSubmit={handleSubmit}>
            <Input label="Amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
            <Input label="Invoice Date" type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} />
            <Input label="Due Date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
            <div className="mb-4">
              <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Status *</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm" required>
                <option value="unpaid" className="bg-[#0B0F14] text-[#E5E7EB]">Unpaid</option>
                <option value="paid" className="bg-[#0B0F14] text-[#E5E7EB]">Paid</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;

