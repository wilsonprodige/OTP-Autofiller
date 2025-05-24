import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

let authInterceptor;

api.interceptors.response.use(
    (response) => response?.data,
    (error) => {
      return Promise.reject(error);
    }
  );

export const setAuthHeader = (token) => {
  if (authInterceptor) {
    api.interceptors.request.eject(authInterceptor);
  }
  authInterceptor = api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};


export const clearAuthHeader = () => {
  if (authInterceptor) {
    api.interceptors.request.eject(authInterceptor);
    authInterceptor = null;
  }
};

export default api;