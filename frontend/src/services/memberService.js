import apiClient from './apiClient.js';

export async function getMembers() {
  const { data } = await apiClient.get('/api/members');
  return data;
}

export async function createMember(payload) {
  const { data } = await apiClient.post('/api/members', payload);
  return data;
}

export async function updateMember(id, payload) {
  const { data } = await apiClient.patch(`/api/members/${id}`, payload);
  return data;
}

export async function deleteMember(id) {
  const { data } = await apiClient.delete(`/api/members/${id}`);
  return data;
}
