import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../components/apiconfig/api-config';

const Navbar = ({ sidebarWidth, sidebarOpen, setSidebarOpen, isMobile, onSidebarOpen }) => {
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear any local storage or cookies if needed
      navigate('/login');
    }
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 bg-white shadow-md z-40 h-16 flex items-center px-4"
      style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {isMobile && (
            <button
              onClick={onSidebarOpen}
              className="p-2 rounded-md hover:bg-gray-100 mr-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {!isMobile && (
            <button
              onClick={setSidebarOpen}
              className="p-2 rounded-md hover:bg-gray-100 mr-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800">PG Pilot Project</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

