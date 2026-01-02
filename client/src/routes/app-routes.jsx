import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../protected/protected-route';
import Dashboard from '../modules/layout/Dashboard';
import Login from '../modules/auth/login';
import Signup from '../modules/auth/signup';
import LandingPage from '../pages/LandingPage';
import PGManagement from '../pages/PGManagement';
import Plans from '../pages/Plans';
import RoomsBeds from '../pages/RoomsBeds';
import Tenants from '../pages/Tenants';
import Payments from '../pages/Payments';
import Complaints from '../pages/Complaints';
import MessPlans from '../pages/MessPlans';
import MessBills from '../pages/MessBills';
import Bills from '../pages/Bills';
import Subscriptions from '../pages/Subscriptions';
import Invoices from '../pages/Invoices';
import Coupons from '../pages/Coupons';
import Referrals from '../pages/Referrals';
import AuditLogs from '../pages/AuditLogs';
import Profile from '../pages/Profile';
import MarketplaceSearch from '../pages/MarketplaceSearch';
import PGDetail from '../pages/PGDetail';
import InquiryList from '../pages/InquiryList';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/marketplace/pg/:pg_id" element={<PGDetail />} />
      <Route path="/marketplace/search" element={<MarketplaceSearch />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LandingPage />} />
      <Route path="/signup" element={<LandingPage />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pgs" element={<ProtectedRoute requireRole="superadmin"><PGManagement /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute requireRole="superadmin"><Plans /></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute><RoomsBeds /></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
      <Route path="/mess-plans" element={<ProtectedRoute><MessPlans /></ProtectedRoute>} />
      <Route path="/mess-bills" element={<ProtectedRoute><MessBills /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
      <Route path="/coupons" element={<ProtectedRoute requireRole="superadmin"><Coupons /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/inquiries" element={<ProtectedRoute><InquiryList /></ProtectedRoute>} />

      {/* Default Route - Redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

