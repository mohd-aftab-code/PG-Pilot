import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getStoredUser, setStoredUser } from '../utils/auth';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-destructive mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-destructive text-lg font-medium mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">No user data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-primary/10 px-6 py-8 border-b border-border">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold flex-shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-foreground mb-1 truncate">{user.name || 'N/A'}</h2>
                <p className="text-muted-foreground text-sm">
                  {formatRole(user.role)}
                  {user.pg_id && ` • PG ID: ${user.pg_id}`}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-foreground font-mono text-sm bg-secondary px-3 py-2 rounded border border-border">
                  {user.id || 'N/A'}
                </p>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <p className="text-foreground">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'superadmin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {formatRole(user.role)}
                  </span>
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-foreground">{user.name || 'N/A'}</p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="text-foreground break-all">
                  {user.email ? (
                    <a 
                      href={`mailto:${user.email}`} 
                      className="text-primary hover:underline"
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
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p className="text-foreground">
                  {user.phone ? (
                    <a 
                      href={`tel:${user.phone}`} 
                      className="text-primary hover:underline"
                    >
                      {user.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Not provided</span>
                  )}
                </p>
              </div>

              {/* Google ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Google ID</label>
                <p className="text-foreground">
                  {user.google_id ? (
                    <span className="font-mono text-sm bg-secondary px-3 py-1 rounded border border-border">
                      {user.google_id.substring(0, 20)}...
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not linked</span>
                  )}
                </p>
              </div>

              {/* PG ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">PG ID</label>
                <p className="text-foreground">
                  {user.pg_id ? (
                    <span className="font-mono text-sm bg-secondary px-3 py-1 rounded border border-border">
                      {user.pg_id}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Not assigned</span>
                  )}
                </p>
              </div>

              {/* Created At */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                <p className="text-foreground">{formatDate(user.created_at)}</p>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Authentication Method</p>
                      <p className="text-foreground font-medium">
                        {user.google_id ? 'Google OAuth' : user.phone ? 'Phone & Password' : 'Email'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <p className="text-foreground font-medium text-green-600 dark:text-green-400">Active</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
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

