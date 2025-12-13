import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { clearAuth, getStoredUser } from '../../utils/auth';

const Navbar = ({ sidebarWidth, sidebarOpen, setSidebarOpen, isMobile, onSidebarOpen }) => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/');
    }
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 bg-card border-b border-border shadow-sm z-40 h-16 flex items-center px-4 md:px-6"
      style={{ 
        left: isMobile ? 0 : `${sidebarWidth}px`,
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`
      }}
    >
      <div className="flex items-center justify-between w-full max-w-full">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          {isMobile && (
            <button
              onClick={onSidebarOpen}
              className="p-2 hover:bg-secondary rounded transition-colors text-foreground flex-shrink-0"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {!isMobile && (
            <button
              onClick={setSidebarOpen}
              className="p-2 hover:bg-secondary rounded transition-colors text-foreground flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {user && (
            <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-secondary rounded">
              <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="hidden md:flex items-center gap-1 min-w-0">
                <span className="text-sm text-foreground truncate max-w-[120px]">{user.name}</span>
                <span className="text-xs text-muted-foreground hidden lg:inline whitespace-nowrap">
                  ({user.role === 'superadmin' ? 'Super Admin' : 'PG Admin'})
                </span>
              </div>
            </div>
          )}
          <button
            className="p-2 hover:bg-secondary rounded transition-colors text-foreground relative flex-shrink-0"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-all text-sm font-medium flex-shrink-0"
            aria-label="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
