import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  conversationId: string;
  from: string;
  content: string;
  isInbound: boolean;
  timestamp: string;
}

interface Conversation {
  id: string;
  contactPhone: string;
  contactName?: string;
  unreadCount: number;
  lastMessageAt: string;
}

export default function useMessageNotifications() {
  const { user } = useAuthStore();
  const { addMessageNotification } = useNotificationStore();
  const lastCheckRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.tenantId || user.role === 'super_admin') {
      return;
    }

    // Start polling for new messages
    const checkForNewMessages = async () => {
      try {
        const lastCheck = lastCheckRef.current;
        
        // Get conversations with unread messages
        const conversationsResponse = await api.get('/messages/conversations');
        const conversations: Conversation[] = conversationsResponse.data.data || [];
        
        // Find conversations with unread messages
        const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
        
        for (const conversation of unreadConversations) {
          try {
            // Get recent messages from this conversation
            const messagesResponse = await api.get(`/messages/conversations/${conversation.id}/messages?limit=5`);
            const messages: Message[] = messagesResponse.data.data || [];
            
            // Find new inbound messages since last check
            const newMessages = messages.filter(msg => 
              msg.isInbound && 
              new Date(msg.timestamp) > lastCheck
            );
            
            // Create notifications for new messages
            for (const message of newMessages) {
              addMessageNotification({
                from: conversation.contactName || conversation.contactPhone,
                content: message.content,
                conversationId: conversation.id,
                avatar: undefined // Will be enhanced with contact avatar later
              });
              
              console.log(`🔔 Nova mensagem de ${conversation.contactName}: ${message.content.substring(0, 30)}...`);
            }
          } catch (error) {
            console.error('Error checking messages for conversation:', conversation.id, error);
          }
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