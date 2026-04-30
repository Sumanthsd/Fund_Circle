import apiClient from './apiClient.js';

export async function getCurrentUser() {
  const { data } = await apiClient.get('/api/auth/me');
  return data;
}

export async function getActiveUsers() {
  const { data } = await apiClient.get('/api/auth/active-users');
  return data;
}

export async function getDataRevision() {
  const { data } = await apiClient.get('/api/realtime/version');
  return Number(data?.revision || 0);
}

export async function updateProfile(payload) {
  const { data } = await apiClient.patch('/api/profile', payload);
  return data;
}
