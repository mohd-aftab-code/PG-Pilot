import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TrialBanner from '../../components/common/TrialBanner';

const SIDEBAR_OPEN_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 80;

const LayoutWrapper = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    if (sidebarVisible) {
      setSidebarVisible(false);
      setSidebarOpen(false);
    } else {
      setSidebarVisible(true);
      setSidebarOpen(true);
    }
  }, [sidebarVisible]);

  const handleSidebarClose = useCallback(() => {
    setSidebarVisible(false);
    setSidebarOpen(false);
  }, []);

  const handleSidebarOpen = useCallback(() => {
    setSidebarVisible(true);
    setSidebarOpen(true);
  }, []);

  const handleMainClick = useCallback(() => {
    if (sidebarVisible && isMobile) {
      setSidebarVisible(false);
      setSidebarOpen(false);
    }
  }, [sidebarVisible, isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      setSidebarOpen(prev => {
        if (mobile && prev) {
          return false;
        } else if (!mobile && !prev) {
          return true;
        }
        return prev;
      });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarWidth = sidebarVisible ? (sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH) : 0;

  return (
    <div className="bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14] min-h-screen">
      <Navbar 
        sidebarWidth={sidebarWidth} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={handleSidebarToggle}
        isMobile={isMobile}
        onSidebarOpen={handleSidebarOpen}
      />
      {sidebarVisible && (
        <Sidebar 
          open={sidebarOpen} 
          onClose={handleSidebarClose}
          isMobile={isMobile}
        />
      )}
      <main
        className="transition-all duration-300 bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14]"
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`, 
          paddingTop: '4rem',
          minHeight: 'calc(100vh - 4rem)',
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`
        }}
        onClick={handleMainClick}
      >
        <TrialBanner />
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;

