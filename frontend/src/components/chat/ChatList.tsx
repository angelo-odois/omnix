import { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Chat {
  contactId: string;
  contactName: string;
  contactNumber: string;
  lastMessage: {
    content: string;
    timestamp: string;
    fromMe: boolean;
  };
  unreadCount: number;
  sessionName: string;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: string | null;
  onChatSelect: (contactId: string) => void;
}

export default function ChatList({ chats, selectedChat, onChatSelect }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredChats = chats.filter(chat => 
    chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.contactNumber.includes(searchTerm) ||
    chat.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm text-center">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.contactId}
              onClick={() => onChatSelect(chat.contactId)}
              className={`
                flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100
                ${selectedChat === chat.contactId ? 'bg-blue-50 hover:bg-blue-50' : ''}
              `}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {chat.contactName}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(chat.lastMessage.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate">
                    {chat.lastMessage.fromMe && <span className="text-gray-400">Você: </span>}
                    {chat.lastMessage.content}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  {chat.contactNumber}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}