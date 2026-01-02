import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY, formatDateForInput } from '../components/common/dateUtils';

const Tenants = () => {
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
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
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
        if (!val) return <span className="text-muted-foreground">-</span>;
        const docUrl = val.startsWith('http') ? val : `http://localhost:5000${val}`;
        return (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm font-medium"
          >
            View Document
          </a>
        );
      }
    },
    { header: 'Status', accessor: 'is_active', render: (val) => <StatusBadge isActive={val} /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Tenants</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add New Tenant</Button>
      </div>

      {/* Simple Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, phone, email..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(filters.search || filters.status !== 'all') && (
          <button
            onClick={() => setFilters({ search: '', status: 'all' })}
            className="px-4 py-2 text-sm text-primary hover:text-accent font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredTenants}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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
            <label className="block text-sm font-medium mb-2">Aadhaar Document</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                setFormData({ ...formData, aadhaar_file: file });
              }}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
            {formData.aadhaar_file && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {formData.aadhaar_file.name}
              </p>
            )}
            {editingTenant && editingTenant.aadhaar_url && !formData.aadhaar_file && (
              <div className="mt-2 p-2 bg-muted rounded border border-border">
                <p className="text-xs text-muted-foreground mb-2">Current Document:</p>
                <a
                  href={editingTenant.aadhaar_url.startsWith('http') ? editingTenant.aadhaar_url : `http://localhost:5000${editingTenant.aadhaar_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
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
            <label className="block text-foreground text-sm font-semibold mb-2">Room</label>
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
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            >
              <option value="">Select Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.room_name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">Bed</label>
            <select
              value={formData.bed_id}
              onChange={(e) => setFormData({ ...formData, bed_id: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
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
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-foreground">Active</span>
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

