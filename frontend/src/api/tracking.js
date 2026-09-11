import api from './axios';

export const listTracking = (params = {}) =>
  api.get('/tracking', { params }).then((r) => r.data);

export const getTracking = (id) =>
  api.get(`/tracking/${id}`).then((r) => r.data);

export const createTracking = (data) =>
  api.post('/tracking', data).then((r) => r.data);

export const updateTracking = (id, data) =>
  api.put(`/tracking/${id}`, data).then((r) => r.data);

export const updateStatus = (id, data) =>
  api.post(`/tracking/${id}/status`, data).then((r) => r.data);

export const deleteTracking = (id) =>
  api.delete(`/tracking/${id}`).then((r) => r.data);

export const lookupTracking = (trackingNumber) =>
  api.get(`/tracking/lookup/${trackingNumber}`).then((r) => r.data);
