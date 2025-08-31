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

export default function ChatV4Clean() {
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
  const [availablePrompts, setAvailablePrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInstances();
    loadConversations();
    loadAvailablePrompts();
  }, []);

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
      
      // Check for new inbound messages to notify
      if (messages.length > 0 && newMessages.length > messages.length) {
        const newerMessages = newMessages.slice(messages.length);
        const inboundMessages = newerMessages.filter(msg => msg.isInbound);
        
        // Create notifications for new inbound messages
        inboundMessages.forEach(msg => {
          console.log('🔔 New inbound message detected:', msg.content);
          addNotification({
            type: 'message',
            title: selectedConversation?.contactName || selectedConversation?.contactPhone || 'Cliente',
            message: msg.content,
            from: selectedConversation?.contactName || selectedConversation?.contactPhone || 'Cliente',
            conversationId: conversationId,
            priority: 'high'
          });
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
      
      // Não mostrar notificação para mensagens enviadas por mim
      // addNotification({
      //   type: 'success',
      //   title: 'Mensagem Enviada',
      //   message: `Mensagem enviada para ${selectedConversation.contactName || selectedConversation.contactPhone}`,
      //   priority: 'normal'
      // });
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      addNotification({
        type: 'warning',
        title: 'Erro ao Enviar',
        message: error.response?.data?.message || error.message || 'Falha no envio da mensagem',
        priority: 'high'
      });
      
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

        <div {...withComponentId('ConversationSidebar', 'list')} className="flex-1 overflow-y-auto scrollbar-thin">
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
                  {...withComponentId('ConversationItem', conv.id)}
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {(conv.contactName || conv.contactPhone).charAt(0).toUpperCase()}
                    </div>
                    
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
                      setSidebarCollapsed(false);
                      setShowContactInfo(false);
                    } else if (showContactInfo) {
                      setShowContactInfo(false);
                    } else {
                      setShowContactInfo(true);
                    }
                  }}
                  className={`relative p-2 rounded-lg transition-colors ${
                    showContactInfo ? 'bg-teal-100 text-teal-600' : 
                    sidebarCollapsed ? 'bg-blue-100 text-blue-600' : 
                    'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  {sidebarCollapsed && conversations.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversations.length > 99 ? '99+' : conversations.length}
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
                  className={`relative p-2 rounded-lg transition-colors ${
                    showAI ? 'bg-purple-100 text-purple-600 shadow-sm' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Bot className="w-5 h-5" />
                  {showAI && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  )}
                </button>
                
                {/* Test Button for Notifications */}
                <button
                  onClick={() => {
                    // Simulate incoming message for testing notifications
                    const testMessage: Message = {
                      id: `test-${Date.now()}`,
                      from: selectedConversation.contactPhone,
                      content: 'Mensagem de teste do cliente para verificar notificações!',
                      isInbound: true,
                      timestamp: new Date().toISOString(),
                      status: 'sent'
                    };
                    
                    setMessages(prev => [...prev, testMessage]);
                    setTimeout(scrollToBottom, 100);
                    
                    // Trigger notification
                    addNotification({
                      type: 'message',
                      title: selectedConversation.contactName || selectedConversation.contactPhone,
                      message: testMessage.content,
                      from: selectedConversation.contactName || selectedConversation.contactPhone,
                      conversationId: selectedConversation.id,
                      priority: 'high'
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                  title="Simular mensagem recebida"
                >
                  📩
                </button>
              </div>
            </div>

            {/* Messages */}
            <div {...withComponentId('MessageArea')} className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
                          className={`max-w-sm px-4 py-2 rounded-2xl ${
                            isMe ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
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
                  <div ref={messagesEndRef} className="h-1 w-full" />
                </div>
              )}
            </div>

            {/* Input */}
            <div {...withComponentId('MessageInput')} className="p-4 border-t border-gray-200 bg-white">
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
                  className={`p-2 rounded-lg ${
                    newMessage.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* AI Panel */}
          {showAI && (
            <div {...withFeatureId('AI Assistant')} className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-500" />
                    Assistente IA
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
                          api.delete(`/ai/cache/${selectedConversation.id}`).catch(() => {});
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
                    <p className="text-sm text-gray-600">Analisando com IA...</p>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Análise OpenAI</h4>
                      
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
                      <h4 className="font-medium text-gray-900 mb-3">Sugestões da IA</h4>
                      
                      <div className="space-y-2">
                        {aiAnalysis.suggestions.map((suggestion: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => applySuggestion(suggestion.content)}
                            className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                          >
                            <p className="text-sm text-gray-800">{suggestion.content}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                                {suggestion.tone}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(suggestion.confidence * 100).toFixed(0)}% confiança
                              </span>
                            </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat Inteligente</h2>
            <p className="text-gray-600">Selecione uma conversa para começar</p>
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
    </div>
  );
}