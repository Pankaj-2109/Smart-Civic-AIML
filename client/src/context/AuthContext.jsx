import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext();

export const DEMO_ACCOUNTS = {
  citizen: {
    id: 'demo-citizen-id',
    name: 'Rahul Sharma',
    email: 'citizen@gmail.com',
    role: 'citizen',
    phone: '+91 98222 33445',
  },
  admin: {
    id: 'demo-admin-id',
    name: 'Municipal Commissioner Vikram Rao',
    email: 'admin@smartcivic.gov',
    role: 'admin',
    department: 'Central Municipal Authority',
  },
  worker: {
    id: 'demo-worker-id',
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar@smartcivic.gov',
    role: 'worker',
    department: 'Sanitation',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartcivic_user');
    return saved ? JSON.parse(saved) : DEMO_ACCOUNTS.citizen;
  });
  const [token, setToken] = useState(() => localStorage.getItem('smartcivic_token') || 'demo-token');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Complaint Verified',
      message: 'Your report near Connaught Circus was verified by AI with 96% confidence.',
      time: '10m ago',
      read: false,
    },
    {
      id: 2,
      title: 'Worker Dispatched',
      message: 'Sanitation crew lead Ramesh Kumar assigned to your garbage clearance request.',
      time: '1h ago',
      read: false,
    },
  ]);

  const switchRole = (role) => {
    if (DEMO_ACCOUNTS[role]) {
      const demoUser = DEMO_ACCOUNTS[role];
      setUser(demoUser);
      localStorage.setItem('smartcivic_user', JSON.stringify(demoUser));
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('smartcivic_user', JSON.stringify(res.data.user));
        localStorage.setItem('smartcivic_token', res.data.token);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(DEMO_ACCOUNTS.citizen);
    setToken('');
    localStorage.removeItem('smartcivic_token');
    localStorage.removeItem('smartcivic_user');
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [
      { id: Date.now(), time: 'Just now', read: false, ...notif },
      ...prev,
    ]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        switchRole,
        login,
        logout,
        notifications,
        addNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

