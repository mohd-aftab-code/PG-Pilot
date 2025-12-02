import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { getStoredUser, getStoredPgId } from '../../utils/auth';
import Button from '../../components/common/Button';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const pgId = getStoredPgId();
  const [stats, setStats] = useState({
    tenants: 0,
    rooms: 0,
    payments: 0,
    complaints: 0,
  });

  useEffect(() => {
    if (pgId) {
      fetchStats();
    }
  }, [pgId]);

  const fetchStats = async () => {
    try {
      const [tenantsRes, roomsRes, paymentsRes, complaintsRes] = await Promise.all([
        api.get(`/api/tenants/pg/${pgId}`),
        api.get(`/api/rooms/pg/${pgId}`),
        api.get(`/api/payments/pg/${pgId}`),
        api.get(`/api/complaints/pg/${pgId}`),
      ]);

      setStats({
        tenants: tenantsRes.data.tenants?.length || 0,
        rooms: roomsRes.data.rooms?.length || 0,
        payments: paymentsRes.data.payments?.length || 0,
        complaints: complaintsRes.data.complaints?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { title: 'Total Tenants', value: stats.tenants, color: 'bg-primary', icon: '👥', route: '/tenants' },
    { title: 'Total Rooms', value: stats.rooms, color: 'bg-accent', icon: '🏠', route: '/rooms' },
    { title: 'Total Payments', value: stats.payments, color: 'bg-chart-1', icon: '💰', route: '/payments' },
    { title: 'Open Complaints', value: stats.complaints, color: 'bg-destructive', icon: '📝', route: '/complaints' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-card p-6 rounded border border-border hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate(card.route)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">View →</span>
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">{card.title}</h3>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button onClick={() => navigate('/tenants')} className="w-full justify-start">Add New Tenant</Button>
            <Button onClick={() => navigate('/payments')} variant="secondary" className="w-full justify-start">Record Payment</Button>
            <Button onClick={() => navigate('/complaints')} variant="outline" className="w-full justify-start">View Complaints</Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Role:</span>
              <span className="text-foreground font-medium">{user?.role === 'superadmin' ? 'Super Admin' : 'PG Admin'}</span>
            </div>
            {user?.pg_id && (
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">PG ID:</span>
                <span className="text-foreground font-medium">{user.pg_id}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

