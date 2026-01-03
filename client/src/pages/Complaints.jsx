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

  const columns = [
    { header: 'Tenant', accessor: 'tenant_name' },
    { header: 'Title', accessor: 'title' },
    { header: 'Status', accessor: 'status', render: (val) => val.replace('_', ' ').toUpperCase() },
    { header: 'Date', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#E5E7EB]">Complaints</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Complaint</Button>
      </div>

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
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
              required
            >
              <option value="">Select Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
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
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
              rows="4"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
              required
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
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

