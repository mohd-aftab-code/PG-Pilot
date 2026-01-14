import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Skeleton, SkeletonCard } from '../components/common/Skeleton';

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
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14]">
        {/* Header Skeleton */}
        <header className="bg-[#0F1720]/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-primary/10">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </header>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <SkeletonCard showHeader={true} lines={3} />
              <SkeletonCard showHeader={true} lines={2} />
              <SkeletonCard showHeader={true} lines={4} showButton={true} />
            </div>
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <SkeletonCard showHeader={true} lines={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pgData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#E5E7EB]">PG not found</p>
          <button
            onClick={() => navigate('/marketplace/search')}
            className="mt-4 px-4 py-2 bg-[#22D3EE] text-[#0B0F14] rounded-lg hover:bg-[#1FB6C1] transition-colors font-semibold"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14]">
      {/* Header */}
      <header className="bg-[#0F1720]/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
            <button
              onClick={() => navigate('/marketplace/search')}
              className="flex items-center gap-2 text-[#22D3EE] hover:text-[#1FB6C1] font-medium transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Search
            </button>
            <Link
              to="/"
              className="text-[#9CA3AF] hover:text-[#E5E7EB] text-sm transition-colors"
            >
              Home
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#E5E7EB]">{pgData.pg_name}</h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">{pgData.area}, {pgData.city}</p>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Location */}
            <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#E5E7EB]">Location</h2>
              <p className="text-[#E5E7EB] mb-2 text-sm sm:text-base">{pgData.address}</p>
              <p className="text-[#9CA3AF] text-sm sm:text-base">
                {pgData.area}, {pgData.city}
                {pgData.pincode && ` - ${pgData.pincode}`}
              </p>
              {pgData.latitude && pgData.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${pgData.latitude},${pgData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[#22D3EE] hover:text-[#1FB6C1] transition-colors text-sm sm:text-base"
                >
                  View on Google Maps →
                </a>
              )}
            </div>

            {/* Facilities */}
            {pgData.facilities && pgData.facilities.length > 0 && (
              <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#E5E7EB]">Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {pgData.facilities.map((facility, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rooms */}
            {pgData.rooms && pgData.rooms.length > 0 && (
              <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#E5E7EB]">Available Rooms</h2>
                <div className="space-y-4">
                  {pgData.rooms
                    .filter(room => room.available_beds > 0)
                    .map((room) => (
                      <div
                        key={room.room_id}
                        className="border border-primary/10 rounded-lg p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all bg-[#0B0F14]"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB]">{room.room_name}</h3>
                            <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
                              {room.gender_type} • {room.available_beds} bed{room.available_beds !== 1 ? 's' : ''} available
                            </p>
                            {room.room_description && (
                              <p className="text-[#E5E7EB] mt-2 text-sm sm:text-base">{room.room_description}</p>
                            )}
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-xl sm:text-2xl font-bold text-[#22D3EE]">
                              ₹{room.rent_per_bed}
                            </div>
                            <div className="text-xs sm:text-sm text-[#9CA3AF]">per bed/month</div>
                          </div>
                        </div>
                        
                        {room.room_images && room.room_images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {room.room_images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={getFullUrl(img)}
                                alt={`${room.room_name} ${idx + 1}`}
                                className="w-full h-20 sm:h-24 object-cover rounded border border-primary/10"
                              />
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => handleInquiryClick(room)}
                          className="w-full bg-[#14B8A6] text-white py-2 sm:py-2.5 rounded-lg hover:bg-[#2DD4BF] transition-colors font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
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
            <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-20">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#E5E7EB]">Quick Info</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Food Available</span>
                  <p className="font-semibold text-[#E5E7EB] text-sm sm:text-base">{pgData.food_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Total Rooms</span>
                  <p className="font-semibold text-[#E5E7EB] text-sm sm:text-base">{pgData.rooms?.length || 0}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-[#9CA3AF]">Available Beds</span>
                  <p className="font-semibold text-[#E5E7EB] text-sm sm:text-base">
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
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-[#9CA3AF] mb-2">
              Room: <span className="font-semibold text-[#E5E7EB]">{selectedRoom?.room_name}</span>
            </p>
            <p className="text-sm text-[#9CA3AF]">
              Rent: <span className="font-semibold text-[#E5E7EB]">₹{selectedRoom?.rent_per_bed}/bed/month</span>
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

