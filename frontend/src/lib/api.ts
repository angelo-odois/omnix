import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8300/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Primeiro tenta pegar do store
  let token = useAuthStore.getState().token;
  
  // Se não tiver no store, tenta pegar do localStorage
  if (!token) {
    token = localStorage.getItem('token');
    
    // Se encontrou no localStorage mas não no store, atualiza o store
    if (token) {
      useAuthStore.getState().setToken(token);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Request with token to:', config.url);
  } else {
    console.warn('Request WITHOUT token to:', config.url);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Error:', error.config?.url);
      
      // Não fazer logout se for uma rota de autenticação ou se já estiver na página de login
      const authRoutes = ['/auth/', '/v2/auth/'];
      const isAuthRoute = authRoutes.some(route => error.config?.url?.includes(route));
      const isOnLoginPage = window.location.pathname.includes('/login');
      
      if (!isAuthRoute && !isOnLoginPage) {
        console.log('Unauthorized access, redirecting to login');
        useAuthStore.getState().logout();
        window.location.href = '/loginv2';
      }
    }
    return Promise.reject(error);
  }
);