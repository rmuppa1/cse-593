import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);
const storedUser = () => { try { return JSON.parse(localStorage.getItem('smartcity_user')); } catch { return null; } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const saveSession = ({ token, user: nextUser }) => {
    localStorage.setItem('smartcity_token', token);
    localStorage.setItem('smartcity_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };
  const login = async (credentials) => { const { data } = await api.post('/auth/login', credentials); saveSession(data); return data.user; };
  const register = async (details) => { const { data } = await api.post('/auth/register', details); if (data.token) saveSession(data); return data; };
  const logout = () => { localStorage.removeItem('smartcity_token'); localStorage.removeItem('smartcity_user'); setUser(null); };
  const value = useMemo(() => ({ user, login, register, logout, isStaff: ['ADMIN', 'MANAGER'].includes(user?.role) }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

