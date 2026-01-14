import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

const MessPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingSchedulePlan, setEditingSchedulePlan] = useState(null);
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), name: '', price: '' });
  const [scheduleData, setScheduleData] = useState({});
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) fetchPlans();
  }, [pgId]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/mess-plans/pg/${pgId}`);
      setPlans(response.data.mess_plans || []);
    } catch (error) {
      console.error('Error fetching mess plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSchedule = (existingSchedule = null) => {
    const schedule = {};
    DAYS.forEach(day => {
      schedule[day] = {
        breakfast: existingSchedule?.[day]?.breakfast || '',
        lunch: existingSchedule?.[day]?.lunch || '',
        dinner: existingSchedule?.[day]?.dinner || ''
      };
    });
    return schedule;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        schedule: Object.keys(scheduleData).length > 0 ? scheduleData : null
      };
      if (editingPlan) {
        await api.put(`/api/mess-plans/${editingPlan.id}`, submitData);
      } else {
        await api.post('/api/mess-plans', submitData);
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({ pg_id: pgId, name: '', price: '' });
      setScheduleData({});
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving mess plan');
    }
  };

  const handleScheduleUpdate = async () => {
    try {
      await api.put(`/api/mess-plans/${editingSchedulePlan.id}`, {
        name: editingSchedulePlan.name,
        price: editingSchedulePlan.price,
        schedule: scheduleData
      });
      setIsScheduleModalOpen(false);
      setEditingSchedulePlan(null);
      setScheduleData({});
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating schedule');
    }
  };

  const openScheduleModal = (plan) => {
    setEditingSchedulePlan(plan);
    setScheduleData(initializeSchedule(plan.schedule));
    setIsScheduleModalOpen(true);
  };

  const updateScheduleMeal = (day, meal, value) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: value
      }
    }));
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Price', accessor: 'price', render: (val) => `₹${val}` },
    { 
      header: 'Schedule', 
      accessor: 'schedule', 
      render: (val, row) => (
        <Button 
          variant="outline" 
          onClick={() => openScheduleModal(row)}
          className="text-xs"
        >
          {val ? 'View/Edit' : 'Set Schedule'}
        </Button>
      )
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Mess Plans</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage mess meal plans</p>
        </div>
        <Button onClick={() => {
          setIsModalOpen(true);
          setScheduleData(initializeSchedule());
        }} className="w-full sm:w-auto">Add Mess Plan</Button>
      </div>
      {/* Table */}
      <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
        <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        onEdit={(plan) => {
          setEditingPlan(plan);
          setFormData({ pg_id: pgId, name: plan.name, price: plan.price });
          setScheduleData(initializeSchedule(plan.schedule));
          setIsModalOpen(true);
        }}
        onDelete={async (plan) => {
          if (window.confirm('Delete this mess plan?')) {
            try {
              await api.delete(`/api/mess-plans/${plan.id}`);
              fetchPlans();
            } catch (error) {
              alert(error.response?.data?.error || 'Error deleting');
            }
          }
        }}
      />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => { 
        setIsModalOpen(false); 
        setEditingPlan(null); 
        setScheduleData({}); 
      }} title={editingPlan ? 'Edit Mess Plan' : 'Add Mess Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
          
          {/* Weekly Schedule Section */}
          <div className="mt-6 pt-4 border-t border-primary/20">
            <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Weekly Meal Schedule</h3>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 schedule-scrollbar">
              {DAYS.map((day) => (
                <div key={day} className="bg-[#0B0F14] border border-primary/20 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 capitalize">{day}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {MEALS.map((meal) => (
                      <div key={meal}>
                        <label className="block text-sm font-medium text-[#9CA3AF] mb-1 capitalize">{meal}</label>
                        <input
                          type="text"
                          value={scheduleData[day]?.[meal] || ''}
                          onChange={(e) => updateScheduleMeal(day, meal, e.target.value)}
                          placeholder={`Enter ${meal} menu`}
                          className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:border-[#22D3EE]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-primary/20">
            <Button type="button" variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingPlan(null);
              setScheduleData({});
            }}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal 
        isOpen={isScheduleModalOpen} 
        onClose={() => { 
          setIsScheduleModalOpen(false); 
          setEditingSchedulePlan(null); 
          setScheduleData({}); 
        }} 
        title={`Weekly Meal Schedule - ${editingSchedulePlan?.name || ''}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto schedule-scrollbar pr-2">
          {DAYS.map((day) => (
            <div key={day} className="bg-[#0B0F14] border border-primary/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-[#E5E7EB] mb-3 capitalize">{day}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {MEALS.map((meal) => (
                  <div key={meal}>
                    <label className="block text-sm font-medium text-[#9CA3AF] mb-1 capitalize">{meal}</label>
                    <input
                      type="text"
                      value={scheduleData[day]?.[meal] || ''}
                      onChange={(e) => updateScheduleMeal(day, meal, e.target.value)}
                      placeholder={`Enter ${meal} menu`}
                      className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] focus:outline-none focus:border-[#22D3EE]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-primary/10">
            <Button type="button" variant="outline" onClick={() => { 
              setIsScheduleModalOpen(false); 
              setEditingSchedulePlan(null); 
              setScheduleData({}); 
            }}>
              Cancel
            </Button>
            <Button onClick={handleScheduleUpdate}>Update Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessPlans;

