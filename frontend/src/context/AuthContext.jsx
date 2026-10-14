import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state by checking session cookie / me endpoint
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        // Not logged in or network down
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('parkcloud_token', res.token);
      }
      setUser(res.user);
      return res.user;
    }
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('parkcloud_token', res.token);
      }
      setUser(res.user);
      return res.user;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('parkcloud_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
