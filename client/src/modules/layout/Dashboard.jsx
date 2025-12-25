import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getStoredUser, getStoredPgId } from '../../utils/auth';
import Button from '../../components/common/Button';

// Icon Components
const IconUsers = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconHome = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconDollar = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const IconFileText = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconEye = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const pgId = getStoredPgId();
  const [stats, setStats] = useState({
    tenants: 0,
    activeTenants: 0,
    rooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    payments: 0,
    pendingPayments: 0,
    complaints: 0,
    openComplaints: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pgId) {
      fetchStats();
      fetchRecentActivity();
    } else {
      setLoading(false);
    }
  }, [pgId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [tenantsRes, roomsRes, paymentsRes, complaintsRes] = await Promise.all([
        api.get(`/api/tenants/pg/${pgId}`),
        api.get(`/api/rooms/pg/${pgId}`),
        api.get(`/api/payments/pg/${pgId}`),
        api.get(`/api/complaints/pg/${pgId}`),
      ]);

      const tenants = tenantsRes.data.tenants || [];
      const rooms = roomsRes.data.rooms || [];
      const payments = paymentsRes.data.payments || [];
      const complaints = complaintsRes.data.complaints || [];

      // Calculate total beds and occupied beds
      let totalBeds = 0;
      let occupiedBeds = 0;
      rooms.forEach(room => {
        totalBeds += room.total_beds || 0;
      });
      tenants.forEach(tenant => {
        if (tenant.bed_id && tenant.is_active) {
          occupiedBeds++;
        }
      });

      // Calculate revenue
      const totalRevenue = payments
        .filter(p => p.status === 'received')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      setStats({
        tenants: tenants.length,
        activeTenants: tenants.filter(t => t.is_active).length,
        rooms: rooms.length,
        totalBeds,
        occupiedBeds,
        payments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        complaints: complaints.length,
        openComplaints: complaints.filter(c => c.status === 'open').length,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [paymentsRes, complaintsRes] = await Promise.all([
        api.get(`/api/payments/pg/${pgId}`).catch(() => ({ data: { payments: [] } })),
        api.get(`/api/complaints/pg/${pgId}`).catch(() => ({ data: { complaints: [] } })),
      ]);

      const payments = paymentsRes.data.payments || [];
      const complaints = complaintsRes.data.complaints || [];

      // Combine and sort by date
      const activities = [
        ...payments.slice(0, 3).map(p => ({
          type: 'payment',
          title: `Payment received: ₹${p.amount}`,
          description: `From tenant - ${new Date(p.created_at).toLocaleDateString()}`,
          date: p.created_at,
          status: p.status,
        })),
        ...complaints.slice(0, 3).map(c => ({
          type: 'complaint',
          title: `New complaint: ${c.title}`,
          description: `Status: ${c.status}`,
          date: c.created_at,
          status: c.status,
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const statCards = [
    { 
      title: 'Total Tenants', 
      value: stats.tenants,
      subtitle: `${stats.activeTenants} active`,
      color: 'bg-primary', 
      iconColor: 'text-primary-foreground',
      icon: IconUsers, 
      route: '/tenants' 
    },
    { 
      title: 'Total Rooms', 
      value: stats.rooms,
      subtitle: `${stats.occupiedBeds}/${stats.totalBeds} beds occupied`,
      color: 'bg-accent', 
      iconColor: 'text-accent-foreground',
      icon: IconHome, 
      route: '/rooms' 
    },
    { 
      title: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      subtitle: `${stats.payments} payments`,
      color: 'bg-green-500', 
      iconColor: 'text-white',
      icon: IconDollar, 
      route: '/payments' 
    },
    { 
      title: 'Open Complaints', 
      value: stats.openComplaints,
      subtitle: `${stats.complaints} total`,
      color: 'bg-destructive', 
      iconColor: 'text-destructive-foreground',
      icon: IconAlert, 
      route: '/complaints' 
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {statCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div
              key={idx}
              className="bg-card p-5 md:p-6 rounded-lg border border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(card.route)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center ${card.iconColor} shadow-sm`}>
                  <IconComponent />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  View
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-2">{card.title}</h3>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions and System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions */}
        <div className="bg-card p-5 md:p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/tenants')} 
              className="w-full justify-start gap-2"
            >
              <IconPlus />
              Add New Tenant
            </Button>
            <Button 
              onClick={() => navigate('/payments')} 
              variant="secondary" 
              className="w-full justify-start gap-2"
            >
              <IconDollar />
              Record Payment
            </Button>
            <Button 
              onClick={() => navigate('/complaints')} 
              variant="outline" 
              className="w-full justify-start gap-2"
            >
              <IconEye />
              View Complaints
            </Button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-card p-5 md:p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            System Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <span className="text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Role:
              </span>
              <span className="text-foreground font-medium">
                {user?.role === 'superadmin' ? (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs font-medium">
                    Super Admin
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-medium">
                    PG Admin
                  </span>
                )}
              </span>
            </div>
            {user?.pg_id && (
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  PG ID:
                </span>
                <span className="text-foreground font-medium font-mono text-sm">{user.pg_id}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status:
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

