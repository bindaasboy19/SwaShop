import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';
const baseURL = cleanBase ? (cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`) : '/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('swashop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth expiration
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Something went wrong. Please try again.'
    };

    if (error.response?.status === 401) {
      // If token expired or invalid, clear stored auth
      if (localStorage.getItem('swashop_token')) {
        localStorage.removeItem('swashop_token');
        localStorage.removeItem('swashop_user');
        window.dispatchEvent(new Event('swashop-auth-expired'));
      }
    }

    return Promise.reject(customError);
  }
);

export default axiosClient;
