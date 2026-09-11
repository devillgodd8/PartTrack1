import api from './axios';

export const listUsers = () =>
  api.get('/users').then((r) => r.data);

export const getUser = (id) =>
  api.get(`/users/${id}`).then((r) => r.data);

export const createUser = (data) =>
  api.post('/users', data).then((r) => r.data);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data).then((r) => r.data);

export const deactivateUser = (id) =>
  api.put(`/users/${id}/deactivate`).then((r) => r.data);

export const resetUserPassword = (id, password) =>
  api.put(`/users/${id}/reset-password`, { password }).then((r) => r.data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((r) => r.data);
