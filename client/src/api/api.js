import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcivic_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  assignWorker: (id, workerData) => api.post(`/complaints/${id}/assign`, workerData),
  resolve: (id, formData) => api.post(`/complaints/${id}/resolve`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const workerAPI = {
  getAll: () => api.get('/workers'),
  getTasks: (id) => api.get(`/workers/${id}/tasks`),
  updateStatus: (id, status) => api.patch(`/workers/${id}/status`, { status }),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getHotspots: () => api.get('/admin/hotspots'),
  getRouteOptimize: () => api.get('/admin/route-optimize'),
};

export const aiAPI = {
  ask: (query, userContext) => api.post('/ai/assistant', { query, userContext }),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export default api;

