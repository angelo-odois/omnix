import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from '../notifications/Toast';
import useMessageNotifications from '../../hooks/useMessageNotifications';
import { withLayoutId } from '../../utils/componentId';

export default function Layout() {
  // Initialize message notifications monitoring globally
  useMessageNotifications();

  return (
    <div {...withLayoutId('MainLayout')} className="flex h-screen bg-gray-50">
      <div {...withLayoutId('MainLayout', 'sidebar')}>
        <Sidebar />
      </div>
      <div {...withLayoutId('MainLayout', 'content')} className="flex-1 flex flex-col overflow-hidden">
        <div {...withLayoutId('MainLayout', 'header')}>
          <Header />
        </div>
        <main {...withLayoutId('MainLayout', 'main')} className="flex-1 overflow-auto p-6">
          <div {...withLayoutId('MainLayout', 'page-content')}>
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Global Toast Notifications */}
      <div {...withLayoutId('MainLayout', 'notifications')}>
        <Toast />
      </div>
    </div>
  );
}