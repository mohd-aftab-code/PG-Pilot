import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

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
      if (editingInvoice) {
        await api.put(`/api/invoices/${editingInvoice.id}`, formData);
      } else {
        await api.post('/api/invoices', formData);
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
      setFormData({ pg_id: pgId, amount: '', invoice_date: '', due_date: '', status: 'unpaid' });
      fetchInvoices();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving invoice');
    }
  };

  const columns = [
    { header: 'Amount', accessor: 'amount', render: (val) => `₹${val}` },
    { header: 'Invoice Date', accessor: 'invoice_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Due Date', accessor: 'due_date', render: (val) => formatDateDDMMYY(val) },
    { header: 'Status', accessor: 'status', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#E5E7EB]">Invoices</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Invoice</Button>
      </div>
      <DataTable columns={columns} data={invoices} loading={loading} onEdit={(inv) => { setEditingInvoice(inv); setFormData({ pg_id: inv.pg_id, amount: inv.amount, invoice_date: formatDateForInput(inv.invoice_date), due_date: formatDateForInput(inv.due_date), status: inv.status }); setIsModalOpen(true); }} />
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }} title={editingInvoice ? 'Edit Invoice' : 'Add Invoice'}>
        <form onSubmit={handleSubmit}>
          <Input label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <Input label="Invoice Date" type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} />
          <Input label="Due Date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Status *</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]" required>
              <option value="unpaid">Unpaid</option>
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

export default Invoices;

