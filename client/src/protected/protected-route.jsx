import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireRole }) => {
  // Simple check - if token exists in cookies, allow access
  // For now, just allow access (you can add proper cookie check later)
  const hasToken = document.cookie.includes('token=');

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

