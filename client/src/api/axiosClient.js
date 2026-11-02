import axios from 'axios';

// ---------------------------------------------------------------------------
// SwaShop Universal API Client
// Handles both Separate Production Deployment (Vercel/Netlify -> Render)
// and Local Development (Vite Proxy -> http://localhost:5001)
// ---------------------------------------------------------------------------

const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

// Normalize URL: remove any trailing slashes
const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';

// Ensure it terminates with /api
const baseURL = cleanBase
  ? (cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`)
  : '/api';

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.info('[SwaShop API Client] Base URL:', baseURL);
}

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30s timeout for cold starts on free Render tier
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

// Response Interceptor: Handle auth expiration & normalized errors
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend is sleeping / waking up on Render free tier
    const isNetworkOrTimeout =
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      !error.response;

    const customError = {
      status: error.response?.status || 500,
      message: isNetworkOrTimeout
        ? 'Connecting to SwaShop server... If the backend server was idle, it may take ~30 seconds to wake up. Please retry!'
        : (error.response?.data?.message || error.message || 'Something went wrong. Please try again.')
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
