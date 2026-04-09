import apiClient from './apiClient.js';

export async function getCycles() {
  const { data } = await apiClient.get('/api/cycles');
  return data;
}

export async function createCycle(payload) {
  const { data } = await apiClient.post('/api/cycles', payload);
  return data;
}

export async function deleteCycle(id) {
  const { data } = await apiClient.delete(`/api/cycles/${id}`);
  return data;
}

export async function startCycle(id) {
  const { data } = await apiClient.post(`/api/cycles/${id}/start`);
  return data;
}

export async function updateContribution(id, status) {
  const { data } = await apiClient.patch(`/api/cycles/contributions/${id}`, { status });
  return data;
}

export async function finalizeRandomDraw(monthId, selectedMemberId) {
  const { data } = await apiClient.post(`/api/cycles/months/${monthId}/random-draw`, {
    selectedMemberId,
  });
  return data;
}
