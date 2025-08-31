import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import AuthProvider from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { ModuleProtectedRoute } from './components/layout/ModuleAwareNavigation';
import Layout from './components/layout/Layout';
import LoginV2 from './pages/LoginV2';
import AcceptInvite from './pages/AcceptInvite';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import WhatsAppInstances from './pages/WhatsAppInstances';
import Contacts from './pages/Contacts';
import Chat from './pages/Chat';
import Workflows from './pages/Workflows';
import AdminDashboard from './pages/AdminDashboard';
import ModuleMarketplace from './pages/ModuleMarketplace';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
            <Routes>
            <Route path="/loginv2" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginV2 />
            } />
            <Route path="/login" element={<Navigate to="/loginv2" replace />} />
            <Route path="/invite" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <AcceptInvite />
            } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="conversations" element={
              <ModuleProtectedRoute requiredModules={['messages']}>
                <Chat />
              </ModuleProtectedRoute>
            } />
            <Route path="contacts" element={
              <ModuleProtectedRoute requiredModules={['contacts']}>
                <Contacts />
              </ModuleProtectedRoute>
            } />
            <Route path="instances" element={
              <ModuleProtectedRoute 
                requiredModules={['whatsapp']}
                requiredRoles={['super_admin', 'tenant_admin', 'tenant_manager']}
              >
                <Instances />
              </ModuleProtectedRoute>
            } />
            <Route path="whatsapp" element={
              <ModuleProtectedRoute 
                requiredModules={['whatsapp']}
                requiredRoles={['super_admin', 'tenant_admin', 'tenant_manager']}
              >
                <WhatsAppInstances />
              </ModuleProtectedRoute>
            } />
            <Route path="workflows" element={
              <ModuleProtectedRoute 
                requiredModules={['workflows']}
                requiredRoles={['super_admin', 'tenant_admin', 'tenant_manager']}
              >
                <Workflows />
              </ModuleProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute roles={['super_admin', 'tenant_admin']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>

          {/* Admin Dashboard - Separate from main layout */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;