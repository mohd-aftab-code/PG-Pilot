import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../protected/protected-route';
import Dashboard from '../modules/layout/Dashboard';
import LandingPage from '../pages/LandingPage'; // For PG Owners
import TenantLandingPage from '../pages/TenantLandingPage'; // For Tenants
import RegisterPG from '../pages/RegisterPG';
import PGSuccess from '../pages/PGSuccess';
import ChoosePlan from '../pages/ChoosePlan';
import PaymentSuccess from '../pages/PaymentSuccess';
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
      <Route path="/for-owners" element={<LandingPage />} /> {/* Dedicated for PG Owners */}
      <Route path="/for-tenants" element={<TenantLandingPage />} /> {/* Dedicated for Tenants */}
      <Route path="/" element={<Navigate to="/for-tenants" replace />} /> {/* Default to tenant landing */}
      <Route path="/login" element={<Navigate to="/for-tenants" replace state={{ modal: 'login' }} />} /> {/* Redirect to tenant landing with login modal */}
      <Route path="/signup" element={<Navigate to="/for-owners" replace state={{ modal: 'signup' }} />} /> {/* Redirect to owner landing with signup modal */}

      {/* Onboarding Routes */}
      <Route path="/register-pg" element={<ProtectedRoute requirePG={false}><RegisterPG /></ProtectedRoute>} />
      <Route path="/pg-success" element={<ProtectedRoute requirePG={true} requirePlan={false}><PGSuccess /></ProtectedRoute>} />
      <Route path="/choose-plan" element={<ProtectedRoute requirePG={true} requirePlan={false}><ChoosePlan /></ProtectedRoute>} />
      <Route path="/payment-success" element={<ProtectedRoute requirePG={true} requirePlan={false}><PaymentSuccess /></ProtectedRoute>} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute requirePG={true} requirePlan={true}><Dashboard /></ProtectedRoute>} />
      <Route path="/pgs" element={<ProtectedRoute requireRole="superadmin"><PGManagement /></ProtectedRoute>} />
      <Route path="/plans" element={<ProtectedRoute requireRole="superadmin"><Plans /></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute requirePG={true} requirePlan={true}><RoomsBeds /></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute requirePG={true} requirePlan={true}><Tenants /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute requirePG={true} requirePlan={true}><Payments /></ProtectedRoute>} />
      <Route path="/complaints" element={<ProtectedRoute requirePG={true} requirePlan={true}><Complaints /></ProtectedRoute>} />
      <Route path="/mess-plans" element={<ProtectedRoute requirePG={true} requirePlan={true}><MessPlans /></ProtectedRoute>} />
      <Route path="/mess-bills" element={<ProtectedRoute requirePG={true} requirePlan={true}><MessBills /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute requirePG={true} requirePlan={true}><Bills /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute requirePG={true} requirePlan={true}><Subscriptions /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute requirePG={true} requirePlan={true}><Invoices /></ProtectedRoute>} />
      <Route path="/coupons" element={<ProtectedRoute requireRole="superadmin"><Coupons /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute requirePG={true} requirePlan={true}><Referrals /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute requirePG={true} requirePlan={true}><AuditLogs /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/inquiries" element={<ProtectedRoute requirePG={true} requirePlan={true}><InquiryList /></ProtectedRoute>} />

      {/* Default Route - Redirect to tenant landing */}
      <Route path="*" element={<Navigate to="/for-tenants" replace />} />
    </Routes>
  );
};

export default AppRoutes;

