import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getStoredPgId } from '../utils/auth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const MessPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [formData, setFormData] = useState({ pg_id: getStoredPgId(), name: '', price: '' });
  const [scheduleData, setScheduleData] = useState({});
  const [modalScheduleData, setModalScheduleData] = useState({});
  const [tempScheduleData, setTempScheduleData] = useState({});
  const pgId = getStoredPgId();

  useEffect(() => {
    if (pgId) fetchPlans();
  }, [pgId]);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Auto-select first plan
      const firstPlan = plans[0];
      setSelectedPlan(firstPlan);
      setScheduleData(initializeSchedule(firstPlan.schedule));
      setEditingRowIndex(null);
    }
  }, [plans]);

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
        schedule: Object.keys(modalScheduleData).length > 0 ? modalScheduleData : null
      };
      if (editingPlan) {
        await api.put(`/api/mess-plans/${editingPlan.id}`, submitData);
      } else {
        await api.post('/api/mess-plans', submitData);
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      setFormData({ pg_id: pgId, name: '', price: '' });
      setModalScheduleData({});
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving mess plan');
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setScheduleData(initializeSchedule(plan.schedule));
    setEditingRowIndex(null);
  };

  const handleEditRow = (day) => {
    setEditingRowIndex(day);
    setTempScheduleData({
      breakfast: scheduleData[day]?.breakfast || '',
      lunch: scheduleData[day]?.lunch || '',
      dinner: scheduleData[day]?.dinner || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setTempScheduleData({});
  };

  const handleSaveRow = async (day) => {
    try {
      const updatedSchedule = {
        ...scheduleData,
        [day]: {
          breakfast: tempScheduleData.breakfast,
          lunch: tempScheduleData.lunch,
          dinner: tempScheduleData.dinner
        }
      };
      
      await api.put(`/api/mess-plans/${selectedPlan.id}`, {
        name: selectedPlan.name,
        price: selectedPlan.price,
        schedule: updatedSchedule
      });
      
      setScheduleData(updatedSchedule);
      setEditingRowIndex(null);
      setTempScheduleData({});
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating schedule');
    }
  };

  const handleUpdateMeal = (meal, value) => {
    setTempScheduleData(prev => ({
      ...prev,
      [meal]: value
    }));
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Price', accessor: 'price', render: (val) => `₹${val}` },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E5E7EB]">Mess Plans</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Manage mess meal plans and schedules</p>
      </div>


      {/* Schedule Table - Always visible when plans exist */}
      {selectedPlan && (
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-primary/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#E5E7EB]">{selectedPlan.name} - Schedule</h2>
                <p className="text-sm text-[#9CA3AF] mt-1">Price: ₹{selectedPlan.price}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {plans.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {plans.map((plan) => (
                      <Button
                        key={plan.id}
                        variant={selectedPlan.id === plan.id ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan)}
                        className="text-xs"
                      >
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPlan(selectedPlan);
                      setFormData({ pg_id: pgId, name: selectedPlan.name, price: selectedPlan.price });
                      setModalScheduleData(initializeSchedule(selectedPlan.schedule));
                      setIsModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (window.confirm('Delete this mess plan?')) {
                        try {
                          await api.delete(`/api/mess-plans/${selectedPlan.id}`);
                          if (plans.length > 1) {
                            const remainingPlans = plans.filter(p => p.id !== selectedPlan.id);
                            if (remainingPlans.length > 0) {
                              handleSelectPlan(remainingPlans[0]);
                            } else {
                              setSelectedPlan(null);
                              setScheduleData({});
                            }
                          } else {
                            setSelectedPlan(null);
                            setScheduleData({});
                          }
                          fetchPlans();
                        } catch (error) {
                          alert(error.response?.data?.error || 'Error deleting');
                        }
                      }
                    }}
                    className="text-xs bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingPlan(null);
                      setFormData({ pg_id: pgId, name: '', price: '' });
                      setModalScheduleData(initializeSchedule());
                      setIsModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    Add Mess Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#E5E7EB] bg-[#0B0F14]">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#E5E7EB] bg-[#0B0F14]">Breakfast</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#E5E7EB] bg-[#0B0F14]">Lunch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#E5E7EB] bg-[#0B0F14]">Dinner</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[#E5E7EB] bg-[#0B0F14]">Edit</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, index) => (
                  <tr
                    key={day}
                    className={`border-b border-primary/10 ${
                      editingRowIndex === day ? 'bg-[#0B0F14]' : 'hover:bg-[#0B0F14]/50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[#E5E7EB]">
                      {DAY_LABELS[day]}
                    </td>
                    {editingRowIndex === day ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={tempScheduleData.breakfast}
                            onChange={(e) => handleUpdateMeal('breakfast', e.target.value)}
                            className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE]"
                            placeholder="Enter breakfast menu"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={tempScheduleData.lunch}
                            onChange={(e) => handleUpdateMeal('lunch', e.target.value)}
                            className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE]"
                            placeholder="Enter lunch menu"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={tempScheduleData.dinner}
                            onChange={(e) => handleUpdateMeal('dinner', e.target.value)}
                            className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE]"
                            placeholder="Enter dinner menu"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              onClick={() => handleSaveRow(day)}
                              className="text-xs px-3 py-1"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="text-xs px-3 py-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-[#E5E7EB]">
                          {scheduleData[day]?.breakfast || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#E5E7EB]">
                          {scheduleData[day]?.lunch || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#E5E7EB]">
                          {scheduleData[day]?.dinner || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            onClick={() => handleEditRow(day)}
                            className="text-xs px-3 py-1"
                          >
                            Edit
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Plan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingPlan(null);
        setModalScheduleData({});
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
                  <h4 className="text-md font-semibold text-[#E5E7EB] mb-3 capitalize">{DAY_LABELS[day]}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Breakfast</label>
                      <input
                        type="text"
                        value={modalScheduleData[day]?.breakfast || ''}
                        onChange={(e) => {
                          setModalScheduleData(prev => ({
                            ...prev,
                            [day]: {
                              ...prev[day],
                              breakfast: e.target.value
                            }
                          }));
                        }}
                        placeholder="Enter breakfast menu"
                        className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:border-[#22D3EE]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Lunch</label>
                      <input
                        type="text"
                        value={modalScheduleData[day]?.lunch || ''}
                        onChange={(e) => {
                          setModalScheduleData(prev => ({
                            ...prev,
                            [day]: {
                              ...prev[day],
                              lunch: e.target.value
                            }
                          }));
                        }}
                        placeholder="Enter lunch menu"
                        className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:border-[#22D3EE]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Dinner</label>
                      <input
                        type="text"
                        value={modalScheduleData[day]?.dinner || ''}
                        onChange={(e) => {
                          setModalScheduleData(prev => ({
                            ...prev,
                            [day]: {
                              ...prev[day],
                              dinner: e.target.value
                            }
                          }));
                        }}
                        placeholder="Enter dinner menu"
                        className="w-full px-3 py-2 bg-[#0F1720] border border-primary/20 rounded text-[#E5E7EB] text-sm focus:outline-none focus:border-[#22D3EE]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-primary/20">
            <Button type="button" variant="outline" onClick={() => {
              setIsModalOpen(false);
              setEditingPlan(null);
              setModalScheduleData({});
            }}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MessPlans;
