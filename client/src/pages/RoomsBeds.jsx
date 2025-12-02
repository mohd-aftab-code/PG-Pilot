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
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
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
    try {
      const response = await api.get(`/api/beds/room/${roomId}`);
      setBeds(response.data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
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

  const roomColumns = [
    { header: 'Room Name', accessor: 'room_name' },
    { header: 'Total Beds', accessor: 'total_beds' },
    { header: 'Rent per Bed', accessor: 'rent_per_bed', render: (val) => `₹${val}` },
  ];

  const bedColumns = [
    { header: 'Bed Number', accessor: 'bed_number' },
    { header: 'Status', accessor: 'status', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Rooms & Beds</h1>
        <Button onClick={() => setIsRoomModalOpen(true)}>Add New Room</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Rooms</h2>
          <DataTable
            columns={roomColumns}
            data={rooms}
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

        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Beds {selectedRoom && `- ${selectedRoom.room_name}`}
          </h2>
          {selectedRoom ? (
            <DataTable
              columns={bedColumns}
              data={beds}
              onEdit={(bed) => {
                const newStatus = bed.status === 'vacant' ? 'occupied' : bed.status === 'occupied' ? 'blocked' : 'vacant';
                handleBedStatusUpdate(bed, newStatus);
              }}
            />
          ) : (
            <p className="text-muted-foreground">Select a room to view beds</p>
          )}
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

