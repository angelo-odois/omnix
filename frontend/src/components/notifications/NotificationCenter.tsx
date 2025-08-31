import { useState, useEffect } from 'react';
import { Bell, BellOff, X, MessageSquare, AlertTriangle, CheckCircle, Info, Volume2, Settings } from 'lucide-react';
import { useNotificationStore, NotificationSound } from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    showNotifications,
    soundEnabled,
    selectedSound,
    toggleNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    setSoundEnabled,
    setSound,
    playTestSound
  } = useNotificationStore();

  const [showSettings, setShowSettings] = useState(false);

  const soundOptions: { value: NotificationSound; label: string; emoji: string }[] = [
    { value: 'whatsapp', label: 'WhatsApp (padrão)', emoji: '📱' },
    { value: 'ding', label: 'Ding', emoji: '🔔' },
    { value: 'chime', label: 'Chime', emoji: '🎵' },
    { value: 'bell', label: 'Bell', emoji: '🔔' },
    { value: 'pop', label: 'Pop', emoji: '💫' },
    { value: 'default', label: 'Sistema', emoji: '🖥️' }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-l-4 border-l-red-500 bg-red-50';
    }
    switch (type) {
      case 'message': return 'border-l-4 border-l-blue-500 bg-blue-50';
      case 'warning': return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-4 border-l-green-500 bg-green-50';
      default: return 'border-l-4 border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    if (notification.type === 'message' && notification.conversationId) {
      // Navigate to chat with conversation selected
      navigate(`/conversations?conv=${notification.conversationId}`);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={toggleNotifications}
        className={`relative p-2 rounded-lg transition-colors ${
          unreadCount > 0 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={toggleNotifications}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ⚙️
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
            </div>

            {/* Settings */}
            {showSettings && (
              <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-4 flex-shrink-0">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Som das notificações</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Selection */}
                {soundEnabled && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tipo de som</label>
                    <div className="space-y-2">
                      {soundOptions.map(option => (
                        <div key={option.value} className="flex items-center justify-between">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="notificationSound"
                              value={option.value}
                              checked={selectedSound === option.value}
                              onChange={() => setSound(option.value)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {option.emoji} {option.label}
                            </span>
                          </label>
                          <button
                            onClick={playTestSound}
                            className="text-blue-600 hover:text-blue-700 text-xs flex items-center"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            Testar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhuma notificação</p>
                  <p className="text-sm">Você será notificado sobre novas mensagens aqui</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? getNotificationColor(notification.type, notification.priority) : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon/Avatar */}
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <img 
                            src={notification.avatar} 
                            alt={notification.from}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : notification.from ? (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {notification.from.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="p-2">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${
                            notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                          }`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(notification.timestamp, { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => {
                    navigate('/conversations');
                    toggleNotifications();
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas as conversas →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}