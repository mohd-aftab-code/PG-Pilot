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
          <div className="bg-secondary rounded-lg p-4 border border-border">
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
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
      }`}
      onClick={() => onSelect(room)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
          }`}>
            <IconHome />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{room.room_name}</h3>
            <p className="text-sm text-muted-foreground">Room ID: {room.id}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(room);
          }}
          className="p-2 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
          title="Edit room"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Beds</p>
          <p className="text-lg font-semibold text-foreground">{room.total_beds}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rent per Bed</p>
          <p className="text-lg font-semibold text-foreground">₹{room.rent_per_bed}</p>
        </div>
      </div>
    </div>
  );
};

// Bed Card Component
const BedCard = ({ bed, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700';
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
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <IconBed />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Bed #{bed.bed_number}</h3>
            <p className="text-xs text-muted-foreground">ID: {bed.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bed.status)}`}>
            {bed.status?.charAt(0).toUpperCase() + bed.status?.slice(1) || 'Vacant'}
          </span>
          <button
            onClick={() => onStatusChange(bed, getNextStatus(bed.status))}
            className="p-2 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
            title={`Change to ${getNextStatus(bed.status)}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const [beds, setBeds] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
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
  });

  useEffect(() => {
    if (formData.pg_id) {
      fetchRooms();
    }
  }, [formData.pg_id]);

  useEffect(() => {
    if (selectedRoom) {
      fetchBeds(selectedRoom.id);
    } else {
      // Clear beds when no room is selected
      setBeds([]);
    }
  }, [selectedRoom]);

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
    if (!roomId) {
      setBeds([]);
      return;
    }
    setBedsLoading(true);
    try {
      setBeds([]); // Clear previous beds
      const response = await api.get(`/api/beds/room/${roomId}`);
      const fetchedBeds = response.data.beds || [];
      console.log(`Fetched ${fetchedBeds.length} beds for room ${roomId}:`, fetchedBeds);
      setBeds(fetchedBeds);
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    } finally {
      setBedsLoading(false);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.put(`/api/rooms/${editingRoom.id}`, formData);
      } else {
        await api.post('/api/rooms', formData);
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
      setFormData({ ...formData, room_name: '', total_beds: 1, rent_per_bed: 0 });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert(error.response?.data?.error || 'Error saving room');
    }
  };

  const handleBedStatusUpdate = async (bed, newStatus) => {
    try {
      await api.put(`/api/beds/${bed.id}/status`, { status: newStatus });
      fetchBeds(selectedRoom.id);
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

  // Filter beds
  const filteredBeds = beds.filter((bed) => {
    if (!bed) return false; // Filter out any null/undefined beds
    if (bedFilter.status === 'all') return true;
    return bed.status?.toLowerCase() === bedFilter.status.toLowerCase();
  });

  const roomColumns = [
    { header: 'Room Name', accessor: 'room_name' },
    { header: 'Total Beds', accessor: 'total_beds' },
    { header: 'Rent per Bed', accessor: 'rent_per_bed', render: (val) => `₹${val}` },
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
          <h1 className="text-3xl font-bold text-foreground mb-1">Rooms & Beds</h1>
          <p className="text-muted-foreground text-sm">Manage your rooms and bed availability</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <IconHome />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
                <p className="text-xl font-bold text-foreground">{rooms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                <IconBed />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Beds</p>
                <p className="text-xl font-bold text-foreground">
                  {rooms.reduce((sum, room) => sum + (room.total_beds || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          {selectedRoom && (
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                  <IconBed />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Selected Room Beds</p>
                  <p className="text-xl font-bold text-foreground">{beds.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rooms Section */}
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <IconHome />
              Rooms
            </h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search rooms..."
                value={roomFilter.search}
                onChange={(e) => setRoomFilter({ ...roomFilter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <IconSearch />
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto custom-scrollbar">
            {loading ? (
              <SkeletonLoader rows={4} />
            ) : filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isSelected={selectedRoom?.id === room.id}
                  onSelect={setSelectedRoom}
                  onEdit={(room) => {
                    setEditingRoom(room);
                    setFormData({
                      ...formData,
                      room_name: room.room_name,
                      total_beds: room.total_beds,
                      rent_per_bed: room.rent_per_bed,
                    });
                    setIsRoomModalOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconHome />
                </div>
                <p className="text-muted-foreground mt-3">
                  {roomFilter.search ? 'No rooms found matching your search' : 'No rooms added yet'}
                </p>
                <Button
                  onClick={() => setIsRoomModalOpen(true)}
                  variant="outline"
                  className="mt-4 flex items-center gap-2 mx-auto"
                >
                  <IconPlus />
                  <span>Add First Room</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Beds Section */}
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <IconBed />
              Beds
              {selectedRoom && (
                <span className="text-base font-normal text-muted-foreground">
                  - {selectedRoom.room_name}
                </span>
              )}
            </h2>
            {selectedRoom && (
              <select
                value={bedFilter.status}
                onChange={(e) => setBedFilter({ ...bedFilter, status: e.target.value })}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="blocked">Blocked</option>
              </select>
            )}
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto custom-scrollbar">
            {selectedRoom ? (
              <>
                {bedsLoading ? (
                  <SkeletonLoader rows={5} />
                ) : filteredBeds.length > 0 ? (
                  <>
                    {filteredBeds.map((bed) => (
                      <BedCard
                        key={bed.id}
                        bed={bed}
                        onStatusChange={handleBedStatusUpdate}
                      />
                    ))}
                    {beds.length > filteredBeds.length && (
                      <div className="p-3 text-xs text-muted-foreground border-t border-border bg-secondary/30 rounded-b-lg text-center">
                        Showing {filteredBeds.length} of {beds.length} beds
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconBed />
                    </div>
                    <p className="text-muted-foreground mt-3">
                      {beds.length === 0 
                        ? 'No beds found for this room' 
                        : `No beds found with status: ${bedFilter.status}`}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-border rounded-lg">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <IconBed />
                </div>
                <p className="text-muted-foreground text-center px-4">
                  Select a room from the left to view and manage beds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setEditingRoom(null);
          setFormData({ ...formData, room_name: '', total_beds: 1, rent_per_bed: 0 });
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
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomsBeds;
