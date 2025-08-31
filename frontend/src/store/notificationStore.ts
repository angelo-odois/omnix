import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'message' | 'system' | 'warning' | 'success';
  title: string;
  message: string;
  from?: string;
  avatar?: string;
  conversationId?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
}

export type NotificationSound = 'default' | 'ding' | 'pop' | 'chime' | 'bell' | 'whatsapp' | 'custom';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  showNotifications: boolean;
  soundEnabled: boolean;
  selectedSound: NotificationSound;
  customSoundUrl?: string;
  customSoundName?: string;
  isPlayingSound: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleNotifications: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSound: (sound: NotificationSound, customUrl?: string, customName?: string) => void;
  playTestSound: () => void;
  stopSound: () => void;
  uploadCustomSound: (file: File) => Promise<boolean>;
  removeCustomSound: () => void;
  
  // Message specific
  addMessageNotification: (message: {
    from: string;
    content: string;
    conversationId: string;
    avatar?: string;
  }) => void;
}

// Notification sound URLs
const NOTIFICATION_SOUNDS: Record<NotificationSound, string> = {
  default: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp',
  ding: 'data:audio/wav;base64,UklGRg4HAABXQVZFZm10IBAAAAABAAEAESsAADNEAAACABAAZGF0YewGAAChkYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmzhBTiS1/LNeSsFJHfH8N2QQAoUXrTp',
  pop: 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEAVFYAAKhOAQACABAAZGF0YQAEAAA=',
  chime: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS1/LNeSsFJHfH8N2QQAoUXrTp',
  bell: 'data:audio/wav;base64,UklGRhwCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfgBAAA=',
  whatsapp: 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAQAAAOsAAqKioqKioqKioqKioqKioqKjY2NjY2NjY2NjY2NjY2NjY2NkJCQkJCQkJCQkJCQkJCQkJCQk5OTk5OTk5OTk5OTk5OTk5OTlpaWlpaWlpaWlpaWlpaWlpaWmZmZmZmZmZmZmZmZmZmZmZmZnJycnJycnJycnJycnJycnJycn5+fn5+fn5+fn5+fn5+fn5+fotLS0tLS0tLS0tLS0tLS0tLS5eXl5eXl5eXl5eXl5eXl5eXl6ysrKysrKysrKysrKysrKysrLi4uLi4uLi4uLi4uLi4uLi4uMXFxcXFxcXFxcXFxcXFxcXFxdHR0dHR0dHR0dHR0dHR0dHR0d3d3d3d3d3d3d3d3d3d3d3d3ejo6Ojo6Ojo6Ojo6Ojo6Ojo6Oj09PT09PT09PT09PT09PT09PT0/////////////////////wAAACtMYXZmNTQuMjAuMTAwAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  custom: ''
};

// Current audio instance for playback control
let currentAudio: HTMLAudioElement | null = null;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  showNotifications: false,
  soundEnabled: true,
  selectedSound: 'whatsapp',
  customSoundUrl: undefined,
  customSoundName: undefined,
  isPlayingSound: false,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications.slice(0, 49)], // Keep max 50
      unreadCount: state.unreadCount + 1
    }));

    // Play sound if enabled
    if (get().soundEnabled && typeof window !== 'undefined') {
      get().playTestSound();
    }

    // Auto-remove after 10 seconds for non-message notifications
    if (notification.type !== 'message') {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, 10000);
    }
  },

  addMessageNotification: (message) => {
    const truncatedContent = message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;

    get().addNotification({
      type: 'message',
      title: message.from,
      message: truncatedContent,
      from: message.from,
      avatar: message.avatar,
      conversationId: message.conversationId,
      priority: 'high'
    });
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  toggleNotifications: () => {
    set((state) => ({ showNotifications: !state.showNotifications }));
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    localStorage.setItem('notificationSoundEnabled', enabled ? 'true' : 'false');
  },

  setSound: (sound, customUrl, customName) => {
    set({ 
      selectedSound: sound,
      customSoundUrl: customUrl,
      customSoundName: customName
    });
    localStorage.setItem('notificationSoundType', sound);
    if (customUrl) {
      localStorage.setItem('customNotificationSound', customUrl);
    }
    if (customName) {
      localStorage.setItem('customNotificationSoundName', customName);
    }
  },

  playTestSound: () => {
    const state = get();
    if (!state.soundEnabled || typeof window === 'undefined') return;

    // Stop any currently playing sound
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      let audioUrl = '';
      
      if (state.selectedSound === 'custom' && state.customSoundUrl) {
        audioUrl = state.customSoundUrl;
      } else {
        audioUrl = NOTIFICATION_SOUNDS[state.selectedSound] || NOTIFICATION_SOUNDS.default;
      }
      
      currentAudio = new Audio(audioUrl);
      currentAudio.volume = 0.5;
      
      set({ isPlayingSound: true });
      
      currentAudio.onended = () => {
        set({ isPlayingSound: false });
        currentAudio = null;
      };
      
      currentAudio.onerror = () => {
        set({ isPlayingSound: false });
        currentAudio = null;
        console.log('Could not play notification sound');
      };
      
      currentAudio.play().catch(() => {
        set({ isPlayingSound: false });
        currentAudio = null;
        console.log('Could not play notification sound');
      });
    } catch (error) {
      set({ isPlayingSound: false });
      console.log('Error playing notification sound:', error);
    }
  },

  stopSound: () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    set({ isPlayingSound: false });
  },

  uploadCustomSound: async (file: File) => {
    return new Promise<boolean>((resolve) => {
      try {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
          console.log('Invalid file type. Please select an audio file.');
          resolve(false);
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.log('File too large. Please select a file smaller than 5MB.');
          resolve(false);
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
          const audioUrl = e.target?.result as string;
          const fileName = file.name;
          
          // Test if audio can be played
          const testAudio = new Audio(audioUrl);
          
          testAudio.oncanplaythrough = () => {
            get().setSound('custom', audioUrl, fileName);
            resolve(true);
          };
          
          testAudio.onerror = () => {
            console.log('Invalid audio file format');
            resolve(false);
          };
          
          // Set a timeout for loading
          setTimeout(() => {
            console.log('Audio loading timeout');
            resolve(false);
          }, 5000);
        };
        
        reader.onerror = () => {
          console.log('Error reading file');
          resolve(false);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.log('Error uploading custom sound:', error);
        resolve(false);
      }
    });
  },

  removeCustomSound: () => {
    set({ 
      selectedSound: 'whatsapp',
      customSoundUrl: undefined,
      customSoundName: undefined
    });
    localStorage.removeItem('customNotificationSound');
    localStorage.removeItem('customNotificationSoundName');
    localStorage.setItem('notificationSoundType', 'whatsapp');
  }
}));

// Initialize settings from localStorage
if (typeof window !== 'undefined') {
  const store = useNotificationStore.getState();
  
  // Sound enabled/disabled
  const savedSoundEnabled = localStorage.getItem('notificationSoundEnabled');
  if (savedSoundEnabled !== null) {
    store.setSoundEnabled(savedSoundEnabled === 'true');
  }
  
  // Sound type
  const savedSoundType = localStorage.getItem('notificationSoundType') as NotificationSound;
  if (savedSoundType && (NOTIFICATION_SOUNDS[savedSoundType] !== undefined || savedSoundType === 'custom')) {
    const customUrl = localStorage.getItem('customNotificationSound');
    const customName = localStorage.getItem('customNotificationSoundName');
    store.setSound(savedSoundType, customUrl || undefined, customName || undefined);
  }
}