import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const InquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 20,
  });
  const [total, setTotal] = useState(0);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchInquiries();
    }
  }, [pgId, filters.status, filters.page]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pg_id: pgId,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await api.get(`/api/inquiry/list?${params.toString()}`);
      
      if (response.data.success) {
        setInquiries(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      alert('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !selectedInquiry) return;

    setUpdating(true);
    try {
      const response = await api.patch(
        `/api/inquiry/${selectedInquiry.id}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        alert('Inquiry status updated successfully');
        setShowStatusModal(false);
        setSelectedInquiry(null);
        setNewStatus('');
        fetchInquiries();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setNewStatus(inquiry.status);
    setShowStatusModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'CONTACTED':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'VISITED':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'BOOKED':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'NEW':
        return ['CONTACTED', 'REJECTED'];
      case 'CONTACTED':
        return ['VISITED', 'REJECTED'];
      case 'VISITED':
        return ['BOOKED', 'REJECTED'];
      default:
        return [];
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'created_at',
      render: (row) => formatDateDDMMYY(new Date(row.created_at)),
    },
    {
      header: 'Tenant Name',
      accessor: 'tenant_name',
    },
    {
      header: 'Phone',
      accessor: 'tenant_phone',
    },
    {
      header: 'Email',
      accessor: 'tenant_email',
    },
    {
      header: 'Profession',
      accessor: 'tenant_profession',
    },
    {
      header: 'Room',
      accessor: 'room_name',
    },
    {
      header: 'Rent',
      accessor: 'rent_per_bed',
      render: (row) => `₹${row.rent_per_bed}/bed`,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => openStatusModal(row)}
          className="px-2 py-1 bg-[#1FB6C1]/20 text-[#1FB6C1] rounded-lg hover:bg-[#1FB6C1]/30 transition-all text-xs font-medium border border-[#1FB6C1]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={row.status === 'BOOKED' || row.status === 'REJECTED'}
        >
          Update Status
        </button>
      ),
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB] mb-1 sm:mb-2">Booking Inquiries</h1>
        <p className="text-sm sm:text-base text-[#9CA3AF]">Manage inquiries from potential tenants</p>
      </div>

      {/* Filters */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <label className="text-sm sm:text-base font-semibold text-[#E5E7EB] whitespace-nowrap">Filter by Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
          >
            <option value="all" className="bg-[#0B0F14] text-[#E5E7EB]">All</option>
            <option value="NEW" className="bg-[#0B0F14] text-[#E5E7EB]">New</option>
            <option value="CONTACTED" className="bg-[#0B0F14] text-[#E5E7EB]">Contacted</option>
            <option value="VISITED" className="bg-[#0B0F14] text-[#E5E7EB]">Visited</option>
            <option value="BOOKED" className="bg-[#0B0F14] text-[#E5E7EB]">Booked</option>
            <option value="REJECTED" className="bg-[#0B0F14] text-[#E5E7EB]">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
          data={inquiries}
          columns={columns}
          loading={loading}
          emptyMessage="No inquiries found"
        />
      </div>

      {/* Pagination */}
      {total > filters.limit && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="w-full sm:w-auto px-4 py-2 border border-primary/20 rounded-lg bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-[#E5E7EB]">
            Page <span className="font-semibold">{filters.page}</span> of <span className="font-semibold">{Math.ceil(total / filters.limit)}</span>
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page >= Math.ceil(total / filters.limit)}
            className="w-full sm:w-auto px-4 py-2 border border-primary/20 rounded-lg bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedInquiry(null);
          setNewStatus('');
        }}
        title="Update Inquiry Status"
        size="sm"
      >
        {selectedInquiry && (
          <div>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-[#9CA3AF]">
                <strong className="text-[#E5E7EB]">Tenant:</strong> <span className="text-[#E5E7EB]">{selectedInquiry.tenant_name}</span>
              </p>
              <p className="text-sm text-[#9CA3AF]">
                <strong className="text-[#E5E7EB]">Room:</strong> <span className="text-[#E5E7EB]">{selectedInquiry.room_name}</span>
              </p>
              <p className="text-sm text-[#9CA3AF]">
                <strong className="text-[#E5E7EB]">Current Status:</strong>{' '}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedInquiry.status)}`}>
                  {selectedInquiry.status}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#E5E7EB] mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
              >
                <option value={selectedInquiry.status} className="bg-[#0B0F14] text-[#E5E7EB]">{selectedInquiry.status} (Current)</option>
                {getNextStatusOptions(selectedInquiry.status).map((status) => (
                  <option key={status} value={status} className="bg-[#0B0F14] text-[#E5E7EB]">
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedInquiry(null);
                  setNewStatus('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updating || newStatus === selectedInquiry.status}>
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InquiryList;

