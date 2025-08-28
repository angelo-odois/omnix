import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState, User, Tenant } from '../types/auth';

interface AuthStore extends AuthState {
  token: string | null;
  setAuth: (token: string, user: User, tenant?: Tenant) => void;
  setUser: (user: User) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token, user, tenant) => {
        // Salvar token no localStorage para garantir persistência
        localStorage.setItem('token', token);
        
        set({
          token,
          user,
          tenant: tenant || null,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),

      setIsAuthenticated: (authenticated) =>
        set((state) => ({
          ...state,
          isAuthenticated: authenticated,
        })),

      setToken: (token) => {
        localStorage.setItem('token', token);
        set((state) => ({
          ...state,
          token,
        }));
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          tenant: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Quando o estado é rehidratado do localStorage
        if (state && state.token) {
          // Garantir que o token também está no localStorage
          localStorage.setItem('token', state.token);
        }
      },
    }
  )
);

// Função helper para verificar autenticação
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const state = useAuthStore.getState();
  
  if (token && !state.token) {
    // Se tem token no localStorage mas não no state, atualizar
    state.setToken(token);
    state.setIsAuthenticated(true);
  }
  
  return !!token;
};