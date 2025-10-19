import { apiClient } from '@/lib/api-client';

export async function getCitizenStats() {
  return apiClient.get('/ops/citizens/stats');
}

export async function listCitizens(params: { q?: string; status?: 'active'|'inactive'; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiClient.get(`/ops/citizens${qs ? `?${qs}` : ''}`);
}

export async function updateCitizenStatus(id: number, status: 'active'|'inactive') {
  return apiClient.patch(`/ops/citizens/${id}/status`, { status });
}

export async function getCitizen(id: number) {
  return apiClient.get(`/ops/citizens/${id}`);
}

export async function updateCitizen(id: number, patch: { name?: string; email?: string; phone?: string; address?: string }) {
  return apiClient.patch(`/ops/citizens/${id}`, patch);
}

export async function createCitizen(body: { name: string; email: string; phone?: string; address?: string; dpi?: string; password: string }) {
  // El backend debe forzar rol "citizen" por defecto
  return apiClient.post(`/ops/citizens`, body);
}
