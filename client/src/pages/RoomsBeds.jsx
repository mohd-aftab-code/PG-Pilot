import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredUser, getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

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
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Rooms & Beds</h1>
        <Button onClick={() => setIsRoomModalOpen(true)} className="w-full sm:w-auto">Add New Room</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Rooms</h2>
            <input
              type="text"
              placeholder="Search room..."
              value={roomFilter.search}
              onChange={(e) => setRoomFilter({ ...roomFilter, search: e.target.value })}
              className="w-full sm:w-48 px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <DataTable
              columns={roomColumns}
              data={filteredRooms}
              loading={loading}
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
              onView={(room) => setSelectedRoom(room)}
            />
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)] mt-4 lg:mt-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Beds {selectedRoom && <span className="text-base sm:text-lg">- {selectedRoom.room_name}</span>}
            </h2>
            {selectedRoom && (
              <select
                value={bedFilter.status}
                onChange={(e) => setBedFilter({ ...bedFilter, status: e.target.value })}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="blocked">Blocked</option>
              </select>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {selectedRoom ? (
              <>
                {bedsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading beds...
                  </div>
                ) : (
                  <>
                    {filteredBeds.length > 0 ? (
                      <DataTable
                        columns={bedColumns}
                        data={filteredBeds}
                        onEdit={(bed) => {
                          const newStatus = bed.status === 'vacant' ? 'occupied' : bed.status === 'occupied' ? 'blocked' : 'vacant';
                          handleBedStatusUpdate(bed, newStatus);
                        }}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {beds.length === 0 
                          ? 'No beds found for this room' 
                          : `No beds found with status: ${bedFilter.status}`}
                      </div>
                    )}
                    {beds.length > 0 && (
                      <div className="p-3 text-xs text-muted-foreground border-t border-border bg-secondary/30">
                        Showing {filteredBeds.length} of {beds.length} beds
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm sm:text-base text-center px-4">Select a room to view beds</p>
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
