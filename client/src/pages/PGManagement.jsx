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
    city: '',
    area: '',
    pincode: '',
    food_enabled: false,
    default_due_day: 5,
    images: [],
    facilities: {
      FOOD: false,
      WIFI: false,
      AC: false,
      PARKING: false,
      LAUNDRY: false,
      SECURITY: false,
      CCTV: false,
      GYM: false,
      STUDY_ROOM: false,
    },
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
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('city', formData.city || '');
      formDataToSend.append('area', formData.area || '');
      formDataToSend.append('pincode', formData.pincode || '');
      formDataToSend.append('food_enabled', formData.food_enabled ? '1' : '0');
      formDataToSend.append('default_due_day', formData.default_due_day.toString());
      
      // Append facilities
      Object.keys(formData.facilities).forEach(facility => {
        if (formData.facilities[facility]) {
          formDataToSend.append('facilities[]', facility);
        }
      });
      
      // Append images
      formData.images.forEach((image, index) => {
        formDataToSend.append(`images`, image);
      });

      if (editingPG) {
        await api.put(`/api/pgs/${editingPG.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/pgs', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      setEditingPG(null);
      setFormData({ 
        name: '', 
        address: '', 
        city: '', 
        area: '', 
        pincode: '', 
        food_enabled: false, 
        default_due_day: 5,
        images: [],
        facilities: {
          FOOD: false,
          WIFI: false,
          AC: false,
          PARKING: false,
          LAUNDRY: false,
          SECURITY: false,
          CCTV: false,
          GYM: false,
          STUDY_ROOM: false,
        },
      });
      fetchPGs();
    } catch (error) {
      console.error('Error saving PG:', error);
      alert(error.response?.data?.error || 'Error saving PG');
    }
  };

  const handleEdit = async (pg) => {
    setEditingPG(pg);
    
    // Fetch facilities for this PG
    let facilities = {
      FOOD: false,
      WIFI: false,
      AC: false,
      PARKING: false,
      LAUNDRY: false,
      SECURITY: false,
      CCTV: false,
      GYM: false,
      STUDY_ROOM: false,
    };
    
    try {
      const response = await api.get(`/api/pgs/${pg.id}`);
      if (response.data && response.data.facilities) {
        response.data.facilities.forEach(facility => {
          if (facilities.hasOwnProperty(facility)) {
            facilities[facility] = true;
          }
        });
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
    
    setFormData({
      name: pg.name,
      address: pg.address || '',
      city: pg.city || '',
      area: pg.area || '',
      pincode: pg.pincode || '',
      food_enabled: pg.food_enabled === 1,
      default_due_day: pg.default_due_day || 5,
      images: pg.images ? (typeof pg.images === 'string' ? JSON.parse(pg.images) : pg.images) : [],
      facilities: facilities,
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
    { header: 'City', accessor: 'city', render: (val) => val || '-' },
    { header: 'Area', accessor: 'area', render: (val) => val || '-' },
    { header: 'Address', accessor: 'address', render: (val) => val || '-' },
    { header: 'Food Enabled', accessor: 'food_enabled', render: (val) => val === 1 ? 'Yes' : 'No' },
    { header: 'Default Due Day', accessor: 'default_due_day' },
    { header: 'Created At', accessor: 'created_at', render: (val) => formatDateDDMMYY(val) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#E5E7EB]">PG Management</h1>
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
          setFormData({ 
            name: '', 
            address: '', 
            city: '', 
            area: '', 
            pincode: '', 
            food_enabled: false, 
            default_due_day: 5,
            images: []
          });
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Noida, Delhi"
              required
            />
            <Input
              label="Area *"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="e.g., Sector 44"
              required
            />
          </div>
          <Input
            label="Pincode *"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder="e.g., 201301"
            required
          />
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-2">
              PG Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setFormData({ ...formData, images: files });
              }}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
            />
            {formData.images.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-[#9CA3AF] mb-2">
                  {formData.images.length} image(s) selected
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-primary/10"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {editingPG && editingPG.images && (
              <div className="mt-2">
                <p className="text-sm text-[#9CA3AF] mb-2">Existing Images:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(typeof editingPG.images === 'string' ? JSON.parse(editingPG.images) : editingPG.images).map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-primary/10"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.food_enabled}
                onChange={(e) => setFormData({ ...formData, food_enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-[#E5E7EB]">Food Enabled</span>
            </label>
          </div>
          <Input
            label="Default Due Day"
            type="number"
            value={formData.default_due_day}
            onChange={(e) => setFormData({ ...formData, default_due_day: parseInt(e.target.value) })}
            required
          />
          
          {/* Facilities Section */}
          <div className="mb-4">
            <label className="block text-[#E5E7EB] text-sm font-semibold mb-3">
              Facilities *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(formData.facilities).map((facility) => (
                <label key={facility} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.facilities[facility]}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          [facility]: e.target.checked,
                        },
                      });
                    }}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm text-[#E5E7EB]">{facility.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Select all facilities available at your PG
            </p>
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

export default PGManagement;

