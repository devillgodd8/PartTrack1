import api from './axios';

export const getDashboardStats = () =>
  api.get('/dashboard/stats').then((r) => r.data);

export const getActivityLog = (params = {}) =>
  api.get('/activity', { params }).then((r) => r.data);
