import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { authServiceV2 } from '../services/authServiceV2';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const authStore = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // Ao montar, verificar se há token no localStorage
      const token = localStorage.getItem('token');
      const authStorage = localStorage.getItem('auth-storage');
      
      console.log('AuthProvider - Checking token:', !!token);
      console.log('AuthProvider - Checking auth-storage:', !!authStorage);
      
      if (token) {
        // Se tem token, tentar validar com o backend
        try {
          authStore.setLoading(true);
          const sessionResult = await authServiceV2.validateSession();
          
          if (sessionResult.success && sessionResult.user) {
            // Sessão válida, atualizar store
            authStore.setAuth(
              token,
              sessionResult.user,
              sessionResult.tenant
            );
            console.log('AuthProvider - Session valid, user authenticated');
          } else {
            // Sessão inválida, limpar dados
            console.log('AuthProvider - Session invalid, clearing auth');
            authStore.logout();
          }
        } catch (error) {
          console.error('AuthProvider - Session validation error:', error);
          // Se falhar na validação, tentar usar dados do localStorage como fallback
          if (authStorage) {
            try {
              const data = JSON.parse(authStorage);
              console.log('AuthProvider - Using stored auth data as fallback');
              
              if (data.state?.user) {
                authStore.setAuth(
                  data.state.token || token,
                  data.state.user,
                  data.state.tenant
                );
              }
            } catch (e) {
              console.error('Error parsing auth-storage:', e);
              authStore.logout();
            }
          } else {
            authStore.logout();
          }
        } finally {
          authStore.setLoading(false);
        }
      } else if (authStore.isAuthenticated) {
        // Se não tem token mas o store diz que está autenticado, fazer logout
        console.log('AuthProvider - No token but authenticated, logging out');
        authStore.logout();
      }
      
      setIsReady(true);
    };

    initAuth();
  }, []);

  // Não renderizar children até estar pronto
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}