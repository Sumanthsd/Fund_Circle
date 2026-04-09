import apiClient from './apiClient.js';

export async function getCurrentUser() {
  const { data } = await apiClient.get('/api/auth/me');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await apiClient.patch('/api/profile', payload);
  return data;
}
