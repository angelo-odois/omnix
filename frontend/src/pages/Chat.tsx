import { useState, useEffect, useRef } from 'react';
import { Send, Phone, MoreVertical, ArrowLeft, Paperclip, Smile, RefreshCw, Info, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContactProfile from '../components/chat/ContactProfile';
import { useAuthStore } from '../store/authStore';

interface Conversation {
  id: string;
  contactPhone: string;
  contactName?: string;
  lastMessageAt: string;
  unreadCount: number;
  isArchived: boolean;
  tags: string[];
}

interface Message {
  id: string;
  from: string;
  to: string;
  type: string;
  content: string;
  mediaUrl?: string;
  status: string;
  isInbound: boolean;
  timestamp: string;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags: string[];
  customFields: Record<string, any>;
  lastContact?: string;
  createdAt: string;
}

export default function Chat() {
  const { user } = useAuthStore();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInstances();
    loadConversations();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadConversations();
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      loadContactInfo(selectedConversation.contactPhone);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInstances = async () => {
    try {
      const response = await api.get('/whatsapp/instances');
      const instancesData = response.data.data || [];
      setInstances(instancesData);
      
      // Auto-select first connected instance
      const connectedInstance = instancesData.find((inst: WhatsAppInstance) => inst.status === 'connected');
      if (connectedInstance && !selectedInstance) {
        setSelectedInstance(connectedInstance);
      }
    } catch (error) {
      console.error('Error loading instances:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);
      setMessages(response.data.data || []);
      
      // Mark as read
      await api.post(`/messages/conversations/${conversationId}/read`);
      
      // Update conversation unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadContactInfo = async (phone: string) => {
    try {
      const response = await api.get(`/contacts/phone/${phone}`);
      setSelectedContact(response.data.data);
    } catch (error) {
      console.log('Contact not found for phone:', phone);
      setSelectedContact(null);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedInstance || sending) return;

    try {
      setSending(true);
      
      // Send via WhatsApp instance
      await api.post(`/whatsapp/instances/${selectedInstance.id}/send`, {
        to: selectedConversation.contactPhone,
        message: newMessage,
        type: 'text'
      });

      // Clear message
      setNewMessage('');
      
      // Refresh messages after a short delay
      setTimeout(() => {
        loadMessages(selectedConversation.id);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation || deletingConversation) return;

    try {
      setDeletingConversation(selectedConversation.id);
      
      await api.delete(`/messages/conversations/${selectedConversation.id}`);
      
      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      
      // Clear selected conversation
      setSelectedConversation(null);
      setSelectedContact(null);
      setShowDeleteModal(false);
      
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      alert('Erro ao excluir conversa: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingConversation(null);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: ptBR 
    });
  };

  const formatPhoneNumber = (phone: string) => {
    // Format Brazilian phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const formatted = cleaned.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
      return formatted;
    }
    return phone;
  };

  const connectedInstances = instances.filter(inst => inst.status === 'connected');
  const isAdmin = user?.role === 'tenant_admin' || user?.role === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando conversas...</span>
      </div>
    );
  }

  if (connectedInstances.length === 0) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center bg-gray-50 rounded-lg -m-6">
        <div className="text-center max-w-md">
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Instância WhatsApp Conectada
          </h2>
          <p className="text-gray-600 mb-6">
            Você precisa ter pelo menos uma instância WhatsApp conectada para usar o chat.
          </p>
          <a
            href="/whatsapp"
            className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="w-5 h-5 mr-2" />
            Configurar WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex bg-gray-50 rounded-lg overflow-hidden shadow-sm -m-6">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">💬 Conversas</h1>
            <button
              onClick={() => {
                loadConversations();
                loadInstances();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Instance Selector */}
          {connectedInstances.length > 1 && (
            <div className="mt-3">
              <select
                value={selectedInstance?.id || ''}
                onChange={(e) => {
                  const instance = connectedInstances.find(i => i.id === e.target.value);
                  setSelectedInstance(instance || null);
                  setSelectedConversation(null);
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {connectedInstances.map(instance => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name} {instance.phoneNumber && `(${formatPhoneNumber(instance.phoneNumber)})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>Nenhuma conversa ainda</p>
              <p className="text-sm">As conversas aparecerão aqui quando você receber mensagens</p>
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {(conversation.contactName || conversation.contactPhone).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.contactName || formatPhoneNumber(conversation.contactPhone)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatMessageTime(conversation.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        <div className="flex h-full">
          {/* Main Chat */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="mr-3 md:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                  {(selectedConversation.contactName || selectedConversation.contactPhone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.contactName || 'Contato'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formatPhoneNumber(selectedConversation.contactPhone)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Informações do contato"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
                
                {isAdmin && (
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                    title="Excluir conversa (apenas admin)"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4 pb-4">
              {loadingMessages ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Envie a primeira mensagem para iniciar a conversa</p>
                </div>
              ) : (
                messages.reverse().map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.isInbound ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                        message.isInbound
                          ? 'bg-white border border-gray-200 text-gray-900'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        message.isInbound ? 'text-gray-500' : 'text-green-100'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                        {!message.isInbound && (
                          <span className="ml-2">
                            {message.status === 'sent' && '✓'}
                            {message.status === 'delivered' && '✓✓'}
                            {message.status === 'read' && '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={sending}
                  />
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending || !selectedInstance}
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {selectedInstance && (
                <div className="mt-2 text-xs text-gray-500">
                  Enviando via: {selectedInstance.name} 
                  {selectedInstance.phoneNumber && ` (${formatPhoneNumber(selectedInstance.phoneNumber)})`}
                </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Selecione uma Conversa
                </h2>
                <p className="text-gray-600">
                  Escolha uma conversa na lista à esquerda para começar a enviar mensagens
                </p>
                {conversations.length === 0 && (
                  <p className="text-sm text-gray-500 mt-4">
                    💡 Dica: Mensagens recebidas via WhatsApp aparecerão aqui automaticamente
                  </p>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Contact Info Panel */}
          {selectedConversation && showContactInfo && (
            <div className="w-80 border-l border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-900">👤 Informações do Contato</h3>
              </div>
              <div className="p-4">
                <ContactProfile 
                  contact={selectedContact}
                  onEdit={(contact) => {
                    // TODO: Open contact edit modal
                    console.log('Edit contact:', contact);
                  }}
                  onStartChat={(phone) => {
                    // Already in chat, maybe show message templates
                    console.log('Start chat with:', phone);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Excluir Conversa</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir a conversa com{' '}
              <strong>{selectedConversation.contactName || selectedConversation.contactPhone}</strong>?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Esta ação é irreversível!</strong>
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>Todas as mensagens serão perdidas</li>
                <li>O histórico da conversa será deletado</li>
                <li>Esta ação não pode ser desfeita</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deleteConversation}
                disabled={!!deletingConversation}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deletingConversation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Definitivamente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}