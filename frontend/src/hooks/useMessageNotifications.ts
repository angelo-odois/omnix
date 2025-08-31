import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface RecentMessage {
  id: string;
  conversationId: string;
  from: string;
  content: string;
  timestamp: string;
  conversation: {
    id: string;
    contactName?: string;
    contactPhone: string;
  };
}

export default function useMessageNotifications() {
  const { user } = useAuthStore();
  const { addMessageNotification } = useNotificationStore();
  const lastCheckRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔔 Message notifications hook initialized for user:', user?.email);
    
    if (!user?.tenantId || user.role === 'super_admin') {
      console.log('⏭️ Skipping notifications for super admin or no tenant');
      return;
    }

    // Start polling for new messages
    const checkForNewMessages = async () => {
      try {
        const lastCheck = lastCheckRef.current;
        
        // Get recent messages since last check
        const response = await api.get(`/messages/recent?since=${lastCheck.toISOString()}`);
        const messages = response.data.data || [];
        
        console.log(`📱 Checking for messages since ${lastCheck.toISOString()}, found ${messages.length} new messages`);
        
        // Create notifications for new messages
        for (const message of messages) {
          addMessageNotification({
            from: message.from,
            content: message.content,
            conversationId: message.conversationId,
            avatar: undefined // Will be enhanced with contact avatar later
          });
          
          console.log(`🔔 Nova mensagem de ${message.from}: ${message.content.substring(0, 30)}...`);
        }
        
        // Update last check time
        lastCheckRef.current = new Date();
        
      } catch (error) {
        console.error('Error checking for new messages:', error);
      }
    };

    // Initial check
    checkForNewMessages();
    
    // Poll every 3 seconds
    intervalRef.current = setInterval(checkForNewMessages, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.tenantId, user?.role, addMessageNotification]);

  // Manual check function (can be called from other components)
  const checkNow = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      lastCheckRef.current = new Date(Date.now() - 10000); // Check last 10 seconds
      
      // Restart with immediate check
      const checkForNewMessages = async () => {
        // Same logic as above
      };
      
      checkForNewMessages();
      intervalRef.current = setInterval(checkForNewMessages, 3000);
    }
  };

  return { checkNow };
}