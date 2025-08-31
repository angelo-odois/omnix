import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../notifications/Toast';
import useMessageNotifications from '../../hooks/useMessageNotifications';

export default function Layout() {
  // Initialize message notifications monitoring globally
  useMessageNotifications();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
}