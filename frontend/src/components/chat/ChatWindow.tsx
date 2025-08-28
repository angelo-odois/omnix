import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, User, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  fromMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'audio' | 'document';
}

interface Contact {
  id: string;
  name: string;
  number: string;
  lastSeen?: string;
}

interface ChatWindowProps {
  contact: Contact | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export default function ChatWindow({ contact, messages, onSendMessage, isLoading }: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Selecione uma conversa</h3>
          <p className="text-sm text-gray-500 mt-1">
            Escolha uma conversa da lista para começar a enviar mensagens
          </p>
        </div>
      </div>
    );
  }

  const renderMessageStatus = (status?: string, fromMe?: boolean) => {
    if (!fromMe) return null;
    
    switch (status) {
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'sent':
      default:
        return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.timestamp), 'dd/MM/yyyy', { locale: ptBR });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{contact.name}</h2>
              <p className="text-sm text-gray-500">{contact.number}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                {date === format(new Date(), 'dd/MM/yyyy', { locale: ptBR }) ? 'Hoje' : date}
              </span>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm
                    ${message.fromMe 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-900'}
                  `}
                >
                  <p className="break-words whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                    message.fromMe ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    <span className="text-xs">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {renderMessageStatus(message.status, message.fromMe)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          
          <input
            type="text"
            placeholder="Digite uma mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />

          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Smile className="w-5 h-5 text-gray-500" />
          </button>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`
              p-2 rounded-lg transition-colors
              ${inputMessage.trim() && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

// Fix missing import
import { MessageSquare } from 'lucide-react';