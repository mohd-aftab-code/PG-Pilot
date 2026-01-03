import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [formData, setFormData] = useState({
    tenant_id: '',
    pg_id: getStoredPgId(),
    title: '',
    description: '',
    status: 'open',
  });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchComplaints();
      fetchTenants();
    }
  }, [pgId]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/complaints/pg/${pgId}`);
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
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
      if (editingComplaint) {
        await api.put(`/api/complaints/${editingComplaint.id}`, formData);
      } else {
        await api.post('/api/complaints', formData);
      }
      setIsModalOpen(false);
      setEditingComplaint(null);
      resetForm();
      fetchComplaints();
    } catch (error) {
      console.error('Error saving complaint:', error);
      alert(error.response?.data?.error || 'Error saving complaint');
    }
  };

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      pg_id: pgId,
      title: '',
      description: '',
      status: 'open',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', label: 'Open' },
      in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'In Progress' },
      resolved: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', label: 'Resolved' },
    };
    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    { header: 'Tenant', accessor: 'tenant_name' },
    { header: 'Title', accessor: 'title' },
    { header: 'Status', accessor: 'status', render: (val) => getStatusBadge(val) },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Complaints</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage tenant complaints</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Complaint</Button>
      </div>

      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={complaints}
          loading={loading}
          onEdit={(complaint) => {
            setEditingComplaint(complaint);
            setFormData({
              tenant_id: complaint.tenant_id,
              pg_id: complaint.pg_id,
              title: complaint.title,
              description: complaint.description || '',
              status: complaint.status,
            });
            setIsModalOpen(true);
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingComplaint(null);
          resetForm();
        }}
        title={editingComplaint ? 'Edit Complaint' : 'Add Complaint'}
        size="lg"
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
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm resize-none"
              rows="4"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            >
              <option value="open" className="bg-[#0B0F14] text-[#E5E7EB]">Open</option>
              <option value="in_progress" className="bg-[#0B0F14] text-[#E5E7EB]">In Progress</option>
              <option value="resolved" className="bg-[#0B0F14] text-[#E5E7EB]">Resolved</option>
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

export default Complaints;

