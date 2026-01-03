import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';
import { Skeleton, SkeletonCard } from '../components/common/Skeleton';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/me');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setStoredUser(response.data.user);
        } else {
          setError('Failed to load user profile');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please try again.');
        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatRole = (role) => {
    if (!role) return 'N/A';
    return role === 'superadmin' ? 'Super Admin' : 'PG Admin';
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-4 sm:mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Profile Card Skeleton */}
          <SkeletonCard showHeader={true} lines={6} className="mb-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 text-lg font-medium mb-2">Error</p>
          <p className="text-[#9CA3AF]">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#9CA3AF]">No user data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-6">
      <div className="max-w-8xl mx-auto">
       

        {/* Profile Card */}
        <div className="bg-[#0F1720] border border-primary/10 rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-[#22D3EE]/10 px-4 sm:px-6 py-6 sm:py-8 border-b border-primary/10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#22D3EE] rounded-full flex items-center justify-center text-[#0B0F14] text-2xl sm:text-3xl font-bold flex-shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-1 truncate">{user.name || 'N/A'}</h2>
                <p className="text-xs sm:text-sm text-[#9CA3AF]">
                  {formatRole(user.role)}
                  {user.pg_id && ` • PG ID: ${user.pg_id}`}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* User ID */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs sm:text-sm font-medium text-[#9CA3AF]">User ID</label>
                <p className="text-[#E5E7EB] font-mono text-xs sm:text-sm bg-[#0B0F14] px-3 py-2 rounded border border-primary/10 break-all">
                  {user.id || 'N/A'}
                </p>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">Role</label>
                <p className="text-[#E5E7EB]">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'superadmin' 
                      ? 'bg-purple-500/20 text-purple-300' 
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {formatRole(user.role)}
                  </span>
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">Full Name</label>
                <p className="text-[#E5E7EB]">{user.name || 'N/A'}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">Email Address</label>
                <p className="text-[#E5E7EB] break-all">
                  {user.email ? (
                    <a 
                      href={`mailto:${user.email}`} 
                      className="text-[#22D3EE] hover:text-[#1FB6C1] hover:underline"
                    >
                      {user.email}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">Phone Number</label>
                <p className="text-[#E5E7EB]">
                  {user.phone ? (
                    <a 
                      href={`tel:${user.phone}`} 
                      className="text-[#22D3EE] hover:text-[#1FB6C1] hover:underline"
                    >
                      {user.phone}
                    </a>
                  ) : (
                    <span className="text-[#9CA3AF] italic">Not provided</span>
                  )}
                </p>
              </div>

              {/* Google ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">Google ID</label>
                <p className="text-[#E5E7EB]">
                  {user.google_id ? (
                    <span className="font-mono text-sm bg-[#0B0F14] px-3 py-1 rounded border border-primary/10">
                      {user.google_id.substring(0, 20)}...
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] italic">Not linked</span>
                  )}
                </p>
              </div>

              {/* PG ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">PG ID</label>
                <p className="text-[#E5E7EB]">
                  {user.pg_id ? (
                    <span className="font-mono text-sm bg-[#0B0F14] px-3 py-1 rounded border border-primary/10">
                      {user.pg_id}
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] italic">Not assigned</span>
                  )}
                </p>
              </div>

              {/* Created At */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#9CA3AF]">Account Created</label>
                <p className="text-[#E5E7EB]">{formatDate(user.created_at)}</p>
              </div>
            </div>

            {/* PG Details Section */}
            {user.pg_details && (
              <div className="mt-8 pt-6 border-t border-primary/10">
                <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  PG Details
                </h3>
                <div className="bg-[#22D3EE]/5 border border-primary/20 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PG Name */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-[#9CA3AF]">PG Name</label>
                      <p className="text-[#E5E7EB] text-lg font-semibold">{user.pg_details.name || 'N/A'}</p>
                    </div>

                    {/* PG UID */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">PG UID</label>
                      <p className="text-[#E5E7EB] font-mono text-sm bg-[#0B0F14] px-3 py-2 rounded border border-primary/10">
                        {user.pg_details.pg_uid || 'N/A'}
                      </p>
                    </div>

                    {/* PG ID */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">PG ID</label>
                      <p className="text-[#E5E7EB] font-mono text-sm bg-[#0B0F14] px-3 py-2 rounded border border-primary/10">
                        {user.pg_details.id || 'N/A'}
                      </p>
                    </div>

                    {/* Address */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-[#9CA3AF]">Full Address</label>
                      <p className="text-[#E5E7EB] bg-[#0B0F14] px-3 py-2 rounded border border-primary/10">
                        {user.pg_details.address || 'N/A'}
                      </p>
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">City</label>
                      <p className="text-[#E5E7EB] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {user.pg_details.city || 'N/A'}
                      </p>
                    </div>

                    {/* Area */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">Area</label>
                      <p className="text-[#E5E7EB] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {user.pg_details.area || 'N/A'}
                      </p>
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">Pincode</label>
                      <p className="text-[#E5E7EB] font-mono">{user.pg_details.pincode || 'N/A'}</p>
                    </div>

                    {/* Food Enabled */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">Food Service</label>
                      <p className="text-[#E5E7EB]">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.pg_details.food_enabled
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {user.pg_details.food_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </p>
                    </div>

                    {/* Default Due Day */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">Default Due Day</label>
                      <p className="text-[#E5E7EB]">
                        Day {user.pg_details.default_due_day || 'N/A'} of month
                      </p>
                    </div>

                    {/* PG Created At */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[#9CA3AF]">PG Created</label>
                      <p className="text-[#E5E7EB]">{formatDate(user.pg_details.created_at)}</p>
                    </div>

                    {/* PG Images */}
                    {user.pg_details.images && user.pg_details.images.length > 0 && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-[#9CA3AF]">PG Images</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {user.pg_details.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-primary/10">
                              <img
                                src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                                alt={`PG Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info Section */}
            <div className="mt-8 pt-6 border-t border-primary/10">
              <h3 className="text-lg font-semibold text-[#E5E7EB] mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0B0F14] p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#22D3EE]/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Authentication Method</p>
                      <p className="text-[#E5E7EB] font-medium">
                        {user.google_id ? 'Google OAuth' : user.phone ? 'Phone & Password' : 'Email'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B0F14] p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#22D3EE]/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Account Status</p>
                      <p className="text-[#E5E7EB] font-medium text-green-400">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B0F14] hover:bg-[#0F1720] border border-primary/10 text-[#E5E7EB] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

