import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const RegisterPG = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const facilityLabels = {
    FOOD: 'Food Available',
    WIFI: 'WiFi',
    AC: 'AC Rooms',
    PARKING: 'Parking',
    LAUNDRY: 'Laundry Service',
    SECURITY: 'Security',
    CCTV: 'CCTV',
    GYM: 'Gym',
    STUDY_ROOM: 'Study Room',
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    setFormData({ ...formData, images: files });
  };

  const handleFacilityChange = (facility) => {
    setFormData({
      ...formData,
      facilities: {
        ...formData.facilities,
        [facility]: !formData.facilities[facility],
      },
    });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('city', formData.city || '');
      formDataToSend.append('area', formData.area || '');
      formDataToSend.append('pincode', formData.pincode || '');
      formDataToSend.append('food_enabled', formData.food_enabled ? '1' : '0');
      formDataToSend.append('default_due_day', formData.default_due_day.toString());
      
      // Append facilities as array
      Object.keys(formData.facilities).forEach(facility => {
        if (formData.facilities[facility]) {
          formDataToSend.append('facilities[]', facility);
        }
      });
      
      // Append images
      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await api.post('/api/pgs', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newPG = response.data.pg;
      
      // Backend now returns updated user info with pg_id
      if (response.data.user && response.data.user.pg_id) {
        console.log('RegisterPG: Received updated user from backend:', response.data.user);
        setStoredUser(response.data.user);
      } else {
        // Fallback: Wait a bit and refresh user data from API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const userResponse = await api.get('/api/auth/me');
          if (userResponse.data?.user) {
            const updatedUser = userResponse.data.user;
            console.log('RegisterPG: Refreshed user from API:', updatedUser);
            setStoredUser(updatedUser);
          }
        } catch (err) {
          console.error('Error refreshing user:', err);
          // Last fallback: update manually
          const currentUser = getStoredUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, pg_id: newPG.id };
            console.log('RegisterPG: Fallback - manually updated user:', updatedUser);
            setStoredUser(updatedUser);
          }
        }
      }
      
      // Redirect to success page
      navigate('/pg-success', { replace: true });
    } catch (error) {
      console.error('Error creating PG:', error);
      setError(error.response?.data?.error || 'Failed to create PG. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-[#0F1720] rounded-xl shadow-xl border border-primary/10 p-6 sm:p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-[#E5E7EB] mb-3">
              Register Your PG
            </h1>
            <p className="text-[#D1D5DB] text-sm sm:text-base">
              Create your PG profile to get started. This is free and takes less than 2 minutes.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="PG Name *"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Green Valley PG"
            />

            <Input
              label="Address *"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Full address"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Noida"
              />

              <Input
                label="Area"
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Sector 44"
              />
            </div>

            <Input
              label="Pincode"
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="e.g., 201301"
            />

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#E5E7EB]">
                Default Due Day *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.default_due_day}
                onChange={(e) => setFormData({ ...formData, default_due_day: parseInt(e.target.value) || 5 })}
                className="w-full px-4 py-3 text-sm border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                required
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Day of month when rent is due (1-31)</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="food_enabled"
                checked={formData.food_enabled}
                onChange={(e) => setFormData({ ...formData, food_enabled: e.target.checked })}
                className="w-4 h-4 text-accent focus:ring-accent"
              />
              <label htmlFor="food_enabled" className="text-sm text-[#E5E7EB] cursor-pointer">
                Food service available
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#E5E7EB]">
                Facilities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(facilityLabels).map((facility) => (
                  <div key={facility} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`facility_${facility}`}
                      checked={formData.facilities[facility]}
                      onChange={() => handleFacilityChange(facility)}
                      className="w-4 h-4 text-accent focus:ring-accent"
                    />
                    <label htmlFor={`facility_${facility}`} className="text-sm text-[#E5E7EB] cursor-pointer">
                      {facilityLabels[facility]}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-[#E5E7EB]">
                PG Images (Optional, Max 10)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-3 text-sm border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#14B8A6] file:text-white hover:file:bg-[#2DD4BF] cursor-pointer"
              />
              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating PG...' : 'Register PG'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPG;

