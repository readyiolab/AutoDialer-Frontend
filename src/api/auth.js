import api from './axios';

export const login = (phone, password, companyCode) =>
  api.post('/auth/login', { phone, password, companyCode, clientType: 'web' }, {
    headers: { 'X-Client-Type': 'web' },
  });

export const verifyOtp = (phone, otp) =>
  api.post('/auth/verify-otp', { phone, otp });

export const refreshToken = () =>
  api.post('/auth/refresh-token');

export const logout = () =>
  api.post('/auth/logout');

export const getMe = () =>
  api.get('/auth/me');

export const acceptInvite = (token, password) =>
  api.post('/auth/invitations/accept', { token, password });

export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword });
