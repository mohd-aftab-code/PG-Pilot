import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getStoredUser } from '../../utils/auth';
import { useSubscription } from '../../context/SubscriptionContext';

// Icon Components
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconBuilding = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconPackage = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconTag = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const IconHome = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconDollar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconCoffee = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14M5 11a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6m-9 4h6" />
  </svg>
);

const IconFile = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconZap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconBox = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconReceipt = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconLink = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const IconClipboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const IconInquiry = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const IconChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Subscription Status Card Component
const SubscriptionStatusCard = ({ open, subscriptionStatus, trialInfo, hasActiveSubscription, isTrialActive, isTrialExpired }) => {
  const getStatusInfo = () => {
    if (hasActiveSubscription && subscriptionStatus) {
      const expiryDate = new Date(subscriptionStatus.expiry_date);
      const today = new Date();
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        type: 'paid',
        label: 'Paid Plan',
        planName: subscriptionStatus.plan_name || 'Active Plan',
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        expiryDate: subscriptionStatus.expiry_date,
        color: 'text-green-300',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    } else if (isTrialActive && trialInfo) {
      const endDate = new Date(trialInfo.endDate);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        type: 'trial',
        label: 'Free Trial',
        planName: 'Trial Period',
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        expiryDate: trialInfo.endDate,
        color: 'text-[#22D3EE]',
        bgColor: 'bg-[#22D3EE]/10',
        borderColor: 'border-[#22D3EE]/30'
      };
    } else if (isTrialExpired) {
      return {
        type: 'expired',
        label: 'Trial Expired',
        planName: 'No Active Plan',
        daysRemaining: 0,
        expiryDate: null,
        color: 'text-red-300',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
      };
    } else {
      return {
        type: 'none',
        label: 'No Plan',
        planName: 'No Active Plan',
        daysRemaining: 0,
        expiryDate: null,
        color: 'text-[#9CA3AF]',
        bgColor: 'bg-[#0B0F14]',
        borderColor: 'border-primary/10'
      };
    }
  };

  const statusInfo = getStatusInfo();

  if (!open) {
    // Collapsed view - just show icon
    return (
      <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
        <svg className={`w-5 h-5 ${statusInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${statusInfo.color} mb-1`}>{statusInfo.label}</p>
          <p className="text-xs text-[#9CA3AF] truncate">{statusInfo.planName}</p>
        </div>
      </div>
      
      {statusInfo.type === 'paid' && statusInfo.daysRemaining > 0 && (
        <div className="mt-2 pt-2 border-t border-primary/10">
          <p className="text-xs text-[#9CA3AF]">
            {statusInfo.daysRemaining} {statusInfo.daysRemaining === 1 ? 'day' : 'days'} remaining
          </p>
        </div>
      )}
      
      {statusInfo.type === 'trial' && statusInfo.daysRemaining > 0 && (
        <div className="mt-2 pt-2 border-t border-primary/10">
          <p className="text-xs text-[#9CA3AF]">
            {statusInfo.daysRemaining} {statusInfo.daysRemaining === 1 ? 'day' : 'days'} left
          </p>
        </div>
      )}
      
      {statusInfo.type === 'expired' && (
        <div className="mt-2 pt-2 border-t border-primary/10">
          <p className="text-xs text-red-300">Upgrade to continue</p>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ open, onClose, isMobile }) => {
  const location = useLocation();
  const user = getStoredUser();
  const { subscriptionStatus, trialInfo, hasActiveSubscription, isTrialActive, isTrialExpired } = useSubscription();

  // Base menu items for all users
  const baseMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: IconDashboard, roles: ['superadmin', 'pg_admin'] },
  ];

  // Superadmin only items
  const superadminItems = [
    { path: '/pgs', label: 'PG Management', icon: IconBuilding, roles: ['superadmin'] },
    { path: '/plans', label: 'Plans', icon: IconPackage, roles: ['superadmin'] },
    { path: '/coupons', label: 'Coupons', icon: IconTag, roles: ['superadmin'] },
  ];

  // PG Admin items
  const pgAdminItems = [
    { path: '/core', label: 'Core Management', icon: IconHome, roles: ['pg_admin'] },
    { path: '/complaints', label: 'Complaints', icon: IconAlert, roles: ['pg_admin'] },
    { path: '/inquiries', label: 'Inquiries', icon: IconInquiry, roles: ['pg_admin'] },
    { path: '/mess-plans', label: 'Mess Plans', icon: IconCoffee, roles: ['pg_admin'] },
    { path: '/mess-bills', label: 'Mess Bills', icon: IconFile, roles: ['pg_admin'] },
    { path: '/bills', label: 'Utility Bills', icon: IconZap, roles: ['pg_admin'] },
    { path: '/subscriptions', label: 'Subscriptions', icon: IconBox, roles: ['pg_admin'] },
    { path: '/invoices', label: 'Invoices', icon: IconReceipt, roles: ['pg_admin'] },
    { path: '/referrals', label: 'Referrals', icon: IconLink, roles: ['pg_admin'] },
  ];

  // Common items
  const commonItems = [
    { path: '/audit-logs', label: 'Audit Logs', icon: IconClipboard, roles: ['superadmin', 'pg_admin'] },
  ];

  // Combine all menu items based on user role
  const allMenuItems = [
    ...baseMenuItems,
    ...(user?.role === 'superadmin' ? superadminItems : []),
    ...(user?.role === 'pg_admin' ? pgAdminItems : []),
    ...commonItems,
  ].filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-[#0B0F14]/80 z-30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen bg-[#0F1720] text-[#E5E7EB] shadow-lg z-30 transition-all duration-300 border-r border-primary/10 ${
          open ? 'w-64' : 'w-20'
        } ${isMobile ? (open ? 'translate-x-0' : '-translate-x-full') : ''}`}
        style={{ width: open ? '256px' : '80px', paddingTop: '4rem' }}
      >
        {/* Logo Section */}
        <div className="fixed top-0 left-0 h-16 bg-[#0F1720] border-b border-primary/10 flex items-center justify-start z-40 transition-all duration-300"
          style={{ width: open ? '256px' : '80px' }}
        >
          <div className="flex items-center gap-3 px-3 w-full">
            <div className="w-10 h-10 bg-[#22D3EE]/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/20">
              <span className="text-[#22D3EE] font-bold text-sm">PG</span>
            </div>
            {open && (
              <h1 className="text-lg font-bold text-[#E5E7EB] whitespace-nowrap">Pilot</h1>
            )}
          </div>
        </div>
        
        <nav className="p-3 flex flex-col h-[calc(100vh-4rem)]">
          <ul className="space-y-1 flex-1 overflow-y-auto sidebar-scrollbar">
            {allMenuItems.map((item) => {
              // Check if current path matches or starts with item path (for tabs)
              const isActive = location.pathname === item.path || 
                (item.path === '/core' && ['/rooms', '/tenants', '/payments'].includes(location.pathname));
              const IconComponent = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                      isActive
                        ? 'bg-[#1FB6C1]/20 text-[#22D3EE] border-l-4 border-[#22D3EE] shadow-sm'
                        : 'text-[#9CA3AF] hover:bg-[#0B0F14] hover:text-[#E5E7EB]'
                    }`}
                    onClick={isMobile ? onClose : undefined}
                  >
                    <IconComponent />
                    {open && (
                      <>
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        {isActive && <IconChevronRight />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          {/* Subscription Status Card - Bottom of Sidebar */}
          {user?.role === 'pg_admin' && (
            <div className="mt-auto pt-3 border-t border-primary/10">
              <SubscriptionStatusCard open={open} subscriptionStatus={subscriptionStatus} trialInfo={trialInfo} hasActiveSubscription={hasActiveSubscription} isTrialActive={isTrialActive} isTrialExpired={isTrialExpired} />
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
