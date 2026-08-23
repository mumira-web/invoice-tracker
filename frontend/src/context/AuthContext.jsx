import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('invoicehub_access');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUser(response.data);
    } catch (error) {
      // Token invalid — clear everything
      localStorage.removeItem('invoicehub_access');
      localStorage.removeItem('invoicehub_refresh');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    const { access, refresh } = response.data;
    localStorage.setItem('invoicehub_access', access);
    localStorage.setItem('invoicehub_refresh', refresh);
    await fetchProfile();
    return response;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register/', data);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('invoicehub_access');
    localStorage.removeItem('invoicehub_refresh');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile/', data);
    setUser(response.data);
    return response;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
