import React, { useState, useEffect } from 'react';
import api, { getFullUrl } from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import { useSubscription } from '../context/SubscriptionContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const Tenants = () => {
  const { isReadOnly } = useSubscription();
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  
  const [formData, setFormData] = useState({
    pg_id: getStoredPgId(),
    bed_id: '',
    name: '',
    phone: '',
    email: '',
    aadhaar_file: null,
    join_date: '',
    rent_amount: '',
    deposit_amount: '',
    is_active: true,
  });
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) {
      fetchTenants();
      fetchRooms();
    }
  }, [pgId]);

  const [selectedRoomId, setSelectedRoomId] = useState('');

  useEffect(() => {
    if (selectedRoomId) {
      fetchBedsForRoom(selectedRoomId);
    }
  }, [selectedRoomId]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/tenants/pg/${pgId}`);
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get(`/api/rooms/pg/${pgId}`);
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBedsForRoom = async (roomId) => {
    try {
      const response = await api.get(`/api/beds/room/${roomId}`);
      setBeds(response.data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pg_id', formData.pg_id);
      formDataToSend.append('bed_id', formData.bed_id || '');
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('email', formData.email || '');
      formDataToSend.append('join_date', formData.join_date || '');
      formDataToSend.append('rent_amount', formData.rent_amount || '');
      formDataToSend.append('deposit_amount', formData.deposit_amount || '');
      formDataToSend.append('is_active', formData.is_active ? '1' : '0');
      
      // Append Aadhaar file if selected
      if (formData.aadhaar_file) {
        formDataToSend.append('aadhaar', formData.aadhaar_file);
      }

      if (editingTenant) {
        await api.put(`/api/tenants/${editingTenant.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/tenants', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      setEditingTenant(null);
      resetForm();
      fetchTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      alert(error.response?.data?.error || 'Error saving tenant');
    }
  };

  const resetForm = () => {
    setFormData({
      pg_id: pgId,
      bed_id: '',
      name: '',
      phone: '',
      email: '',
      aadhaar_file: null,
      join_date: '',
      rent_amount: '',
      deposit_amount: '',
      is_active: true,
    });
    setSelectedRoomId('');
    setBeds([]);
  };

  const handleEdit = async (tenant) => {
    if (isReadOnly) {
      alert('Trial expired. Please upgrade to edit tenants.');
      return;
    }
    setEditingTenant(tenant);
    setFormData({
      ...formData,
      bed_id: tenant.bed_id || '',
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      aadhaar_file: null,
      join_date: formatDateForInput(tenant.join_date),
      rent_amount: tenant.rent_amount || '',
      deposit_amount: tenant.deposit_amount || '',
      is_active: tenant.is_active === 1,
    });
    
    // If tenant has a bed_id, find the room_id and set selectedRoomId
    if (tenant.bed_id) {
      try {
        const bedResponse = await api.get(`/api/beds/${tenant.bed_id}`);
        if (bedResponse.data.bed && bedResponse.data.bed.room_id) {
          const roomId = bedResponse.data.bed.room_id.toString();
          setSelectedRoomId(roomId);
          // Manually fetch beds for this room
          await fetchBedsForRoom(roomId);
        }
      } catch (error) {
        console.error('Error fetching bed details:', error);
        setSelectedRoomId('');
        setBeds([]);
      }
    } else {
      setSelectedRoomId('');
      setBeds([]);
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (tenant) => {
    if (isReadOnly) {
      alert('Trial expired. Please upgrade to delete tenants.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await api.delete(`/api/tenants/${tenant.id}`);
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert(error.response?.data?.error || 'Error deleting tenant');
    }
  };

  // Status Badge Component
  const StatusBadge = ({ isActive }) => {
    if (isActive === 1 || isActive === true) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-300">
        Inactive
      </span>
    );
  };

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    // Search filter
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      tenant.name?.toLowerCase().includes(searchTerm) ||
      tenant.phone?.toLowerCase().includes(searchTerm) ||
      tenant.email?.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && tenant.is_active === 1) ||
      (filters.status === 'inactive' && tenant.is_active !== 1);

    return matchesSearch && matchesStatus;
  });

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email', render: (val) => val || '-' },
    { header: 'Room', accessor: 'room_name', render: (val) => val || '-' },
    { header: 'Bed', accessor: 'bed_number', render: (val) => val || '-' },
    { header: 'Rent', accessor: 'rent_amount', render: (val) => val ? `₹${val}` : '-' },
    { header: 'Join Date', accessor: 'join_date', render: (val) => formatDateDDMMYY(val) },
    { 
      header: 'Aadhaar', 
      accessor: 'aadhaar_url', 
      render: (val, row) => {
        if (!val) return <span className="text-[#9CA3AF]">-</span>;
        const docUrl = getFullUrl(val);
        return (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#22D3EE] hover:text-[#1FB6C1] hover:underline text-sm font-medium transition-colors"
          >
            View Document
          </a>
        );
      }
    },
    { header: 'Status', accessor: 'is_active', render: (val) => <StatusBadge isActive={val} /> },
  ];

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-2">Tenants</h1>
            <p className="text-[#9CA3AF] text-sm md:text-base">
              Manage all your PG tenants, their details, and room assignments
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Tenant
          </Button>
        </div>

        {/* Filters Section */}
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 md:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, phone, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(filters.search || filters.status !== 'all') && (
              <button
                onClick={() => setFilters({ search: '', status: 'all' })}
                className="w-full sm:w-auto px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-[#22D3EE] hover:text-[#1FB6C1] font-medium border border-primary/20 hover:border-primary/40 rounded-lg bg-[#0B0F14] hover:bg-[#0F1720] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[#9CA3AF] text-xs md:text-sm font-medium mb-1">Total Tenants</p>
              <p className="text-xl md:text-2xl font-bold text-[#E5E7EB] truncate">{filteredTenants.length}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[#9CA3AF] text-xs md:text-sm font-medium mb-1">Active</p>
              <p className="text-xl md:text-2xl font-bold text-green-400 truncate">
                {filteredTenants.filter(t => t.is_active === 1).length}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[#9CA3AF] text-xs md:text-sm font-medium mb-1">Inactive</p>
              <p className="text-xl md:text-2xl font-bold text-red-400 truncate">
                {filteredTenants.filter(t => t.is_active !== 1).length}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredTenants}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTenant(null);
          resetForm();
          setSelectedRoomId('');
          setBeds([]);
        }}
        title={editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Aadhaar Document</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setFormData({ ...formData, aadhaar_file: file });
                }}
                className="w-full px-3 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#22D3EE]/20 file:text-[#22D3EE] hover:file:bg-[#22D3EE]/30 transition-all"
              />
            </div>
            {formData.aadhaar_file && (
              <div className="mt-2 p-3 bg-[#0B0F14] border border-primary/10 rounded-lg">
                <p className="text-xs text-[#9CA3AF] flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selected: <span className="text-[#E5E7EB] font-medium">{formData.aadhaar_file.name}</span>
                </p>
              </div>
            )}
            {editingTenant && editingTenant.aadhaar_url && !formData.aadhaar_file && (
              <div className="mt-2 p-3 bg-[#0B0F14] rounded-lg border border-primary/10">
                <p className="text-xs text-[#9CA3AF] mb-2">Current Document:</p>
                <a
                  href={getFullUrl(editingTenant.aadhaar_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#22D3EE] bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Document
                </a>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Room</label>
            <select
              value={selectedRoomId}
              onChange={(e) => {
                const roomId = e.target.value;
                setSelectedRoomId(roomId);
                if (roomId) {
                  fetchBedsForRoom(roomId);
                } else {
                  setBeds([]);
                }
              }}
              className="w-full px-3 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all"
            >
              <option value="">Select Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.room_name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">Bed</label>
            <select
              value={formData.bed_id}
              onChange={(e) => setFormData({ ...formData, bed_id: e.target.value })}
              className="w-full px-3 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all"
            >
              <option value="">Select Bed</option>
              {beds.map((bed) => (
                <option key={bed.id} value={bed.id}>Bed {bed.bed_number} ({bed.status})</option>
              ))}
            </select>
          </div>
          <Input
            label="Join Date"
            type="date"
            value={formData.join_date}
            onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
          />
          <Input
            label="Rent Amount"
            type="number"
            value={formData.rent_amount}
            onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
          />
          <Input
            label="Deposit Amount"
            type="number"
            value={formData.deposit_amount}
            onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
          />
          <div className="mb-4">
            <label className="flex items-center gap-3 p-3 bg-[#0B0F14] border border-primary/10 rounded-lg cursor-pointer hover:bg-[#0F1720] transition-colors">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#22D3EE] bg-[#0B0F14] border-primary/20 rounded focus:ring-[#22D3EE] focus:ring-2"
              />
              <span className="text-[#E5E7EB] font-medium">Active Tenant</span>
            </label>
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

export default Tenants;

