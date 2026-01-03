import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser, getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

// Icon Components
const IconHome = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconBed = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Skeleton Loader Component
const SkeletonLoader = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="animate-pulse">
          <div className="bg-[#0B0F14] rounded-lg p-4 border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-8 w-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Room Card Component
const RoomCard = ({ room, isSelected, onSelect, onEdit }) => {
  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-[#22D3EE] bg-[#22D3EE]/10 shadow-md'
          : 'border-primary/10 bg-[#0F1720] hover:border-primary/30 hover:shadow-sm'
      }`}
      onClick={() => onSelect(room)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-[#22D3EE] text-[#0B0F14]' : 'bg-[#0B0F14] text-[#E5E7EB]'
          }`}>
            <IconHome />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#E5E7EB] truncate">{room.room_name}</h3>
            <p className="text-sm text-[#9CA3AF]">Room ID: {room.id}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(room);
          }}
          className="p-2 hover:bg-[#0B0F14] rounded transition-colors text-[#9CA3AF] hover:text-[#E5E7EB]"
          title="Edit room"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-primary/10">
        <div>
          <p className="text-xs text-[#9CA3AF] mb-1">Total Beds</p>
          <p className="text-lg font-semibold text-[#E5E7EB]">{room.total_beds}</p>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF] mb-1">Rent per Bed</p>
          <p className="text-lg font-semibold text-[#E5E7EB]">₹{room.rent_per_bed}</p>
        </div>
      </div>
      {room.gender_type && (
        <div className="mt-2">
          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
            {room.gender_type}
          </span>
          {room.show_in_marketplace && (
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded ml-2">
              Marketplace
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Bed Card Component
const BedCard = ({ bed, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'blocked':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus?.toLowerCase()) {
      case 'vacant':
        return 'occupied';
      case 'occupied':
        return 'blocked';
      default:
        return 'vacant';
    }
  };

  return (
    <div className="p-3 rounded-lg border border-primary/10 bg-[#0F1720] hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0B0F14] flex items-center justify-center">
            <IconBed />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#E5E7EB]">Bed #{bed.bed_number}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bed.status)}`}>
            {bed.status?.charAt(0).toUpperCase() + bed.status?.slice(1) || 'Vacant'}
          </span>
          <button
            onClick={() => onStatusChange(bed, getNextStatus(bed.status))}
            className="p-1.5 hover:bg-[#0B0F14] rounded transition-colors text-[#9CA3AF] hover:text-[#E5E7EB]"
            title={`Change to ${getNextStatus(bed.status)}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const RoomsBeds = () => {
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState({});
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState({});
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingImages, setViewingImages] = useState(null);
  
  // Filter states
  const [roomFilter, setRoomFilter] = useState({
    search: '',
  });
  const [bedFilter, setBedFilter] = useState({
    status: 'all',
  });
  
  const [formData, setFormData] = useState({
    pg_id: getStoredPgId(),
    room_name: '',
    total_beds: 1,
    rent_per_bed: 0,
    gender_type: 'unisex',
    show_in_marketplace: true,
    room_description: '',
    images: [],
  });

  useEffect(() => {
    if (formData.pg_id) {
      fetchRooms();
    }
  }, [formData.pg_id]);

  const toggleRoom = async (roomId) => {
    const newExpanded = new Set(expandedRooms);
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId);
    } else {
      newExpanded.add(roomId);
      // Fetch beds if not already loaded
      if (!beds[roomId]) {
        await fetchBeds(roomId);
      }
    }
    setExpandedRooms(newExpanded);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/rooms/pg/${formData.pg_id}`);
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (roomId) => {
    if (!roomId) return;
    setBedsLoading(prev => ({ ...prev, [roomId]: true }));
    try {
      const response = await api.get(`/api/beds/room/${roomId}`);
      const fetchedBeds = response.data.beds || [];
      setBeds(prev => ({ ...prev, [roomId]: fetchedBeds }));
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds(prev => ({ ...prev, [roomId]: [] }));
    } finally {
      setBedsLoading(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pg_id', formData.pg_id);
      formDataToSend.append('room_name', formData.room_name);
      formDataToSend.append('total_beds', formData.total_beds.toString());
      formDataToSend.append('rent_per_bed', formData.rent_per_bed.toString());
      formDataToSend.append('gender_type', formData.gender_type);
      formDataToSend.append('show_in_marketplace', formData.show_in_marketplace ? '1' : '0');
      formDataToSend.append('room_description', formData.room_description || '');
      
      // Append images
      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      if (editingRoom) {
        await api.put(`/api/rooms/${editingRoom.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/rooms', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
      setFormData({ 
        ...formData, 
        room_name: '', 
        total_beds: 1, 
        rent_per_bed: 0,
        gender_type: 'unisex',
        show_in_marketplace: true,
        room_description: '',
        images: [],
      });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert(error.response?.data?.error || 'Error saving room');
    }
  };

  const handleBedStatusUpdate = async (bed, newStatus, roomId) => {
    try {
      await api.put(`/api/beds/${bed.id}/status`, { status: newStatus });
      fetchBeds(roomId);
    } catch (error) {
      console.error('Error updating bed status:', error);
      alert(error.response?.data?.error || 'Error updating bed status');
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      vacant: {
        label: 'Vacant',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      },
      occupied: {
        label: 'Occupied',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
      },
      blocked: {
        label: 'Blocked',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
      },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.vacant;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
      >
        {config.label}
      </span>
    );
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !roomFilter.search || room.room_name?.toLowerCase().includes(roomFilter.search.toLowerCase());
    return matchesSearch;
  });

  const roomColumns = [
    { header: 'Room Name', accessor: 'room_name' },
    { header: 'Total Beds', accessor: 'total_beds' },
    { header: 'Rent per Bed', accessor: 'rent_per_bed', render: (val) => `₹${val}` },
    { 
      header: 'Gender', 
      accessor: 'gender_type', 
      render: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A' 
    },
    { 
      header: 'Marketplace', 
      accessor: 'show_in_marketplace', 
      render: (val) => val ? 'Yes' : 'No' 
    },
  ];

  const bedColumns = [
    { header: 'Bed Number', accessor: 'bed_number' },
    { header: 'Status', accessor: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#E5E7EB] mb-1">Rooms & Beds</h1>
          <p className="text-[#9CA3AF] text-sm">Manage your rooms and bed availability</p>
        </div>
        <Button 
          onClick={() => setIsRoomModalOpen(true)} 
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <IconPlus />
          Add New Room
        </Button>
      </div>

      {/* Stats Summary */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0F1720] p-4 rounded-lg border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <IconHome />
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF]">Total Rooms</p>
                <p className="text-xl font-bold text-[#E5E7EB]">{rooms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F1720] p-4 rounded-lg border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                <IconBed />
              </div>
              <div>
                <p className="text-xs text-[#9CA3AF]">Total Beds</p>
                <p className="text-xl font-bold text-[#E5E7EB]">
                  {rooms.reduce((sum, room) => sum + (room.total_beds || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search rooms..."
            value={roomFilter.search}
            onChange={(e) => setRoomFilter({ ...roomFilter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
            <IconSearch />
          </div>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-[#0F1720] rounded-lg border border-primary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-primary/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider w-12"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Room Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Total Beds</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Rent/Bed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Marketplace</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Images</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map((room) => {
                  const isExpanded = expandedRooms.has(room.id);
                  const roomBeds = Array.isArray(beds[room.id]) ? beds[room.id] : [];
                  const filteredRoomBeds = bedFilter.status === 'all' 
                    ? roomBeds 
                    : (Array.isArray(roomBeds) ? roomBeds.filter(bed => bed.status === bedFilter.status) : []);
                  
                  return (
                    <React.Fragment key={room.id}>
                      <tr 
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => toggleRoom(room.id)}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoom(room.id);
                            }}
                            className="p-1 hover:bg-[#0B0F14] rounded transition-colors"
                          >
                            <svg 
                              className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#E5E7EB]">{room.room_name}</div>
                          {room.room_description && (
                            <div className="text-xs text-[#9CA3AF] mt-1 truncate max-w-xs">
                              {room.room_description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#E5E7EB]">{room.total_beds}</td>
                        <td className="px-4 py-3 text-[#E5E7EB]">₹{room.rent_per_bed}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                            {room.gender_type || 'unisex'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {room.show_in_marketplace ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Yes</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {room.room_images && (typeof room.room_images === 'string' ? JSON.parse(room.room_images) : room.room_images).length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImages(room);
                              }}
                              className="text-sm text-primary hover:underline font-medium"
                            >
                              View ({typeof room.room_images === 'string' ? JSON.parse(room.room_images).length : room.room_images.length})
                            </button>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoom(room);
                              setFormData({
                                ...formData,
                                room_name: room.room_name,
                                total_beds: room.total_beds,
                                rent_per_bed: room.rent_per_bed,
                                gender_type: room.gender_type || 'unisex',
                                show_in_marketplace: room.show_in_marketplace === 1 || room.show_in_marketplace === true,
                                room_description: room.room_description || '',
                                images: [],
                              });
                              setIsRoomModalOpen(true);
                            }}
                            className="p-2 hover:bg-[#0B0F14] rounded transition-colors text-[#9CA3AF] hover:text-[#E5E7EB]"
                            title="Edit room"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="px-4 py-4 bg-muted/20">
                            <div className="space-y-2">
                              {bedsLoading[room.id] ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                </div>
                              ) : filteredRoomBeds.length > 0 ? (
                                <>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-[#E5E7EB]">Beds in {room.room_name}</h4>
                                    <select
                                      value={bedFilter.status}
                                      onChange={(e) => setBedFilter({ ...bedFilter, status: e.target.value })}
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-3 py-1.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
                                    >
                                      <option value="all">All Status</option>
                                      <option value="vacant">Vacant</option>
                                      <option value="occupied">Occupied</option>
                                      <option value="blocked">Blocked</option>
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredRoomBeds.map((bed) => (
                                      <BedCard
                                        key={bed.id}
                                        bed={bed}
                                        onStatusChange={(bed, newStatus) => handleBedStatusUpdate(bed, newStatus, room.id)}
                                      />
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-4 text-[#9CA3AF]">
                                  {roomBeds.length === 0 
                                    ? 'No beds found for this room' 
                                    : `No beds found with status: ${bedFilter.status}`}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#0B0F14] rounded-full flex items-center justify-center mb-4">
                        <IconHome />
                      </div>
                      <p className="text-[#9CA3AF] mb-4">
                        {roomFilter.search ? 'No rooms found matching your search' : 'No rooms added yet'}
                      </p>
                      <Button
                        onClick={() => setIsRoomModalOpen(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <IconPlus />
                        <span>Add First Room</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setEditingRoom(null);
          setFormData({ 
            ...formData, 
            room_name: '', 
            total_beds: 1, 
            rent_per_bed: 0,
            gender_type: 'unisex',
            show_in_marketplace: true,
            room_description: '',
            images: [],
          });
        }}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleRoomSubmit}>
          <Input
            label="Room Name"
            value={formData.room_name}
            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
            required
          />
          <Input
            label="Total Beds"
            type="number"
            value={formData.total_beds}
            onChange={(e) => setFormData({ ...formData, total_beds: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Rent per Bed"
            type="number"
            value={formData.rent_per_bed}
            onChange={(e) => setFormData({ ...formData, rent_per_bed: parseFloat(e.target.value) })}
            required
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Gender Type</label>
            <select
              value={formData.gender_type}
              onChange={(e) => setFormData({ ...formData, gender_type: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
            >
              <option value="unisex">Unisex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show_in_marketplace}
                onChange={(e) => setFormData({ ...formData, show_in_marketplace: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-[#E5E7EB]">Show in Marketplace</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Room Description</label>
            <textarea
              value={formData.room_description}
              onChange={(e) => setFormData({ ...formData, room_description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-[#E5E7EB]"
              rows="3"
              placeholder="Describe the room (optional)"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Room Images</label>
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
            {editingRoom && editingRoom.room_images && (
              <div className="mt-2">
                <p className="text-sm text-[#9CA3AF] mb-2">Existing Images:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(typeof editingRoom.room_images === 'string' ? JSON.parse(editingRoom.room_images) : editingRoom.room_images).map((img, index) => (
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

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Image View Modal */}
      <Modal
        isOpen={viewingImages !== null}
        onClose={() => setViewingImages(null)}
        title={`Room Images - ${viewingImages?.room_name || ''}`}
        size="lg"
      >
        {viewingImages && viewingImages.room_images && (
          <div className="grid grid-cols-2 gap-4">
            {(typeof viewingImages.room_images === 'string' 
              ? JSON.parse(viewingImages.room_images) 
              : viewingImages.room_images).map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                  alt={`Room image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-primary/10"
                />
                <a
                  href={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                >
                  View Full
                </a>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoomsBeds;
