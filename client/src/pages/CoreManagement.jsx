import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import RoomsBeds from './RoomsBeds';
import Tenants from './Tenants';
import Payments from './Payments';

const CoreManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Handle direct navigation to /rooms, /tenants, /payments
  useEffect(() => {
    if (location.pathname === '/rooms') {
      navigate('/core?tab=rooms', { replace: true });
    } else if (location.pathname === '/tenants') {
      navigate('/core?tab=tenants', { replace: true });
    } else if (location.pathname === '/payments') {
      navigate('/core?tab=payments', { replace: true });
    }
  }, [location.pathname, navigate]);

  const activeTab = searchParams.get('tab') || 'rooms';

  const tabs = [
    { id: 'rooms', label: 'Rooms & Beds', component: RoomsBeds },
    { id: 'tenants', label: 'Tenants', component: Tenants },
    { id: 'payments', label: 'Payments', component: Payments },
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || RoomsBeds;

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Tabs Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-primary/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold transition-all relative ${
                activeTab === tab.id
                  ? 'text-[#22D3EE]'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22D3EE]"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Tab Content */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default CoreManagement;

