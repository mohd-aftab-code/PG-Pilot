import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getFullUrl } from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [status, setStatus] = useState('open');
  const [adminNotes, setAdminNotes] = useState('');
  const [formData, setFormData] = useState({
    tenant_id: '',
    title: '',
    description: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchComplaints();
      fetchTenants();
    }
  }, [pgId]);

  const fetchTenants = async () => {
    try {
      const response = await api.get(`/api/tenants/pg/${pgId}`);
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

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

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/api/complaints/${editingComplaint.id}`, {
        title: editingComplaint.title,
        description: editingComplaint.description,
        photo_url: editingComplaint.photo_url,
        status: status,
        admin_notes: adminNotes || null
      });
      setIsModalOpen(false);
      setEditingComplaint(null);
      setStatus('open');
      setAdminNotes('');
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert(error.response?.data?.error || 'Error updating complaint status');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('tenant_id', formData.tenant_id);
      formDataToSend.append('pg_id', pgId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }

      await api.post('/api/complaints', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsCreateModalOpen(false);
      setFormData({ tenant_id: '', title: '', description: '' });
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchComplaints();
      alert('Complaint created successfully!');
    } catch (error) {
      console.error('Error creating complaint:', error);
      alert(error.response?.data?.error || 'Error creating complaint');
    }
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
          <p className="text-sm text-[#9CA3AF] mt-1">Manage tenant complaints - Update status to process</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Create Complaint (Tenant Form)
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={complaints}
          loading={loading}
          onView={(complaint) => {
            setEditingComplaint(complaint);
            setStatus(complaint.status);
            setAdminNotes(complaint.admin_notes || '');
            setIsModalOpen(true);
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingComplaint(null);
          setStatus('open');
          setAdminNotes('');
        }}
        title="Update Complaint Status"
        size="lg"
        position="right"
      >
        {editingComplaint && (
          <div className="space-y-4">
            {/* Display complaint details (read-only) */}
            <div className="bg-[#0B0F14] border border-primary/20 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-[#9CA3AF] text-xs font-semibold mb-1">Tenant</label>
                <p className="text-[#E5E7EB] text-sm">{editingComplaint.tenant_name}</p>
              </div>
              <div>
                <label className="block text-[#9CA3AF] text-xs font-semibold mb-1">Title</label>
                <p className="text-[#E5E7EB] text-sm">{editingComplaint.title}</p>
              </div>
              {editingComplaint.description && (
                <div>
                  <label className="block text-[#9CA3AF] text-xs font-semibold mb-1">Description</label>
                  <p className="text-[#E5E7EB] text-sm whitespace-pre-wrap">{editingComplaint.description}</p>
                </div>
              )}
              {editingComplaint.photo_url && (
                <div>
                  <label className="block text-[#9CA3AF] text-xs font-semibold mb-1">Photo</label>
                  <img 
                    src={getFullUrl(editingComplaint.photo_url)}
                    alt="Complaint photo"
                    className="max-w-full h-auto rounded-lg border border-primary/20"
                  />
                </div>
              )}
              {editingComplaint.admin_notes && (
                <div>
                  <label className="block text-[#9CA3AF] text-xs font-semibold mb-1">Admin Notes</label>
                  <p className="text-[#E5E7EB] text-sm whitespace-pre-wrap bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded p-2">{editingComplaint.admin_notes}</p>
                </div>
              )}
              <div>
                <label className="block text-[#9CA3AF] text-xs font-semibold mb-1">Date</label>
                <p className="text-[#E5E7EB] text-sm">{formatDateDDMMYY(editingComplaint.created_at)}</p>
              </div>
            </div>

            {/* Status update section */}
            <div>
              <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Update Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
                required
              >
                <option value="open" className="bg-[#0B0F14] text-[#E5E7EB]">Open</option>
                <option value="in_progress" className="bg-[#0B0F14] text-[#E5E7EB]">In Progress</option>
                <option value="resolved" className="bg-[#0B0F14] text-[#E5E7EB]">Resolved</option>
              </select>
            </div>

            {/* Admin Notes section */}
            <div>
              <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes or comments about this status update..."
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm resize-none"
                rows="4"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
              <Button type="button" variant="outline" onClick={() => {
                setIsModalOpen(false);
                setEditingComplaint(null);
                setStatus('open');
                setAdminNotes('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>Update Status</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Complaint Modal (Tenant Form) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ tenant_id: '', title: '', description: '' });
          setPhotoFile(null);
          setPhotoPreview(null);
        }}
        title="Create New Complaint"
        size="lg"
        position="right"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4">
          <div>
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Tenant *</label>
            <select
              value={formData.tenant_id}
              onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            >
              <option value="" className="bg-[#0B0F14] text-[#E5E7EB]">Select Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id} className="bg-[#0B0F14] text-[#E5E7EB]">
                  {tenant.name} {tenant.phone ? `(${tenant.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter complaint title"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your complaint in detail..."
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm resize-none"
              rows="4"
            />
          </div>

          <div>
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#14B8A6] file:text-white hover:file:bg-[#2DD4BF] cursor-pointer"
            />
            {photoPreview && (
              <div className="mt-3 relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="max-w-full h-32 object-cover rounded-lg border border-primary/20"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ tenant_id: '', title: '', description: '', photo_url: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Submit Complaint</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;

