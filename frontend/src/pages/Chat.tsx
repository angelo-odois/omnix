import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageSquare, Smartphone, AlertCircle } from 'lucide-react';

interface Instance {
  sessionName: string;
  displayName: string;
  number: string;
  status: string;
}

export default function Chat() {
  const { user } = useAuthStore();
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [contact, setContact] = useState<any | null>(null);
  
  // Debug: verificar se há token
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Chat page - Token exists:', !!token);
    console.log('Chat page - User:', user);
  }, [user]);

  // Buscar instâncias ativas
  const { data: instances, isLoading: loadingInstances, error: instancesError } = useQuery({
    queryKey: ['instances', user?.tenantId],
    queryFn: async () => {
      const response = await api.get('/waha/sessions');
      
      // Transformar para o formato esperado
      if (response.data.success && response.data.sessions) {
        return response.data.sessions.map((session: any) => ({
          sessionName: session.name,
          displayName: session.config?.metadata?.displayName || session.name,
          number: session.me?.id?.replace('@c.us', '') || 'Não conectado',
          status: session.status
        }));
      }
      
      return [];
    },
    enabled: !!user,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Buscar chats da instância selecionada
  const { data: chatsData, refetch: refetchChats } = useQuery({
    queryKey: ['chats', selectedInstance],
    queryFn: async () => {
      if (!selectedInstance) return { chats: [] };
      const response = await api.get(`/messages/chats?sessionName=${selectedInstance}`);
      return response.data;
    },
    enabled: !!selectedInstance,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });

  // Buscar mensagens do chat selecionado
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedInstance, selectedChat],
    queryFn: async () => {
      if (!selectedInstance || !selectedChat) return { messages: [] };
      const response = await api.get(
        `/messages/chat/${selectedChat}?sessionName=${selectedInstance}`
      );
      return response.data;
    },
    enabled: !!selectedInstance && !!selectedChat,
    refetchInterval: 2000, // Atualizar a cada 2 segundos
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (!selectedInstance || !selectedChat) return;
      
      const response = await api.post('/messages/send', {
        sessionName: selectedInstance,
        chatId: selectedChat,
        text: data.content,
      });
      return response.data;
    },
    onSuccess: () => {
      refetchMessages();
    },
  });

  // Atualizar chats quando os dados chegarem
  useEffect(() => {
    if (chatsData?.chats) {
      setChats(chatsData.chats);
    }
  }, [chatsData]);

  // Atualizar mensagens quando os dados chegarem
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Atualizar contato quando um chat for selecionado
  useEffect(() => {
    if (selectedChat && chats.length > 0) {
      const chat = chats.find((c: any) => c.contactId === selectedChat);
      if (chat) {
        setContact({
          id: chat.contactId,
          name: chat.contactName,
          number: chat.contactNumber,
        });
      }
    }
  }, [selectedChat, chats]);

  // Selecionar primeira instância automaticamente
  useEffect(() => {
    if (instances && instances.length > 0 && !selectedInstance) {
      const activeInstance = instances.find((i: Instance) => i.status === 'connected');
      if (activeInstance) {
        setSelectedInstance(activeInstance.sessionName);
      }
    }
  }, [instances, selectedInstance]);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate({ content });
  };

  const activeInstances = instances?.filter((i: Instance) => i.status === 'connected') || [];

  if (loadingInstances) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando instâncias...</p>
        </div>
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma instância configurada
          </h2>
          <p className="text-gray-600">
            Configure uma instância WhatsApp para começar a receber e enviar mensagens.
          </p>
        </div>
      </div>
    );
  }

  if (activeInstances.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma instância conectada
          </h2>
          <p className="text-gray-600">
            Todas as suas instâncias estão desconectadas. Conecte uma instância para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de Instâncias */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Atendimento
          </h2>
        </div>
        
        <div className="p-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Instância Ativa
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedInstance || ''}
            onChange={(e) => {
              setSelectedInstance(e.target.value);
              setSelectedChat(null);
              setMessages([]);
            }}
          >
            {activeInstances.map((instance: Instance) => (
              <option key={instance.sessionName} value={instance.sessionName}>
                {instance.displayName || instance.number}
              </option>
            ))}
          </select>
          
          {selectedInstance && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-700">
                <span className="font-medium">Número:</span> {
                  activeInstances.find((i: Instance) => i.sessionName === selectedInstance)?.number
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat List */}
      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        onChatSelect={setSelectedChat}
      />

      {/* Chat Window */}
      <ChatWindow
        contact={contact}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />
    </div>
  );
}