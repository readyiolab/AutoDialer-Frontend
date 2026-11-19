import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  acceptInvite as apiAcceptInvite,
  changePassword as apiChangePassword,
} from '../api/auth';

const AuthContext = createContext(null);

function normalizeUser(raw, extras = {}) {
  if (!raw) return null;
  const roleName = raw.role?.name || raw.roleName || raw.role;
  const permissions = raw.role?.permissions || raw.permissions || [];
  const mustChangePassword =
    extras.mustChangePassword !== undefined
      ? !!extras.mustChangePassword
      : !!(raw.mustChangePassword);
  return {
    ...raw,
    role: roleName,
    roleName: raw.role?.displayName || roleName,
    permissions: Array.isArray(permissions) ? permissions : [],
    companyId: raw.companyId || raw.company?.id,
    isPlatformAdmin: !!raw.isPlatformAdmin || roleName === 'SUPER_ADMIN',
    mustChangePassword,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('autodial_token'));
  const [loading, setLoading] = useState(true);

  const persist = (accessToken, userData, extras = {}) => {
    const normalized = normalizeUser(userData, extras);
    localStorage.setItem('autodial_token', accessToken);
    localStorage.setItem('autodial_user', JSON.stringify(normalized));
    setToken(accessToken);
    setUser(normalized);
  };

  const restoreSession = useCallback(async () => {
    const savedToken = localStorage.getItem('autodial_token');
    if (!savedToken || savedToken === 'demo-jwt-token' || savedToken === 'demo-token') {
      localStorage.removeItem('autodial_token');
      localStorage.removeItem('autodial_user');
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getMe();
      const profile = res.data?.data || res.data;
      persist(savedToken, profile);
    } catch {
      localStorage.removeItem('autodial_token');
      localStorage.removeItem('autodial_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (phone, password, companyCode) => {
    try {
      const res = await apiLogin(phone, password, companyCode);
      const payload = res.data?.data || res.data;
      const accessToken = payload.accessToken || payload.token;
      if (!accessToken || !payload.user) {
        return { success: false, message: 'Invalid login response' };
      }
      const roleName = payload.user.role?.name || payload.user.roleName;
      if (roleName === 'TELECALLER') {
        return {
          success: false,
          message: 'Telecallers must use the Android app. Web portal access is not allowed.',
        };
      }
      const mustChangePassword = !!(
        payload.user.mustChangePassword || payload.mustChangePassword
      );
      persist(accessToken, payload.user, { mustChangePassword });
      return { success: true, mustChangePassword };
    } catch (err) {
      const status = err.response?.status;
      const raw = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : typeof raw === 'object'
          ? raw.message || 'Login failed'
          : String(raw);
      if (status === 429) {
        return {
          success: false,
          message: 'Too many sign-in attempts. Wait about a minute, then try again.',
        };
      }
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiChangePassword(currentPassword, newPassword);
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, mustChangePassword: false };
        localStorage.setItem('autodial_user', JSON.stringify(next));
        return next;
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Password change failed',
      };
    }
  };

  const acceptInvite = async (inviteToken, password) => {
    try {
      await apiAcceptInvite(inviteToken, password);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invitation acceptance failed',
      };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('autodial_token');
    localStorage.removeItem('autodial_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (user.isPlatformAdmin || user.role === 'SUPER_ADMIN') return true;
    return user.role === role;
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.isPlatformAdmin || user.role === 'SUPER_ADMIN') return true;
    const list = user.permissions || [];
    if (list.includes('*') || list.includes('manage_*')) return true;
    return Array.isArray(perm) ? perm.some((p) => list.includes(p)) : list.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        acceptInvite,
        changePassword,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
