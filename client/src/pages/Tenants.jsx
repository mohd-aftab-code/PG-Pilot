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
      if (editingTenant) {
        await api.put(`/api/tenants/${editingTenant.id}`, formData);
      } else {
        await api.post('/api/tenants', formData);
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
      join_date: '',
      rent_amount: '',
      deposit_amount: '',
      is_active: true,
    });
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      ...formData,
      bed_id: tenant.bed_id || '',
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      join_date: formatDateForInput(tenant.join_date),
      rent_amount: tenant.rent_amount || '',
      deposit_amount: tenant.deposit_amount || '',
      is_active: tenant.is_active === 1,
    });
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

