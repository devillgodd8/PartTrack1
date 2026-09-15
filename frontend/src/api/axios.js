import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for diagnostic logging
api.interceptors.request.use((config) => {
  const isDebug = Boolean(window.__DEBUG_API__ || import.meta.env.DEV);
  if (isDebug) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.url?.includes('login') ? { ...config.data, password: '***' } : config.data,
    });
  }
  return config;
});

// Response interceptor with comprehensive error diagnostics
api.interceptors.response.use(
  (response) => {
    const isDebug = Boolean(window.__DEBUG_API__ || import.meta.env.DEV);
    if (isDebug) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} => ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
    const res = error.response;
    const req = error.config;
    const status = res?.status;
    const url = req ? `${req.baseURL || ''}${req.url || ''}` : 'Unknown URL';
    const isHtml = typeof res?.data === 'string' && res.data.includes('<html');

    // Always log detailed diagnostic group for any HTTP 4xx or 5xx error
    console.group(`[PartTrack API Diagnostic] ${req?.method?.toUpperCase()} ${url} => ${status || 'NETWORK_ERROR'}`);
    console.error('HTTP Status:', status, res?.statusText);
    console.error('Response Headers:', res?.headers);
    console.error('Response Data:', res?.data);

    if (res?.headers?.['x-debug-auth-failure']) {
      console.warn(`[Backend Auth Reason]: ${res.headers['x-debug-auth-failure']}`);
    }

    if (isHtml) {
      console.warn('⚠️ The server returned an HTML error page instead of JSON.');
      console.warn('This usually indicates a block by Apache, Cloudflare, or StackCDN WAF before reaching the PHP application.');
    }
    console.groupEnd();

    if (status === 401) {
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
