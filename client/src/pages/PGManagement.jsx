import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { formatDateDDMMYY } from '../components/common/dateUtils';

const PGManagement = () => {
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPG, setEditingPG] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    food_enabled: false,
    default_due_day: 5,
  });
  const user = getStoredUser();

  useEffect(() => {
    fetchPGs();
  }, []);

  const fetchPGs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/pgs');
      setPGs(response.data.pgs || []);
    } catch (error) {
      console.error('Error fetching PGs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPG) {
        await api.put(`/api/pgs/${editingPG.id}`, formData);
      } else {
        await api.post('/api/pgs', formData);
      }
      setIsModalOpen(false);
      setEditingPG(null);
      setFormData({ name: '', address: '', food_enabled: false, default_due_day: 5 });
      fetchPGs();
    } catch (error) {
      console.error('Error saving PG:', error);
      alert(error.response?.data?.error || 'Error saving PG');
    }
  };

  const handleEdit = (pg) => {
    setEditingPG(pg);
    setFormData({
      name: pg.name,
      address: pg.address || '',
      food_enabled: pg.food_enabled === 1,
      default_due_day: pg.default_due_day || 5,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (pg) => {
    if (!window.confirm('Are you sure you want to delete this PG?')) return;
    try {
      await api.delete(`/api/pgs/${pg.id}`);
      fetchPGs();
    } catch (error) {
      console.error('Error deleting PG:', error);
      alert(error.response?.data?.error || 'Error deleting PG');
    }
  };

  const columns = [
    { header: 'PG UID', accessor: 'pg_uid' },
    { header: 'Name', accessor: 'name' },
    { header: 'Address', accessor: 'address', render: (val) => val || '-' },
    { header: 'Food Enabled', accessor: 'food_enabled', render: (val) => val === 1 ? 'Yes' : 'No' },
    { header: 'Default Due Day', accessor: 'default_due_day' },
    { header: 'Created At', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">PG Management</h1>
        {user?.role === 'superadmin' && (
          <Button onClick={() => setIsModalOpen(true)}>Add New PG</Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={pgs}
        loading={loading}
        onEdit={user?.role === 'superadmin' ? handleEdit : null}
        onDelete={user?.role === 'superadmin' ? handleDelete : null}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPG(null);
          setFormData({ name: '', address: '', food_enabled: false, default_due_day: 5 });
        }}
        title={editingPG ? 'Edit PG' : 'Add New PG'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="PG Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            type="textarea"
          />
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.food_enabled}
                onChange={(e) => setFormData({ ...formData, food_enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-foreground">Food Enabled</span>
            </label>
          </div>
          <Input
            label="Default Due Day"
            type="number"
            value={formData.default_due_day}
            onChange={(e) => setFormData({ ...formData, default_due_day: parseInt(e.target.value) })}
            required
          />
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

export default PGManagement;

