import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send,
  Paperclip,
  ArrowLeft,
  Users,
  Bot,
  X,
  Trash2,
  UserPlus
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import SaveContactModal, { type ContactFormData } from '../components/contacts/SaveContactModal';

interface WhatsAppInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface Conversation {
  id: string;
  contactPhone: string;
  contactName?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  from: string;
  content: string;
  isInbound: boolean;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatV4() {
  const { user } = useAuthStore();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveContactModal, setShowSaveContactModal] = useState(false);
  const [availablePrompts, setAvailablePrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInstances();
    loadConversations();
    loadAvailablePrompts();
  }, []);

  // Calculate total unread messages
  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  
  // Debug: Log unread counts
  console.log('📊 Conversations unread counts:', conversations.map(conv => ({
    phone: conv.contactPhone,
    unread: conv.unreadCount
  })));
  console.log('📊 Total unread messages:', totalUnreadMessages);

  const loadAvailablePrompts = async () => {
    try {
      const response = await api.get('/ai/prompts');
      setAvailablePrompts(response.data.data || []);
      
      const defaultPrompt = response.data.data?.find((p: any) => p.isDefault);
      if (defaultPrompt) {
        setSelectedPromptId(defaultPrompt.id);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const loadInstances = async () => {
    try {
      const response = await api.get('/whatsapp/instances');
      const instancesData = response.data.data || [];
      setInstances(instancesData);

      const connectedInstance = instancesData.find((inst: WhatsAppInstance) => inst.status === 'connected');
      if (connectedInstance) {
        setSelectedInstance(connectedInstance);
      }
    } catch (error) {
      console.error('Error loading instances:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && showAI && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        analyzeConversation();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [showAI, selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      const conversations = response.data.data || [];
      
      // Debug: Log conversations to see contact names
      console.log('📋 Loaded conversations:', conversations.map(conv => ({
        id: conv.id,
        contactName: conv.contactName,
        contactPhone: conv.contactPhone
      })));
      
      setConversations(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages?limit=50`);
      const newMessages = response.data.data || [];
      
      if (messages.length > 0 && newMessages.length > messages.length) {
        const newerMessages = newMessages.slice(messages.length);
        const inboundMessages = newerMessages.filter(msg => msg.isInbound);
        
        inboundMessages.forEach(msg => {
          console.log('📥 New message from client:', msg.content.substring(0, 50) + '...');
        });
      }
      
      setMessages(newMessages);
      setTimeout(scrollToBottom, 200);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedConversation) return;

    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      from: 'me',
      content: messageText,
      isInbound: false,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      if (!selectedInstance?.id) {
        throw new Error('Nenhuma instância WhatsApp conectada');
      }

      await api.post(`/whatsapp/instances/${selectedInstance.id}/send`, {
        to: selectedConversation.contactPhone,
        message: messageText,
        type: 'text'
      });
      
      console.log('📤 Message sent to:', selectedConversation.contactName || selectedConversation.contactPhone);
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const analyzeConversation = async () => {
    if (!selectedConversation || messages.length === 0 || loadingAI) return;
    
    console.log('🤖 Analyzing conversation with AI...');
    setLoadingAI(true);
    
    try {
      const response = await api.post('/ai/suggest-responses', {
        conversationId: selectedConversation.id,
        contactName: selectedConversation.contactName,
        businessContext: 'Atendimento ao cliente',
        customPromptId: selectedPromptId || undefined
      });
      
      if (response.data.success) {
        setAiAnalysis(response.data.data);
        console.log('✅ AI analysis completed');
      }
    } catch (error) {
      console.error('❌ Error analyzing conversation:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation) return;
    
    try {
      await api.delete(`/messages/conversations/${selectedConversation.id}`);
      
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      setSelectedConversation(null);
      setShowDeleteModal(false);
      
      console.log('✅ Conversation deleted successfully');
    } catch (error: any) {
      console.error('❌ Failed to delete conversation:', error);
    }
  };

  const saveContact = async (contactData: ContactFormData) => {
    try {
      console.log('💾 Starting to save contact:', contactData);
      console.log('🔗 Selected conversation:', selectedConversation);
      
      const response = await api.post('/contacts', contactData);
      console.log('📡 API Response:', response.data);
      
      // Update the conversation with the new contact name
      if (selectedConversation) {
        console.log('🔄 Updating conversation locally:', selectedConversation.id, 'to name:', contactData.name);
        setSelectedConversation(prev => prev ? {
          ...prev,
          contactName: contactData.name
        } : null);
        
        // Update in the conversations list too
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, contactName: contactData.name }
            : conv
        ));
      }

      // Reload conversations from backend to ensure sync
      setTimeout(() => {
        console.log('🔄 Reloading conversations from backend...');
        loadConversations();
      }, 500);
      
      console.log('✅ Contact saved successfully:', contactData.name);
    } catch (error: any) {
      console.error('❌ Failed to save contact:', error);
      console.error('❌ Error details:', error.response?.data);
      alert(`Erro ao salvar contato: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  };

  const applySuggestion = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const areaCode = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      return `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    if (cleaned.length === 11) {
      const areaCode = cleaned.substring(0, 2);
      const number = cleaned.substring(2);
      return `(${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    return phone;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-700 border-green-200';
      case 'negative': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSentimentEmoji = (emotion: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'frustrated': return '😤';
      default: return '😐';
    }
  };

  const connectedInstances = instances.filter(inst => inst.status === 'connected');

  if (!loading && connectedInstances.length === 0) {
    return (
      <div className="h-[calc(100vh-10vh)] bg-white rounded-lg shadow-sm border border-gray-200 -m-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Phone className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Instância WhatsApp Conectada
          </h2>
          <p className="text-gray-600 mb-6">
            Para enviar e receber mensagens, você precisa conectar uma instância WhatsApp.
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
    <div className="h-[calc(100vh-10vh)] bg-gradient-to-br from-whatsapp-50 to-white rounded-2xl shadow-xl border border-neutral-200 -m-6 flex overflow-hidden">
      {/* Sidebar - Conversations */}
      <div 
        className={`${
          sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 
          selectedConversation ? 'hidden lg:flex lg:w-80' : 'flex w-full lg:w-80'
        } transition-all duration-300 border-r border-gray-200 flex-col`}
      >
        <div className="p-4 border-b border-whatsapp-200 bg-gradient-to-r from-whatsapp-50 to-whatsapp-100">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-dark-800 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary-500" />
              Conversas
            </h1>
            {selectedInstance && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-primary-600 font-medium">
                  {selectedInstance.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma conversa</p>
            </div>
          ) : (
            <div className="min-h-full">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-light-200 cursor-pointer hover:bg-light-100 transition-all duration-200 ${
                    selectedConversation?.id === conv.id ? 'bg-gradient-to-r from-primary-50 to-light-200 border-primary-300 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {(conv.contactName || conv.contactPhone).charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conv.contactName || conv.contactPhone}
                          </h3>
                          {conv.contactName && (
                            <p className="text-xs text-gray-400 truncate">
                              {formatPhoneDisplay(conv.contactPhone)}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conv.lastMessage || 'Nenhuma mensagem'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-white to-neutral-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                    } else {
                      setSelectedConversation(null);
                    }
                  }}
                  className={`${sidebarCollapsed || window.innerWidth < 1024 ? 'flex' : 'hidden lg:hidden'} p-2 hover:bg-gray-100 rounded-lg`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-primary-200">
                  {(selectedConversation.contactName || selectedConversation.contactPhone).charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <h2 className="font-bold text-gray-900">
                    {selectedConversation.contactName || selectedConversation.contactPhone}
                  </h2>
                  {selectedConversation.contactName ? (
                    <p className="text-sm text-gray-500">{formatPhoneDisplay(selectedConversation.contactPhone)}</p>
                  ) : (
                    <p className="text-sm text-primary-600 font-medium">online</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                      setShowContactInfo(false);
                    } else if (showContactInfo) {
                      setShowContactInfo(false);
                    } else {
                      setShowContactInfo(true);
                    }
                  }}
                  className={`relative p-2 rounded-xl transition-all duration-200 ${
                    showContactInfo ? 'bg-gradient-to-r from-light-100 to-light-200 text-dark-700 shadow-lg' : 
                    sidebarCollapsed ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 shadow-lg' : 
                    'hover:bg-light-100 text-dark-600'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  {sidebarCollapsed && totalUnreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    const newAIState = !showAI;
                    setShowAI(newAIState);
                    
                    if (newAIState && window.innerWidth < 1400) {
                      setSidebarCollapsed(true);
                    }
                  }}
                  className={`relative p-2 rounded-xl transition-all duration-200 ${
                    showAI ? 'bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700 shadow-lg' : 'hover:bg-light-100 text-dark-600'
                  }`}
                >
                  <Bot className="w-5 h-5" />
                  {showAI && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full animate-pulse shadow-sm"></div>
                  )}
                </button>

              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-light-50 to-light-100">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Nenhuma mensagem</p>
                    <p>Envie uma mensagem para começar</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMe = !message.isInbound;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-sm px-4 py-3 rounded-2xl shadow-lg ${
                            isMe 
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-primary-300' 
                              : 'bg-white border border-light-300 shadow-light-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isMe ? 'text-primary-100' : 'text-neutral-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-1 w-full" />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    newMessage.trim() 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:scale-105' 
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info Panel */}
          {showContactInfo && selectedConversation && (
            <div className="w-80 border-l border-light-200 bg-gradient-to-b from-light-50 to-light-100 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-teal-500" />
                  Contato
                </h3>
                <button
                  onClick={() => setShowContactInfo(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">
                    {(selectedConversation.contactName || selectedConversation.contactPhone).charAt(0).toUpperCase()}
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                    {selectedConversation.contactName || selectedConversation.contactPhone}
                  </h4>
                  {selectedConversation.contactName && (
                    <p className="text-sm text-gray-600 mb-4">{formatPhoneDisplay(selectedConversation.contactPhone)}</p>
                  )}
                  
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <button 
                      className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                      title="Ligar"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </button>
                    
                    {/* Save Contact Button - Always show for testing */}
                    <button 
                      onClick={() => {
                        console.log('🔗 Opening save contact modal for:', selectedConversation.contactPhone);
                        setShowSaveContactModal(true);
                      }}
                      className="p-2 bg-primary-100 hover:bg-primary-200 rounded-full transition-colors"
                      title="Salvar Contato"
                    >
                      <UserPlus className="w-4 h-4 text-primary-600" />
                    </button>
                    
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                      title="Excluir conversa"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-gray-900">{messages.length}</div>
                      <div className="text-xs text-gray-500">Mensagens</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-gray-900">{selectedConversation.unreadCount}</div>
                      <div className="text-xs text-gray-500">Não lidas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Panel */}
          {showAI && (
            <div className="w-80 border-l border-light-200 bg-gradient-to-b from-light-50 to-light-100 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-dark-800 flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-secondary-500" />
                    IA OpenAI
                  </h3>
                  <button onClick={() => setShowAI(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                {availablePrompts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Prompt:</label>
                    <select
                      value={selectedPromptId}
                      onChange={(e) => {
                        setSelectedPromptId(e.target.value);
                        setAiAnalysis(null);
                        if (selectedConversation) {
                          setTimeout(analyzeConversation, 500);
                        }
                      }}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="">Padrão</option>
                      {availablePrompts.filter(p => p.isActive).map(prompt => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {loadingAI ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Analisando...</p>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Análise</h4>
                      
                      <div className={`p-3 rounded-lg border ${getSentimentColor(aiAnalysis.sentiment.sentiment)}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xl">{getSentimentEmoji(aiAnalysis.sentiment.emotion)}</span>
                          <span className="font-medium capitalize">{aiAnalysis.sentiment.sentiment}</span>
                          <span className="text-xs">({(aiAnalysis.sentiment.confidence * 100).toFixed(0)}%)</span>
                        </div>
                        
                        {aiAnalysis.sentiment.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {aiAnalysis.sentiment.keywords.map((keyword: string, index: number) => (
                              <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Sugestões</h4>
                      
                      <div className="space-y-2">
                        {aiAnalysis.suggestions.map((suggestion: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => applySuggestion(suggestion.content)}
                            className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                          >
                            <p className="text-sm text-gray-800">{suggestion.content}</p>
                            <span className="text-xs text-purple-600 mt-1 block">
                              {suggestion.tone} • {(suggestion.confidence * 100).toFixed(0)}%
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={analyzeConversation}
                          disabled={loadingAI}
                          className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          🔄 Atualizar
                        </button>
                        
                        <a href="/ai-prompts" className="text-xs text-purple-600 underline">
                          Configurar
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                    <h4 className="font-medium text-gray-900 mb-2">IA OpenAI</h4>
                    <button
                      onClick={analyzeConversation}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                    >
                      🚀 Analisar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat Limpo</h2>
            <p className="text-gray-600">Sistema otimizado e funcional</p>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Excluir Conversa</h3>
            <p className="text-gray-600 mb-6">
              Excluir conversa com {selectedConversation.contactName || selectedConversation.contactPhone}?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={deleteConversation}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Contact Modal */}
      {selectedConversation && (
        <SaveContactModal
          isOpen={showSaveContactModal}
          onClose={() => setShowSaveContactModal(false)}
          onSave={saveContact}
          phone={selectedConversation.contactPhone}
          currentName={selectedConversation.contactName}
        />
      )}
    </div>
  );
}