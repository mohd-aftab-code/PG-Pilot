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
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [status, setStatus] = useState('open');
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchComplaints();
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

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/api/complaints/${editingComplaint.id}`, {
        title: editingComplaint.title,
        description: editingComplaint.description,
        photo_url: editingComplaint.photo_url,
        status: status
      });
      setIsModalOpen(false);
      setEditingComplaint(null);
      setStatus('open');
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert(error.response?.data?.error || 'Error updating complaint status');
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
      </div>

      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={complaints}
          loading={loading}
          onEdit={(complaint) => {
            setEditingComplaint(complaint);
            setStatus(complaint.status);
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
        }}
        title="Update Complaint Status"
        size="lg"
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

            <div className="flex gap-2 justify-end pt-4 border-t border-primary/20">
              <Button type="button" variant="outline" onClick={() => {
                setIsModalOpen(false);
                setEditingComplaint(null);
                setStatus('open');
              }}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>Update Status</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Complaints;

