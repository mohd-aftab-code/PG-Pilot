import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const PGDetail = () => {
  const { pg_id } = useParams();
  const navigate = useNavigate();
  const [pgData, setPgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    tenant_user_id: '',
    name: '',
    phone: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPGDetail();
  }, [pg_id]);

  const fetchPGDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/pg/${pg_id}`);
      if (response.data.success) {
        setPgData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching PG detail:', error);
      alert('Failed to load PG details');
      navigate('/marketplace/search');
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryClick = (room) => {
    setSelectedRoom(room);
    setShowInquiryModal(true);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    
    if (!inquiryForm.name || !inquiryForm.phone) {
      alert('Name and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      // First, check if tenant_user exists or create one
      let tenantUserId = inquiryForm.tenant_user_id;
      
      if (!tenantUserId) {
        // Try to find existing tenant user by phone
        try {
          // Note: You might need to create an endpoint to find/create tenant user
          // For now, we'll create the inquiry directly
        } catch (err) {
          // If not found, we'll need to create one
          // This is a simplified version - you might want to add tenant user creation endpoint
        }
      }

      // Create inquiry
      const inquiryData = {
        tenant_user_id: tenantUserId || 1, // Temporary - should be from tenant user creation
        pg_id: parseInt(pg_id),
        room_id: selectedRoom.room_id,
      };

      const response = await api.post(`/api/inquiry`, inquiryData);
      
      if (response.data.success) {
        alert('Inquiry submitted successfully! The PG owner will contact you soon.');
        setShowInquiryModal(false);
        setInquiryForm({ tenant_user_id: '', name: '', phone: '', email: '' });
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert(error.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading PG details...</p>
        </div>
      </div>
    );
  }

  if (!pgData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">PG not found</p>
          <button
            onClick={() => navigate('/marketplace/search')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/marketplace/search')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Search
            </button>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Home
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pgData.pg_name}</h1>
          <p className="text-sm text-gray-600 mt-1">{pgData.area}, {pgData.city}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Location */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <p className="text-gray-700 mb-2">{pgData.address}</p>
              <p className="text-gray-600">
                {pgData.area}, {pgData.city}
                {pgData.pincode && ` - ${pgData.pincode}`}
              </p>
              {pgData.latitude && pgData.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${pgData.latitude},${pgData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-blue-600 hover:text-blue-800"
                >
                  View on Google Maps →
                </a>
              )}
            </div>

            {/* Facilities */}
            {pgData.facilities && pgData.facilities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {pgData.facilities.map((facility, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms */}
            {pgData.rooms && pgData.rooms.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
                <div className="space-y-4">
                  {pgData.rooms
                    .filter(room => room.available_beds > 0)
                    .map((room) => (
                      <div
                        key={room.room_id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold">{room.room_name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {room.gender_type} • {room.available_beds} bed{room.available_beds !== 1 ? 's' : ''} available
                            </p>
                            {room.room_description && (
                              <p className="text-gray-700 mt-2">{room.room_description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              ₹{room.rent_per_bed}
                            </div>
                            <div className="text-sm text-gray-600">per bed/month</div>
                          </div>
                        </div>
                        
                        {room.room_images && room.room_images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {room.room_images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`${room.room_name} ${idx + 1}`}
                                className="w-full h-24 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => handleInquiryClick(room)}
                          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Send Inquiry
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Quick Info</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Food Available</span>
                  <p className="font-semibold">{pgData.food_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Rooms</span>
                  <p className="font-semibold">{pgData.rooms?.length || 0}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Available Beds</span>
                  <p className="font-semibold">
                    {pgData.rooms?.reduce((sum, room) => sum + room.available_beds, 0) || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <Modal
        isOpen={showInquiryModal}
        onClose={() => {
          setShowInquiryModal(false);
          setInquiryForm({ tenant_user_id: '', name: '', phone: '', email: '' });
          setSelectedRoom(null);
        }}
        title="Send Inquiry"
        size="md"
      >
        <form onSubmit={handleInquirySubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Room: <span className="font-semibold">{selectedRoom?.room_name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Rent: <span className="font-semibold">₹{selectedRoom?.rent_per_bed}/bed/month</span>
            </p>
          </div>

          <Input
            label="Your Name *"
            value={inquiryForm.name}
            onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
            required
          />

          <Input
            label="Phone Number *"
            type="tel"
            value={inquiryForm.phone}
            onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
            required
          />

          <Input
            label="Email (Optional)"
            type="email"
            value={inquiryForm.email}
            onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
          />

          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowInquiryModal(false);
                setInquiryForm({ tenant_user_id: '', name: '', phone: '', email: '' });
                setSelectedRoom(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Send Inquiry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PGDetail;

