import { useEffect } from 'react';
import { X, MessageSquare, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';

export default function Toast() {
  const { notifications, markAsRead, removeNotification } = useNotificationStore();

  // Get the most recent unread high-priority notification
  const activeNotification = notifications.find(n => 
    !n.read && (n.priority === 'high' || n.type === 'message')
  );

  useEffect(() => {
    if (activeNotification) {
      // Auto-remove toast after 5 seconds for non-message notifications
      if (activeNotification.type !== 'message') {
        const timer = setTimeout(() => {
          markAsRead(activeNotification.id);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeNotification, markAsRead]);

  if (!activeNotification) return null;

  const getIcon = () => {
    switch (activeNotification.type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (activeNotification.type) {
      case 'message': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleClick = () => {
    markAsRead(activeNotification.id);
    
    if (activeNotification.type === 'message' && activeNotification.conversationId) {
      // Navigate to chat
      window.location.href = `/conversations?conv=${activeNotification.conversationId}`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-1 duration-300">
      <div 
        className={`
          max-w-sm w-full border rounded-lg shadow-lg cursor-pointer
          transform transition-all duration-300 hover:scale-105
          ${getBackgroundColor()}
        `}
        onClick={handleClick}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon/Avatar */}
            <div className="flex-shrink-0">
              {activeNotification.avatar ? (
                <img 
                  src={activeNotification.avatar} 
                  alt={activeNotification.from}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : activeNotification.from ? (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {activeNotification.from.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="p-1">
                  {getIcon()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activeNotification.type === 'message' && '💬 '}{activeNotification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activeNotification.message}
                  </p>
                  {activeNotification.type === 'message' && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Clique para responder →
                    </p>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(activeNotification.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        {activeNotification.type !== 'message' && (
          <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-5000 ease-linear"
              style={{ 
                animation: 'toast-progress 5s linear forwards',
                width: '0%'
              }}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}