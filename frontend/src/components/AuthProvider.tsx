import { useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '../store/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const authStore = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ao montar, verificar se há token no localStorage
    const token = localStorage.getItem('token');
    const authStorage = localStorage.getItem('auth-storage');
    
    console.log('AuthProvider - Checking token:', !!token);
    console.log('AuthProvider - Checking auth-storage:', !!authStorage);
    
    if (token) {
      // Se tem token no localStorage
      if (!authStore.token) {
        // Mas não no store, atualizar
        authStore.setToken(token);
        authStore.setIsAuthenticated(true);
      }
      
      // Tentar recuperar dados do usuário do auth-storage
      if (authStorage) {
        try {
          const data = JSON.parse(authStorage);
          console.log('AuthProvider - Auth storage data:', data);
          
          if (data.state?.user && !authStore.user) {
            authStore.setUser(data.state.user);
          }
          
          if (data.state?.tenant && !authStore.tenant) {
            // Adicionar método setTenant se necessário
            authStore.setAuth(
              data.state.token || token,
              data.state.user,
              data.state.tenant
            );
          }
        } catch (e) {
          console.error('Error parsing auth-storage:', e);
        }
      }
    } else if (!token && authStore.isAuthenticated) {
      // Se não tem token mas o store diz que está autenticado, fazer logout
      console.log('AuthProvider - No token but authenticated, logging out');
      authStore.logout();
    }
    
    setIsReady(true);
  }, []);

  // Não renderizar children até estar pronto
  if (!isReady) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}