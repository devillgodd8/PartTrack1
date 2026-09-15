import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not auto-redirect if on login or public tracking route
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.startsWith('/track')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
