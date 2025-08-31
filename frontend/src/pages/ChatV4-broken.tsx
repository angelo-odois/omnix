import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Search, 
  MoreVertical, 
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  Users,
  Settings,
  Bot,
  Zap,
  X,
  Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { withPageId, withComponentId, withFeatureId } from '../utils/componentId';

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
  const { addNotification } = useNotificationStore();
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availablePrompts, setAvailablePrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInstances();
    loadConversations();
    loadAvailablePrompts();
  }, []);

  const loadAvailablePrompts = async () => {
    try {
      const response = await api.get('/ai/prompts');
      setAvailablePrompts(response.data.data || []);
      
      // Auto-select default prompt
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

      // Auto-select first connected instance
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
      if (showAI) {
        analyzeConversation();
      }
      
      // Auto-refresh messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && showAI && messages.length > 0) {
      // Only analyze when AI is first opened or conversation changes
      // Don't re-analyze on every message change
      const timeoutId = setTimeout(() => {
        analyzeConversation();
      }, 1000); // Debounce to avoid multiple calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [showAI, selectedConversation?.id]); // Remove messages dependency

  // Auto-scroll to bottom when messages change
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
      setConversations(response.data.data || []);
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
      setMessages(newMessages);
      
      // Scroll to bottom after loading messages
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
    
    // Add optimistic message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      from: 'me',
      content: messageText,
      isInbound: false,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // Auto-scroll after adding message
    setTimeout(scrollToBottom, 100);

    try {
      // Send via API using correct instance
      if (!selectedInstance?.id) {
        throw new Error('Nenhuma instância WhatsApp conectada');
      }

      await api.post(`/whatsapp/instances/${selectedInstance.id}/send`, {
        to: selectedConversation.contactPhone,
        message: messageText,
        type: 'text'
      });
      
      addNotification({
        type: 'success',
        title: 'Mensagem Enviada',
        message: `Mensagem enviada para ${selectedConversation.contactName || selectedConversation.contactPhone}`,
        priority: 'normal'
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      addNotification({
        type: 'warning',
        title: 'Erro ao Enviar',
        message: error.response?.data?.message || error.message || 'Falha no envio da mensagem',
        priority: 'high'
      });
      
      // Restore message text
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
        businessContext: 'Atendimento ao cliente - empresa de tecnologia',
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
      
      // Remove from list and clear selection
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      setSelectedConversation(null);
      setShowDeleteModal(false);
      
      addNotification({
        type: 'success',
        title: 'Conversa Excluída',
        message: 'Conversa foi excluída permanentemente',
        priority: 'normal'
      });
    } catch (error: any) {
      addNotification({
        type: 'warning',
        title: 'Erro ao Excluir',
        message: error.response?.data?.message || 'Erro ao excluir conversa',
        priority: 'high'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedInstance?.id || !selectedConversation) return;

    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      addNotification({
        type: 'warning',
        title: 'Arquivo Muito Grande',
        message: 'O arquivo deve ter no máximo 16MB',
        priority: 'normal'
      });
      return;
    }

    setUploading(true);
    setShowAttachMenu(false);
    
    // Add optimistic message for file
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      from: 'me',
      content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      isInbound: false,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      // Send file via WhatsApp API
      await api.post(`/whatsapp/instances/${selectedInstance.id}/send`, {
        to: selectedConversation.contactPhone,
        message: `Arquivo: ${file.name}`,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        mediaUrl: URL.createObjectURL(file) // This would need proper file upload handling
      });

      addNotification({
        type: 'success',
        title: 'Arquivo Enviado',
        message: `${file.name} foi enviado com sucesso`,
        priority: 'normal'
      });

    } catch (error: any) {
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      addNotification({
        type: 'warning',
        title: 'Erro no Upload',
        message: error.response?.data?.message || 'Erro ao enviar arquivo',
        priority: 'high'
      });
    } finally {
      setUploading(false);
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

  // Show setup screen if no connected instances
  if (!loading && connectedInstances.length === 0) {
    return (
      <div {...withPageId('ChatV4')} className="h-[calc(100vh-10vh)] bg-white rounded-lg shadow-sm border border-gray-200 -m-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Phone className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Instância WhatsApp Conectada
          </h2>
          <p className="text-gray-600 mb-6">
            Para enviar e receber mensagens, você precisa ter pelo menos uma instância WhatsApp conectada.
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
    <div {...withPageId('ChatV4')} className="h-[calc(100vh-10vh)] bg-white rounded-lg shadow-sm border border-gray-200 -m-6 flex">
      {/* Sidebar - Conversations */}
      <div 
        {...withComponentId('ConversationSidebar')}
        className={`${
          sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 
          selectedConversation ? 'hidden lg:flex lg:w-80' : 'flex w-full lg:w-80'
        } transition-all duration-300 border-r border-gray-200 flex-col`}
      >
        
        {/* Header */}
        <div {...withComponentId('ConversationSidebar', 'header')} className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
              Conversas
            </h1>
            {selectedInstance && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">
                  {selectedInstance.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div {...withComponentId('ConversationSidebar', 'list')} className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div {...withComponentId('ConversationSidebar', 'loading')} className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div {...withComponentId('ConversationSidebar', 'empty')} className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma conversa</p>
            </div>
          ) : (
            <div className="min-h-full">
              {conversations.map((conv) => (
                <div
                  {...withComponentId('ConversationItem', conv.id)}
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {(conv.contactName || conv.contactPhone).charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conv.contactName || conv.contactPhone}
                      </h3>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
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
        <div {...withComponentId('ChatArea')} className="flex-1 flex">
          {/* Main Chat */}
          <div {...withComponentId('ChatArea', 'main')} className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div {...withComponentId('ChatHeader')} className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
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
                  title={sidebarCollapsed ? 'Mostrar conversas' : 'Voltar às conversas'}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {(selectedConversation.contactName || selectedConversation.contactPhone).charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <h2 className="font-bold text-gray-900">
                    {selectedConversation.contactName || selectedConversation.contactPhone}
                  </h2>
                  <p className="text-sm text-green-600">online</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      // Se sidebar colapsada, expande
                      setSidebarCollapsed(false);
                      setShowContactInfo(false);
                    } else if (showContactInfo) {
                      // Se info do contato aberta, fecha
                      setShowContactInfo(false);
                    } else {
                      // Se tudo normal, abre info do contato
                      setShowContactInfo(true);
                    }
                  }}
                  className={`relative p-2 rounded-lg transition-colors ${
                    showContactInfo ? 'bg-teal-100 text-teal-600' : 
                    sidebarCollapsed ? 'bg-blue-100 text-blue-600' : 
                    'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={
                    sidebarCollapsed ? `Expandir conversas (${conversations.length})` : 
                    showContactInfo ? 'Fechar detalhes do contato' : 
                    'Ver detalhes do contato'
                  }
                >
                  <Users className="w-5 h-5" />
                  {sidebarCollapsed && conversations.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversations.length > 99 ? '99+' : conversations.length}
                    </div>
                  )}
                  {showContactInfo && !sidebarCollapsed && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    const newAIState = !showAI;
                    setShowAI(newAIState);
                    
                    // Auto-collapse sidebar when AI is enabled for better view
                    if (newAIState && window.innerWidth < 1400) {
                      setSidebarCollapsed(true);
                    }
                  }}
                  className={`relative p-2 rounded-lg transition-colors ${
                    showAI ? 'bg-purple-100 text-purple-600 shadow-sm' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={showAI ? 'Fechar IA' : 'Abrir Assistente IA'}
                >
                  <Bot className="w-5 h-5" />
                  {showAI && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  )}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Ligar">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Mais opções">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div {...withComponentId('MessageArea')} className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div {...withComponentId('MessageArea', 'empty')} className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Nenhuma mensagem</p>
                    <p>Envie uma mensagem para começar</p>
                  </div>
                </div>
              ) : (
                <div {...withComponentId('MessageArea', 'messages')} className="space-y-4">
                  {messages.map((message) => {
                    const isMe = !message.isInbound;
                    return (
                      <div
                        {...withComponentId('MessageBubble', isMe ? 'sent' : 'received')}
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        data-message-id={message.id}
                        data-message-type={isMe ? 'sent' : 'received'}
                      >
                        <div
                          className={`max-w-sm px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isMe ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} className="h-1 w-full" />
                </div>
              )}
            </div>

            {/* Input */}
            <div {...withComponentId('MessageInput')} className="p-4 border-t border-gray-200 bg-white">
              <form {...withComponentId('MessageInput', 'form')} onSubmit={sendMessage} className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`p-2 text-gray-600 hover:bg-gray-100 rounded-lg ${uploading ? 'opacity-50' : ''}`}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  
                  {/* Attachment Menu */}
                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-48 z-10">
                      <button
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'image/*';
                            fileInputRef.current.click();
                          }
                          setShowAttachMenu(false);
                        }}
                        className="flex items-center w-full p-2 hover:bg-gray-100 rounded text-sm"
                      >
                        📷 Câmera/Fotos
                      </button>
                      <button
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'audio/*';
                            fileInputRef.current.click();
                          }
                          setShowAttachMenu(false);
                        }}
                        className="flex items-center w-full p-2 hover:bg-gray-100 rounded text-sm"
                      >
                        🎵 Áudio
                      </button>
                      <button
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
                            fileInputRef.current.click();
                          }
                          setShowAttachMenu(false);
                        }}
                        className="flex items-center w-full p-2 hover:bg-gray-100 rounded text-sm"
                      >
                        📄 Documento
                      </button>
                    </div>
                  )}
                </div>

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
                  type="button"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className={`p-2 rounded-lg ${
                    newMessage.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </div>

          {/* Contact Info Panel */}
          {showContactInfo && selectedConversation && (
            <div {...withFeatureId('Contact Info')} className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
              <div {...withComponentId('ContactPanel', 'header')} className="p-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-teal-500" />
                  Detalhes do Contato
                </h3>
                <button
                  {...withComponentId('ContactPanel', 'close-button')}
                  onClick={() => setShowContactInfo(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-teal p-4 space-y-4">
                {/* Contact Header */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {(selectedConversation.contactName || selectedConversation.contactPhone).charAt(0).toUpperCase()}
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                      {selectedConversation.contactName || 'Cliente'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{selectedConversation.contactPhone}</p>
                    
                    <div className="flex items-center justify-center space-x-1 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Online agora</span>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <button 
                        className="p-3 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                        title="Fazer chamada"
                      >
                        <Phone className="w-5 h-5 text-green-600" />
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                        title="Enviar arquivo"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Paperclip className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                      <button 
                        className="p-3 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
                        title="Gerenciar tags"
                      >
                        🏷️
                      </button>
                      <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="p-3 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                        title="Excluir conversa"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-gray-900">{messages.length}</div>
                      <div className="text-xs text-gray-500">Mensagens</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-gray-900">{selectedConversation.unreadCount}</div>
                      <div className="text-xs text-gray-500">Não lidas</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-bold text-gray-900">4.8</div>
                      <div className="text-xs text-gray-500">Satisfação</div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-3">Informações</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="text-gray-900">{selectedConversation.contactName || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="text-gray-900">{selectedConversation.contactPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última conversa:</span>
                      <span className="text-gray-900">
                        {new Date(selectedConversation.lastMessageAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-3">Tags</h5>
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">cliente</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">ativo</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">whatsapp</span>
                  </div>
                  <button className="mt-2 text-xs text-blue-600 hover:text-blue-800">+ Adicionar tag</button>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-3">Notas Internas</h5>
                  <textarea
                    placeholder="Adicione uma nota sobre este contato..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button className="mt-2 px-3 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700">
                    Salvar Nota
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Panel (if enabled) */}
          {showAI && (
            <div {...withFeatureId('AI Assistant')} className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
              <div {...withComponentId('AIPanel', 'header')} className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-500" />
                    Assistente IA
                  </h3>
                  <button
                    {...withComponentId('AIPanel', 'close-button')}
                    onClick={() => setShowAI(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                {/* Prompt Selector */}
                {availablePrompts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prompt Ativo:
                    </label>
                    <select
                      value={selectedPromptId}
                      onChange={(e) => {
                        setSelectedPromptId(e.target.value);
                        // Clear current analysis and force refresh with new prompt
                        setAiAnalysis(null);
                        
                        // Invalidate cache to force new analysis
                        if (selectedConversation) {
                          api.delete(`/ai/cache/${selectedConversation.id}`).catch(() => {});
                          
                          // Analyze with new prompt after short delay
                          setTimeout(() => {
                            analyzeConversation();
                          }, 500);
                        }
                      }}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Prompt Padrão</option>
                      {availablePrompts.filter(p => p.isActive).map(prompt => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.name} ({prompt.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-purple p-4">
                {loadingAI ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Analisando com IA...</p>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    {/* Real Sentiment Analysis */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Bot className="w-4 h-4 mr-2 text-purple-500" />
                        Análise OpenAI
                      </h4>
                      
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${getSentimentColor(aiAnalysis.sentiment.sentiment)}`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getSentimentEmoji(aiAnalysis.sentiment.emotion)}</span>
                          <div>
                            <span className="font-medium capitalize">{aiAnalysis.sentiment.sentiment}</span>
                            <p className="text-xs opacity-75">
                              {aiAnalysis.sentiment.emotion} • {(aiAnalysis.sentiment.confidence * 100).toFixed(0)}% confiança
                            </p>
                            {selectedPromptId && (
                              <p className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded mt-1">
                                Prompt: {availablePrompts.find(p => p.id === selectedPromptId)?.name || 'Personalizado'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${
                            aiAnalysis.sentiment.score > 0 ? 'text-green-600' : 
                            aiAnalysis.sentiment.score < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {aiAnalysis.sentiment.score > 0 ? '+' : ''}{(aiAnalysis.sentiment.score * 100).toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">score</div>
                        </div>
                      </div>

                      {aiAnalysis.sentiment.keywords.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-2">Palavras-chave:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiAnalysis.sentiment.keywords.map((keyword: string, index: number) => (
                              <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Real AI Suggestions */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-orange-500" />
                          Sugestões da IA
                        </h4>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Cache ativo"></div>
                          <span className="text-xs text-gray-500">OpenAI</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {aiAnalysis.suggestions.map((suggestion: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => applySuggestion(suggestion.content)}
                            className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200 transition-all group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 group-hover:text-gray-900">
                                  {suggestion.content}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                                    {suggestion.tone}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(suggestion.confidence * 100).toFixed(0)}% confiança
                                  </span>
                                </div>
                              </div>
                              <div className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <Send className="w-4 h-4" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>💡 Contexto:</strong> {aiAnalysis.suggestions[0]?.context || 'Sugestões baseadas na análise da conversa'}
                        </p>
                      </div>
                    </div>

                    {/* Manual Refresh */}
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={analyzeConversation}
                        disabled={loadingAI}
                        className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                      >
                        {loadingAI ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          '🔄'
                        )}
                        {loadingAI ? 'Analisando...' : 'Atualizar'}
                      </button>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">
                          Cache: {aiAnalysis ? 'Ativo' : 'Vazio'} • {messages.length} msgs
                        </span>
                        <button
                          onClick={loadAvailablePrompts}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Recarregar Prompts
                        </button>
                        <a
                          href="/ai-prompts"
                          className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                          Configurar
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                    <h4 className="font-medium text-gray-900 mb-2">IA OpenAI Integrada</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Clique para analisar esta conversa com inteligência artificial
                    </p>
                    <button
                      onClick={analyzeConversation}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      🚀 Analisar Conversa
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Welcome Screen */
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Chat Inteligente</h2>
            <p className="text-gray-600 mb-6">Interface limpa com IA integrada e cache otimizado</p>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Funcionalidades Disponíveis:</h3>
              <div className="grid grid-cols-1 gap-3 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span>Assistente IA com OpenAI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-teal-500" />
                  <span>Detalhes e ações do contato</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Sidebar colapsável</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Cache inteligente (90% economia)</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">👈 Selecione uma conversa para começar o atendimento</p>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Excluir Conversa</h3>
                <p className="text-sm text-gray-600">Esta ação é permanente</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Você está prestes a excluir permanentemente a conversa com:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium text-gray-900">
                  {selectedConversation.contactName || selectedConversation.contactPhone}
                </p>
                <p className="text-sm text-gray-600">
                  {messages.length} mensagens • Última: {new Date(selectedConversation.lastMessageAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="mt-4 text-sm text-red-600">
                <p className="font-medium">⚠️ Esta ação não pode ser desfeita!</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={deleteConversation}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}