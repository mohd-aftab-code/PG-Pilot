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
        return 'bg-blue-100 text-blue-800';
      case 'CONTACTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'VISITED':
        return 'bg-purple-100 text-purple-800';
      case 'BOOKED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(row.status)}`}>
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
          className="text-blue-600 hover:text-blue-800 text-sm"
          disabled={row.status === 'BOOKED' || row.status === 'REJECTED'}
        >
          Update Status
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Inquiries</h1>
        <p className="text-gray-600">Manage inquiries from potential tenants</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filter by Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="VISITED">Visited</option>
            <option value="BOOKED">Booked</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <DataTable
            data={inquiries}
            columns={columns}
            loading={loading}
            emptyMessage="No inquiries found"
          />

          {/* Pagination */}
          {total > filters.limit && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {filters.page} of {Math.ceil(total / filters.limit)}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= Math.ceil(total / filters.limit)}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
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
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Tenant:</strong> {selectedInquiry.tenant_name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Room:</strong> {selectedInquiry.room_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Status:</strong>{' '}
                <span className={getStatusColor(selectedInquiry.status)}>
                  {selectedInquiry.status}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={selectedInquiry.status}>{selectedInquiry.status} (Current)</option>
                {getNextStatusOptions(selectedInquiry.status).map((status) => (
                  <option key={status} value={status}>
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

