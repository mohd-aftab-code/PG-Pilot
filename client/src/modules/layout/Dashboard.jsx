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

const IconInquiry = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
    vacantBeds: 0,
    occupancyRate: 0,
    payments: 0,
    pendingPayments: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    complaints: 0,
    openComplaints: 0,
    totalRevenue: 0,
    inquiries: 0,
    newInquiries: 0,
    marketplaceViews: 0,
    subscriptionStatus: 'active',
    subscriptionExpiry: null,
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
      const [tenantsRes, roomsRes, paymentsRes, complaintsRes, inquiriesRes, analyticsRes] = await Promise.all([
        api.get(`/api/tenants/pg/${pgId}`),
        api.get(`/api/rooms/pg/${pgId}`),
        api.get(`/api/payments/pg/${pgId}`),
        api.get(`/api/complaints/pg/${pgId}`),
        api.get(`/api/inquiry/list?pg_id=${pgId}&limit=1000`).catch(() => ({ data: { data: [], total: 0 } })),
        api.get(`/api/pg/${pgId}/analytics`).catch(() => ({ data: { data: { today: {}, summary: {} } } })),
      ]);

      const tenants = tenantsRes.data.tenants || [];
      const rooms = roomsRes.data.rooms || [];
      const payments = paymentsRes.data.payments || [];
      const complaints = complaintsRes.data.complaints || [];
      const inquiries = inquiriesRes.data.data || [];
      const analytics = analyticsRes.data.data || {};

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
      const vacantBeds = totalBeds - occupiedBeds;
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      // Calculate revenue
      const totalRevenue = payments
        .filter(p => p.status === 'received')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Calculate this month and last month revenue
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const thisMonthRevenue = payments
        .filter(p => {
          const paymentDate = new Date(p.month_for || p.created_at);
          return p.status === 'received' && paymentDate >= thisMonth && paymentDate <= thisMonthEnd;
        })
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      const lastMonthRevenue = payments
        .filter(p => {
          const paymentDate = new Date(p.month_for || p.created_at);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return p.status === 'received' && paymentDate >= lastMonth && paymentDate <= lastMonthEnd;
        })
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Get subscription info
      let subscriptionStatus = 'inactive';
      let subscriptionExpiry = null;
      try {
        const subscriptionRes = await api.get(`/api/subscriptions/pg/${pgId}/active`).catch(() => null);
        if (subscriptionRes?.data?.subscription) {
          subscriptionStatus = subscriptionRes.data.subscription.expiry_date >= new Date().toISOString().split('T')[0] ? 'active' : 'expired';
          subscriptionExpiry = subscriptionRes.data.subscription.expiry_date;
        }
      } catch (e) {
        // Ignore subscription errors
      }

      setStats({
        tenants: tenants.length,
        activeTenants: tenants.filter(t => t.is_active).length,
        rooms: rooms.length,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyRate,
        payments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        thisMonthRevenue,
        lastMonthRevenue,
        complaints: complaints.length,
        openComplaints: complaints.filter(c => c.status === 'open').length,
        totalRevenue,
        inquiries: inquiries.length,
        newInquiries: inquiries.filter(i => i.status === 'NEW').length,
        marketplaceViews: analytics.today?.profile_views || 0,
        subscriptionStatus,
        subscriptionExpiry,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [paymentsRes, complaintsRes, inquiriesRes] = await Promise.all([
        api.get(`/api/payments/pg/${pgId}`).catch(() => ({ data: { payments: [] } })),
        api.get(`/api/complaints/pg/${pgId}`).catch(() => ({ data: { complaints: [] } })),
        api.get(`/api/inquiry/list?pg_id=${pgId}&limit=5`).catch(() => ({ data: { data: [] } })),
      ]);

      const payments = paymentsRes.data.payments || [];
      const complaints = complaintsRes.data.complaints || [];
      const inquiries = inquiriesRes.data.data || [];

      // Combine and sort by date
      const activities = [
        ...payments.slice(0, 2).map(p => ({
          type: 'payment',
          title: `Payment received: ₹${p.amount}`,
          description: `From tenant - ${new Date(p.created_at).toLocaleDateString()}`,
          date: p.created_at,
          status: p.status,
        })),
        ...inquiries.slice(0, 2).map(i => ({
          type: 'inquiry',
          title: `New inquiry from ${i.tenant_name || 'Tenant'}`,
          description: `Room: ${i.room_name} - Status: ${i.status}`,
          date: i.created_at,
          status: i.status,
        })),
        ...complaints.slice(0, 2).map(c => ({
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
      color: 'bg-blue-500', 
      iconColor: 'text-white',
      icon: IconUsers, 
      route: '/tenants',
      trend: null,
    },
    { 
      title: 'Occupancy Rate', 
      value: `${stats.occupancyRate}%`,
      subtitle: `${stats.occupiedBeds}/${stats.totalBeds} beds`,
      color: 'bg-green-500', 
      iconColor: 'text-white',
      icon: IconHome, 
      route: '/rooms',
      trend: stats.vacantBeds > 0 ? `${stats.vacantBeds} vacant` : 'Full',
    },
    { 
      title: 'This Month Revenue', 
      value: `₹${stats.thisMonthRevenue.toLocaleString('en-IN')}`,
      subtitle: stats.lastMonthRevenue > 0 
        ? `Last month: ₹${stats.lastMonthRevenue.toLocaleString('en-IN')}`
        : `${stats.payments} total payments`,
      color: 'bg-emerald-500', 
      iconColor: 'text-white',
      icon: IconDollar, 
      route: '/payments',
      trend: stats.lastMonthRevenue > 0 
        ? (stats.thisMonthRevenue > stats.lastMonthRevenue ? '↑' : '↓')
        : null,
    },
    { 
      title: 'New Inquiries', 
      value: stats.newInquiries,
      subtitle: `${stats.inquiries} total inquiries`,
      color: 'bg-purple-500', 
      iconColor: 'text-white',
      icon: IconInquiry, 
      route: '/inquiries',
      trend: stats.newInquiries > 0 ? 'New' : null,
    },
    { 
      title: 'Open Complaints', 
      value: stats.openComplaints,
      subtitle: `${stats.complaints} total`,
      color: stats.openComplaints > 0 ? 'bg-red-500' : 'bg-orange-500', 
      iconColor: 'text-white',
      icon: IconAlert, 
      route: '/complaints',
      trend: stats.openComplaints > 0 ? 'Action needed' : null,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
        {statCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div
              key={idx}
              className="bg-card p-5 md:p-6 rounded-xl border border-border hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => navigate(card.route)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
              <div className="relative">
              <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center ${card.iconColor} shadow-lg group-hover:scale-110 transition-transform`}>
                  <IconComponent />
                </div>
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
                  View
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
                <h3 className="text-muted-foreground text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-foreground mb-1">{card.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  {card.trend && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                      {card.trend}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card p-5 md:p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </h2>
            {recentActivity.length > 0 && (
              <button
                onClick={() => navigate('/payments')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View All
              </button>
            )}
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors border border-border/50 cursor-pointer"
                  onClick={() => {
                    if (activity.type === 'payment') navigate('/payments');
                    else if (activity.type === 'inquiry') navigate('/inquiries');
                    else if (activity.type === 'complaint') navigate('/complaints');
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' :
                    activity.type === 'inquiry' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {activity.type === 'payment' ? <IconDollar /> :
                     activity.type === 'inquiry' ? <IconInquiry /> :
                     <IconAlert />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm mb-1">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm">No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-card p-5 md:p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Vacant Beds</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{stats.vacantBeds}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.occupancyRate}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Occupied Beds</span>
                <span className="text-lg font-bold text-green-900 dark:text-green-100">{stats.occupiedBeds}</span>
              </div>
              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.occupancyRate}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Pending Payments</span>
                <span className="text-lg font-bold text-orange-900 dark:text-orange-100">{stats.pendingPayments}</span>
              </div>
            </div>
            {stats.marketplaceViews > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Today's Views</span>
                  <span className="text-lg font-bold text-purple-900 dark:text-purple-100">{stats.marketplaceViews}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions and System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions */}
        <div className="bg-card p-5 md:p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => navigate('/tenants')} 
              className="w-full justify-start gap-2 h-auto py-3 flex-col items-start"
            >
              <IconPlus />
              <span className="text-sm">Add Tenant</span>
            </Button>
            <Button 
              onClick={() => navigate('/rooms')} 
              variant="secondary" 
              className="w-full justify-start gap-2 h-auto py-3 flex-col items-start"
            >
              <IconHome />
              <span className="text-sm">Add Room</span>
            </Button>
            <Button 
              onClick={() => navigate('/payments')} 
              variant="outline" 
              className="w-full justify-start gap-2 h-auto py-3 flex-col items-start"
            >
              <IconDollar />
              <span className="text-sm">Record Payment</span>
            </Button>
            <Button 
              onClick={() => navigate('/inquiries')} 
              variant="outline" 
              className="w-full justify-start gap-2 h-auto py-3 flex-col items-start"
            >
              <IconInquiry />
              <span className="text-sm">View Inquiries</span>
            </Button>
          </div>
          {stats.newInquiries > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">New Inquiries</span>
                <button
                  onClick={() => navigate('/inquiries')}
                  className="text-sm font-bold text-blue-900 dark:text-blue-100 hover:underline"
                >
                  {stats.newInquiries} new
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="bg-card p-5 md:p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            System Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-3 bg-secondary/30 rounded-lg">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Role
              </span>
              <span className="text-foreground font-medium">
                {user?.role === 'superadmin' ? (
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-md text-xs font-semibold">
                    Super Admin
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md text-xs font-semibold">
                    PG Admin
                  </span>
                )}
              </span>
            </div>
            {user?.pg_id && (
              <div className="flex items-center justify-between py-3 px-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  PG ID
                </span>
                <span className="text-foreground font-medium font-mono text-sm">{user.pg_id}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 px-3 bg-secondary/30 rounded-lg">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Subscription
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                stats.subscriptionStatus === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {stats.subscriptionStatus === 'active' ? (
                  <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Active
                  </>
                ) : (
                  'Expired'
                )}
              </span>
            </div>
            {stats.subscriptionExpiry && (
              <div className="flex items-center justify-between py-3 px-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Expires
                </span>
                <span className="text-foreground font-medium text-sm">
                  {new Date(stats.subscriptionExpiry).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
              </span>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

