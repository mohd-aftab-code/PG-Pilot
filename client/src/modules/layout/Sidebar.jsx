import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ open, onClose, isMobile }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    // Add more menu items as needed
  ];

  return (
    <>
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg z-30 transition-all duration-200 ${
          open ? 'w-64' : 'w-20'
        } ${isMobile ? (open ? 'translate-x-0' : '-translate-x-full') : ''}`}
      >
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={isMobile ? onClose : undefined}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {open && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

