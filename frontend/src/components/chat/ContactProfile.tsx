import { useState } from 'react';
import { User, Phone, Mail, Tag, Edit3, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface ContactProfileProps {
  contact: Contact | null;
  onEdit?: (contact: Contact) => void;
  onStartChat?: (phone: string) => void;
}

export default function ContactProfile({ contact, onEdit, onStartChat }: ContactProfileProps) {
  const [showFullInfo, setShowFullInfo] = useState(false);

  if (!contact) {
    return (
      <div className="p-6 text-center text-gray-500">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p>Selecione um contato para ver as informações</p>
      </div>
    );
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
    }
    return phone;
  };

  const profilePicUrl = contact.customFields?.whatsappProfilePic || contact.avatar;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="relative mx-auto w-24 h-24 mb-4">
          {profilePicUrl ? (
            <img 
              src={profilePicUrl} 
              alt={contact.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {contact.name.charAt(0).toUpperCase()}
            </div>
          )}
          {contact.customFields?.whatsappProfilePic && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs">📱</span>
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{contact.name}</h2>
        <p className="text-gray-600">{formatPhoneNumber(contact.phone)}</p>
        
        {contact.email && (
          <p className="text-sm text-blue-600 mt-1">{contact.email}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => onStartChat?.(contact.phone)}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Enviar Mensagem
        </button>
        <button
          onClick={() => onEdit?.(contact)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map(tag => (
              <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Informações de Contato</h3>
          <button
            onClick={() => setShowFullInfo(!showFullInfo)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {showFullInfo ? 'Menos' : 'Mais'} detalhes
          </button>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <Phone className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Telefone:</span>
            <span className="ml-2 font-medium">{formatPhoneNumber(contact.phone)}</span>
          </div>
          
          {contact.email && (
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{contact.email}</span>
            </div>
          )}
          
          {contact.lastContact && (
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Último contato:</span>
              <span className="ml-2 font-medium">
                {formatDistanceToNow(new Date(contact.lastContact), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          )}
        </div>

        {/* WhatsApp Profile Info */}
        {contact.customFields?.whatsappProfilePic && showFullInfo && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">📱 Perfil WhatsApp</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div>✅ Foto de perfil sincronizada</div>
              {contact.customFields?.lastProfileSync && (
                <div>
                  🔄 Último sync: {formatDistanceToNow(
                    new Date(contact.customFields.lastProfileSync), 
                    { addSuffix: true, locale: ptBR }
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {showFullInfo && Object.keys(contact.customFields).length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">Campos Personalizados</h4>
            <div className="space-y-1 text-xs">
              {Object.entries(contact.customFields)
                .filter(([key]) => !key.startsWith('whatsapp'))
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
        <div>Criado em: {new Date(contact.createdAt).toLocaleDateString('pt-BR')}</div>
        <div>ID: {contact.id.substring(0, 8)}...</div>
      </div>
    </div>
  );
}