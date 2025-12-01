import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/apiconfig/api-config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/protected`, {
        withCredentials: true,
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      try {
        // Try refreshing token
        await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, {
          withCredentials: true
        });
        const response = await axios.get(`${API_BASE_URL}/api/auth/protected`, {
          withCredentials: true,
        });
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      await checkAuth();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

