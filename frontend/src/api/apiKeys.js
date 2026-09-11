import api from './axios';

export const listApiKeys = async () => {
  const { data } = await api.get('/keys');
  return data;
};

export const createApiKey = async (name) => {
  const { data } = await api.post('/keys', { name });
  return data;
};

export const revokeApiKey = async (id) => {
  const { data } = await api.delete(`/keys/${id}`);
  return data;
};
